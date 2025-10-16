# Luca - Your AI Invoice Assistant

![Example Documents](example.png)

**Generate professional invoices, quotations, and receipts just by chatting with Luca.**
No JSON files. No command-line gymnastics. Just tell Luca what you need in plain language.

## Meet Luca

Luca is your AI financial document assistant built for [Claude Code](https://claude.com/claude-code). Instead of wrestling with JSON schemas or memorizing CLI commands, you simply have a conversation:

```
@luca I need an invoice for the web design project I just finished for ABC Company
```

Luca will:
- Ask you the right questions (customer info, project details, payment terms)
- Handle Thai tax calculations automatically (withholding vs VAT)
- Generate a beautiful PDF in A4 format
- Draft a professional email template to send with it
- Keep track of document numbers automatically

Perfect for freelancers who want to spend less time on paperwork and more time doing actual work.

## Quick Start

### Installation

```bash
# Install dependencies
bun install

# Setup your info (one-time)
cp config/freelancer.example.json config/freelancer.json
# Edit config/freelancer.json with your details
```

### Using Luca (Recommended)

Just tag `@luca` in Claude Code and describe what you need:

```
@luca create an invoice for the mobile app project
```

```
@luca I need a quotation for a new client - web redesign project
```

```
@luca generate a receipt for the payment I just received
```

Luca handles everything: gathering details, creating files, generating PDFs, and drafting emails.

## What You Get

Three types of professional documents with distinct color themes:

| Type | Color | When to Use |
|------|-------|-------------|
| **Invoice** | Dark Blue (#2c3e50) | Bill clients for completed work |
| **Quotation** | Purple (#8e44ad) | Send price estimates before starting |
| **Receipt** | Green (#27ae60) | Confirm payments received |

Each document includes:
- Auto-numbering (e.g., INV-202410-001)
- Thai language support with Buddhist calendar dates
- Automatic tax calculations (withholding or VAT)
- Your branding (name, contact, bank details)
- Professional formatting ready to print

## How It Works

Behind the scenes, Luca uses a simple but powerful workflow:

1. **Conversation** → Luca gathers all required information through natural chat
2. **Validation** → Creates properly formatted JSON with correct schema
3. **Generation** → Renders HTML templates to PDF using Puppeteer
4. **Delivery** → Provides the PDF + email template ready to send

All documents are A4 format, professionally styled, and include Thai number formatting with proper Buddhist Era dates.

## Alternative: Traditional CLI Usage

If you prefer command-line tools or want to integrate this into scripts:

```bash
bun run generate <type> <input-json> [options]
```

**Examples:**
```bash
bun run generate invoice examples/invoice-auto.json
bun run generate quotation examples/quotation.json --output custom/path.pdf
bun run generate receipt examples/receipt.json
```

See the `examples/` folder for sample JSON files you can use as templates.

## Configuration

Your freelancer information is stored once in `config/freelancer.json`:

```json
{
  "name": "Your Name",
  "title": "Your Title",
  "email": "your@email.com",
  "phone": "08-1234-5678",
  "address": "Your Address",
  "taxId": "1-2345-67890-12-3",
  "bankInfo": {
    "bankName": "Bank Name",
    "accountName": "Account Name",
    "accountNumber": "123-456-789-0"
  }
}
```

This information appears on all your documents. Set it once, use it forever.

## Auto-Numbering

Documents are automatically numbered with the format `PREFIX-YYYYMM-NNN`:
- **Invoice**: `INV-202410-001`, `INV-202410-002`, ...
- **Quotation**: `QT-202410-001`, `QT-202410-002`, ...
- **Receipt**: `REC-202410-001`, `REC-202410-002`, ...

Counters reset each month and increment automatically. Luca handles this for you, or you can set `"documentNumber": "auto"` in JSON files when using CLI mode.

Metadata is stored in `.metadata.json` (gitignored by default).

## Tax Calculations

The tool handles Thai tax automatically:

- **Withholding Tax (3%)**: Deducted from subtotal (common for freelancers)
  - Example: ฿53,750 - ฿1,612.50 = ฿52,137.50
- **VAT (7%)**: Added to subtotal
  - Example: ฿196,000 + ฿13,720 = ฿209,720

Luca helps you choose the right tax type based on your situation.

## Tech Stack

Built with:
- **Bun** - Fast JavaScript runtime
- **TypeScript** - Type-safe code
- **Puppeteer** - HTML to PDF rendering
- **HTML/CSS** - Professional templates with Thai font support (Noto Sans Thai)

---

## Advanced: JSON Schema Reference

If you're using CLI mode or integrating with other tools, here are the complete JSON schemas:

<details>
<summary><strong>Invoice Schema</strong></summary>

```json
{
  "documentNumber": "INV-2024-001",
  "issueDate": "2024-10-15",
  "dueDate": "2024-10-30",
  "customer": {
    "name": "Customer Name",
    "company": "Company Name",
    "address": "Full Address",
    "taxId": "Tax ID",
    "phone": "Phone (optional)"
  },
  "items": [
    {
      "description": "Service description",
      "quantity": 15,
      "unit": "hrs",
      "unitPrice": 750.00
    }
  ],
  "taxRate": 0.03,
  "taxType": "withholding",
  "taxLabel": "หักภาษี ณ ที่จ่าย (3%)",
  "paymentTerms": ["Optional payment terms"],
  "notes": "Optional notes"
}
```

**Key Fields:**
- `documentNumber`: Use "auto" for auto-numbering
- `dueDate`: Payment deadline
- `taxType`: "withholding" (deducted) or "vat" (added)
- `paymentTerms`: Optional array of payment milestones

</details>

<details>
<summary><strong>Quotation Schema</strong></summary>

```json
{
  "documentNumber": "QT-2024-001",
  "issueDate": "2024-10-15",
  "validUntil": "2024-11-15",
  "customer": { /* same as invoice */ },
  "items": [ /* same as invoice */ ],
  "taxRate": 0.07,
  "taxType": "vat",
  "taxLabel": "ภาษีมูลค่าเพิ่ม 7%",
  "paymentTerms": ["Optional payment terms"],
  "notes": "Optional notes"
}
```

**Differences from Invoice:**
- `validUntil` instead of `dueDate` (quote expiry date)
- Typically uses VAT instead of withholding tax

</details>

<details>
<summary><strong>Receipt Schema</strong></summary>

```json
{
  "documentNumber": "REC-2024-001",
  "issueDate": "2024-10-15",
  "paymentDate": "2024-10-15",
  "paymentMethod": "Bank Transfer",
  "referenceNumber": "INV-2024-001",
  "customer": { /* same as invoice */ },
  "items": [ /* same as invoice */ ],
  "taxRate": 0.03,
  "taxType": "withholding",
  "taxLabel": "หักภาษี ณ ที่จ่าย (3%)",
  "paidAmount": 52137.50,
  "paymentTerms": ["Optional payment context"],
  "notes": "Payment received"
}
```

**Differences from Invoice:**
- `paymentDate`: When payment was received
- `paymentMethod`: How payment was made
- `referenceNumber`: Original invoice reference (optional)
- `paidAmount`: Actual amount received

</details>

<details>
<summary><strong>Project Structure</strong></summary>

```
invoice-gen/
├── src/
│   ├── index.ts          # CLI entry point
│   ├── generator.ts      # PDF generation
│   ├── validator.ts      # Schema validation
│   ├── utils.ts          # Calculations & formatting
│   └── metadata.ts       # Auto-numbering logic
├── templates/
│   ├── invoice.html      # Invoice template (dark blue)
│   ├── quotation.html    # Quotation template (purple)
│   └── receipt.html      # Receipt template (green)
├── config/
│   └── freelancer.json   # Your info (gitignored)
├── data/                 # Your JSON inputs
├── output/               # Generated PDFs
└── examples/             # Sample JSON files
```

</details>

---

## License

MIT

## Author

Created for personal freelance work. Customize as needed for your business.
