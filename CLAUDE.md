# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Description
CLI tool for generating financial documents (quotations, invoices, receipts) for freelance work. Outputs ready-to-use PDF files in A4 format.

## Tech Stack
- **Runtime**: Bun
- **Rendering**: HTML + JavaScript
- **PDF Generation**: Puppeteer (renders HTML to A4 PDF)
- **Language**: TypeScript

## Development Commands

```bash
# Install dependencies
bun install

# Generate a document
bun run generate <type> <input-json> --customer <customer-json> [options]

# Examples - Manual numbering
bun run generate invoice examples/invoice.json --customer customers/acme-corp.json
bun run generate quotation examples/quotation.json --customer customers/demo-company.json --output custom/path.pdf
bun run generate receipt examples/receipt.json --customer customers/test-customer.json --config config/freelancer.json

# Examples - Auto-numbering
bun run generate invoice examples/invoice-auto.json --customer customers/acme-corp.json
bun run generate quotation examples/quotation-auto.json --customer customers/demo-company.json
bun run generate receipt examples/receipt-auto.json --customer customers/acme-corp.json
```

## Project Architecture

### Source Files (`src/`)

1. **`src/index.ts`** - CLI entry point
   - Parses command-line arguments including `--customer` (required)
   - Validates input files (document, customer, config)
   - Handles auto-numbering logic
   - Orchestrates the generation process

2. **`src/validator.ts`** - JSON schema validation
   - Defines TypeScript interfaces for all document types
   - Validation functions for Invoice, Quotation, Receipt, Customer
   - Validates freelancer config
   - Accepts "auto" as valid documentNumber
   - Customer data is separate from document data

3. **`src/generator.ts`** - PDF generation
   - Launches Puppeteer headless browser
   - Injects data into HTML templates using `{{placeholder}}` syntax
   - Accepts separate customer parameter
   - Generates A4 format PDFs

4. **`src/utils.ts`** - Helper functions
   - `calculateTotals()` - Calculate subtotal, tax, and total
   - `formatNumber()` - Thai number formatting with thousand separators
   - `formatDateThai()` - Convert dates to Buddhist Era format
   - `readJSON()` - Read and parse JSON files
   - `getOutputPath()` - Generate output file paths

5. **`src/metadata.ts`** - Document numbering system
   - `readMetadata()` - Read counter state from `.metadata.json`
   - `writeMetadata()` - Save counter state
   - `getNextDocumentNumber()` - Generate next sequential number
   - `incrementDocumentCounter()` - Update counter after generation
   - Auto-resets counters on year rollover

### Templates (`templates/`)

All templates use a placeholder injection system with `{{variable}}` syntax:

1. **`templates/invoice.html`** - Dark blue theme (`#2c3e50`)
   - Placeholders: `{{documentNumber}}`, `{{issueDate}}`, `{{dueDate}}`, `{{paymentTerms}}`
   - Includes payment terms section

2. **`templates/quotation.html`** - Purple theme (`#8e44ad`)
   - Placeholders: `{{documentNumber}}`, `{{issueDate}}`, `{{validUntil}}`, `{{paymentTerms}}`
   - Includes optional payment terms section

3. **`templates/receipt.html`** - Green theme (`#27ae60`)
   - Placeholders: `{{documentNumber}}`, `{{issueDate}}`, `{{paymentDate}}`, `{{paymentMethod}}`, `{{referenceNumber}}`, `{{paymentTerms}}`
   - Shows payment confirmation with optional payment terms context

### Common Template Placeholders

All templates support:
- **Freelancer**: `{{freelancer.name}}`, `{{freelancer.title}}`, `{{freelancer.email}}`, `{{freelancer.phone}}`, `{{freelancer.address}}`, `{{freelancer.taxId}}`
  - Note: `{{freelancer.phone}}` is conditionally rendered with " | โทร: " prefix if present
- **Bank**: `{{bank.name}}`, `{{bank.accountName}}`, `{{bank.accountNumber}}`, `{{bank.branch}}`
- **Customer**: `{{customer.name}}`, `{{customer.company}}`, `{{customer.address}}`, `{{customer.taxId}}`, `{{customer.phone}}`
  - Note: `{{customer.phone}}` is conditionally rendered with "<br>โทร: " prefix if present
- **Items**: `{{items}}` - Generated dynamically as table rows
- **Calculations**: `{{subtotal}}`, `{{taxLabel}}`, `{{taxAmount}}`, `{{total}}`
- **Notes**: `{{notes}}`

