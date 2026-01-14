#!/usr/bin/env bun

/**
 * Pacioli CLI
 * Main entry point for command routing
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { initCommand } from "./commands/init";
import { generateCommand } from "./commands/generate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get version from package.json
 */
function getVersion(): string {
  try {
    const packageRoot = join(__dirname, "..");
    const packageJsonPath = join(packageRoot, "package.json");
    const packageJson = require(packageJsonPath);
    return packageJson.version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}

/**
 * Print main help message
 */
function printHelp() {
  console.log(`
Pacioli - Financial Document Generator for Freelancers
Named after Luca Pacioli, father of accounting (1494)

Usage:
  pacioli <command> [options]

Commands:
  init                Initialize a new project with templates and examples
  generate            Generate a financial document (invoice, quotation, receipt)
  help                Show this help message
  version             Show version number

Examples:
  # Initialize new project
  mkdir my-invoices && cd my-invoices
  pacioli init

  # Generate documents
  pacioli generate invoice examples/invoice.json --customer customers/acme-corp.json
  pacioli generate quotation examples/quotation.json --customer customers/demo.json
  pacioli generate receipt examples/receipt.json --customer customers/test.json

For command-specific help:
  pacioli generate --help

Learn more: https://github.com/peerasak-u/pacioli
  `);
}

/**
 * Main CLI router
 */
async function main() {
  const args = process.argv.slice(2);

  // No arguments - show help
  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const command = args[0];

  // Route commands
  switch (command) {
    case "init":
      await initCommand(args.slice(1));
      break;

    case "generate":
      await generateCommand(args.slice(1));
      break;

    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;

    case "version":
    case "--version":
    case "-v":
      console.log(`v${getVersion()}`);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "pacioli help" for usage information');
      process.exit(1);
  }
}

// Run CLI
main().catch((error) => {
  console.error("Fatal error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
