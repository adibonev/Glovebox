import { describe, expect, it } from "vitest";

import { eraseServiceRecord, eraseVehicle, type RecordErasure } from "./erasure";

/**
 * An in-memory stand-in: two Vehicles, their Service Records, and Documents with files. It logs
 * each step, so a test can check the order as well as the outcome.
 */
function garage(options: { storageFails?: boolean } = {}) {
  const records = new Map<string, string>([
    ["go", "audi"],
    ["kasko", "audi"],
    ["vignette", "bmw"],
  ]);
  const documents = new Map<string, string>([
    ["audi/go/policy.pdf", "go"],
    ["audi/kasko/policy.jpg", "kasko"],
    ["audi/kasko/receipt.jpg", "kasko"],
    ["bmw/vignette/receipt.pdf", "vignette"],
  ]);
  const files = new Set(documents.keys());
  const vehicles = new Set(["audi", "bmw"]);
  const log: string[] = [];

  const erasure: RecordErasure = {
    async serviceRecordIds(vehicleId) {
      return [...records].filter(([, vehicle]) => vehicle === vehicleId).map(([id]) => id);
    },
    async documentPaths(serviceRecordIds) {
      return [...documents].filter(([, record]) => serviceRecordIds.includes(record)).map(([path]) => path);
    },
    async removeFiles(paths) {
      if (options.storageFails) throw new Error("storage unavailable");
      log.push(`files: ${[...paths].sort().join(", ")}`);
      for (const path of paths) files.delete(path);
    },
    async deleteServiceRecord(id) {
      log.push(`record: ${id}`);
      records.delete(id);
      for (const [path, record] of documents) if (record === id) documents.delete(path);
    },
    async deleteVehicle(id) {
      log.push(`vehicle: ${id}`);
      vehicles.delete(id);
      for (const [record, vehicle] of records) {
        if (vehicle !== id) continue;
        records.delete(record);
        for (const [path, owner] of documents) if (owner === record) documents.delete(path);
      }
    },
  };
  return { erasure, records, documents, files, vehicles, log };
}

describe("eraseServiceRecord", () => {
  it("removes the files of the Service Record's Documents before the record itself", async () => {
    const g = garage();

    await eraseServiceRecord(g.erasure, "kasko");

    expect(g.log).toEqual(["files: audi/kasko/policy.jpg, audi/kasko/receipt.jpg", "record: kasko"]);
    expect([...g.files].sort()).toEqual(["audi/go/policy.pdf", "bmw/vignette/receipt.pdf"]);
    expect(g.records.has("kasko")).toBe(false);
  });

  it("goes straight to the record when it has no Documents", async () => {
    const g = garage();
    g.documents.delete("audi/go/policy.pdf");

    await eraseServiceRecord(g.erasure, "go");

    expect(g.log).toEqual(["record: go"]);
  });

  it("keeps the Service Record when its files cannot be removed, so a retry still finds them", async () => {
    const g = garage({ storageFails: true });

    await expect(eraseServiceRecord(g.erasure, "kasko")).rejects.toThrow("storage unavailable");

    expect(g.records.has("kasko")).toBe(true);
    expect(g.documents.size).toBe(4);
  });
});

describe("eraseVehicle", () => {
  it("removes the files of every Service Record on the Vehicle, then the Vehicle", async () => {
    const g = garage();

    await eraseVehicle(g.erasure, "audi");

    expect(g.log).toEqual([
      "files: audi/go/policy.pdf, audi/kasko/policy.jpg, audi/kasko/receipt.jpg",
      "vehicle: audi",
    ]);
    expect([...g.files]).toEqual(["bmw/vignette/receipt.pdf"]);
    expect(g.vehicles.has("audi")).toBe(false);
  });

  it("keeps the Vehicle when its files cannot be removed", async () => {
    const g = garage({ storageFails: true });

    await expect(eraseVehicle(g.erasure, "audi")).rejects.toThrow("storage unavailable");

    expect(g.vehicles.has("audi")).toBe(true);
    expect(g.records.has("go")).toBe(true);
  });
});