## Document Types & Workflows

### Invoice
- For billing completed work
- Requires: `dueDate`, optional `paymentTerms`
- Tax type: Usually "withholding" (deducted)

### Quotation
- For price estimates before work begins
- Requires: `validUntil` (quote expiry date)
- Tax type: Usually "vat" (added)
- Optional: `paymentTerms` (for outlining payment milestones)

### Receipt
- For payment confirmation
- Requires: `paymentDate`, `paymentMethod`, optional `referenceNumber`, `paidAmount`
- Optional: `paymentTerms` (for showing payment milestone context)
- Shows actual payment received

## Configuration

### Freelancer Configuration (Required)
Before first use, create `config/freelancer.json`:
```bash
cp config/freelancer.example.json config/freelancer.json
# Edit with your information
```

### Customer Database
Customer data is stored separately in the `customers/` directory. Each customer has their own JSON file:

**Structure:**
```
customers/
├── acme-corp.json
├── demo-company.json
└── test-customer.json
```

**Customer JSON Format:**
```json
{
  "name": "นาย ทดสอบ ตัวอย่าง",
  "company": "บริษัท เดโมนิค จำกัด",
  "address": "เลขที่ 456 ถ. สาทร กรุงเทพมหานคร 10120",
  "taxId": "0-1055-12345-67-8",
  "phone": "02-111-2222"
}
```

**Benefits:**
- Single source of truth for customer data
- No duplication across multiple documents
- Easy to update customer information
- Can reuse customer files for multiple invoices/receipts

**Usage:**
Specify customer file with `--customer` flag:
```bash
bun run generate invoice data/invoice.json --customer customers/acme-corp.json
```

## Key Implementation Details

### Data Separation Architecture
The tool uses a **separation of concerns** approach:

**Document JSON** (`examples/*.json`):
- Contains: documentNumber, dates, items, tax info, payment terms, notes
- Does NOT contain customer data

**Customer JSON** (`customers/*.json`):
- Contains: name, company, address, taxId, phone
- Reusable across multiple documents

**Freelancer Config** (`config/freelancer.json`):
- Contains: your business info, bank details
- Set once, used for all documents

This separation provides:
- **DRY Principle**: Single source of truth for customer data
- **Maintainability**: Update customer info in one place
- **Reusability**: One customer file for all their invoices/receipts
- **Clarity**: Document data vs. customer data are clearly separated

### Auto-Numbering System
The tool maintains sequential document numbers using `.metadata.json`:
- **Format**: `PREFIX-YYYYMM-NUMBER` (e.g., `INV-202410-001`)
- **Usage**: Set `"documentNumber": "auto"` in JSON input
- **Month Rollover**: Counters automatically reset to 1 each month
- **Manual Override**: Can still use custom document numbers
- **Smart Update**: Manual numbers update the counter if higher than current value
- **File Location**: `.metadata.json` in project root (gitignored)

Example workflow:
```json
{"documentNumber": "auto", ...}  // First invoice in Oct 2024 → INV-202410-001
{"documentNumber": "auto", ...}  // Second invoice → INV-202410-002
{"documentNumber": "INV-202410-999", ...}  // Manual number updates counter to 999
{"documentNumber": "auto", ...}  // Next auto → INV-202410-1000
{"documentNumber": "auto", ...}  // First invoice in Nov 2024 → INV-202411-001 (counter resets)
```

### Tax Calculation
- **Withholding Tax**: Deducted from subtotal (common for freelancers in Thailand)
  - `total = subtotal - (subtotal × taxRate)`
- **VAT**: Added to subtotal
  - `total = subtotal + (subtotal × taxRate)`

### Date Formatting
Dates are automatically converted to Buddhist Era (BE):
- 2024-10-15 → "15 ตุลาคม 2567"
- Add 543 years to Gregorian calendar

### Template Modification
When modifying templates:
1. Keep `{{placeholder}}` syntax intact
2. Maintain Thai font imports
3. Preserve print media queries for A4 format
4. Update color theme variables consistently

## Adding New Features

### To add a new document type:
1. Create new template in `templates/`
2. Add type definition in `src/validator.ts`
3. Add validation function in `src/validator.ts`
4. Update CLI type checking in `src/index.ts`
5. Add example JSON in `examples/`

### To modify calculations:
Edit `calculateTotals()` in `src/utils.ts`

### To change date formatting:
Edit `formatDateThai()` in `src/utils.ts`
