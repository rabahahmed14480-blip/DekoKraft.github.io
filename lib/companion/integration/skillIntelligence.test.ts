import assert from "node:assert/strict";
import test from "node:test";
import { ConversationEngine } from "../conversationEngine.ts";
import { ConversationManager } from "../conversationManager.ts";
import { CompanionOnePipeline } from "./pipeline.ts";

const actor = { role: "admin" as const, name: "Skill Intelligence Test" };
const run = async (question: string) => {
  const pipeline = new CompanionOnePipeline(new ConversationEngine(new ConversationManager()));
  pipeline.start(actor, { pageId: "/welcome", pageType: "public", locale: "en" });
  return pipeline.message(question);
};

test("EchoBrain coordination resolves greeting questions to GreetingSkill", async () => {
  const result = await run("Hello");
  assert.equal(result.selectedSkill, "greeting");
  assert.equal(result.semanticResponse, "Hello! How can I help?");
  assert.ok(result.logs.some(entry => entry.component === "EchoBrain"));
});

test("product questions resolve to ProductSkill and return its semantic contract", async () => {
  const result = await run("What is the price of this product?");
  assert.equal(result.selectedSkill, "product");
  assert.match(result.semanticResponse, /verified knowledge/i);
});

test("order questions resolve to OrderSkill", async () => {
  const result = await run("Where is my order delivery?");
  assert.equal(result.selectedSkill, "order");
  assert.match(result.semanticResponse, /order reference/i);
});

test("help questions resolve to HelpSkill", async () => {
  const result = await run("Help me");
  assert.equal(result.selectedSkill, "help");
  assert.match(result.semanticResponse, /here to help/i);
});

test("unknown questions resolve to FallbackSkill", async () => {
  const result = await run("flibbertigibbet zqx");
  assert.equal(result.selectedSkill, "fallback");
  assert.match(result.semanticResponse, /clarify/i);
});

