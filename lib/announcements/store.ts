import fs from "node:fs";
import path from "node:path";
import {
  createAnnouncementPayload,
  type AnnouncementMessages,
  type AnnouncementPayload,
  type AnnouncementStatus,
} from "./types.ts";

export type ParticipantAnnouncementRecord = {
  participantId: string;
  active: AnnouncementPayload | null;
  latestSaved: AnnouncementPayload | null;
  previousSaved: AnnouncementPayload | null;
  enabled: boolean;
  broadcastRevision: number;
  lastBroadcastAt: string | null;
  status: AnnouncementStatus;
  updatedAt: string;
};

export type AdminAnnouncementRecord = {
  active: AnnouncementPayload | null;
  status: "active" | "stopped";
  updatedAt: string;
};

type AnnouncementStore = {
  version: 1;
  adminMain: AdminAnnouncementRecord;
  participants: Record<string, ParticipantAnnouncementRecord>;
};

type AnnouncementWriteContext = {
  operation: "save" | "restore" | "broadcast" | "disable";
  target: "main" | "participant";
  participantId?: string;
};

const emptyParticipantMessages: AnnouncementMessages = {
  ar: "",
  de: "",
  en: "",
  fr: "",
};

function createDefaultParticipantAnnouncement() {
  return createAnnouncementPayload({ ...emptyParticipantMessages });
}

function cloneAnnouncement(
  announcement: AnnouncementPayload | null,
): AnnouncementPayload | null {
  if (!announcement) return null;
  return {
    ...announcement,
    messages: { ...announcement.messages },
    formatting: {
      ar: { ...announcement.formatting.ar },
      de: { ...announcement.formatting.de },
      en: { ...announcement.formatting.en },
      fr: { ...announcement.formatting.fr },
    },
  };
}

function requireParticipantId(participantId: string) {
  const normalized = participantId.trim();
  if (!normalized) throw new Error("participantId-required");
  return normalized;
}

function storePath(projectRoot: string) {
  return path.join(projectRoot, ".dekokraft", "announcements.json");
}

function emptyStore(): AnnouncementStore {
  return {
    version: 1,
    adminMain: { active: null, status: "stopped", updatedAt: new Date(0).toISOString() },
    participants: {},
  };
}

function readStore(projectRoot = process.cwd()): AnnouncementStore {
  try {
    const value: unknown = JSON.parse(fs.readFileSync(storePath(projectRoot), "utf8"));
    if (!value || typeof value !== "object") return emptyStore();
    const record = value as Partial<AnnouncementStore>;
    const participants = Object.fromEntries(
      Object.entries(record.participants ?? {}).map(([participantId, participant]) => [
        participantId,
        {
          ...participant,
          previousSaved: participant.previousSaved ?? null,
          enabled:
            typeof participant.enabled === "boolean"
              ? participant.enabled
              : true,
          broadcastRevision:
            typeof participant.broadcastRevision === "number"
              ? participant.broadcastRevision
              : 0,
          lastBroadcastAt: participant.lastBroadcastAt ?? null,
        },
      ]),
    );
    return {
      version: 1,
      adminMain: record.adminMain ?? emptyStore().adminMain,
      participants,
    };
  } catch {
    return emptyStore();
  }
}

function logAnnouncementWrite(
  label: "[AnnouncementWrite]" | "[AnnouncementWriteComplete]",
  context: AnnouncementWriteContext,
  store: AnnouncementStore,
) {
  if (process.env.NODE_ENV !== "development") return;
  const participantId = context.participantId;
  const participant = participantId
    ? store.participants[participantId]
    : undefined;
  console.log(
    label,
    label === "[AnnouncementWrite]"
      ? {
          ...context,
          adminMainBefore: store.adminMain,
          participantBefore: participant,
          participantKeys: Object.keys(store.participants),
        }
      : {
          ...context,
          adminMainAfter: store.adminMain,
          participantAfter: participant,
          participantKeys: Object.keys(store.participants),
        },
  );
}

