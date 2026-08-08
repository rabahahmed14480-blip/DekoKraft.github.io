import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  broadcastParticipantAnnouncements,
  disableParticipantAnnouncement,
  getAdminAnnouncement,
  getParticipantAnnouncement,
  getParticipantAnnouncementView,
  publishParticipantAnnouncement,
  restoreParticipantAnnouncement,
  setAdminAnnouncement,
  stopAdminAnnouncement,
} from "./store.ts";
import { createAnnouncementPayload } from "./types.ts";

const participantOne = "seller-001";
const participantTwo = "seller-002";
const participantWithoutAnnouncement = "seller-empty";

function payload(text: string) {
  const value = createAnnouncementPayload({
    ar: `${text}-ar`,
    de: `${text}-de`,
    en: `${text}-en`,
    fr: `${text}-fr`,
  });
  value.formatting.ar = {
    fontSize: 24,
    bold: true,
    italic: true,
    alignment: "right",
  };
  return value;
}

function payloadWithArabic(text: string) {
  const value = payload(text);
  value.messages.ar = text;
  return value;
}

test("participant restore swaps complete saved versions and preserves ownership", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dekokraft-announcements-"));
  try {
    assert.equal(getParticipantAnnouncement(participantOne, projectRoot), null);
    const participantDefault = restoreParticipantAnnouncement(
      participantWithoutAnnouncement,
      projectRoot,
    );
    assert.equal(participantDefault.participantId, participantWithoutAnnouncement);
    assert.equal(participantDefault.latestSaved?.messages.ar, "");
    assert.equal(
      getParticipantAnnouncement(participantOne, projectRoot),
      null,
    );

    const one = publishParticipantAnnouncement(participantOne, payload("one"), projectRoot);
    const two = publishParticipantAnnouncement(participantTwo, payload("two"), projectRoot);
    assert.equal(one.latestSaved?.messages.en, "one-en");
    assert.equal(one.latestSaved?.formatting.ar.fontSize, 24);
    assert.equal(two.latestSaved?.messages.en, "two-en");
    assert.equal(one.previousSaved, null);

    const updatedOne = payload("one-updated");
    updatedOne.language = "fr";
    updatedOne.logoReference = "/participant-logo.webp";
    updatedOne.logoSize = 80;
    publishParticipantAnnouncement(participantOne, updatedOne, projectRoot);

    setAdminAnnouncement(payload("admin"), projectRoot);
    const participantView =
      getParticipantAnnouncementView(participantOne, projectRoot);
    assert.equal(
      participantView.participantAnnouncement?.messages.en,
      "one-updated-en",
    );
    assert.equal(participantView.participant?.previousSaved?.messages.en, "one-en");
    const restoredWhileMainExists =
      restoreParticipantAnnouncement(participantOne, projectRoot);
    assert.equal(restoredWhileMainExists.active?.messages.en, "one-en");
    assert.equal(restoredWhileMainExists.latestSaved?.messages.en, "one-en");
    assert.equal(
      restoredWhileMainExists.previousSaved?.messages.en,
      "one-updated-en",
    );

    stopAdminAnnouncement(projectRoot);
    const waitingForRestore = getParticipantAnnouncementView(participantOne, projectRoot);
    assert.equal(waitingForRestore.participant?.latestSaved?.messages.en, "one-en");
    const restored = restoreParticipantAnnouncement(participantOne, projectRoot);
    assert.equal(restored.active?.messages.en, "one-updated-en");
    assert.equal(restored.active?.formatting.ar.bold, true);
    assert.equal(restored.active?.language, "fr");
    assert.equal(restored.active?.logoReference, "/participant-logo.webp");
    assert.equal(restored.active?.logoSize, 80);
    assert.equal(restored.previousSaved?.messages.en, "one-en");
    assert.equal(
      getParticipantAnnouncement(participantTwo, projectRoot)?.latestSaved?.messages.en,
      "two-en",
    );
    assert.equal(
      getParticipantAnnouncement(participantOne, projectRoot)?.active?.messages.en,
      "one-updated-en",
    );
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
});

