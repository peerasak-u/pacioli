/**
 * Document metadata management for auto-numbering
 */

import { fileExists } from "./utils";

export interface DocumentTypeMetadata {
  lastNumber: number;
  prefix: string;
  year: number;
  month: number;
}

export interface Metadata {
  invoice: DocumentTypeMetadata;
  quotation: DocumentTypeMetadata;
  receipt: DocumentTypeMetadata;
}

const METADATA_PATH = ".metadata.json";

/**
 * Get default metadata structure
 */
function getDefaultMetadata(): Metadata {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  return {
    invoice: {
      lastNumber: 0,
      prefix: "INV",
      year: currentYear,
      month: currentMonth,
    },
    quotation: {
      lastNumber: 0,
      prefix: "QT",
      year: currentYear,
      month: currentMonth,
    },
    receipt: {
      lastNumber: 0,
      prefix: "REC",
      year: currentYear,
      month: currentMonth,
    },
  };
}

/**
 * Read metadata from file
 */
export async function readMetadata(): Promise<Metadata> {
  try {
    if (await fileExists(METADATA_PATH)) {
      const file = Bun.file(METADATA_PATH);
      const data = await file.json();

      // Validate and return metadata
      return data as Metadata;
    }
  } catch (error) {
    console.warn("Warning: Could not read metadata file, using defaults");
  }

  return getDefaultMetadata();
}

/**
 * Write metadata to file
 */
export async function writeMetadata(metadata: Metadata): Promise<void> {
  try {
    await Bun.write(METADATA_PATH, JSON.stringify(metadata, null, 2));
  } catch (error) {
    throw new Error(`Failed to write metadata: ${error}`);
  }
}

/**
 * Generate next document number for a given type
 */
export async function getNextDocumentNumber(
  type: "invoice" | "quotation" | "receipt"
): Promise<string> {
  const metadata = await readMetadata();
  const typeMetadata = metadata[type];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Reset counter if year or month has changed
  if (typeMetadata.year !== currentYear || typeMetadata.month !== currentMonth) {
    typeMetadata.year = currentYear;
    typeMetadata.month = currentMonth;
    typeMetadata.lastNumber = 0;
  }

  // Increment counter
  const nextNumber = typeMetadata.lastNumber + 1;

  // Format: PREFIX-YYYYMM-00N (e.g., INV-202410-001)
  const yearMonth = `${currentYear}${String(currentMonth).padStart(2, "0")}`;
  const documentNumber = `${typeMetadata.prefix}-${yearMonth}-${String(nextNumber).padStart(3, "0")}`;

  return documentNumber;
}

/**
 * Update metadata after successful document generation
 */
export async function incrementDocumentCounter(
  type: "invoice" | "quotation" | "receipt",
  documentNumber: string
): Promise<void> {
  const metadata = await readMetadata();
  const typeMetadata = metadata[type];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Reset counter if year or month has changed
  if (typeMetadata.year !== currentYear || typeMetadata.month !== currentMonth) {
    typeMetadata.year = currentYear;
    typeMetadata.month = currentMonth;
    typeMetadata.lastNumber = 0;
  }

  // Extract number from document number (e.g., "INV-202410-005" -> 5)
  const match = documentNumber.match(/-(\d+)$/);
  if (match && match[1]) {
    const number = parseInt(match[1], 10);
    // Only update if this number is higher than current
    if (number > typeMetadata.lastNumber) {
      typeMetadata.lastNumber = number;
    }
  }

  await writeMetadata(metadata);
}

/**
 * Initialize metadata file if it doesn't exist
 */
export async function initMetadata(): Promise<void> {
  if (!(await fileExists(METADATA_PATH))) {
    const defaultMetadata = getDefaultMetadata();
    await writeMetadata(defaultMetadata);
    console.log("✓ Created .metadata.json with default values");
  } else {
    console.log("✓ .metadata.json already exists");
  }
}

/**
 * Reset counter for a specific document type
 */
export async function resetCounter(
  type: "invoice" | "quotation" | "receipt"
): Promise<void> {
  const metadata = await readMetadata();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  metadata[type].lastNumber = 0;
  metadata[type].year = currentYear;
  metadata[type].month = currentMonth;

  await writeMetadata(metadata);
  console.log(`✓ Reset ${type} counter to 0 for ${currentYear}-${String(currentMonth).padStart(2, "0")}`);
}
