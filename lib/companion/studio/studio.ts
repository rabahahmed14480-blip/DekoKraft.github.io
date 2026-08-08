import { CompanionBuilder } from "./builder.ts";
import { CompanionPackageManager } from "./packages.ts";
import type { CompanionPackage } from "./types.ts";

export class CompanionStudio {
  readonly packages = new CompanionPackageManager();
  createBuilder() { return new CompanionBuilder(); }
  export(companionPackage: CompanionPackage) { return this.packages.exporter.export(companionPackage); }
  import(serialized: string) { return this.packages.importer.import(serialized); }
  clone(companionPackage: CompanionPackage, title?: string) { return this.packages.clone(companionPackage, title); }
  share(companionPackage: CompanionPackage) { return this.packages.share(companionPackage); }
  prepareMarketplacePublishing(companionPackage: CompanionPackage) { return this.packages.prepareMarketplacePublishing(companionPackage); }
}