function writeStore(
  store: AnnouncementStore,
  projectRoot = process.cwd(),
  context?: AnnouncementWriteContext,
  previousStore?: AnnouncementStore,
) {
  const target = storePath(projectRoot);
  const temporary = `${target}.${process.pid}.tmp`;
  if (context && previousStore) {
    logAnnouncementWrite("[AnnouncementWrite]", context, previousStore);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  fs.writeFileSync(temporary, `${JSON.stringify(store, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  fs.renameSync(temporary, target);
  if (context) {
    logAnnouncementWrite("[AnnouncementWriteComplete]", context, store);
  }
}

export function getAdminAnnouncement(projectRoot = process.cwd()) {
  return readStore(projectRoot).adminMain;
}

export function setAdminAnnouncement(
  payload: AnnouncementPayload,
  projectRoot = process.cwd(),
) {
  const store = readStore(projectRoot);
  const nextStore: AnnouncementStore = {
    ...store,
    adminMain: {
      active: cloneAnnouncement(payload),
      status: "active",
      updatedAt: new Date().toISOString(),
    },
    participants: { ...store.participants },
  };
  writeStore(nextStore, projectRoot, {
    operation: "save",
    target: "main",
  }, store);
  return nextStore.adminMain;
}

export function stopAdminAnnouncement(projectRoot = process.cwd()) {
  const store = readStore(projectRoot);
  const nextStore: AnnouncementStore = {
    ...store,
    adminMain: {
      active: null,
      status: "stopped",
      updatedAt: new Date().toISOString(),
    },
    participants: { ...store.participants },
  };
  writeStore(nextStore, projectRoot, {
    operation: "restore",
    target: "main",
  }, store);
  return nextStore.adminMain;
}

export function getParticipantAnnouncement(
  participantId: string,
  projectRoot = process.cwd(),
): ParticipantAnnouncementRecord | null {
  const store = readStore(projectRoot);
  const record = store.participants[participantId];
  return record ?? null;
}

export function publishParticipantAnnouncement(
  participantId: string,
  payload: AnnouncementPayload,
  projectRoot = process.cwd(),
) {
  const normalizedParticipantId = requireParticipantId(participantId);
  const store = readStore(projectRoot);
  const current = store.participants[normalizedParticipantId];
  const savedAnnouncement = cloneAnnouncement(payload);
  const record: ParticipantAnnouncementRecord = {
    participantId: normalizedParticipantId,
    active: cloneAnnouncement(savedAnnouncement),
    latestSaved: cloneAnnouncement(savedAnnouncement),
    previousSaved: cloneAnnouncement(current?.latestSaved ?? null),
    enabled: current?.enabled ?? true,
    broadcastRevision: current?.broadcastRevision ?? 0,
    lastBroadcastAt: current?.lastBroadcastAt ?? null,
    status: "active",
    updatedAt: new Date().toISOString(),
  };
  const nextStore: AnnouncementStore = {
    ...store,
    adminMain: { ...store.adminMain },
    participants: {
      ...store.participants,
      [normalizedParticipantId]: record,
    },
  };
  writeStore(nextStore, projectRoot, {
    operation: "save",
    target: "participant",
    participantId: normalizedParticipantId,
  }, store);
  return record;
}

export function restoreParticipantAnnouncement(
  participantId: string,
  projectRoot = process.cwd(),
) {
  const normalizedParticipantId = requireParticipantId(participantId);
  const store = readStore(projectRoot);
  const record = store.participants[normalizedParticipantId];
  if (!record?.previousSaved) {
    const defaultAnnouncement = createDefaultParticipantAnnouncement();
    const restoredDefault: ParticipantAnnouncementRecord = {
      participantId: normalizedParticipantId,
      active: cloneAnnouncement(defaultAnnouncement),
      latestSaved: cloneAnnouncement(defaultAnnouncement),
      previousSaved: cloneAnnouncement(record?.latestSaved ?? null),
      enabled: record?.enabled ?? true,
      broadcastRevision: record?.broadcastRevision ?? 0,
      lastBroadcastAt: record?.lastBroadcastAt ?? null,
      status: "active",
      updatedAt: new Date().toISOString(),
    };
    const nextStore: AnnouncementStore = {
      ...store,
      adminMain: { ...store.adminMain },
      participants: {
        ...store.participants,
        [normalizedParticipantId]: restoredDefault,
      },
    };
    writeStore(nextStore, projectRoot, {
      operation: "restore",
      target: "participant",
      participantId: normalizedParticipantId,
    }, store);
    return restoredDefault;
  }
  const restored: ParticipantAnnouncementRecord = {
    ...record,
    participantId: normalizedParticipantId,
    active: cloneAnnouncement(record.previousSaved),
    latestSaved: cloneAnnouncement(record.previousSaved),
    previousSaved: cloneAnnouncement(record.latestSaved),
    status: "active",
    updatedAt: new Date().toISOString(),
  };
  const nextStore: AnnouncementStore = {
    ...store,
    adminMain: { ...store.adminMain },
    participants: {
      ...store.participants,
      [normalizedParticipantId]: restored,
    },
  };
  writeStore(nextStore, projectRoot, {
    operation: "restore",
    target: "participant",
    participantId: normalizedParticipantId,
  }, store);
  return restored;
}

export function broadcastParticipantAnnouncements(
  participantIds: string[],
  projectRoot = process.cwd(),
) {
  const normalizedParticipantIds = [
    ...new Set(participantIds.map(requireParticipantId)),
  ];
  const store = readStore(projectRoot);
  const broadcastAt = new Date().toISOString();
  const participants = { ...store.participants };
  const updatedParticipantIds: string[] = [];

  for (const participantId of normalizedParticipantIds) {
    const current = participants[participantId];
    if (!current) continue;
    participants[participantId] = {
      ...current,
      enabled: true,
      broadcastRevision: (current.broadcastRevision ?? 0) + 1,
      lastBroadcastAt: broadcastAt,
    };
    updatedParticipantIds.push(participantId);
  }

  const nextStore: AnnouncementStore = {
    ...store,
    adminMain: { ...store.adminMain },
    participants,
  };
  writeStore(nextStore, projectRoot, {
    operation: "broadcast",
    target: "participant",
  }, store);
  return {
    participantIds: updatedParticipantIds,
    announcements: Object.fromEntries(
      updatedParticipantIds.map((participantId) => [
        participantId,
        nextStore.participants[participantId],
      ]),
    ),
  };
}

export function disableParticipantAnnouncement(
  participantId: string,
  projectRoot = process.cwd(),
) {
  const normalizedParticipantId = requireParticipantId(participantId);
  const store = readStore(projectRoot);
  const current = store.participants[normalizedParticipantId];
  if (!current) throw new Error("NO_SAVED_ANNOUNCEMENT");
  const record: ParticipantAnnouncementRecord = {
    ...current,
    enabled: false,
    updatedAt: new Date().toISOString(),
  };
  const nextStore: AnnouncementStore = {
    ...store,
    adminMain: { ...store.adminMain },
    participants: {
      ...store.participants,
      [normalizedParticipantId]: record,
    },
  };
  writeStore(nextStore, projectRoot, {
    operation: "disable",
    target: "participant",
    participantId: normalizedParticipantId,
  }, store);
  return record;
}

export function getParticipantAnnouncementView(
  participantId: string,
  projectRoot = process.cwd(),
) {
  const store = readStore(projectRoot);
  const participant = store.participants[participantId] ?? null;
  const participantAnnouncement = participant?.latestSaved ?? null;
  return {
    participantId,
    participantAnnouncement,
    participant,
  };
}
