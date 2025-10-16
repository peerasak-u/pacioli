# CLI Invoice Generator

A command-line tool for generating professional financial documents (invoices, quotations, receipts) for freelance work. Generates ready-to-use PDF files in A4 format.

![Example Documents](example.png)

## Overview

This tool converts JSON data into beautifully formatted PDF documents using HTML templates and Puppeteer. Perfect for freelancers who need to quickly generate professional invoices, quotations, and receipts from the terminal.

## Features

- Generate three types of documents: **Invoice**, **Quotation**, **Receipt**
- **Auto-numbering** with sequential document tracking
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
  "taxId": "1-2345-67890-12-3",
  "bankInfo": {
    "bankName": "ธนาคารกรุงเทพ",
    "accountName": "นาย สมชาย ดีมี",
    "accountNumber": "123-456-789-0"
  }
}
```

**Note**: Phone is optional and can be omitted if not needed.

**Tip**: Copy `config/freelancer.example.json` to `config/freelancer.json` and update with your information.

## Auto-Numbering

The tool automatically tracks document numbers for each type (invoice, quotation, receipt) using a `.metadata.json` file.

### Using Auto-Numbering

Set `"documentNumber": "auto"` in your JSON file:

```json
{
  "documentNumber": "auto",
  "issueDate": "2024-10-15",
  ...
}
```

When you generate the document, the tool will:
1. Check `.metadata.json` for the last used number
2. Generate the next sequential number (e.g., `INV-202410-001`, `INV-202410-002`, etc.)
3. Update the metadata file automatically

### Document Number Format

- **Invoice**: `INV-YYYYMM-NNN` (e.g., `INV-202410-001`)
- **Quotation**: `QT-YYYYMM-NNN` (e.g., `QT-202410-001`)
- **Receipt**: `REC-YYYYMM-NNN` (e.g., `REC-202410-001`)

### Metadata File

The `.metadata.json` file is automatically created and tracks:
- Last document number for each type
- Current year and month (counters reset automatically each month)
- Custom prefix for each document type

**Note**: `.metadata.json` is gitignored by default to keep your business data private.

### Manual Numbering

You can still use manual document numbers by specifying them explicitly:

```json
{
  "documentNumber": "INV-2024-SPECIAL-001",
  ...
}
```

The metadata counter will be updated if the manual number is higher than the current counter.

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
    "address": "เลขที่ 456 ถ. สาทร เขตสาทร กรุงเทพมหานคร 10120",
    "taxId": "0-1055-12345-67-8",
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
- `documentNumber` (string, required): Invoice number (e.g., "INV-2024-001" or "auto" for auto-numbering)
- `issueDate` (string, required): Issue date in YYYY-MM-DD format
- `dueDate` (string, required): Payment due date in YYYY-MM-DD format
- `customer` (object, required): Customer information
  - `name` (string, required): Customer name
  - `company` (string, optional): Company name
  - `address` (string, required): Customer address
  - `taxId` (string, required): Tax identification number
  - `phone` (string, optional): Contact phone
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
  "customer": {
    "name": "นาย ลูกค้า ทดสอบ",
    "company": "บริษัท ตัวอย่าง จำกัด",
    "address": "เลขที่ 789 ถ. สุขุมวิท เขตคลองเตย กรุงเทพมหานคร 10110",
    "taxId": "0-1055-98765-43-2",
    "phone": "02-333-4444"
  },
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
- `validUntil` (string, required): Quote validity date (replaces `dueDate`)
- `paymentTerms` (array, optional): Payment terms as array of strings
- Customer fields: Same requirements as invoice (address and taxId required, phone optional)

### Receipt Schema

```json
{
  "documentNumber": "REC-2024-001",
  "issueDate": "2024-10-15",
  "paymentDate": "2024-10-15",
  "paymentMethod": "โอนเงิน",
  "referenceNumber": "INV-2024-001",
  "customer": {
    "name": "นาย ทดสอบ ตัวอย่าง",
    "company": "บริษัท เดโมนิค จำกัด",
    "address": "เลขที่ 456 ถ. สาทร เขตสาทร กรุงเทพมหานคร 10120",
    "taxId": "0-1055-12345-67-8",
    "phone": "02-111-2222"
  },
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
- `paymentDate` (string, required): Date payment was received (replaces `dueDate`)
- `paymentMethod` (string, required): Payment method (e.g., "โอนเงิน", "เงินสด")
- `referenceNumber` (string, optional): Reference to original invoice
- `paidAmount` (number, required): Amount actually paid
- `paymentTerms` (array, optional): Payment terms as array of strings (useful for showing payment milestone context)
- Customer fields: Same requirements as invoice (address and taxId required, phone optional)

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

**Manual Numbering:**
- `examples/invoice.json` - Invoice with manual document number
- `examples/quotation.json` - Quotation with manual document number
- `examples/receipt.json` - Receipt with manual document number

**Auto-Numbering:**
- `examples/invoice-auto.json` - Invoice with auto-numbering
- `examples/quotation-auto.json` - Quotation with auto-numbering
- `examples/receipt-auto.json` - Receipt with auto-numbering

Try auto-numbering:
```bash
bun run generate invoice examples/invoice-auto.json
```

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

## Bonus: Using Claude Code's Luca Agent

If you're using [Claude Code](https://claude.com/claude-code), this project includes a custom **Luca agent** that makes document creation even easier! Instead of manually creating JSON files, Luca acts as your financial document assistant.

### What Luca Does

Luca is an intelligent agent that:
- Interactively gathers all required information through conversation
- Creates properly formatted JSON files following the correct schema
- Automatically generates the PDF document
- Drafts a professional email template for sending to clients
- Handles Thai tax calculations correctly (withholding tax vs VAT)

### How to Use Luca

Simply tag the `@luca` agent in Claude Code and describe what you need:

```
@luca create an invoice for 2nd installment follow the "data/fastwork-001.md"
```

```
@luca I need a quotation for a new web design project for ABC Company
```

```
@luca create a receipt for the payment I just received from XYZ Corp
```

### What Luca Delivers

After a brief conversation to gather details, Luca will:
1. Create a valid JSON file in the `data/` directory
2. Run the generator to produce the PDF in `output/`
3. Provide a professional email template (Thai or English)
4. Summarize everything with file paths and document numbers

This is perfect for:
- Quick document generation without remembering JSON schema
- Following up on existing projects (reference markdown notes in `data/`)
- Getting professional email templates along with your documents
- Ensuring correct tax calculations every time

### Try It Out

If you have Claude Code installed, just type `@luca` in the chat and describe what document you need!

## License

MIT

## Author

Created for personal freelance work. Customize as needed for your business.
