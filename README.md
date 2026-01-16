# Pacioli

Generate professional invoices, quotations, and receipts in seconds.

Named after **Luca Pacioli** (1494), the father of modern accounting.

## Quick Start

```bash
# Initialize project
bunx pacioli init

# Configure profile
cp config/freelancer.example.json config/freelancer.json

# Generate document
bunx pacioli generate invoice examples/invoice.json --customer customers/acme-corp.json
```

PDF saved to `output/invoice-INV-202411-001.pdf`

## Features

- **Auto-numbering** - Sequential numbers that reset monthly (INV-202411-001)
- **Thai tax support** - Withholding tax and VAT calculations
- **Customer database** - Reusable JSON files, no duplication
- **Beautiful PDFs** - Professional HTML templates with Thai Buddhist Era dates
- **Zero config** - Start in 30 seconds

## Usage

### Init
```bash
pacioli init [--force]
```
Creates: `templates/`, `examples/`, `customers/`, `config/`, `output/`, `.metadata.json`

### Generate
```bash
pacioli generate <type> <data.json> --customer <customer.json> [--output path] [--profile path]
```

**Types**: `invoice`, `quotation`, `receipt`

**Auto-numbering**: Set `"documentNumber": "auto"` for sequential numbering

## Document Types

- **Invoice** - Bill for completed work (due date, payment terms)
- **Quotation** - Price estimate (validity period, optional payment terms)
- **Receipt** - Payment confirmation (payment date, method, reference)

## Configuration

**config/freelancer.json**:
```json
{
  "name": "Your Name",
  "title": "Your Title",
  "email": "you@example.com",
  "phone": "081-234-5678",
  "address": "Your Address",
  "taxId": "Your Tax ID",
  "bankInfo": {
    "bankName": "Bank Name",
    "accountName": "Account Name",
    "accountNumber": "Account Number",
    "branch": "Branch"
  },
  "signature": "config/signature.png"
}
```

**Document Data** (`data.json`):
```json
{
  "documentNumber": "auto",
  "issueDate": "2024-11-12",
  "items": [
    {
      "description": "Web Development",
      "quantity": 1,
      "unit": "Project",
      "unitPrice": 50000
    }
  ],
  "taxType": "withholding",
  "taxRate": 0.03,
  "taxLabel": "หัก ณ ที่จ่าย 3%",
  "paymentTerms": ["Full payment within 30 days"],
  "notes": "Thank you!"
}
```

**Customer** (`customers/client.json`):
```json
{
  "name": "Client Name",
  "company": "Company Ltd",
  "address": "Client Address",
  "taxId": "Client Tax ID",
  "phone": "02-123-4567"
}
```

## Tax Calculations

- **Withholding**: Total = Subtotal - (Subtotal × Rate)
- **VAT**: Total = Subtotal + (Subtotal × Rate)

## Customization

Edit `templates/*.html` to change design. Uses `{{placeholder}}` syntax.

## Development

```bash
bun install
bun test
bun run dev init
bun run dev generate invoice examples/invoice.json --customer customers/acme-corp.json
```

## Requirements

- Bun ≥ 1.0.0
- Puppeteer (auto-installed)

## License

MIT
