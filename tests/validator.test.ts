/**
 * Unit tests for validation functions
 */

import { describe, test, expect } from "bun:test";
import {
  validateInvoice,
  validateQuotation,
  validateReceipt,
  validateFreelancerConfig,
  validateCustomer,
  type InvoiceData,
  type QuotationData,
  type ReceiptData,
  type FreelancerConfig,
} from "../src/validator";
import {
  sampleInvoice,
  sampleQuotation,
  sampleReceipt,
  sampleFreelancerConfig,
  sampleCustomer,
} from "./fixtures/sample-data";

describe("validateInvoice", () => {
  test("validates correct invoice data", () => {
    const result = validateInvoice(sampleInvoice);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("accepts 'auto' as valid document number", () => {
    const invoice = { ...sampleInvoice, documentNumber: "auto" };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("rejects missing document number", () => {
    const invoice = { ...sampleInvoice, documentNumber: undefined };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Document number is required");
  });

  test("rejects empty document number", () => {
    const invoice = { ...sampleInvoice, documentNumber: "   " };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("cannot be empty"))).toBe(true);
  });

  test("rejects missing issue date", () => {
    const invoice = { ...sampleInvoice, issueDate: undefined };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Issue date is required");
  });

  test("rejects invalid issue date format", () => {
    const invoice = { ...sampleInvoice, issueDate: "15/10/2024" };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("YYYY-MM-DD"))).toBe(true);
  });

  test("rejects missing due date", () => {
    const invoice = { ...sampleInvoice, dueDate: undefined };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Due date is required");
  });

  test("rejects invalid due date format", () => {
    // Note: validator only checks format (YYYY-MM-DD), not if date is valid
    const invoice = { ...sampleInvoice, dueDate: "15/10/2024" };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("YYYY-MM-DD"))).toBe(true);
  });

  test("rejects invalid tax rate (negative)", () => {
    const invoice = { ...sampleInvoice, taxRate: -0.5 };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("between 0 and 1"))).toBe(true);
  });

  test("rejects invalid tax rate (greater than 1)", () => {
    const invoice = { ...sampleInvoice, taxRate: 1.5 };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("between 0 and 1"))).toBe(true);
  });

  test("accepts zero tax rate", () => {
    const invoice = { ...sampleInvoice, taxRate: 0 };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(true);
  });

  test("accepts maximum tax rate (1)", () => {
    const invoice = { ...sampleInvoice, taxRate: 1 };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(true);
  });

  test("rejects invalid tax type", () => {
    const invoice = { ...sampleInvoice, taxType: "invalid" };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("withholding"))).toBe(true);
  });

  test("rejects missing tax label", () => {
    const invoice = { ...sampleInvoice, taxLabel: "" };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Tax label is required");
  });

  test("accepts invoice without optional paymentTerms", () => {
    const invoice = { ...sampleInvoice, paymentTerms: undefined };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(true);
  });

  test("rejects paymentTerms if not an array", () => {
    const invoice = { ...sampleInvoice, paymentTerms: "Not an array" };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("array"))).toBe(true);
  });

  test("accepts empty paymentTerms array", () => {
    const invoice = { ...sampleInvoice, paymentTerms: [] };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(true);
  });
});

describe("validateInvoice - Customer validation", () => {
  test("rejects missing customer", () => {
    const invoice = { ...sampleInvoice, customer: undefined };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Customer information is required");
  });

  test("rejects missing customer name", () => {
    const customer = { ...sampleCustomer, name: "" };
    const result = validateCustomer(customer);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Customer name is required");
  });

  test("rejects missing customer address", () => {
    const customer = { ...sampleCustomer, address: "" };
    const result = validateCustomer(customer);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Customer address is required");
  });

  test("rejects missing customer tax ID", () => {
    const customer = { ...sampleCustomer, taxId: "" };
    const result = validateCustomer(customer);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Customer tax ID is required");
  });

  test("accepts customer without optional phone", () => {
    const customer = { ...sampleCustomer, phone: undefined };
    const result = validateCustomer(customer);
    expect(result.valid).toBe(true);
  });

  test("rejects invalid phone type", () => {
    const customer = { ...sampleCustomer, phone: 123 as any };
    const result = validateCustomer(customer);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("phone must be a string"))).toBe(true);
  });
});

