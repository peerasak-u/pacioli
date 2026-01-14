# Data Schemas

This document defines the JSON structures required for Pacioli.

## Freelancer Configuration
File: `config/freelancer.json`

```json
{
  "name": "Luca Pacioli",
  "title": "Father of Accounting",
  "email": "luca@venice.it",
  "phone": "+39 123 456 7890",
  "address": "San Sepolcro, Republic of Florence",
  "taxId": "IT12345678901",
  "signature": "signature.png",
  "bankInfo": {
    "bankName": "Bank of Venice",
    "accountName": "Luca Pacioli",
    "accountNumber": "123-456-7890",
    "branch": "Main Branch",
    "swift": "BOVUIT22"
  }
}
```

## Customer Profile
File: `customers/<customer-slug>.json`

```json
{
  "name": "Ludovico Sforza",
  "company": "Duke of Milan",
  "address": "Castello Sforzesco, Milan",
  "taxId": "MILAN9999",
  "phone": "+39 987 654 3210"
}
```

## Document Types

All documents share these common fields:
- `documentNumber`: String. Use "auto" for auto-numbering (YYYYMM-001).
- `issueDate`: "YYYY-MM-DD"
- `taxRate`: Number (0-1). e.g., 0.03 for 3%.
- `taxType`: "withholding" (subtracts tax) or "vat" (adds tax).
- `taxLabel`: String (e.g., "Withholding Tax", "VAT").
- `items`: Array of line items.

### Invoice
File: `invoices/<file>.json`

```json
{
  "documentNumber": "auto",
  "issueDate": "2023-10-27",
  "dueDate": "2023-11-26",
  "taxRate": 0.03,
  "taxType": "withholding",
  "taxLabel": "Withholding Tax (3%)",
  "items": [
    {
      "description": "Mathematics Tutoring",
      "quantity": 10,
      "unit": "hours",
      "unitPrice": 150.00
    }
  ],
  "paymentTerms": [
    "Please pay within 30 days",
    "Bank transfer only"
  ]
}
```

### Quotation
File: `quotations/<file>.json`

```json
{
  "documentNumber": "auto",
  "issueDate": "2023-10-27",
  "validUntil": "2023-11-10",
  "taxRate": 0.07,
  "taxType": "vat",
  "taxLabel": "VAT (7%)",
  "items": [
    {
      "description": "Website Design",
      "quantity": 1,
      "unit": "project",
      "unitPrice": 5000.00
    }
  ],
  "paymentTerms": [
    "50% deposit required"
  ]
}
```

### Receipt
File: `receipts/<file>.json`

```json
{
  "documentNumber": "auto",
  "issueDate": "2023-10-27",
  "paymentDate": "2023-10-27",
  "paymentMethod": "Bank Transfer",
  "referenceNumber": "TXN-123456",
  "paidAmount": 485.00,
  "taxRate": 0.03,
  "taxType": "withholding",
  "taxLabel": "Withholding Tax (3%)",
  "items": [
    {
      "description": "Consulting Services",
      "quantity": 5,
      "unit": "hours",
      "unitPrice": 100.00
    }
  ]
}
```
