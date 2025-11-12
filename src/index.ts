#!/usr/bin/env bun

/**
 * CLI Invoice Generator
 * Main entry point
 */

import { fileExists, readJSON, getOutputPath } from "./utils";
import {
  validateInvoice,
  validateQuotation,
  validateReceipt,
  validateFreelancerConfig,
  validateCustomer,
  type DocumentData,
  type FreelancerConfig,
  type Customer,
} from "./validator";
import { generatePDF } from "./generator";
import {
  getNextDocumentNumber,
  incrementDocumentCounter,
} from "./metadata";

const VALID_TYPES = ["invoice", "quotation", "receipt"] as const;
type DocumentType = (typeof VALID_TYPES)[number];

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
CLI Invoice Generator

Usage:
  bun run generate <type> <input-json> --customer <customer-json> [options]

Arguments:
  <type>           Document type: invoice, quotation, or receipt
  <input-json>     Path to JSON data file
  --customer       Path to customer JSON file (required)

Options:
  --output <path>  Custom output PDF path (default: output/{type}-{number}.pdf)
  --config <path>  Path to freelancer config (default: config/freelancer.json)
  --help           Show this help message

Examples:
  bun run generate invoice data/invoice-001.json --customer customers/acme-corp.json
  bun run generate quotation data/quote-001.json --customer customers/demo.json --output custom/path.pdf
  bun run generate receipt data/receipt-001.json --customer customers/test.json --config config/freelancer.json
  `);
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]) {
  const options: {
    type?: DocumentType;
    inputPath?: string;
    customerPath?: string;
    outputPath?: string;
    configPath: string;
    help: boolean;
  } = {
    configPath: "config/freelancer.json",
    help: false,
  };

  // Check for help flag
  if (args.includes("--help") || args.includes("-h")) {
    options.help = true;
    return options;
  }

  // Get positional arguments
  const positionalArgs = args.filter((arg) => !arg.startsWith("--"));

  if (positionalArgs.length >= 2) {
    const type = positionalArgs[0];
    if (VALID_TYPES.includes(type as DocumentType)) {
      options.type = type as DocumentType;
    }
    options.inputPath = positionalArgs[1];
  }

  // Parse options
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === "--customer" && nextArg) {
      options.customerPath = nextArg;
      i++;
    } else if (arg === "--output" && nextArg) {
      options.outputPath = nextArg;
      i++;
    } else if (arg === "--config" && nextArg) {
      options.configPath = nextArg;
      i++;
    }
  }

  return options;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const options = parseArgs(args);

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  // Validate arguments
  if (!options.type) {
    console.error("Error: Invalid or missing document type");
    console.error(
      `Valid types: ${VALID_TYPES.join(", ")}`
    );
    process.exit(1);
  }

  if (!options.inputPath) {
    console.error("Error: Input JSON file path is required");
    printUsage();
    process.exit(1);
  }

  if (!options.customerPath) {
    console.error("Error: Customer JSON file path is required (use --customer)");
    printUsage();
    process.exit(1);
  }

  // Check if input file exists
  if (!(await fileExists(options.inputPath))) {
    console.error(`Error: Input file not found: ${options.inputPath}`);
    process.exit(1);
  }

  // Check if customer file exists
  if (!(await fileExists(options.customerPath))) {
    console.error(`Error: Customer file not found: ${options.customerPath}`);
    process.exit(1);
  }

  // Check if config file exists
  if (!(await fileExists(options.configPath))) {
    console.error(`Error: Config file not found: ${options.configPath}`);
    console.error(
      "Tip: Copy config/freelancer.example.json to config/freelancer.json"
    );
    process.exit(1);
  }

  try {
    console.log(`📄 Generating ${options.type}...`);

    // Load freelancer config
    console.log(`📋 Loading config from ${options.configPath}...`);
    const config = await readJSON<FreelancerConfig>(options.configPath);

    // Validate config
    const configValidation = validateFreelancerConfig(config);
    if (!configValidation.valid) {
      console.error("Error: Invalid freelancer config:");
      configValidation.errors.forEach((err) => console.error(`  - ${err}`));
      process.exit(1);
    }

    // Load customer data
    console.log(`👤 Loading customer from ${options.customerPath}...`);
    const customer = await readJSON<Customer>(options.customerPath);

    // Validate customer
    const customerValidation = validateCustomer(customer);
    if (!customerValidation.valid) {
      console.error("Error: Invalid customer data:");
      customerValidation.errors.forEach((err) => console.error(`  - ${err}`));
      process.exit(1);
    }

    // Load document data
    console.log(`📋 Loading data from ${options.inputPath}...`);
    const data = await readJSON<DocumentData>(options.inputPath);

    // Validate document data based on type
    let validation;
    switch (options.type) {
      case "invoice":
        validation = validateInvoice(data);
        break;
      case "quotation":
        validation = validateQuotation(data);
        break;
      case "receipt":
        validation = validateReceipt(data);
        break;
    }

    if (!validation.valid) {
      console.error(`Error: Invalid ${options.type} data:`);
      validation.errors.forEach((err) => console.error(`  - ${err}`));
      process.exit(1);
    }

    // Handle auto-numbering
    let resolvedDocumentNumber = data.documentNumber;
    if (data.documentNumber === "auto") {
      console.log(`🔢 Generating next document number...`);
      resolvedDocumentNumber = await getNextDocumentNumber(options.type);
      data.documentNumber = resolvedDocumentNumber;
      console.log(`✓ Document number: ${resolvedDocumentNumber}`);
    }

    // Determine output path
    const outputPath = getOutputPath(
      options.type,
      resolvedDocumentNumber,
      options.outputPath
    );

    // Generate PDF
    console.log(`🔨 Generating PDF...`);
    await generatePDF(options.type, data, customer, config, outputPath);

    // Update metadata counter after successful generation
    await incrementDocumentCounter(options.type, resolvedDocumentNumber);

    console.log(`\n✅ Success! PDF saved to: ${outputPath}`);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run main
main();
