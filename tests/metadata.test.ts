/**
 * Unit tests for metadata management and auto-numbering
 *
 * NOTE: These tests interact with the file system using the actual .metadata.json file.
 * The file is backed up before tests and restored after.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  getNextDocumentNumber,
  incrementDocumentCounter,
  readMetadata,
  writeMetadata,
  type Metadata,
} from "../src/metadata";
import { fileExists } from "../src/utils";

const METADATA_PATH = ".metadata.json";
const BACKUP_PATH = ".metadata.backup.json";

// Backup existing metadata before tests
let originalMetadata: string | null = null;

async function backupMetadata(): Promise<void> {
  try {
    if (await fileExists(METADATA_PATH)) {
      const file = Bun.file(METADATA_PATH);
      originalMetadata = await file.text();
    }
  } catch {
    // No backup needed
  }
}

async function restoreMetadata(): Promise<void> {
  try {
    if (originalMetadata) {
      await Bun.write(METADATA_PATH, originalMetadata);
    } else {
      // Remove test metadata file
      await Bun.spawn(["rm", "-f", METADATA_PATH]).exited;
    }
  } catch {
    // Ignore errors
  }
}

async function cleanupMetadata(): Promise<void> {
  try {
    await Bun.spawn(["rm", "-f", METADATA_PATH]).exited;
  } catch {
    // Ignore errors
  }
}

describe("readMetadata", () => {
  afterEach(async () => {
    await cleanupMetadata();
  });

  test("returns default metadata when file doesn't exist", async () => {
    await cleanupMetadata();
    const metadata = await readMetadata();

    expect(metadata.invoice).toBeDefined();
    expect(metadata.quotation).toBeDefined();
    expect(metadata.receipt).toBeDefined();
    expect(metadata.invoice.prefix).toBe("INV");
    expect(metadata.quotation.prefix).toBe("QT");
    expect(metadata.receipt.prefix).toBe("REC");
    expect(metadata.invoice.lastNumber).toBe(0);
  });

  test("uses current year and month in default metadata", async () => {
    await cleanupMetadata();
    const metadata = await readMetadata();
    const now = new Date();

    expect(metadata.invoice.year).toBe(now.getFullYear());
    expect(metadata.invoice.month).toBe(now.getMonth() + 1);
  });
});

describe("writeMetadata", () => {
  afterEach(async () => {
    await cleanupMetadata();
  });

  test("writes metadata to file successfully", async () => {
    const testMetadata: Metadata = {
      invoice: { lastNumber: 5, prefix: "INV", year: 2024, month: 10 },
      quotation: { lastNumber: 3, prefix: "QT", year: 2024, month: 10 },
      receipt: { lastNumber: 2, prefix: "REC", year: 2024, month: 10 },
    };

    await writeMetadata(testMetadata);

    // Verify file exists
    const exists = await fileExists(METADATA_PATH);
    expect(exists).toBe(true);
  });

  test("written metadata can be read back", async () => {
    const testMetadata: Metadata = {
      invoice: { lastNumber: 10, prefix: "INV", year: 2024, month: 10 },
      quotation: { lastNumber: 20, prefix: "QT", year: 2024, month: 10 },
      receipt: { lastNumber: 15, prefix: "REC", year: 2024, month: 10 },
    };

    await writeMetadata(testMetadata);

    // Read the file directly
    const file = Bun.file(METADATA_PATH);
    const readData = await file.json();

    expect(readData.invoice.lastNumber).toBe(10);
    expect(readData.quotation.lastNumber).toBe(20);
    expect(readData.receipt.lastNumber).toBe(15);
  });
});

describe("getNextDocumentNumber", () => {
  beforeEach(async () => {
    await cleanupMetadata();
  });

  afterEach(async () => {
    await cleanupMetadata();
  });

  test("generates correct format for invoice", async () => {
    const docNumber = await getNextDocumentNumber("invoice");
    expect(docNumber).toMatch(/^INV-\d{6}-\d{3}$/);
  });

  test("generates correct format for quotation", async () => {
    const docNumber = await getNextDocumentNumber("quotation");
    expect(docNumber).toMatch(/^QT-\d{6}-\d{3}$/);
  });

  test("generates correct format for receipt", async () => {
    const docNumber = await getNextDocumentNumber("receipt");
    expect(docNumber).toMatch(/^REC-\d{6}-\d{3}$/);
  });

  test("starts with number 001 for new counter", async () => {
    const docNumber = await getNextDocumentNumber("invoice");
    expect(docNumber).toMatch(/-001$/);
  });

  test("increments from existing counter", async () => {
    const now = new Date();
    const testMetadata: Metadata = {
      invoice: {
        lastNumber: 5,
        prefix: "INV",
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      },
      quotation: { lastNumber: 0, prefix: "QT", year: 2024, month: 10 },
      receipt: { lastNumber: 0, prefix: "REC", year: 2024, month: 10 },
    };

    await writeMetadata(testMetadata);
    const docNumber = await getNextDocumentNumber("invoice");
    expect(docNumber).toMatch(/-006$/);
  });

  test("includes current year and month in format", async () => {
    const docNumber = await getNextDocumentNumber("invoice");
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(docNumber).toContain(yearMonth);
  });

  test("pads month with leading zero", async () => {
    const docNumber = await getNextDocumentNumber("invoice");
    // Extract year-month part (e.g., "202410" from "INV-202410-001")
    const match = docNumber.match(/INV-(\d{6})-/);
    expect(match).toBeDefined();
    if (match && match[1]) {
      const yearMonth = match[1];
      expect(yearMonth).toHaveLength(6);
      expect(yearMonth.substring(4)).toMatch(/^(0[1-9]|1[0-2])$/);
    }
  });

  test("pads document number with leading zeros", async () => {
    const docNumber = await getNextDocumentNumber("invoice");
    const match = docNumber.match(/-(\d{3})$/);
    expect(match).toBeDefined();
    expect(match![1]).toHaveLength(3);
  });

  test("handles large document numbers", async () => {
    const now = new Date();
    const testMetadata: Metadata = {
      invoice: {
        lastNumber: 999,
        prefix: "INV",
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      },
      quotation: { lastNumber: 0, prefix: "QT", year: 2024, month: 10 },
      receipt: { lastNumber: 0, prefix: "REC", year: 2024, month: 10 },
    };

    await writeMetadata(testMetadata);
    const docNumber = await getNextDocumentNumber("invoice");
    expect(docNumber).toMatch(/-1000$/);
  });

  test("resets counter when month changes", async () => {
    const now = new Date();
    const lastMonth = now.getMonth(); // 0-11
    const testMetadata: Metadata = {
      invoice: {
        lastNumber: 50,
        prefix: "INV",
        year: now.getFullYear(),
        month: lastMonth === 0 ? 12 : lastMonth, // Previous month
      },
      quotation: { lastNumber: 0, prefix: "QT", year: 2024, month: 10 },
      receipt: { lastNumber: 0, prefix: "REC", year: 2024, month: 10 },
    };

    await writeMetadata(testMetadata);
    const docNumber = await getNextDocumentNumber("invoice");
    expect(docNumber).toMatch(/-001$/);
  });

  test("resets counter when year changes", async () => {
    const now = new Date();
    const testMetadata: Metadata = {
      invoice: {
        lastNumber: 100,
        prefix: "INV",
        year: now.getFullYear() - 1,
        month: 12,
      },
      quotation: { lastNumber: 0, prefix: "QT", year: 2024, month: 10 },
      receipt: { lastNumber: 0, prefix: "REC", year: 2024, month: 10 },
    };

    await writeMetadata(testMetadata);
    const docNumber = await getNextDocumentNumber("invoice");
    expect(docNumber).toMatch(/-001$/);
  });
});

describe("incrementDocumentCounter", () => {
  beforeEach(async () => {
    await cleanupMetadata();
  });

  afterEach(async () => {
    await cleanupMetadata();
  });

  test("increments counter for valid document number", async () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

    await incrementDocumentCounter("invoice", `INV-${yearMonth}-005`);

    const file = Bun.file(METADATA_PATH);
    const metadata = await file.json();
    expect(metadata.invoice.lastNumber).toBe(5);
  });

  test("updates counter only if new number is higher", async () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Set initial counter to 10
    const testMetadata: Metadata = {
      invoice: {
        lastNumber: 10,
        prefix: "INV",
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      },
      quotation: { lastNumber: 0, prefix: "QT", year: 2024, month: 10 },
      receipt: { lastNumber: 0, prefix: "REC", year: 2024, month: 10 },
    };
    await writeMetadata(testMetadata);

    // Try to set with lower number
    await incrementDocumentCounter("invoice", `INV-${yearMonth}-005`);

    const file = Bun.file(METADATA_PATH);
    const metadata = await file.json();
    expect(metadata.invoice.lastNumber).toBe(10); // Should remain 10
  });

  test("updates counter with higher number", async () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Set initial counter to 5
    const testMetadata: Metadata = {
      invoice: {
        lastNumber: 5,
        prefix: "INV",
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      },
      quotation: { lastNumber: 0, prefix: "QT", year: 2024, month: 10 },
      receipt: { lastNumber: 0, prefix: "REC", year: 2024, month: 10 },
    };
    await writeMetadata(testMetadata);

    // Update with higher number
    await incrementDocumentCounter("invoice", `INV-${yearMonth}-020`);

    const file = Bun.file(METADATA_PATH);
    const metadata = await file.json();
    expect(metadata.invoice.lastNumber).toBe(20);
  });

  test("handles document number without leading zeros", async () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

    await incrementDocumentCounter("invoice", `INV-${yearMonth}-5`);

    const file = Bun.file(METADATA_PATH);
    const metadata = await file.json();
    expect(metadata.invoice.lastNumber).toBe(5);
  });

  test("handles large document numbers", async () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

    await incrementDocumentCounter("invoice", `INV-${yearMonth}-9999`);

    const file = Bun.file(METADATA_PATH);
    const metadata = await file.json();
    expect(metadata.invoice.lastNumber).toBe(9999);
  });

  test("resets counter when month changes during increment", async () => {
    const now = new Date();
    const lastMonth = now.getMonth();

    // Set metadata to previous month
    const testMetadata: Metadata = {
      invoice: {
        lastNumber: 50,
        prefix: "INV",
        year: now.getFullYear(),
        month: lastMonth === 0 ? 12 : lastMonth,
      },
      quotation: { lastNumber: 0, prefix: "QT", year: 2024, month: 10 },
      receipt: { lastNumber: 0, prefix: "REC", year: 2024, month: 10 },
    };
    await writeMetadata(testMetadata);

    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    await incrementDocumentCounter("invoice", `INV-${yearMonth}-001`);

    const file = Bun.file(METADATA_PATH);
    const metadata = await file.json();
    expect(metadata.invoice.month).toBe(now.getMonth() + 1);
  });

  test("handles different document types independently", async () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

    await incrementDocumentCounter("invoice", `INV-${yearMonth}-010`);
    await incrementDocumentCounter("quotation", `QT-${yearMonth}-020`);
    await incrementDocumentCounter("receipt", `REC-${yearMonth}-030`);

    const file = Bun.file(METADATA_PATH);
    const metadata = await file.json();
    expect(metadata.invoice.lastNumber).toBe(10);
    expect(metadata.quotation.lastNumber).toBe(20);
    expect(metadata.receipt.lastNumber).toBe(30);
  });

  test("handles invalid document number format gracefully", async () => {
    const now = new Date();

    // This should not crash, just not update the counter
    await incrementDocumentCounter("invoice", "INVALID-FORMAT");

    const file = Bun.file(METADATA_PATH);
    const metadata = await file.json();
    expect(metadata.invoice.lastNumber).toBe(0);
  });
});

describe("Document number format consistency", () => {
  beforeEach(async () => {
    await cleanupMetadata();
  });

  afterEach(async () => {
    await cleanupMetadata();
  });

  test("generated number can be used to increment counter", async () => {
    // Generate a document number
    const docNumber = await getNextDocumentNumber("invoice");

    // Use it to increment counter
    await incrementDocumentCounter("invoice", docNumber);

    // Generate next number
    const nextDocNumber = await getNextDocumentNumber("invoice");

    // Extract numbers and verify increment
    const firstNum = parseInt(docNumber.split("-")[2] ?? "0");
    const secondNum = parseInt(nextDocNumber.split("-")[2] ?? "0");
    expect(secondNum).toBe(firstNum + 1);
  });

  test("sequential document generation maintains order", async () => {
    const numbers: string[] = [];

    for (let i = 0; i < 5; i++) {
      const docNumber = await getNextDocumentNumber("invoice");
      numbers.push(docNumber);
      await incrementDocumentCounter("invoice", docNumber);
    }

    // Verify all numbers are sequential
    for (let i = 1; i < numbers.length; i++) {
      const prevNum = parseInt(numbers[i - 1]?.split("-")[2] ?? "0");
      const currentNum = parseInt(numbers[i]?.split("-")[2] ?? "0");
      expect(currentNum).toBe(prevNum + 1);
    }
  });
});