test("main and participant announcements remain independent across participants", () => {
  const projectRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "dekokraft-announcement-kind-"),
  );
  try {
    const main = payload("main");
    const participant = payload("participant");
    setAdminAnnouncement(main, projectRoot);
    publishParticipantAnnouncement(participantOne, participant, projectRoot);
    publishParticipantAnnouncement(participantTwo, payload("participant-two"), projectRoot);

    const participantOneView =
      getParticipantAnnouncementView(participantOne, projectRoot);
    assert.equal(
      participantOneView.participantAnnouncement?.messages.en,
      "participant-en",
    );
    assert.equal(
      getParticipantAnnouncementView(participantTwo, projectRoot)
        .participantAnnouncement?.messages.en,
      "participant-two-en",
    );
    assert.equal(getAdminAnnouncement(projectRoot).active?.messages.en, "main-en");

    publishParticipantAnnouncement(
      participantOne,
      payload("participant-one-updated"),
      projectRoot,
    );
    restoreParticipantAnnouncement(participantOne, projectRoot);

    assert.equal(getAdminAnnouncement(projectRoot).active?.messages.en, "main-en");
    assert.equal(
      getParticipantAnnouncementView(participantTwo, projectRoot)
        .participantAnnouncement?.messages.en,
      "participant-two-en",
    );
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
});

test("each write changes only its exact storage target", () => {
  const projectRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "dekokraft-announcement-target-"),
  );
  try {
    setAdminAnnouncement(payloadWithArabic("MAIN-A"), projectRoot);
    publishParticipantAnnouncement(
      participantOne,
      payloadWithArabic("P1-A"),
      projectRoot,
    );
    publishParticipantAnnouncement(
      participantTwo,
      payloadWithArabic("P2-A"),
      projectRoot,
    );

    assert.deepEqual(
      {
        adminMain: getAdminAnnouncement(projectRoot).active?.messages.ar,
        participantOne:
          getParticipantAnnouncement(participantOne, projectRoot)?.latestSaved
            ?.messages.ar,
        participantTwo:
          getParticipantAnnouncement(participantTwo, projectRoot)?.latestSaved
            ?.messages.ar,
      },
      {
        adminMain: "MAIN-A",
        participantOne: "P1-A",
        participantTwo: "P2-A",
      },
    );

    publishParticipantAnnouncement(
      participantOne,
      payloadWithArabic("P1-B"),
      projectRoot,
    );
    assert.deepEqual(
      {
        adminMain: getAdminAnnouncement(projectRoot).active?.messages.ar,
        participantOne:
          getParticipantAnnouncement(participantOne, projectRoot)?.latestSaved
            ?.messages.ar,
        participantTwo:
          getParticipantAnnouncement(participantTwo, projectRoot)?.latestSaved
            ?.messages.ar,
      },
      {
        adminMain: "MAIN-A",
        participantOne: "P1-B",
        participantTwo: "P2-A",
      },
    );

    restoreParticipantAnnouncement(participantOne, projectRoot);
    assert.deepEqual(
      {
        adminMain: getAdminAnnouncement(projectRoot).active?.messages.ar,
        participantOne:
          getParticipantAnnouncement(participantOne, projectRoot)?.latestSaved
            ?.messages.ar,
        participantTwo:
          getParticipantAnnouncement(participantTwo, projectRoot)?.latestSaved
            ?.messages.ar,
      },
      {
        adminMain: "MAIN-A",
        participantOne: "P1-A",
        participantTwo: "P2-A",
      },
    );

    setAdminAnnouncement(payloadWithArabic("MAIN-B"), projectRoot);
    assert.deepEqual(
      {
        adminMain: getAdminAnnouncement(projectRoot).active?.messages.ar,
        participantOne:
          getParticipantAnnouncement(participantOne, projectRoot)?.latestSaved
            ?.messages.ar,
        participantTwo:
          getParticipantAnnouncement(participantTwo, projectRoot)?.latestSaved
            ?.messages.ar,
      },
      {
        adminMain: "MAIN-B",
        participantOne: "P1-A",
        participantTwo: "P2-A",
      },
    );

    stopAdminAnnouncement(projectRoot);
    assert.deepEqual(
      {
        adminMain: getAdminAnnouncement(projectRoot).active,
        participantOne:
          getParticipantAnnouncement(participantOne, projectRoot)?.latestSaved
            ?.messages.ar,
        participantTwo:
          getParticipantAnnouncement(participantTwo, projectRoot)?.latestSaved
            ?.messages.ar,
      },
      {
        adminMain: null,
        participantOne: "P1-A",
        participantTwo: "P2-A",
      },
    );
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
});

