# CLI Invoice Generator

A command-line tool for generating professional financial documents (invoices, quotations, receipts) for freelance work. Generates ready-to-use PDF files in A4 format.

## Overview

This tool converts JSON data into beautifully formatted PDF documents using HTML templates and Puppeteer. Perfect for freelancers who need to quickly generate professional invoices, quotations, and receipts from the terminal.

## Features

- Generate three types of documents: **Invoice**, **Quotation**, **Receipt**
- Automatic calculation of subtotals, tax, and totals
- Reusable freelancer configuration
- Thai language support with Buddhist calendar dates
- Distinct color themes for each document type
- A4 format optimization for printing
- JSON-based data input for easy automation

## Tech Stack

- **Runtime**: Bun
- **Rendering**: HTML + JavaScript
- **PDF Generation**: Puppeteer (renders HTML to A4 PDF)

## Installation

```bash
# Install dependencies
bun install
```

## Project Structure

```
invoice-gen/
├── src/                      # Source code
│   ├── index.ts              # CLI entry point
│   ├── generator.ts          # PDF generation logic
│   ├── validator.ts          # JSON schema validation
│   └── utils.ts              # Helper functions
├── templates/                # HTML templates
│   ├── invoice.html          # Invoice template (dark blue)
│   ├── quotation.html        # Quotation template (purple)
│   └── receipt.html          # Receipt template (green)
├── config/                   # Configuration files
│   └── freelancer.example.json
├── data/                     # Your input JSON files
├── output/                   # Generated PDF files
├── examples/                 # Example JSON files
│   ├── invoice.json
│   ├── quotation.json
│   └── receipt.json
└── README.md
```

## CLI Usage

### Basic Command

```bash
bun run generate <type> <input-json> [options]
```

**Arguments:**
- `<type>`: Document type - `invoice`, `quotation`, or `receipt`
- `<input-json>`: Path to JSON data file

**Options:**
- `--output <path>`: Custom output PDF path (default: `output/{type}-{number}.pdf`)
- `--config <path>`: Path to freelancer config file (default: `config/freelancer.json`)

### Examples

```bash
# Generate an invoice
bun run generate invoice data/invoice-001.json

# Generate a quotation with custom output path
bun run generate quotation data/quote-001.json --output custom/path.pdf

# Generate a receipt with custom config
bun run generate receipt data/receipt-001.json --config config/freelancer.json
```

## Configuration

### Freelancer Configuration

Create `config/freelancer.json` with your details:

```json
{
  "name": "นาย สมชาย ดีมี",
  "title": "Web Developer & Designer",
  "email": "somchai@email.com",
  "phone": "08-9999-8888",
  "address": "เลขที่ 123 ซ. เพชรบุรี 45 เขตราชเทวี กรุงเทพมหานคร 10400",
  "bankInfo": {
    "bankName": "ธนาคารกรุงเทพ",
    "accountName": "นาย สมชาย ดีมี",
    "accountNumber": "123-456-789-0"
  }
}
```

**Tip**: Copy `config/freelancer.example.json` to `config/freelancer.json` and update with your information.

## JSON Schema

### Invoice Schema

```json
{
  "documentNumber": "INV-2024-001",
  "issueDate": "2024-10-15",
  "dueDate": "2024-10-30",
  "customer": {
    "name": "นาย ทดสอบ ตัวอย่าง",
    "company": "บริษัท เดโมนิค จำกัด",
    "phone": "02-111-2222"
  },
  "items": [
    {
      "description": "บริการให้คำปรึกษาเทคโนโลยี",
      "quantity": 15,
      "unit": "ชม.",
      "unitPrice": 750.00
    }
  ],
  "taxRate": 0.03,
  "taxType": "withholding",
  "taxLabel": "หักภาษี ณ ที่จ่าย (3%)",
  "paymentTerms": [
    "เริ่มงาน: 30%",
    "จบ Phase 1: 30%",
    "จบงาน: 40%"
  ],
  "notes": "ขอบคุณที่ใช้บริการ | หากมีคำถามกรุณาติดต่อ"
}
```

**Fields:**
- `documentNumber` (string, required): Invoice number (e.g., "INV-2024-001")
- `issueDate` (string, required): Issue date in YYYY-MM-DD format
- `dueDate` (string, required): Payment due date in YYYY-MM-DD format
- `customer` (object, required): Customer information
  - `name` (string): Customer name
  - `company` (string, optional): Company name
  - `phone` (string): Contact phone
