/**
 * PDF generation using Puppeteer
 */

import puppeteer from "puppeteer";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { calculateTotals, formatNumber, formatDateThai } from "./utils";
import type {
  DocumentData,
  InvoiceData,
  QuotationData,
  ReceiptData,
  FreelancerConfig,
  Customer,
} from "./validator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load signature image as base64 data URI
 */
async function loadSignatureBase64(
  signaturePath: string
): Promise<string | null> {
  try {
    const file = Bun.file(signaturePath);
    if (!(await file.exists())) {
      console.warn(`Warning: Signature file not found: ${signaturePath}`);
      return null;
    }
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const ext = signaturePath.split(".").pop()?.toLowerCase();
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.warn(`Warning: Failed to load signature: ${error}`);
    return null;
  }
}

/**
 * Inject data into HTML template
 */
async function injectDataIntoTemplate(
  template: string,
  data: DocumentData,
  customer: Customer,
  config: FreelancerConfig,
  signatureDataUri: string | null
): Promise<string> {
  let html = template;

  // Calculate totals
  const { subtotal, taxAmount, total } = calculateTotals(
    data.items,
    data.taxRate,
    data.taxType
  );

  // Freelancer information
  html = html.replace(/\{\{freelancer\.name\}\}/g, config.name);
  html = html.replace(/\{\{freelancer\.title\}\}/g, config.title || "");
  html = html.replace(/\{\{freelancer\.email\}\}/g, config.email);
  html = html.replace(/\{\{freelancer\.phone\}\}/g, config.phone ? ` | โทร: ${config.phone}` : "");
  html = html.replace(/\{\{freelancer\.address\}\}/g, config.address);
  html = html.replace(/\{\{freelancer\.taxId\}\}/g, config.taxId);

  // Bank information
  html = html.replace(/\{\{bank\.name\}\}/g, config.bankInfo.bankName);
  html = html.replace(
    /\{\{bank\.accountName\}\}/g,
    config.bankInfo.accountName
  );
  html = html.replace(
    /\{\{bank\.accountNumber\}\}/g,
    config.bankInfo.accountNumber
  );
  html = html.replace(/\{\{bank\.branch\}\}/g, config.bankInfo.branch || "");

  // Document information
  html = html.replace(/\{\{documentNumber\}\}/g, data.documentNumber);
  html = html.replace(
    /\{\{issueDate\}\}/g,
    formatDateThai(data.issueDate)
  );

  // Type-specific dates
  if ("dueDate" in data) {
    html = html.replace(/\{\{dueDate\}\}/g, formatDateThai(data.dueDate));
  }
  if ("validUntil" in data) {
    html = html.replace(
      /\{\{validUntil\}\}/g,
      formatDateThai(data.validUntil)
    );
  }
  if ("paymentDate" in data) {
    html = html.replace(
      /\{\{paymentDate\}\}/g,
      formatDateThai(data.paymentDate)
    );
  }

  // Receipt-specific fields
  if ("paymentMethod" in data) {
    html = html.replace(/\{\{paymentMethod\}\}/g, data.paymentMethod);
  }
  if ("referenceNumber" in data) {
    html = html.replace(
      /\{\{referenceNumber\}\}/g,
      data.referenceNumber || ""
    );
  }

  // Customer information
  html = html.replace(/\{\{customer\.name\}\}/g, customer.name);
  html = html.replace(
    /\{\{customer\.company\}\}/g,
    customer.company || ""
  );
  html = html.replace(/\{\{customer\.address\}\}/g, customer.address);
  html = html.replace(/\{\{customer\.taxId\}\}/g, customer.taxId);
  html = html.replace(/\{\{customer\.phone\}\}/g, customer.phone ? `<br>โทร: ${customer.phone}` : "");

  // Generate items rows
  const itemsHTML = data.items
    .map((item, index) => {
      const lineTotal = item.quantity * item.unitPrice;
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${item.description}</td>
          <td class="text-center">${item.quantity} ${item.unit}</td>
          <td class="text-right">${formatNumber(item.unitPrice)}</td>
          <td class="text-right">${formatNumber(lineTotal)}</td>
        </tr>
      `;
    })
    .join("");

  html = html.replace(/\{\{items\}\}/g, itemsHTML);

  // Payment terms for invoices
  if ("paymentTerms" in data && data.paymentTerms) {
    const termsHTML = data.paymentTerms
      .map((term) => `<li>${term}</li>`)
      .join("");
    html = html.replace(/\{\{paymentTerms\}\}/g, termsHTML);
  } else {
    html = html.replace(/\{\{paymentTerms\}\}/g, "");
  }

  // Financial calculations
  html = html.replace(/\{\{subtotal\}\}/g, formatNumber(subtotal));
  html = html.replace(/\{\{taxLabel\}\}/g, data.taxLabel);

  // Tax amount with sign
  const taxDisplay =
    data.taxType === "withholding"
      ? `(${formatNumber(taxAmount)})`
      : formatNumber(taxAmount);
  html = html.replace(/\{\{taxAmount\}\}/g, taxDisplay);
  html = html.replace(/\{\{total\}\}/g, formatNumber(total));

  // Notes
  html = html.replace(/\{\{notes\}\}/g, data.notes || "");

  // Signature
  if (signatureDataUri) {
    html = html.replace(
      /\{\{signature\}\}/g,
      `<img src="${signatureDataUri}" alt="Signature" style="max-width: 200px; height: auto;">`
    );
  } else {
    // Leave blank for manual signing
    html = html.replace(/\{\{signature\}\}/g, "");
  }

  return html;
}

/**
 * Resolve template path
 * Looks in user's local templates/ first, then falls back to package templates/
 */
function resolveTemplatePath(type: string): string {
  // Try user's local templates first (in current working directory)
  const localTemplatePath = join(process.cwd(), "templates", `${type}.html`);
  if (existsSync(localTemplatePath)) {
    return localTemplatePath;
  }

  // Fall back to package's bundled templates
  // When running from source: src/generator.ts -> ../templates/
  // When running from installed: dist/generator.js -> ../templates/
  const packageRoot = join(__dirname, "..");
  const packageTemplatePath = join(packageRoot, "templates", `${type}.html`);

  if (existsSync(packageTemplatePath)) {
    return packageTemplatePath;
  }

  throw new Error(
    `Template not found: ${type}.html\n` +
    `  Searched in:\n` +
    `    - ${localTemplatePath}\n` +
    `    - ${packageTemplatePath}\n` +
    `  Tip: Run 'pacioli init' to create templates/ directory`
  );
}

/**
 * Generate PDF from document data
 */
export async function generatePDF(
  type: "invoice" | "quotation" | "receipt",
  data: DocumentData,
  customer: Customer,
  config: FreelancerConfig,
  outputPath: string
): Promise<void> {
  // Resolve template path
  const templatePath = resolveTemplatePath(type);
  const templateFile = Bun.file(templatePath);

  if (!(await templateFile.exists())) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const template = await templateFile.text();

  // Load signature if provided
  const signatureDataUri = config.signature
    ? await loadSignatureBase64(config.signature)
    : null;

  // Inject data into template
  const html = await injectDataIntoTemplate(template, data, customer, config, signatureDataUri);

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    // Generate PDF in A4 format
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    console.log(`✓ PDF generated successfully: ${outputPath}`);
  } finally {
    await browser.close();
  }
}
