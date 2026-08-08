import assert from "node:assert/strict";
import test from "node:test";
import { completeWelcome, isWelcomeCompleted, WELCOME_COMPLETED_KEY } from "./welcomeStorage.ts";

test("welcome completion is false until the persisted value is true", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };

  assert.equal(isWelcomeCompleted(storage), false);
  completeWelcome(storage);
  assert.equal(values.get(WELCOME_COMPLETED_KEY), "true");
  assert.equal(isWelcomeCompleted(storage), true);
});