describe("validateInvoice - Items validation", () => {
  test("rejects non-array items", () => {
    const invoice = { ...sampleInvoice, items: "not an array" };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Items must be an array");
  });

  test("rejects empty items array", () => {
    const invoice = { ...sampleInvoice, items: [] };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("At least one item is required");
  });

  test("rejects item without description", () => {
    const invoice = {
      ...sampleInvoice,
      items: [{ ...sampleInvoice.items[0], description: "" }],
    };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Description is required"))).toBe(true);
  });

  test("rejects item with invalid quantity (zero)", () => {
    const invoice = {
      ...sampleInvoice,
      items: [{ ...sampleInvoice.items[0], quantity: 0 }],
    };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Valid quantity is required"))).toBe(true);
  });

  test("rejects item with invalid quantity (negative)", () => {
    const invoice = {
      ...sampleInvoice,
      items: [{ ...sampleInvoice.items[0], quantity: -5 }],
    };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Valid quantity is required"))).toBe(true);
  });

  test("rejects item without unit", () => {
    const invoice = {
      ...sampleInvoice,
      items: [{ ...sampleInvoice.items[0], unit: "" }],
    };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Unit is required"))).toBe(true);
  });

  test("rejects item with negative unit price", () => {
    const invoice = {
      ...sampleInvoice,
      items: [{ ...sampleInvoice.items[0], unitPrice: -100 }],
    };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Valid unit price is required"))).toBe(true);
  });

  test("accepts item with zero unit price", () => {
    const invoice = {
      ...sampleInvoice,
      items: [{ ...sampleInvoice.items[0], unitPrice: 0 }],
    };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(true);
  });

  test("validates multiple items and reports all errors", () => {
    const invoice = {
      ...sampleInvoice,
      items: [
        { description: "", quantity: -1, unit: "", unitPrice: -100 },
        { description: "Valid", quantity: 0, unit: "unit", unitPrice: 100 },
      ],
    };
    const result = validateInvoice(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(4);
  });
});

describe("validateQuotation", () => {
  test("validates correct quotation data", () => {
    const result = validateQuotation(sampleQuotation);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("accepts 'auto' as valid document number", () => {
    const quotation = { ...sampleQuotation, documentNumber: "auto" };
    const result = validateQuotation(quotation);
    expect(result.valid).toBe(true);
  });

  test("rejects missing validUntil date", () => {
    const quotation = { ...sampleQuotation, validUntil: undefined };
    const result = validateQuotation(quotation);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Valid until date is required");
  });

  test("rejects invalid validUntil date format", () => {
    const quotation = { ...sampleQuotation, validUntil: "15/10/2024" };
    const result = validateQuotation(quotation);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("YYYY-MM-DD"))).toBe(true);
  });

  test("accepts quotation without optional paymentTerms", () => {
    const quotation = { ...sampleQuotation, paymentTerms: undefined };
    const result = validateQuotation(quotation);
    expect(result.valid).toBe(true);
  });

  test("rejects paymentTerms if not an array", () => {
    const quotation = { ...sampleQuotation, paymentTerms: "Not an array" };
    const result = validateQuotation(quotation);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("array"))).toBe(true);
  });

  test("validates base document fields", () => {
    const quotation = { ...sampleQuotation, taxRate: 1.5 };
    const result = validateQuotation(quotation);
    expect(result.valid).toBe(false);
  });
});