test("admin broadcasts participant records without sharing announcement data", () => {
  const projectRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "dekokraft-participant-broadcast-"),
  );
  try {
    setAdminAnnouncement(payloadWithArabic("MAIN-TEST"), projectRoot);
    publishParticipantAnnouncement(
      participantOne,
      payloadWithArabic("P1-TEST"),
      projectRoot,
    );
    publishParticipantAnnouncement(
      participantTwo,
      payloadWithArabic("P2-TEST"),
      projectRoot,
    );

    const firstBroadcast = broadcastParticipantAnnouncements(
      [participantOne, participantOne],
      projectRoot,
    );
    assert.deepEqual(firstBroadcast.participantIds, [participantOne]);
    assert.equal(
      getParticipantAnnouncement(participantOne, projectRoot)?.enabled,
      true,
    );
    assert.equal(
      getParticipantAnnouncement(participantOne, projectRoot)
        ?.broadcastRevision,
      1,
    );
    assert.equal(
      getParticipantAnnouncement(participantTwo, projectRoot)?.enabled,
      true,
    );
    assert.equal(
      getParticipantAnnouncement(participantTwo, projectRoot)?.latestSaved
        ?.messages.ar,
      "P2-TEST",
    );
    assert.equal(
      getAdminAnnouncement(projectRoot).active?.messages.ar,
      "MAIN-TEST",
    );

    broadcastParticipantAnnouncements([participantTwo], projectRoot);
    assert.equal(
      getParticipantAnnouncement(participantOne, projectRoot)
        ?.broadcastRevision,
      1,
    );
    assert.equal(
      getParticipantAnnouncement(participantTwo, projectRoot)?.enabled,
      true,
    );
    assert.equal(
      getParticipantAnnouncement(participantTwo, projectRoot)
        ?.broadcastRevision,
      1,
    );

    disableParticipantAnnouncement(participantOne, projectRoot);
    assert.equal(
      getParticipantAnnouncement(participantOne, projectRoot)?.enabled,
      false,
    );
    assert.equal(
      getParticipantAnnouncement(participantOne, projectRoot)?.latestSaved
        ?.messages.ar,
      "P1-TEST",
    );
    assert.equal(
      getParticipantAnnouncement(participantTwo, projectRoot)?.enabled,
      true,
    );
    assert.equal(
      getAdminAnnouncement(projectRoot).active?.messages.ar,
      "MAIN-TEST",
    );

    broadcastParticipantAnnouncements([participantOne], projectRoot);
    assert.equal(
      getParticipantAnnouncement(participantOne, projectRoot)?.enabled,
      true,
    );
    assert.equal(
      getParticipantAnnouncement(participantOne, projectRoot)
        ?.broadcastRevision,
      2,
    );
    assert.equal(
      getParticipantAnnouncement(participantOne, projectRoot)?.latestSaved
        ?.messages.ar,
      "P1-TEST",
    );

    assert.deepEqual(
      {
        main: getAdminAnnouncement(projectRoot).active?.messages.ar,
        participantOne:
          getParticipantAnnouncement(participantOne, projectRoot)?.latestSaved
            ?.messages.ar,
        participantTwo:
          getParticipantAnnouncement(participantTwo, projectRoot)?.latestSaved
            ?.messages.ar,
      },
      {
        main: "MAIN-TEST",
        participantOne: "P1-TEST",
        participantTwo: "P2-TEST",
      },
    );
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
});

test("legacy participant records without enabled remain visible", () => {
  const projectRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "dekokraft-announcement-legacy-visible-"),
  );
  try {
    publishParticipantAnnouncement(
      participantOne,
      payloadWithArabic("LEGACY"),
      projectRoot,
    );
    const storagePath = path.join(
      projectRoot,
      ".dekokraft",
      "announcements.json",
    );
    const stored = JSON.parse(fs.readFileSync(storagePath, "utf8")) as {
      participants: Record<string, { enabled?: boolean }>;
    };
    delete stored.participants[participantOne].enabled;
    fs.writeFileSync(storagePath, `${JSON.stringify(stored, null, 2)}\n`);

    const migrated = getParticipantAnnouncement(participantOne, projectRoot);
    assert.equal(migrated?.enabled, true);
    assert.equal(migrated?.broadcastRevision, 0);
    assert.equal(migrated?.latestSaved?.messages.ar, "LEGACY");
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
});
