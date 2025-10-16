/**
 * PDF generation using Puppeteer
 */

import puppeteer from "puppeteer";
import { calculateTotals, formatNumber, formatDateThai } from "./utils";
import type {
  DocumentData,
  InvoiceData,
  QuotationData,
  ReceiptData,
  FreelancerConfig,
} from "./validator";

/**
 * Inject data into HTML template
 */
function injectDataIntoTemplate(
  template: string,
  data: DocumentData,
  config: FreelancerConfig
): string {
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
  html = html.replace(/\{\{freelancer\.phone\}\}/g, config.phone);
  html = html.replace(/\{\{freelancer\.address\}\}/g, config.address);

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
  html = html.replace(/\{\{customer\.name\}\}/g, data.customer.name);
  html = html.replace(
    /\{\{customer\.company\}\}/g,
    data.customer.company || ""
  );
  html = html.replace(/\{\{customer\.phone\}\}/g, data.customer.phone);

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

  return html;
}

/**
 * Generate PDF from document data
 */
export async function generatePDF(
  type: "invoice" | "quotation" | "receipt",
  data: DocumentData,
  config: FreelancerConfig,
  outputPath: string
): Promise<void> {
  // Read template
  const templatePath = `templates/${type}.html`;
  const templateFile = Bun.file(templatePath);

  if (!(await templateFile.exists())) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const template = await templateFile.text();

  // Inject data into template
  const html = injectDataIntoTemplate(template, data, config);

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
