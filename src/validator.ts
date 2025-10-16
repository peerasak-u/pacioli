/**
 * JSON schema validation for document data
 */

import type { LineItem } from "./utils";

export interface Customer {
  name: string;
  company?: string;
  phone: string;
}

export interface BaseDocument {
  documentNumber: string;
  issueDate: string;
  customer: Customer;
  items: LineItem[];
  taxRate: number;
  taxType: "withholding" | "vat";
  taxLabel: string;
  notes?: string;
}

export interface InvoiceData extends BaseDocument {
  dueDate: string;
  paymentTerms?: string[];
}

export interface QuotationData extends BaseDocument {
  validUntil: string;
  paymentTerms?: string[];
}

export interface ReceiptData extends BaseDocument {
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  paidAmount: number;
  paymentTerms?: string[];
}

export interface FreelancerConfig {
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  bankInfo: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch?: string;
    swift?: string;
  };
}

export type DocumentData = InvoiceData | QuotationData | ReceiptData;

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate customer data
 */
function validateCustomer(customer: any): string[] {
  const errors: string[] = [];

  if (!customer) {
    errors.push("Customer information is required");
    return errors;
  }

  if (!customer.name || typeof customer.name !== "string") {
    errors.push("Customer name is required");
  }

  if (!customer.phone || typeof customer.phone !== "string") {
    errors.push("Customer phone is required");
  }

  return errors;
}

/**
 * Validate line items
 */
function validateItems(items: any): string[] {
  const errors: string[] = [];

  if (!Array.isArray(items)) {
    errors.push("Items must be an array");
    return errors;
  }

  if (items.length === 0) {
    errors.push("At least one item is required");
    return errors;
  }

  items.forEach((item, index) => {
    if (!item.description || typeof item.description !== "string") {
      errors.push(`Item ${index + 1}: Description is required`);
    }

    if (typeof item.quantity !== "number" || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Valid quantity is required`);
    }

    if (!item.unit || typeof item.unit !== "string") {
      errors.push(`Item ${index + 1}: Unit is required`);
    }

    if (typeof item.unitPrice !== "number" || item.unitPrice < 0) {
      errors.push(`Item ${index + 1}: Valid unit price is required`);
    }
  });

  return errors;
}

/**
 * Validate base document fields
 */
function validateBaseDocument(data: any): string[] {
  const errors: string[] = [];

  if (!data.documentNumber || typeof data.documentNumber !== "string") {
    errors.push("Document number is required");
  }

  if (!data.issueDate || typeof data.issueDate !== "string") {
    errors.push("Issue date is required");
  } else {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.issueDate)) {
      errors.push("Issue date must be in YYYY-MM-DD format");
    }
  }

  if (typeof data.taxRate !== "number" || data.taxRate < 0 || data.taxRate > 1) {
    errors.push("Tax rate must be a number between 0 and 1");
  }

  if (!["withholding", "vat"].includes(data.taxType)) {
    errors.push('Tax type must be either "withholding" or "vat"');
  }

  if (!data.taxLabel || typeof data.taxLabel !== "string") {
    errors.push("Tax label is required");
  }

  errors.push(...validateCustomer(data.customer));
  errors.push(...validateItems(data.items));

  return errors;
}

/**
 * Validate invoice data
 */
export function validateInvoice(data: any): ValidationResult {
  const errors = validateBaseDocument(data);

  if (!data.dueDate || typeof data.dueDate !== "string") {
    errors.push("Due date is required");
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.dueDate)) {
      errors.push("Due date must be in YYYY-MM-DD format");
    }
  }

  if (data.paymentTerms && !Array.isArray(data.paymentTerms)) {
    errors.push("Payment terms must be an array");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate quotation data
 */
export function validateQuotation(data: any): ValidationResult {
  const errors = validateBaseDocument(data);

  if (!data.validUntil || typeof data.validUntil !== "string") {
    errors.push("Valid until date is required");
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.validUntil)) {
      errors.push("Valid until date must be in YYYY-MM-DD format");
    }
  }

  if (data.paymentTerms && !Array.isArray(data.paymentTerms)) {
    errors.push("Payment terms must be an array");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate receipt data
 */
export function validateReceipt(data: any): ValidationResult {
  const errors = validateBaseDocument(data);

  if (!data.paymentDate || typeof data.paymentDate !== "string") {
    errors.push("Payment date is required");
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.paymentDate)) {
      errors.push("Payment date must be in YYYY-MM-DD format");
    }
  }

  if (!data.paymentMethod || typeof data.paymentMethod !== "string") {
    errors.push("Payment method is required");
  }

  if (typeof data.paidAmount !== "number" || data.paidAmount < 0) {
    errors.push("Valid paid amount is required");
  }

  if (data.paymentTerms && !Array.isArray(data.paymentTerms)) {
    errors.push("Payment terms must be an array");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate freelancer config
 */
export function validateFreelancerConfig(config: any): ValidationResult {
  const errors: string[] = [];

  if (!config.name || typeof config.name !== "string") {
    errors.push("Freelancer name is required");
  }

  if (!config.email || typeof config.email !== "string") {
    errors.push("Freelancer email is required");
  }

  if (!config.phone || typeof config.phone !== "string") {
    errors.push("Freelancer phone is required");
  }

  if (!config.address || typeof config.address !== "string") {
    errors.push("Freelancer address is required");
  }

  if (!config.bankInfo) {
    errors.push("Bank information is required");
  } else {
    const { bankInfo } = config;
    if (!bankInfo.bankName || typeof bankInfo.bankName !== "string") {
      errors.push("Bank name is required");
    }
    if (!bankInfo.accountName || typeof bankInfo.accountName !== "string") {
      errors.push("Bank account name is required");
    }
    if (!bankInfo.accountNumber || typeof bankInfo.accountNumber !== "string") {
      errors.push("Bank account number is required");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
