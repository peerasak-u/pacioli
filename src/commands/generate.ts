/**
 * Pacioli Generate Command
 * Generates financial documents (invoice, quotation, receipt) as PDFs
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { fileExists, readJSON, getOutputPath } from "../utils";
import {
  validateInvoice,
  validateQuotation,
  validateReceipt,
  validateFreelancerConfig,
  validateCustomer,
  type DocumentData,
  type FreelancerConfig,
  type Customer,
} from "../validator";
import { generatePDF } from "../generator";
import {
  getNextDocumentNumber,
  incrementDocumentCounter,
} from "../metadata";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VALID_TYPES = ["invoice", "quotation", "receipt"] as const;
type DocumentType = (typeof VALID_TYPES)[number];

/**
 * Get the package root directory
 */
function getPackageRoot(): string {
  return join(__dirname, "../..");
}

/**
 * Print generate command help
 */
function printGenerateHelp() {
  console.log(`
Generate a financial document as PDF

Usage:
  pacioli generate <type> <input-json> --customer <customer-json> [options]

Arguments:
  <type>           Document type: invoice, quotation, or receipt
  <input-json>     Path to document data JSON file (relative to current directory)

Required Options:
  --customer <path>  Path to customer JSON file (required)

Optional Settings:
  --output <path>    Custom output PDF path (default: output/{type}-{number}.pdf)
  --profile <path>   Path to freelancer profile (default: config/freelancer.json)
  --help            Show this help message

Examples:
  # Generate invoice with auto-numbering
  pacioli generate invoice examples/invoice-auto.json --customer customers/acme-corp.json

  # Generate quotation with custom output
  pacioli generate quotation examples/quotation.json --customer customers/demo.json --output custom/quote.pdf

  # Generate receipt with specific profile
  pacioli generate receipt examples/receipt.json --customer customers/test.json --profile config/freelancer-alt.json

Document Types:
  invoice     - Bill for completed work (includes due date, payment terms)
  quotation   - Price estimate before work begins (includes validity period)
  receipt     - Payment confirmation (includes payment date, method, reference)

Auto-numbering:
  Set "documentNumber": "auto" in your JSON file to use sequential numbering.
  Format: PREFIX-YYYYMM-NUMBER (e.g., INV-202410-001)
  Counters automatically reset each month.
  `);
}

/**
 * Parse generate command arguments
 */
function parseGenerateArgs(args: string[]) {
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
    } else if (arg === "--profile" && nextArg) {
      options.configPath = nextArg;
      i++;
    }
  }

  return options;
}

/**
 * Resolve paths relative to current working directory
 */
function resolvePaths(options: ReturnType<typeof parseGenerateArgs>) {
  const cwd = process.cwd();

  return {
    inputPath: options.inputPath ? join(cwd, options.inputPath) : undefined,
    customerPath: options.customerPath ? join(cwd, options.customerPath) : undefined,
    outputPath: options.outputPath ? join(cwd, options.outputPath) : undefined,
    configPath: join(cwd, options.configPath),
  };
}

/**
 * Generate command handler
 */
export async function generateCommand(args: string[]) {
  const options = parseGenerateArgs(args);

  if (options.help) {
    printGenerateHelp();
    return;
  }

  // Validate arguments
  if (!options.type) {
    console.error("❌ Error: Invalid or missing document type");
    console.error(`Valid types: ${VALID_TYPES.join(", ")}`);
    console.error('\nRun "pacioli generate --help" for usage information');
    process.exit(1);
  }

  if (!options.inputPath) {
    console.error("❌ Error: Input JSON file path is required");
    console.error('\nRun "pacioli generate --help" for usage information');
    process.exit(1);
  }

  // Resolve partial paths (we might need inputPath to find customerPath)
  const initialPaths = resolvePaths(options);

  // Check if input file exists first
  if (!(await fileExists(initialPaths.inputPath!))) {
    console.error(`❌ Error: Input file not found: ${options.inputPath}`);
    console.error(`   Looking in: ${initialPaths.inputPath}`);
    process.exit(1);
  }

  try {
    console.log(`\n📄 Generating ${options.type}...`);

    // Load document data early to check for customerPath
    console.log(`📋 Loading data from ${options.inputPath}...`);
    const data = await readJSON<DocumentData>(initialPaths.inputPath!);

    // Determine final customer path
    let customerPath = initialPaths.customerPath;

    // If no CLI customer path, check the JSON data
    if (!customerPath && data.customerPath) {
      // Resolve relative to CWD (same as CLI args)
      customerPath = join(process.cwd(), data.customerPath);
      console.log(`   Found customer path in JSON: ${data.customerPath}`);
    }

    // Now validate we have a customer path
    if (!customerPath) {
      console.error("❌ Error: Customer path not found.");
      console.error("   Please provide it via --customer <path>");
      console.error('   OR add "customerPath": "path/to/customer.json" in your input JSON.');
      process.exit(1);
    }

    // Check if customer file exists
    if (!(await fileExists(customerPath))) {
      console.error(`❌ Error: Customer file not found: ${customerPath}`);
      process.exit(1);
    }

    // Check if profile file exists
    if (!(await fileExists(initialPaths.configPath))) {
      console.error(`❌ Error: Profile file not found: ${options.configPath}`);
      console.error(`   Looking in: ${initialPaths.configPath}`);
      console.error("\n💡 Tip: Did you forget to run 'pacioli init'?");
      console.error("   Or copy config/freelancer.example.json to config/freelancer.json");
      process.exit(1);
    }

    // Load freelancer profile
    console.log(`📋 Loading profile from ${options.configPath}...`);
    const config = await readJSON<FreelancerConfig>(initialPaths.configPath);

    // Validate profile
    const configValidation = validateFreelancerConfig(config);
    if (!configValidation.valid) {
      console.error("❌ Error: Invalid freelancer profile:");
      configValidation.errors.forEach((err) => console.error(`   - ${err}`));
      process.exit(1);
    }

    // Load customer data
    console.log(`👤 Loading customer from ${customerPath}...`);
    const customer = await readJSON<Customer>(customerPath);

    // Validate customer
    const customerValidation = validateCustomer(customer);
    if (!customerValidation.valid) {
      console.error("❌ Error: Invalid customer data:");
      customerValidation.errors.forEach((err) => console.error(`   - ${err}`));
      process.exit(1);
    }

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
      console.error(`❌ Error: Invalid ${options.type} data:`);
      validation.errors.forEach((err) => console.error(`   - ${err}`));
      process.exit(1);
    }

    // Handle auto-numbering
    let resolvedDocumentNumber = data.documentNumber;
    if (data.documentNumber === "auto") {
      console.log(`🔢 Generating next document number...`);
      resolvedDocumentNumber = await getNextDocumentNumber(options.type);
      data.documentNumber = resolvedDocumentNumber;
      console.log(`   ✓ Document number: ${resolvedDocumentNumber}`);
    }

    // Determine output path
    const outputPath = getOutputPath(
      options.type,
      resolvedDocumentNumber,
      initialPaths.outputPath
    );

    // Generate PDF
    console.log(`🔨 Generating PDF...`);
    await generatePDF(options.type, data, customer, config, outputPath);

    // Update metadata counter after successful generation
    await incrementDocumentCounter(options.type, resolvedDocumentNumber);

    console.log(`\n✅ Success! PDF saved to: ${outputPath}`);
  } catch (error) {
    console.error("\n❌ Generation failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
