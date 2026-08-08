import type {
  DesignWorkspaceOverride, PageSectionId, ParticipantDesignOverride,
  ParticipantGroup, ResolvedPageConfiguration, SectionConfiguration,
  SectionOverride,
} from "./networkTypes.ts";

const sectionIds: PageSectionId[] = [
  "toolbar","header","announcement","navigation","cards",
  "profile","dialogs","layout","colors","typography",
];
const defaults = (pageType: "admin" | "participant"): SectionConfiguration =>
  Object.fromEntries(sectionIds.map((id) => [id, {
    enabled: true,
    componentVersionId: `${pageType}-${id}-v1`,
    settings: {},
    layout: {},
  }])) as SectionConfiguration;
function mergeSection(base: SectionOverride, override?: SectionOverride): SectionOverride {
  if (!override?.enabled) return structuredClone(base);
  return {
    ...structuredClone(base), ...structuredClone(override),
    settings: { ...(base.settings ?? {}), ...(override.settings ?? {}) },
    layout: { ...(base.layout ?? {}), ...(override.layout ?? {}) },
  };
}
function applySections(base: SectionConfiguration, overrides?: Partial<SectionConfiguration>) {
  const next = structuredClone(base);
  for (const id of sectionIds) next[id] = mergeSection(next[id], overrides?.[id]);
  return next;
}
export function resolvePageConfiguration(input: {
  pageType: "admin" | "participant";
  participantId?: string;
  groups?: ParticipantGroup[];
  participantOverride?: ParticipantDesignOverride;
  workspaceOverride?: DesignWorkspaceOverride;
  previewOverrides?: Partial<SectionConfiguration>;
  productionVersion: number;
}): ResolvedPageConfiguration {
  let sections = defaults(input.pageType);
  const inheritance = ["platform_root", `${input.pageType}_page`];
  if (input.pageType === "participant") {
    const groups = [...(input.groups ?? [])].sort((a,b) =>
      a.kind === b.kind ? a.priority - b.priority : a.kind === "organization" ? -1 : 1);
    for (const group of groups) {
      if (input.participantId && group.memberIds.includes(input.participantId)) {
        sections = applySections(sections, group.sections);
        inheritance.push(`group:${group.id}:v${group.version}`);
      }
    }
    if (input.participantOverride?.enabled && input.participantOverride.participantId === input.participantId) {
      sections = applySections(sections, input.participantOverride.sections);
      inheritance.push(`participant:${input.participantId}:v${input.participantOverride.version}`);
    }
  }
  if (input.workspaceOverride) {
    sections = applySections(sections, input.workspaceOverride.sections);
    inheritance.push(`design:${input.workspaceOverride.designId}`);
  }
  if (input.previewOverrides) {
    sections = applySections(sections, input.previewOverrides);
    inheritance.push("temporary_preview");
  }
  return {
    pageType: input.pageType, participantId: input.participantId, sections,
    inheritance,
    versionKey: `page-config:${input.pageType}:${input.participantId ?? "global"}:${inheritance.join("|")}:p${input.productionVersion}`,
  };
}