describe("validateReceipt", () => {
  test("validates correct receipt data", () => {
    const result = validateReceipt(sampleReceipt);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("accepts 'auto' as valid document number", () => {
    const receipt = { ...sampleReceipt, documentNumber: "auto" };
    const result = validateReceipt(receipt);
    expect(result.valid).toBe(true);
  });

  test("rejects missing payment date", () => {
    const receipt = { ...sampleReceipt, paymentDate: undefined };
    const result = validateReceipt(receipt);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Payment date is required");
  });

  test("rejects invalid payment date format", () => {
    const receipt = { ...sampleReceipt, paymentDate: "15/10/2024" };
    const result = validateReceipt(receipt);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("YYYY-MM-DD"))).toBe(true);
  });

  test("rejects missing payment method", () => {
    const receipt = { ...sampleReceipt, paymentMethod: "" };
    const result = validateReceipt(receipt);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Payment method is required");
  });

  test("rejects missing paid amount", () => {
    const receipt = { ...sampleReceipt, paidAmount: undefined };
    const result = validateReceipt(receipt);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Valid paid amount is required");
  });

  test("rejects negative paid amount", () => {
    const receipt = { ...sampleReceipt, paidAmount: -1000 };
    const result = validateReceipt(receipt);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Valid paid amount"))).toBe(true);
  });

  test("accepts zero paid amount", () => {
    const receipt = { ...sampleReceipt, paidAmount: 0 };
    const result = validateReceipt(receipt);
    expect(result.valid).toBe(true);
  });

  test("accepts receipt without optional reference number", () => {
    const receipt = { ...sampleReceipt, referenceNumber: undefined };
    const result = validateReceipt(receipt);
    expect(result.valid).toBe(true);
  });

  test("accepts receipt without optional paymentTerms", () => {
    const receipt = { ...sampleReceipt, paymentTerms: undefined };
    const result = validateReceipt(receipt);
    expect(result.valid).toBe(true);
  });

  test("rejects paymentTerms if not an array", () => {
    const receipt = { ...sampleReceipt, paymentTerms: "Not an array" };
    const result = validateReceipt(receipt);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("array"))).toBe(true);
  });
});

describe("validateFreelancerConfig", () => {
  test("validates correct freelancer config", () => {
    const result = validateFreelancerConfig(sampleFreelancerConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("rejects missing name", () => {
    const config = { ...sampleFreelancerConfig, name: "" };
    const result = validateFreelancerConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Freelancer name is required");
  });

  test("rejects missing email", () => {
    const config = { ...sampleFreelancerConfig, email: "" };
    const result = validateFreelancerConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Freelancer email is required");
  });

  test("rejects missing address", () => {
    const config = { ...sampleFreelancerConfig, address: "" };
    const result = validateFreelancerConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Freelancer address is required");
  });

  test("rejects missing tax ID", () => {
    const config = { ...sampleFreelancerConfig, taxId: "" };
    const result = validateFreelancerConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Freelancer tax ID is required");
  });

  test("accepts config without optional phone", () => {
    const config = { ...sampleFreelancerConfig, phone: undefined };
    const result = validateFreelancerConfig(config);
    expect(result.valid).toBe(true);
  });

  test("rejects invalid phone type", () => {
    const config = { ...sampleFreelancerConfig, phone: 123 as any };
    const result = validateFreelancerConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("phone must be a string"))).toBe(true);
  });

  test("rejects missing bank info", () => {
    const config = { ...sampleFreelancerConfig, bankInfo: undefined };
    const result = validateFreelancerConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Bank information is required");
  });

  test("rejects missing bank name", () => {
    const config = {
      ...sampleFreelancerConfig,
      bankInfo: { ...sampleFreelancerConfig.bankInfo, bankName: "" },
    };
    const result = validateFreelancerConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Bank name is required");
  });

  test("rejects missing bank account name", () => {
    const config = {
      ...sampleFreelancerConfig,
      bankInfo: { ...sampleFreelancerConfig.bankInfo, accountName: "" },
    };
    const result = validateFreelancerConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Bank account name is required");
  });

  test("rejects missing bank account number", () => {
    const config = {
      ...sampleFreelancerConfig,
      bankInfo: { ...sampleFreelancerConfig.bankInfo, accountNumber: "" },
    };
    const result = validateFreelancerConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Bank account number is required");
  });

  test("accepts config without optional bank branch", () => {
    const config = {
      ...sampleFreelancerConfig,
      bankInfo: { ...sampleFreelancerConfig.bankInfo, branch: undefined },
    };
    const result = validateFreelancerConfig(config);
    expect(result.valid).toBe(true);
  });

  test("reports multiple validation errors", () => {
    const config = {
      name: "",
      email: "",
      address: "",
      taxId: "",
      bankInfo: {
        bankName: "",
        accountName: "",
        accountNumber: "",
      },
    };
    const result = validateFreelancerConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(7);
  });
});
