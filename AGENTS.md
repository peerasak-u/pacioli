# Pacioli Agent Guide

This document provides essential information for AI coding agents working on the Pacioli project.

## Project Overview
Pacioli is a CLI tool for generating professional financial documents (invoices, quotations, receipts) for freelancers. It uses Bun as the runtime, Puppeteer for PDF generation from HTML templates, and TypeScript for core logic.

## Development Commands

### Environment Setup
- **Install dependencies**: `bun install`
- **Configure profile**: `cp config/freelancer.example.json config/freelancer.json` (then edit)

### Execution
- **Run CLI development**: `bun run src/cli.ts <command>`
- **Generate document**: `bun run generate <type> <json-path> --customer <customer-json>`
- **Run project commands**: `bun run dev init`, `bun run dev generate ...`

### Testing
- **Run all tests**: `bun test`
- **Run single test file**: `bun test tests/utils.test.ts`
- **Run specific test by name**: `bun test -t "calculates withholding tax correctly"`
- **Test with watch mode**: `bun test --watch`

## Code Style & Guidelines

### Language & Runtime
- **Runtime**: Bun (>= 1.0.0)
- **Language**: TypeScript (Strict mode enabled)
- **Module System**: ESM (Use `import`/`export`)

### Formatting & Naming
- **Indentation**: 2 spaces
- **Semicolons**: Always used
- **Variables/Functions**: `camelCase` (e.g., `calculateTotals`, `documentNumber`)
- **Interfaces/Types**: `PascalCase` (e.g., `InvoiceData`, `LineItem`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `VALID_TYPES`, `DATE_FORMAT_REGEX`)
- **Filenames**: `kebab-case` for commands/templates, `camelCase` or `kebab-case` for source files (project uses both, prefer consistency with existing file).

### Imports
- Group imports: External libraries first, then local modules.
- Use explicit file extensions in imports if required by the environment (though Bun usually handles it).
- Prefer `import type` for type-only imports.

### Error Handling
- Use `try-catch` for side-effect operations like file I/O and PDF generation.
- Use explicit validation functions returning a `ValidationResult` object (`{ valid: boolean; errors: string[] }`) for data validation.
- Fail fast for CLI arguments validation.

### File I/O
- Prefer `Bun.file(path)` and its methods (`.exists()`, `.json()`, `.text()`) over Node's `fs` where possible.
- Use `path.join()` for cross-platform path construction.

### Documentation
- Use JSDoc comments for exported functions, interfaces, and classes.
- Focus on the "why" in comments for complex logic.

## Project Architecture & Patterns

### Data Separation (DRY)
- **Document Data**: Specific to the transaction (items, dates, tax). Located in `examples/` or user-provided.
- **Customer Data**: Reusable profiles in `customers/`. Single source of truth for client info.
- **Freelancer Data**: Single source of truth in `config/freelancer.json`. Contains your business/bank info.

### Core Modules
- `src/cli.ts`: Main entry point, routes commands to specific handlers.
- `src/index.ts`: Orchestrates the document generation workflow.
- `src/generator.ts`: Uses Puppeteer to render HTML templates to PDF.
- `src/validator.ts`: Schema validation and TypeScript interfaces for data.
- `src/metadata.ts`: Manages auto-numbering and persistent state in `.metadata.json`.
- `src/utils.ts`: Shared calculation and formatting helpers.

### Logic Conventions
- **Tax Calculation**: 
  - `withholding`: `total = subtotal - (subtotal * taxRate)`. Common for service billing.
  - `vat`: `total = subtotal + (subtotal * taxRate)`. Common for goods/VAT-registered.
- **Date Conversion**: All dates in PDF output must be converted to Thai Buddhist Era (BE) using `formatDateThai()`. Example: `2024-10-15` -> `15 ตุลาคม 2567`.
- **Auto-numbering**: Format is `PREFIX-YYYYMM-NUMBER`. Counter resets monthly.

### Template Engine
- Uses simple `{{placeholder}}` replacement in HTML files located in `templates/`.
- Conditional rendering (e.g., showing/hiding phone numbers) is handled in `src/generator.ts` before injection.
- Styles are embedded in templates; use CSS print media queries for A4 layout.

## Common Pitfalls & Tips
- **Bun APIs**: Don't use Node's `fs` when `Bun.file()` is available. Bun's file API is more performant and has a cleaner syntax.
- **Path Issues**: Always use `path.join()` or absolute paths. Bun handles some relative paths differently than Node.
- **Puppeteer in Bun**: Ensure `puppeteer` is correctly installed. Bun sometimes requires specific flags if running in restricted environments.
- **Thai Fonts**: Templates rely on Google Fonts (Sarabun). Ensure network access or bundle fonts if working offline.
- **Validation**: Always validate the entire data structure (Document + Customer + Profile) before starting PDF generation to avoid partial failures.

## Adding New Features
1. **New Document Type**:
   - Create `templates/new-type.html`.
   - Add interface to `src/validator.ts`.
   - Add validation logic to `src/validator.ts`.
   - Update `src/index.ts` and `src/commands/generate.ts`.
2. **New Helper**: Add to `src/utils.ts` and write corresponding tests in `tests/utils.test.ts`.

## Verification Checklist
- [ ] Run `bun test` after changes.
- [ ] Ensure PDF generation succeeds for all three types: invoice, quotation, receipt.
- [ ] Validate that Thai BE date conversion is correct (+543 years).
- [ ] Verify that auto-numbering increments correctly in `.metadata.json`.
- [ ] Check that financial calculations are accurate to 2 decimal places.
