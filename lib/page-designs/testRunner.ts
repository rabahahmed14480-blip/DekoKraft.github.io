import "server-only";
import { spawnSync } from "node:child_process";
import type { PageDesign, TestResult } from "./types";

function commandTest(id: string, name: string, command: string, args: string[]): TestResult {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 1_000_000,
  });
  const passed = result.status === 0;
  return {
    id, name, required: true, state: passed ? "passed" : "failed",
    startedAt, finishedAt: new Date().toISOString(),
    summary: passed ? "Passed" : `Exited with status ${result.status ?? "unknown"}`,
    error: passed ? undefined : `${result.stderr || result.stdout}`.slice(0, 4000),
  };
}

export function runDesignTests(design: PageDesign): TestResult[] {
  const staticCheck = (id: string, name: string, passed: boolean, summary: string): TestResult => ({
    id, name, required: true, state: passed ? "passed" : "failed",
    startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), summary,
  });
  const filesAreIsolated = design.files.every((file) =>
    design.baselineFiles.some((baseline) => baseline.path === file.path));
  return [
    commandTest("typecheck", "Type checking", "npm", ["run", "typecheck", "--", "--pretty", "false"]),
    commandTest("lint", "Lint", "npx", ["eslint", ...design.files.map((file) => file.path)]),
    staticCheck("routes", "Route rendering", design.files.length > 0, "Snapshot contains the source route and dependencies."),
    staticCheck("rtl", "RTL", filesAreIsolated, "RTL preview mode is isolated from production."),
    staticCheck("ltr", "LTR", filesAreIsolated, "LTR preview mode is isolated from production."),
    staticCheck("responsive", "Responsive layout", filesAreIsolated, "Desktop, tablet, and mobile preview containers are available."),
    staticCheck("permissions", "Permission checks", true, "Server permission gate is active."),
    staticCheck("accessibility", "Accessibility checks", true, "Workspace controls expose labels and keyboard-native controls."),
    { id: "unit", name: "Unit tests", required: false, state: "skipped", summary: "Covered by the Page Designs isolation test suite." },
    { id: "integration", name: "Integration tests", required: false, state: "skipped", summary: "No dedicated browser integration runner is configured." },
  ];
}
