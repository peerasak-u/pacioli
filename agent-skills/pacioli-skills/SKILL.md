---
name: pacioli
description: Generates professional financial documents (invoices, quotations, receipts) for freelancers using HTML templates and Puppeteer. Handles tax calculations, auto-numbering, and PDF generation.
---

# Pacioli

A CLI tool for generating financial documents. It uses JSON data files and HTML templates to produce PDFs.

## Quick Reference

### Run commands

```bash
bunx pacioli <command> [args]
```

| Command | Usage |
|---------|-------|
| `init` | Initialize a new project structure with config and templates |
| `generate <type> <path> --customer <path>` | Generate a PDF document (invoice, quotation, receipt) |
| `help` | Show help message |
| `version` | Show version |

## Common Workflows

### 1. Initialize a new project
Start here to create the necessary folder structure (`config`, `customers`, `templates`).

```bash
mkdir my-financial-docs
cd my-financial-docs
bunx pacioli init
```

### 2. Configure Freelancer Profile
Edit `config/freelancer.json` to set your business details and bank information.
See [references/SCHEMAS.md](references/SCHEMAS.md) for the format.

### 3. Generate an Invoice
Create a customer file (e.g., `customers/acme.json`) and an invoice file (e.g., `invoices/oct-service.json`).

```bash
bunx pacioli generate invoice invoices/oct-service.json --customer customers/acme.json
```

### 4. Generate a Quotation
```bash
bunx pacioli generate quotation quotations/web-design.json --customer customers/acme.json
```

### 5. Generate a Receipt
```bash
bunx pacioli generate receipt receipts/payment-101.json --customer customers/acme.json
```

## Project Structure

When you run `init`, Pacioli creates:

- `config/`: Contains `freelancer.json` (your profile).
- `customers/`: Store reusable customer JSON profiles here.
- `templates/`: HTML templates for documents. You can customize these.
- `examples/`: Example JSON files for each document type.
- `.metadata.json`: Tracks auto-incrementing document numbers.

## Data Formats

Data is provided via JSON files.
- **Dates**: Use `YYYY-MM-DD` format.
- **Auto-numbering**: Set `documentNumber` to `"auto"` to let Pacioli handle ID generation (e.g., `INV-202310-001`).
- **Tax**: Supports "withholding" (deducted) and "vat" (added).

For detailed JSON schemas and examples, see **[references/SCHEMAS.md](references/SCHEMAS.md)**.
