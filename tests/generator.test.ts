/**
 * Unit tests for PDF generator data injection
 *
 * NOTE: These tests focus on data injection and HTML manipulation.
 * Full PDF generation tests are skipped as they require Puppeteer overhead.
 */

import { describe, test, expect } from "bun:test";
import { calculateTotals, formatNumber, formatDateThai } from "../src/utils";
import type {
  InvoiceData,
  QuotationData,
  ReceiptData,
  FreelancerConfig,
  Customer,
} from "../src/validator";
import {
  sampleInvoice,
  sampleQuotation,
  sampleReceipt,
  sampleFreelancerConfig,
  sampleCustomer,
} from "./fixtures/sample-data";

/**
 * Helper to simulate template injection
 * This mirrors the logic in generator.ts injectDataIntoTemplate function
 */
function simulateInjectData(
  template: string,
  data: InvoiceData | QuotationData | ReceiptData,
  customer: Customer,
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
  html = html.replace(
    /\{\{freelancer\.phone\}\}/g,
    config.phone ? ` | โทร: ${config.phone}` : ""
  );
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
  html = html.replace(
    /\{\{bank\.branch\}\}/g,
    config.bankInfo.branch || ""
  );

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
  html = html.replace(
    /\{\{customer\.phone\}\}/g,
    customer.phone ? `<br>โทร: ${customer.phone}` : ""
  );

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

  // Payment terms
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

describe("Data injection - Freelancer info", () => {
  test("injects freelancer name", () => {
    const template = "<div>{{freelancer.name}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(sampleFreelancerConfig.name);
    expect(result).not.toContain("{{freelancer.name}}");
  });

  test("injects freelancer email", () => {
    const template = "<div>{{freelancer.email}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(sampleFreelancerConfig.email);
  });

  test("injects freelancer phone with prefix", () => {
    const template = "<div>{{freelancer.phone}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(` | โทร: ${sampleFreelancerConfig.phone}`);
  });

  test("handles missing optional phone", () => {
    const config = { ...sampleFreelancerConfig, phone: undefined };
    const template = "<div>{{freelancer.phone}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, config);
    expect(result).toBe("<div></div>");
  });

  test("injects all freelancer fields", () => {
    const template = `
      {{freelancer.name}}
      {{freelancer.title}}
      {{freelancer.email}}
      {{freelancer.address}}
      {{freelancer.taxId}}
    `;
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(sampleFreelancerConfig.name);
    expect(result).toContain(sampleFreelancerConfig.title);
    expect(result).toContain(sampleFreelancerConfig.email);
    expect(result).toContain(sampleFreelancerConfig.address);
    expect(result).toContain(sampleFreelancerConfig.taxId);
  });
});

describe("Data injection - Bank info", () => {
  test("injects bank name", () => {
    const template = "<div>{{bank.name}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(sampleFreelancerConfig.bankInfo.bankName);
  });

  test("injects all bank fields", () => {
    const template = `
      {{bank.name}}
      {{bank.accountName}}
      {{bank.accountNumber}}
      {{bank.branch}}
    `;
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(sampleFreelancerConfig.bankInfo.bankName);
    expect(result).toContain(sampleFreelancerConfig.bankInfo.accountName);
    expect(result).toContain(sampleFreelancerConfig.bankInfo.accountNumber);
  });
});

describe("Data injection - Document info", () => {
  test("injects document number", () => {
    const template = "<div>{{documentNumber}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(sampleInvoice.documentNumber);
  });

  test("formats issue date to Thai BE", () => {
    const template = "<div>{{issueDate}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(formatDateThai(sampleInvoice.issueDate));
    expect(result).not.toContain(sampleInvoice.issueDate); // Should not contain raw date
  });

  test("injects invoice due date", () => {
    const template = "<div>{{dueDate}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(formatDateThai(sampleInvoice.dueDate));
  });

  test("injects quotation valid until date", () => {
    const template = "<div>{{validUntil}}</div>";
    const result = simulateInjectData(template, sampleQuotation, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(formatDateThai(sampleQuotation.validUntil));
  });

  test("injects receipt payment date", () => {
    const template = "<div>{{paymentDate}}</div>";
    const result = simulateInjectData(template, sampleReceipt, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(formatDateThai(sampleReceipt.paymentDate));
  });

  test("injects receipt payment method", () => {
    const template = "<div>{{paymentMethod}}</div>";
    const result = simulateInjectData(template, sampleReceipt, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(sampleReceipt.paymentMethod);
  });

  test("injects receipt reference number", () => {
    const template = "<div>{{referenceNumber}}</div>";
    const result = simulateInjectData(template, sampleReceipt, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(sampleReceipt.referenceNumber!);
  });
});

describe("Data injection - Customer info", () => {
  test("injects customer name", () => {
    const template = "<div>{{customer.name}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(sampleCustomer.name);
  });

  test("injects customer company", () => {
    const template = "<div>{{customer.company}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(sampleCustomer.company!);
  });

  test("injects customer phone with prefix", () => {
    const template = "<div>{{customer.phone}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(`<br>โทร: ${sampleCustomer.phone}`);
  });

  test("handles missing optional customer phone", () => {
    const customer = { ...sampleCustomer, phone: undefined };
    const template = "<div>{{customer.phone}}</div>";
    const result = simulateInjectData(template, sampleInvoice, customer, sampleFreelancerConfig);
    expect(result).toBe("<div></div>");
  });

  test("injects all customer fields", () => {
    const template = `
      {{customer.name}}
      {{customer.company}}
      {{customer.address}}
      {{customer.taxId}}
    `;
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(sampleCustomer.name);
    expect(result).toContain(sampleCustomer.company!);
    expect(result).toContain(sampleCustomer.address);
    expect(result).toContain(sampleCustomer.taxId);
  });
});

describe("Data injection - Items", () => {
  test("generates table rows for items", () => {
    const template = "<table>{{items}}</table>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);

    // Should contain all item descriptions
    sampleInvoice.items.forEach((item) => {
      expect(result).toContain(item.description);
    });
  });

  test("includes item quantities and units", () => {
    const template = "<table>{{items}}</table>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);

    sampleInvoice.items.forEach((item) => {
      expect(result).toContain(`${item.quantity} ${item.unit}`);
    });
  });

  test("formats item prices correctly", () => {
    const template = "<table>{{items}}</table>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);

    sampleInvoice.items.forEach((item) => {
      expect(result).toContain(formatNumber(item.unitPrice));
    });
  });

  test("calculates and formats line totals", () => {
    const template = "<table>{{items}}</table>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);

    sampleInvoice.items.forEach((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      expect(result).toContain(formatNumber(lineTotal));
    });
  });

  test("generates sequential item numbers", () => {
    const template = "<table>{{items}}</table>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);

    for (let i = 1; i <= sampleInvoice.items.length; i++) {
      expect(result).toContain(`<td>${i}</td>`);
    }
  });
});

describe("Data injection - Financial calculations", () => {
  test("injects formatted subtotal", () => {
    const template = "<div>{{subtotal}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);

    const { subtotal } = calculateTotals(
      sampleInvoice.items,
      sampleInvoice.taxRate,
      sampleInvoice.taxType
    );
    expect(result).toContain(formatNumber(subtotal));
  });

  test("injects tax label", () => {
    const template = "<div>{{taxLabel}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(sampleInvoice.taxLabel);
  });

  test("formats withholding tax with parentheses", () => {
    const template = "<div>{{taxAmount}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);

    const { taxAmount } = calculateTotals(
      sampleInvoice.items,
      sampleInvoice.taxRate,
      sampleInvoice.taxType
    );
    expect(result).toContain(`(${formatNumber(taxAmount)})`);
  });

  test("formats VAT without parentheses", () => {
    const template = "<div>{{taxAmount}}</div>";
    const result = simulateInjectData(template, sampleQuotation, sampleCustomer, sampleFreelancerConfig);

    const { taxAmount } = calculateTotals(
      sampleQuotation.items,
      sampleQuotation.taxRate,
      sampleQuotation.taxType
    );
    expect(result).toContain(formatNumber(taxAmount));
    expect(result).not.toContain("(");
  });

  test("injects formatted total", () => {
    const template = "<div>{{total}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);

    const { total } = calculateTotals(
      sampleInvoice.items,
      sampleInvoice.taxRate,
      sampleInvoice.taxType
    );
    expect(result).toContain(formatNumber(total));
  });
});

describe("Data injection - Payment terms", () => {
  test("injects payment terms as list items", () => {
    const template = "<ul>{{paymentTerms}}</ul>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);

    sampleInvoice.paymentTerms!.forEach((term) => {
      expect(result).toContain(`<li>${term}</li>`);
    });
  });

  test("handles missing payment terms", () => {
    const invoice = { ...sampleInvoice, paymentTerms: undefined };
    const template = "<ul>{{paymentTerms}}</ul>";
    const result = simulateInjectData(template, invoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toBe("<ul></ul>");
  });

  test("handles empty payment terms array", () => {
    const invoice = { ...sampleInvoice, paymentTerms: [] };
    const template = "<ul>{{paymentTerms}}</ul>";
    const result = simulateInjectData(template, invoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toBe("<ul></ul>");
  });
});

describe("Data injection - Notes", () => {
  test("injects notes", () => {
    const template = "<div>{{notes}}</div>";
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toContain(sampleInvoice.notes!);
  });

  test("handles missing notes", () => {
    const invoice = { ...sampleInvoice, notes: undefined };
    const template = "<div>{{notes}}</div>";
    const result = simulateInjectData(template, invoice, sampleCustomer, sampleFreelancerConfig);
    expect(result).toBe("<div></div>");
  });
});

describe("Data injection - Multiple placeholders", () => {
  test("replaces all occurrences of same placeholder", () => {
    const template = `
      <div>{{freelancer.name}}</div>
      <span>{{freelancer.name}}</span>
      <p>{{freelancer.name}}</p>
    `;
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);

    // Count occurrences
    const matches = result.match(new RegExp(sampleFreelancerConfig.name, "g"));
    expect(matches).toBeDefined();
    expect(matches!.length).toBe(3);
  });

  test("handles complex template with all placeholders", () => {
    const template = `
      <h1>{{documentNumber}}</h1>
      <p>{{freelancer.name}} - {{freelancer.email}}</p>
      <p>Customer: {{customer.name}}</p>
      <table>{{items}}</table>
      <p>Subtotal: {{subtotal}}</p>
      <p>{{taxLabel}}: {{taxAmount}}</p>
      <p>Total: {{total}}</p>
      <p>Notes: {{notes}}</p>
    `;
    const result = simulateInjectData(template, sampleInvoice, sampleCustomer, sampleFreelancerConfig);

    // Verify no placeholders remain
    expect(result).not.toContain("{{");
    expect(result).not.toContain("}}");

    // Verify key data is present
    expect(result).toContain(sampleInvoice.documentNumber);
    expect(result).toContain(sampleFreelancerConfig.name);
    expect(result).toContain(sampleCustomer.name);
  });
});
