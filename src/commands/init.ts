/**
 * Pacioli Init Command
 * Scaffolds a new project with all necessary files and directories
 */

import { existsSync, mkdirSync, readdirSync, copyFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the package root directory (where templates, examples, etc. are stored)
 */
function getPackageRoot(): string {
  // When running from source: src/commands/init.ts -> go up 2 levels to package root
  // When running from installed package: dist/commands/init.js -> go up 2 levels to package root
  return join(__dirname, "../..");
}

/**
 * Print init help
 */
function printInitHelp() {
  console.log(`
Initialize a new Pacioli project

Usage:
  pacioli init [options]

Options:
  --force      Overwrite existing files (use with caution)
  --help       Show this help message

This command creates:
  - templates/       HTML templates for invoices, quotations, receipts
  - examples/        Sample JSON files to get started
  - customers/       Customer database directory with examples
  - config/          Freelancer profile configuration
  - output/          Directory for generated PDFs
  - .metadata.json   Auto-numbering system state

The current directory should be empty or you must use --force to overwrite.
  `);
}

/**
 * Copy directory recursively
 */
function copyDirectory(src: string, dest: string, force: boolean = false) {
  // Create destination directory
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath, force);
    } else {
      // Check if file exists
      if (existsSync(destPath) && !force) {
        console.warn(`  ⚠️  Skipping ${destPath} (already exists)`);
        continue;
      }
      copyFileSync(srcPath, destPath);
      console.log(`  ✓ Created ${destPath}`);
    }
  }
}

/**
 * Create .metadata.json file
 */
function createMetadataFile(targetDir: string, force: boolean = false) {
  const metadataPath = join(targetDir, ".metadata.json");

  if (existsSync(metadataPath) && !force) {
    console.warn(`  ⚠️  Skipping .metadata.json (already exists)`);
    return;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const initialMetadata = {
    invoice: {
      lastNumber: 0,
      prefix: "INV",
      year: currentYear,
      month: currentMonth
    },
    quotation: {
      lastNumber: 0,
      prefix: "QT",
      year: currentYear,
      month: currentMonth
    },
    receipt: {
      lastNumber: 0,
      prefix: "REC",
      year: currentYear,
      month: currentMonth
    },
  };

  writeFileSync(metadataPath, JSON.stringify(initialMetadata, null, 2));
  console.log(`  ✓ Created .metadata.json`);
}

/**
 * Create .gitignore file
 */
function createGitignore(targetDir: string, force: boolean = false) {
  const gitignorePath = join(targetDir, ".gitignore");

  if (existsSync(gitignorePath) && !force) {
    console.warn(`  ⚠️  Skipping .gitignore (already exists)`);
    return;
  }

  const gitignoreContent = `# Generated PDFs
output/*.pdf
!output/.gitkeep

# Local configuration (contains sensitive info)
config/freelancer.json

# Auto-numbering state
.metadata.json

# Dependencies (if you customize templates with build tools)
node_modules/

# OS files
.DS_Store
Thumbs.db
`;

  writeFileSync(gitignorePath, gitignoreContent);
  console.log(`  ✓ Created .gitignore`);
}

/**
 * Check if directory is safe to initialize
 */
function isSafeToInitialize(targetDir: string, force: boolean): boolean {
  if (!existsSync(targetDir)) {
    return true;
  }

  const entries = readdirSync(targetDir);

  // Ignore common hidden files
  const significantFiles = entries.filter(
    (name) => !name.startsWith(".") && name !== "node_modules"
  );

  if (significantFiles.length === 0) {
    return true;
  }

  if (force) {
    return true;
  }

  return false;
}

/**
 * Init command handler
 */
export async function initCommand(args: string[]) {
  // Parse arguments
  const force = args.includes("--force");
  const help = args.includes("--help") || args.includes("-h");

  if (help) {
    printInitHelp();
    return;
  }

  const targetDir = process.cwd();
  const packageRoot = getPackageRoot();

  console.log(`\n🎨 Initializing Pacioli project in ${targetDir}\n`);

  // Safety check
  if (!isSafeToInitialize(targetDir, force)) {
    console.error("❌ Error: Directory is not empty");
    console.error("   Use --force to overwrite existing files (caution!)");
    console.error("   Or run this command in an empty directory");
    process.exit(1);
  }

  try {
    // Copy templates
    console.log("📄 Creating templates...");
    const templatesSource = join(packageRoot, "templates");
    const templatesDest = join(targetDir, "templates");

    if (!existsSync(templatesSource)) {
      throw new Error(`Templates not found at ${templatesSource}. Are you running from the correct location?`);
    }

    copyDirectory(templatesSource, templatesDest, force);

    // Copy examples
    console.log("\n📋 Creating examples...");
    const examplesSource = join(packageRoot, "examples");
    const examplesDest = join(targetDir, "examples");
    copyDirectory(examplesSource, examplesDest, force);

    // Copy customers
    console.log("\n👥 Creating customer database...");
    const customersSource = join(packageRoot, "customers");
    const customersDest = join(targetDir, "customers");
    copyDirectory(customersSource, customersDest, force);

    // Create config directory with example
    console.log("\n⚙️  Creating configuration...");
    const configSource = join(packageRoot, "config");
    const configDest = join(targetDir, "config");

    if (!existsSync(configDest)) {
      mkdirSync(configDest, { recursive: true });
    }

    // Copy freelancer.example.json
    const exampleConfigSrc = join(configSource, "freelancer.example.json");
    const exampleConfigDest = join(configDest, "freelancer.example.json");

    if (existsSync(exampleConfigSrc)) {
      if (existsSync(exampleConfigDest) && !force) {
        console.warn(`  ⚠️  Skipping ${exampleConfigDest} (already exists)`);
      } else {
        copyFileSync(exampleConfigSrc, exampleConfigDest);
        console.log(`  ✓ Created ${exampleConfigDest}`);
      }
    }

    // Create output directory
    console.log("\n📦 Creating output directory...");
    const outputDir = join(targetDir, "output");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
      // Create .gitkeep
      writeFileSync(join(outputDir, ".gitkeep"), "");
      console.log(`  ✓ Created output/`);
    } else {
      console.warn(`  ⚠️  output/ already exists`);
    }

    // Create .metadata.json
    console.log("\n🔢 Creating metadata file...");
    createMetadataFile(targetDir, force);

    // Create .gitignore
    console.log("\n📝 Creating .gitignore...");
    createGitignore(targetDir, force);

    // Success message
    console.log(`
✅ Pacioli project initialized successfully!

Next steps:
  1. Configure your profile:
     cp config/freelancer.example.json config/freelancer.json
     # Then edit config/freelancer.json with your information

  2. Generate your first invoice:
     pacioli generate invoice examples/invoice.json --customer customers/acme-corp.json

  3. Customize templates (optional):
     Edit files in templates/ to match your branding

  4. Add your customers:
     Create JSON files in customers/ directory

📚 Documentation: https://github.com/yourusername/pacioli
    `);
  } catch (error) {
    console.error("\n❌ Initialization failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
