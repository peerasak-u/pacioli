# Pacioli Usage Guide

Complete guide for using Pacioli to generate professional financial documents.

## Table of Contents

- [Installation](#installation)
- [Initialization](#initialization)
- [Generating Documents](#generating-documents)
- [Auto-Numbering](#auto-numbering)
- [Customer Database](#customer-database)
- [Configuration](#configuration)
- [Document Types](#document-types)
- [Tax Calculations](#tax-calculations)
- [Customization](#customization)
- [Advanced Usage](#advanced-usage)

## Installation

### Using bunx (No Installation Required)

```bash
# Create a new project directory
mkdir my-invoices && cd my-invoices

# Initialize with templates and examples
bunx pacioli init
```

### Global Installation (Optional)

If you use this frequently, install globally:

```bash
bun install -g pacioli

# Now use without bunx prefix
pacioli init
pacioli generate invoice data.json --customer customer.json
```

## Initialization

### Initialize New Project

```bash
pacioli init
```

This creates the following structure in your current directory:

```
your-project/
├── templates/          # HTML templates (invoice, quotation, receipt)
├── examples/           # Sample JSON files to get started
├── customers/          # Customer database directory
├── config/             # Your freelancer profile
├── output/             # Generated PDFs
├── .metadata.json      # Auto-numbering state
├── .gitignore          # Git ignore rules
├── AGENTS.md           # AI agent documentation
└── CLAUDE.md           # Claude Code documentation
```

### Force Overwrite

If the directory is not empty and you want to overwrite existing files:

```bash
pacioli init --force
```

**⚠️ Warning**: Use `--force` with caution as it will overwrite existing files.

## Generating Documents

### Basic Usage

```bash
pacioli generate <type> <data.json> --customer <customer.json>
```

### Examples

```bash
# Generate invoice
pacioli generate invoice data/invoice.json --customer customers/acme-corp.json

# Generate quotation
pacioli generate quotation data/quote.json --customer customers/demo-company.json

# Generate receipt
pacioli generate receipt data/receipt.json --customer customers/test-customer.json
```

### Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--customer <path>` | Path to customer JSON file (required) | - |
| `--output <path>` | Custom output PDF path | `output/{type}-{number}.pdf` |
| `--profile <path>` | Path to freelancer profile | `config/freelancer.json` |
| `--help` | Show help message | - |

### Examples with Options

```bash
# Custom output path
pacioli generate invoice data.json --customer customer.json --output custom/path.pdf

# Alternative profile
pacioli generate invoice data.json --customer customer.json --profile config/freelancer-alt.json
```

### Alternative: customerPath in JSON

Instead of using `--customer` flag, you can specify the customer path inside your data JSON:

```json
{
  "customerPath": "customers/acme-corp.json",
  "documentNumber": "auto",
  "issueDate": "2024-11-12",
  ...
}
```

Then run:

```bash
pacioli generate invoice data.json
```

This is useful for scripts or when you want to embed the customer reference in the document data.

## Auto-Numbering

### How It Works

Set `"documentNumber": "auto"` in your JSON file:

```json
{
  "documentNumber": "auto",
  "issueDate": "2024-11-12",
  ...
}
```

Pacioli generates sequential numbers that reset each month:

| Format | Example |
|--------|---------|
| First invoice in Nov 2024 | `INV-202411-001` |
| Second invoice | `INV-202411-002` |
| First invoice in Dec 2024 | `INV-202412-001` (counter resets) |

### Prefixes by Document Type

| Document Type | Prefix |
|---------------|--------|
| Invoice | `INV` |
| Quotation | `QT` |
| Receipt | `REC` |

### Manual Document Numbers

You can also specify a custom document number:

```json
{
  "documentNumber": "INV-2024-CUSTOM-001",
  ...
}
```

This will not update the auto-numbering counter.

## Customer Database

Store customer data separately for reusability.

### Customer File Structure

**customers/acme-corp.json:**

```json
{
  "name": "นาย ทดสอบ ตัวอย่าง",
  "company": "บริษัท เดโมนิค จำกัด",
  "address": "เลขที่ 456 ถ. สาทร กรุงเทพมหานคร 10120",
  "taxId": "0-1055-12345-67-8",
  "phone": "02-111-2222"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Customer contact person name |
| `company` | string | No | Company name |
| `address` | string | No | Full address |
| `taxId` | string | No | Tax ID number |
| `phone` | string | No | Phone number |

### Best Practices

- Use descriptive filenames: `acme-corp.json`, `client-smith.json`
- Update once, use everywhere - all invoices/receipts reference this single file
- Organize by client or project if you have many customers

## Configuration

### Freelancer Profile

Create `config/freelancer.json` by copying the example:

```bash
cp config/freelancer.example.json config/freelancer.json
```

### Profile Structure

```json
{
  "name": "นายสมชาย ใจดี",
  "title": "Full-Stack Developer",
  "email": "somchai@example.com",
  "phone": "081-234-5678",
  "address": "123 ถนนสุขุมวิท กรุงเทพมหานคร 10110",
  "taxId": "1-2345-67890-12-3",
  "bankInfo": {
    "bankName": "ธนาคารกสิกรไทย",
    "accountName": "นายสมชาย ใจดี",
    "accountNumber": "123-4-56789-0",
    "branch": "สาขาสีลม"
  },
  "signature": "config/signature.png"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Your full name |
| `title` | string | No | Your professional title |
| `email` | string | Yes | Your email address |
| `phone` | string | No | Your phone number |
| `address` | string | Yes | Your full address |
| `taxId` | string | No | Your tax ID number |
| `bankInfo` | object | No | Bank account details |
| `signature` | string | No | Path to signature image |

### Multiple Profiles

You can create multiple profiles for different businesses or clients:

```bash
pacioli generate invoice data.json --customer customer.json --profile config/personal.json
pacioli generate invoice data.json --customer customer.json --profile config/company.json
```

## Document Types

### Invoice

For billing completed work.

**Required Fields:**
- `documentNumber`
- `issueDate`
- `dueDate`
- `items`

**Optional Fields:**
- `taxType`
- `taxRate`
- `taxLabel`
- `paymentTerms`
- `notes`

**Example:**

```json
{
  "documentNumber": "auto",
  "issueDate": "2024-11-12",
  "dueDate": "2024-11-30",
  "items": [
    {
      "description": "Website Development",
      "quantity": 1,
      "unit": "โครงการ",
      "unitPrice": 50000
    }
  ],
  "taxType": "withholding",
  "taxRate": 0.03,
  "taxLabel": "หัก ณ ที่จ่าย 3%",
  "paymentTerms": [
    "ชำระเต็มจำนวนภายใน 30 วัน",
    "โอนเงินเข้าบัญชีธนาคาร"
  ],
  "notes": "ขอบคุณที่ใช้บริการครับ"
}
```

### Quotation

For price estimates before work begins.

**Required Fields:**
- `documentNumber`
- `issueDate`
- `validUntil`
- `items`

**Optional Fields:**
- `taxType`
- `taxRate`
- `taxLabel`
- `paymentTerms`
- `notes`

**Example:**

```json
{
  "documentNumber": "auto",
  "issueDate": "2024-11-12",
  "validUntil": "2024-12-31",
  "items": [
    {
      "description": "E-commerce Website",
      "quantity": 1,
      "unit": "โครงการ",
      "unitPrice": 150000
    }
  ],
  "taxType": "vat",
  "taxRate": 0.07,
  "taxLabel": "VAT 7%",
  "paymentTerms": [
    "เริ่มงาน: 30%",
    "จบ Phase 1: 30%",
    "จบงาน: 40%"
  ],
  "notes": "ใบเสนอราคานี้สำหรับโครงการ e-commerce ที่มีคุณสมบัติตามที่กำหนด"
}
```

### Receipt

For payment confirmation.

**Required Fields:**
- `documentNumber`
- `issueDate`
- `paymentDate`
- `items`

**Optional Fields:**
- `paymentMethod`
- `paymentReference`
- `taxType`
- `taxRate`
- `taxLabel`
- `paymentTerms`
- `notes`

**Example:**

```json
{
  "documentNumber": "auto",
  "issueDate": "2024-11-15",
  "paymentDate": "2024-11-14",
  "items": [
    {
      "description": "Website Development",
      "quantity": 1,
      "unit": "โครงการ",
      "unitPrice": 50000
    }
  ],
  "paymentMethod": "โอนเงินธนาคาร",
  "paymentReference": "REF-20241114-001",
  "taxType": "withholding",
  "taxRate": 0.03,
  "taxLabel": "หัก ณ ที่จ่าย 3%",
  "paymentTerms": ["ชำระแล้วเต็มจำนวน"],
  "notes": "ขอบคุณที่ชำระเงินตรงเวลาครับ"
}
```

### Common Fields

All document types share these item structure:

```json
{
  "items": [
    {
      "description": "Service or product description",
      "quantity": 1,
      "unit": "Unit name (e.g., โครงการ, ชม., หน้า)",
      "unitPrice": 10000.00
    }
  ]
}
```

## Tax Calculations

### Withholding Tax (หัก ณ ที่จ่าย)

Common for freelancers in Thailand. Tax is **deducted** from total.

```
Total = Subtotal - (Subtotal × Tax Rate)
```

**Example:**
- Subtotal: 50,000 THB
- Tax Rate: 3%
- Tax Amount: 50,000 × 0.03 = 1,500 THB
- Total: 50,000 - 1,500 = **48,500 THB**

**Configuration:**
```json
{
  "taxType": "withholding",
  "taxRate": 0.03,
  "taxLabel": "หัก ณ ที่จ่าย 3%"
}
```

### VAT (Value Added Tax)

Tax is **added** to total.

```
Total = Subtotal + (Subtotal × Tax Rate)
```

**Example:**
- Subtotal: 50,000 THB
- Tax Rate: 7%
- Tax Amount: 50,000 × 0.07 = 3,500 THB
- Total: 50,000 + 3,500 = **53,500 THB**

**Configuration:**
```json
{
  "taxType": "vat",
  "taxRate": 0.07,
  "taxLabel": "VAT 7%"
}
```

### No Tax

Omit tax fields or set to zero:

```json
{
  "taxRate": 0,
  "taxLabel": "ไม่มีภาษี"
}
```

## Customization

### Edit Templates

After initialization, templates are copied to your project:

```bash
templates/
├── invoice.html       # Dark blue theme
├── quotation.html     # Purple theme
└── receipt.html       # Green theme
```

### Template Syntax

Templates use `{{placeholder}}` syntax for data injection:

```html
<div class="document-number">
  <strong>เลขที่:</strong> {{documentNumber}}
</div>
<div class="issue-date">
  <strong>วันที่:</strong> {{issueDate}}
</div>
```

### Customization Ideas

1. **Change Colors**
   ```css
   .header {
     background-color: #your-color;
   }
   ```

2. **Add Logo**
   ```html
   <img src="config/logo.png" alt="Company Logo">
   ```

3. **Modify Layout**
   - Change column widths
   - Add/remove sections
   - Adjust spacing

4. **Add Custom Fields**
   - Add new placeholders to HTML
   - Include the field in your JSON data

### Thai Date Conversion

All dates are automatically converted to Thai Buddhist Era (BE) in the PDF:

| Input | Output |
|-------|--------|
| `2024-11-15` | `15 พฤศจิกายน 2567` |

This conversion happens automatically in `src/utils.ts`.

## Advanced Usage

### Batch Generation

Generate multiple documents using shell scripts:

```bash
#!/bin/bash
for file in invoices/*.json; do
  pacioli generate invoice "$file" --customer "$(jq -r '.customerPath' "$file")"
done
```

### Version Control

The `.gitignore` file created by `pacioli init` excludes:
- `output/*.pdf` - Generated PDFs
- `config/freelancer.json` - Your sensitive profile
- `.metadata.json` - Auto-numbering state

You should:
- Commit templates and examples
- Keep `freelancer.json` private or use environment variables
- Manually commit `.metadata.json` if you want to track document numbers

### Environment-Specific Profiles

Create profiles for different environments:

```bash
config/
├── freelancer-dev.json      # Development/test profile
├── freelancer-prod.json     # Production profile
└── freelancer.example.json  # Example template
```

Use them as needed:

```bash
# Test documents
pacioli generate invoice test.json --customer test-customer.json --profile config/freelancer-dev.json

# Real documents
pacioli generate invoice invoice.json --customer real-customer.json --profile config/freelancer-prod.json
```

### Custom Output Naming

Use the `--output` flag for custom naming:

```bash
pacioli generate invoice invoice.json --customer acme.json --output "invoices/2024/11/acme-nov-2024.pdf"
```

## Troubleshooting

### Common Issues

**Error: Profile file not found**
```
Error: Profile file not found: config/freelancer.json
Tip: Did you forget to run 'pacioli init'?
Or copy config/freelancer.example.json to config/freelancer.json
```
**Solution:** Run `cp config/freelancer.example.json config/freelancer.json`

**Error: Invalid document data**
```
Error: Invalid invoice data:
   - Missing required field: dueDate
```
**Solution:** Check the required fields for your document type in the "Document Types" section.

**Error: Auto-numbering conflict**
If you manually set document numbers that conflict with auto-numbering, the counter may not increment properly. Either use `"documentNumber": "auto"` consistently or manually manage your own numbering.

### Getting Help

```bash
pacioli --help          # Main help
pacioli init --help     # Init command help
pacioli generate --help # Generate command help
```

### Report Issues

- GitHub Issues: https://github.com/peerasak-u/pacioli/issues
- GitHub Discussions: https://github.com/peerasak-u/pacioli/discussions

## Project Structure

```
pacioli/
├── src/
│   ├── cli.ts              # Main CLI entry point
│   ├── commands/
│   │   ├── init.ts         # Init command handler
│   │   └── generate.ts     # Generate command handler
│   ├── generator.ts        # PDF generation with Puppeteer
│   ├── validator.ts        # JSON schema validation
│   ├── metadata.ts         # Auto-numbering system
│   └── utils.ts            # Helper functions
├── templates/              # HTML templates
├── examples/               # Sample JSON files
├── customers/              # Sample customer database
├── config/                 # Configuration examples
├── tests/                  # Test files
└── package.json            # Package metadata
```

## Development

```bash
# Clone repository
git clone https://github.com/peerasak-u/pacioli.git
cd pacioli

# Install dependencies
bun install

# Run locally
bun run src/cli.ts init
bun run src/cli.ts generate invoice examples/invoice.json --customer customers/acme-corp.json

# Link for global testing
bun link
pacioli init

# Run tests
bun test
bun test --watch
```

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/utils.test.ts

# Run tests by name
bun test -t "calculates withholding tax correctly"
```

## Publishing

```bash
# Login to npm
npm login

# Publish
bun publish
```

After publishing, users can run:
```bash
bunx pacioli init
```

## License

MIT License - see LICENSE file for details
