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
bun run generate <type> <input-json> [options]

# Examples
bun run generate invoice examples/invoice.json
bun run generate quotation examples/quotation.json --output custom/path.pdf
bun run generate receipt examples/receipt.json --config config/freelancer.json
```

## Project Architecture

### Source Files (`src/`)

1. **`src/index.ts`** - CLI entry point
   - Parses command-line arguments
   - Validates input files
   - Orchestrates the generation process

2. **`src/validator.ts`** - JSON schema validation
   - Defines TypeScript interfaces for all document types
   - Validation functions for Invoice, Quotation, Receipt
   - Validates freelancer config

3. **`src/generator.ts`** - PDF generation
   - Launches Puppeteer headless browser
   - Injects data into HTML templates using `{{placeholder}}` syntax
   - Generates A4 format PDFs

4. **`src/utils.ts`** - Helper functions
   - `calculateTotals()` - Calculate subtotal, tax, and total
   - `formatNumber()` - Thai number formatting with thousand separators
   - `formatDateThai()` - Convert dates to Buddhist Era format
   - `readJSON()` - Read and parse JSON files
   - `getOutputPath()` - Generate output file paths

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
- **Freelancer**: `{{freelancer.name}}`, `{{freelancer.title}}`, `{{freelancer.email}}`, `{{freelancer.phone}}`, `{{freelancer.address}}`
- **Bank**: `{{bank.name}}`, `{{bank.accountName}}`, `{{bank.accountNumber}}`, `{{bank.branch}}`
- **Customer**: `{{customer.name}}`, `{{customer.company}}`, `{{customer.phone}}`
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

Before first use, create `config/freelancer.json`:
```bash
cp config/freelancer.example.json config/freelancer.json
# Edit with your information
```

## Key Implementation Details

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
