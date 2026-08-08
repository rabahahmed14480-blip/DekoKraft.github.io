import { createHash, randomUUID } from "node:crypto";
import type { CompanionPackage, ExportedCompanionPackage, MarketplaceMetadata, SharedCompanionPackage } from "./types.ts";

const canonical = (value: unknown) => JSON.stringify(value);
const checksum = (payload: CompanionPackage) => createHash("sha256").update(canonical(payload)).digest("hex");
const validMetadata = (value: unknown): value is MarketplaceMetadata => !!value && typeof value === "object" && typeof (value as MarketplaceMetadata).slug === "string" && typeof (value as MarketplaceMetadata).version === "string";

export class PackageExporter {
  export(companionPackage: CompanionPackage) {
    const envelope: ExportedCompanionPackage = { format: "dekokraft-companion", version: 1, checksum: checksum(companionPackage), payload: structuredClone(companionPackage) };
    return canonical(envelope);
  }
}

export class PackageImporter {
  import(serialized: string): CompanionPackage {
    if (serialized.length > 2_000_000) throw new Error("COMPANION_PACKAGE_TOO_LARGE");
    let envelope: ExportedCompanionPackage;
    try { envelope = JSON.parse(serialized) as ExportedCompanionPackage; } catch { throw new Error("COMPANION_PACKAGE_INVALID_JSON"); }
    if (envelope.format !== "dekokraft-companion" || envelope.version !== 1 || envelope.payload?.schemaVersion !== 1 || !validMetadata(envelope.payload.metadata)) throw new Error("COMPANION_PACKAGE_INVALID");
    if (checksum(envelope.payload) !== envelope.checksum) throw new Error("COMPANION_PACKAGE_CHECKSUM_MISMATCH");
    return structuredClone(envelope.payload);
  }
}

export class CompanionPackageManager {
  readonly exporter: PackageExporter;
  readonly importer: PackageImporter;
  constructor(exporter = new PackageExporter(), importer = new PackageImporter()) { this.exporter = exporter; this.importer = importer; }
  clone(source: CompanionPackage, title = `${source.metadata.title} Copy`): CompanionPackage {
    const timestamp = new Date().toISOString();
    return { ...structuredClone(source), packageId: randomUUID(), createdAt: timestamp, updatedAt: timestamp, metadata: { ...structuredClone(source.metadata), slug: `${source.metadata.slug}-copy-${randomUUID().slice(0, 8)}`, title, publishingStatus: "draft" } };
  }
  share(source: CompanionPackage): SharedCompanionPackage { return { packageId: source.packageId, shareId: randomUUID(), visibility: source.metadata.visibility, createdAt: new Date().toISOString() }; }
  prepareMarketplacePublishing(source: CompanionPackage): CompanionPackage {
    if (source.metadata.visibility !== "public") throw new Error("COMPANION_PACKAGE_NOT_PUBLIC");
    return { ...structuredClone(source), updatedAt: new Date().toISOString(), metadata: { ...structuredClone(source.metadata), publishingStatus: "pending_review" } };
  }
}