- `items` (array, required): Line items
  - `description` (string): Item description
  - `quantity` (number): Quantity
  - `unit` (string): Unit of measurement
  - `unitPrice` (number): Price per unit
- `taxRate` (number): Tax rate as decimal (e.g., 0.03 for 3%)
- `taxType` (string): Tax type - `"withholding"` (deducted) or `"vat"` (added)
- `taxLabel` (string): Tax label to display
- `paymentTerms` (array, optional): Payment terms as array of strings
- `notes` (string, optional): Additional notes or footer text

### Quotation Schema

```json
{
  "documentNumber": "QT-2024-001",
  "issueDate": "2024-10-15",
  "validUntil": "2024-11-15",
  "customer": { /* same as invoice */ },
  "items": [ /* same structure as invoice */ ],
  "taxRate": 0.07,
  "taxType": "vat",
  "taxLabel": "ภาษีมูลค่าเพิ่ม 7%",
  "paymentTerms": [
    "ลงนามสัญญา: 40%",
    "ส่งมอบระบบ: 40%",
    "หลังฝึกอบรม: 20%"
  ],
  "notes": "ราคานี้มีผลถึงวันที่ระบุ"
}
```

**Differences from Invoice:**
- `validUntil` (string): Quote validity date (replaces `dueDate`)
- `paymentTerms` (array, optional): Payment terms as array of strings

### Receipt Schema

```json
{
  "documentNumber": "REC-2024-001",
  "issueDate": "2024-10-15",
  "paymentDate": "2024-10-15",
  "paymentMethod": "โอนเงิน",
  "referenceNumber": "INV-2024-001",
  "customer": { /* same as invoice */ },
  "items": [ /* same structure as invoice */ ],
  "taxRate": 0.03,
  "taxType": "withholding",
  "taxLabel": "หักภาษี ณ ที่จ่าย (3%)",
  "paidAmount": 52137.50,
  "paymentTerms": [
    "งวดที่ 1 (เริ่มงาน): 30% - ชำระแล้ว",
    "งวดที่ 2 (ส่งมอบ UI): 30% - ชำระแล้ว",
    "งวดที่ 3 (ส่งมอบงาน): 40% - นี่คือใบเสร็จสำหรับงวดนี้"
  ],
  "notes": "ได้รับเงินเรียบร้อยแล้ว"
}
```

**Differences from Invoice:**
- `paymentDate` (string): Date payment was received (replaces `dueDate`)
- `paymentMethod` (string): Payment method (e.g., "โอนเงิน", "เงินสด")
- `referenceNumber` (string, optional): Reference to original invoice
- `paidAmount` (number): Amount actually paid
- `paymentTerms` (array, optional): Payment terms as array of strings (useful for showing payment milestone context)

## Document Types & Color Themes

| Type | Color | Hex Code | Use Case |
|------|-------|----------|----------|
| **Invoice** | Dark Blue | `#2c3e50` | Bill for completed work |
| **Quotation** | Purple | `#8e44ad` | Price estimate before work |
| **Receipt** | Green | `#27ae60` | Payment confirmation |

## Development Workflow

1. **Setup**: Copy `config/freelancer.example.json` to `config/freelancer.json` and update with your info
2. **Create data**: Create JSON file in `data/` folder with document details
3. **Generate PDF**: Run the generate command
4. **Send invoice**: Use the generated PDF from `output/` folder

## Examples

See the `examples/` folder for complete examples:
- `examples/invoice.json` - Invoice example
- `examples/quotation.json` - Quotation example
- `examples/receipt.json` - Receipt example

## Calculation Logic

The tool automatically calculates:

1. **Subtotal**: Sum of all line items (`quantity × unitPrice`)
2. **Tax**:
   - If `taxType` is `"withholding"`: Tax is **deducted** from subtotal
   - If `taxType` is `"vat"`: Tax is **added** to subtotal
3. **Total**: Final amount after tax calculation

**Example (Withholding Tax 3%):**
```
Subtotal: 53,750.00
Tax (3%):  (1,612.50)  ← deducted
Total:     52,137.50
```

**Example (VAT 7%):**
```
Subtotal: 196,000.00
VAT (7%):   13,720.00  ← added
Total:     209,720.00
```

## Thai Language Support

- All templates support Thai language
- Uses Noto Sans Thai font (loaded from Google Fonts)
- Dates can be formatted in Buddhist calendar (BE) format
- Number formatting with Thai thousand separators

## License

MIT

## Author

Created for personal freelance work. Customize as needed for your business.
