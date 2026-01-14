# Pacioli - Professional Financial Documents for Freelancers

![Example Documents](example.png)

> Named after **Luca Pacioli** (1494), the father of modern accounting and bookkeeping

Generate professional invoices, quotations, and receipts in seconds. Beautiful A4 PDFs with automatic Thai numbering, tax calculations, and customizable templates.

## Features

- **Zero configuration** - Start generating documents in 30 seconds with `bunx pacioli init`
- **Auto-numbering** - Sequential document numbers that reset monthly (INV-202511-001, INV-202511-002, etc.)
- **Thai tax support** - Automatic withholding tax and VAT calculations
- **Beautiful templates** - Professional HTML/CSS templates for each document type
- **Customizable** - Edit templates to match your branding
- **Customer database** - Reusable customer JSON files, no duplication
- **Bun-native** - Lightning fast with Bun runtime

## Quick Start

### Using bunx (No Installation Required)

```bash
# Create a new project directory
mkdir my-invoices && cd my-invoices

# Initialize with templates and examples
bunx pacioli init

# Configure your profile (one-time setup)
cp config/freelancer.example.json config/freelancer.json
# Edit config/freelancer.json with your information

# Generate your first invoice
bunx pacioli generate invoice examples/invoice-auto.json --customer customers/acme-corp.json
```

That's it! Your PDF is ready in `output/invoice-INV-202511-001.pdf`

### Installation (Optional)

If you use this frequently, install globally:

```bash
bun install -g pacioli

# Now use without bunx prefix
pacioli init
pacioli generate invoice data.json --customer customer.json
```

## Usage

### Initialize New Project

```bash
pacioli init
```

Creates:
- `templates/` - HTML templates (invoice, quotation, receipt)
- `examples/` - Sample JSON files to get started
- `customers/` - Customer database directory
- `config/` - Your freelancer profile
- `output/` - Generated PDFs
- `.metadata.json` - Auto-numbering state

### Generate Documents

```bash
# Invoice (for billing completed work)
pacioli generate invoice data/invoice.json --customer customers/acme-corp.json

# Quotation (for price estimates before work begins)
pacioli generate quotation data/quote.json --customer customers/demo-company.json

# Receipt (for payment confirmation)
pacioli generate receipt data/receipt.json --customer customers/test-customer.json
```

### Auto-Numbering

Set `"documentNumber": "auto"` in your JSON file:

```json
{
  "documentNumber": "auto",
  "issueDate": "2024-11-12",
  ...
}
```

Pacioli generates sequential numbers that reset each month:
- First invoice in Nov 2024: `INV-202411-001`
- Second invoice: `INV-202411-002`
- First invoice in Dec 2024: `INV-202412-001` (counter resets)

### Customer Database

Store customer data separately for reusability:

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

Use this customer file for all their invoices/receipts - update once, use everywhere.

## Document Types

### Invoice
- For billing completed work
- Includes due date and optional payment terms
- Tax type: Usually "withholding" (deducted from total)

### Quotation
- For price estimates before work begins
- Includes validity period
- Tax type: Usually "vat" (added to total)
- Optional payment terms for outlining milestones

### Receipt
- For payment confirmation
- Shows payment date, method, and reference number
- Optional payment terms for context

## Configuration

### Freelancer Profile

Create `config/freelancer.json`:

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

### Document Data Format

**Invoice Example:**
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

See `examples/` directory after running `pacioli init` for complete examples.

## Customization

### Edit Templates

After initialization, templates are copied to your project:

```bash
templates/
├── invoice.html       # Dark blue theme
├── quotation.html     # Purple theme
└── receipt.html       # Green theme
```

Edit these HTML files to:
- Change colors and fonts
- Add your logo
- Modify layout
- Add custom fields

Templates use `{{placeholder}}` syntax for data injection.

### Tax Calculations

**Withholding Tax** (common for freelancers in Thailand):
```
Total = Subtotal - (Subtotal × Tax Rate)
```
Example: 50,000 - (50,000 × 0.03) = 48,500 THB

**VAT** (Value Added Tax):
```
Total = Subtotal + (Subtotal × Tax Rate)
```
Example: 50,000 + (50,000 × 0.07) = 53,500 THB

## Advanced Usage

### Custom Output Path

```bash
pacioli generate invoice data.json --customer customer.json --output custom/path.pdf
```

### Alternative Profile

```bash
pacioli generate invoice data.json --customer customer.json --profile config/freelancer-alt.json
```

### Force Overwrite During Init

```bash
pacioli init --force
```

## Optional: Luca AI Assistant

This tool also includes **Luca**, an AI assistant for [Claude Code](https://claude.com/claude-code) that generates documents through natural conversation:

```
@luca I need an invoice for the web design project I just finished for ABC Company
```

Luca will:
- Ask you the right questions
- Create the JSON files
- Generate the PDF
- Draft a professional email template

Perfect for those who prefer conversation over command-line.

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
```

## Publishing to npm/Bun

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

## Requirements

- **Bun** ≥ 1.0.0
- **Puppeteer** (installed automatically)

## Project Structure

```
pacioli/
├── src/
│   ├── cli.ts              # Main CLI entry point
│   ├── commands/
│   │   ├── init.ts         # Init command
│   │   └── generate.ts     # Generate command
│   ├── generator.ts        # PDF generation
│   ├── validator.ts        # JSON validation
│   ├── metadata.ts         # Auto-numbering system
│   └── utils.ts            # Helper functions
├── templates/              # HTML templates
├── examples/               # Sample JSON files
├── customers/              # Sample customer database
├── config/                 # Configuration examples
└── package.json            # Package metadata
```

## Why "Pacioli"?

Luca Pacioli (1445-1517) was an Italian mathematician and Franciscan friar who published the first comprehensive book on double-entry bookkeeping in 1494. His work, *Summa de arithmetica*, laid the foundation for modern accounting and is still used today. Pacioli's system of debits and credits revolutionized commerce and enabled the Renaissance banking system.

This tool honors his legacy by making financial document generation accessible to modern freelancers and small businesses.

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please open an issue or pull request.

## Support

- **Issues**: https://github.com/peerasak-u/pacioli/issues
- **Discussions**: https://github.com/peerasak-u/pacioli/discussions

---

Made with ❤️ for freelancers everywhere
