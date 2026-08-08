import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { deploymentConfiguration, sanitizedDeploymentStatus } from "../lib/deployment/studioDeploymentCore.ts";

const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

const menu = read("app/config/dashboardMenu.ts");
const routeConfig = read("app/config/routes.ts");
assert.match(routeConfig, /studio: "\/studio"/);
assert.match(menu, /id: "studio"[\s\S]*?admin: routes\.studio, participant: routes\.studio/);
assert.match(menu, /enabledByRole: \{ participant: false \}/);

const center = read("app/admin/dekoclean/DekoCleanCenter.tsx");
assert.match(center, /aria-label="Analyze Root Cause"/);
assert.match(center, /canAnalyzeRootCause\(selected\)/);
assert.match(center, /canAnalyzeRootCause\(finding\)/);
assert.match(center, /تعذر تحليل السبب/);
assert.match(center, /لا توجد أدلة كافية لتحديد السبب حتى الآن/);
assert.match(center, /\/api\/admin\/dekoclean\/analyze-root-cause/);
assert.match(center, /finding\.severity !== "info"/);

const rootCauseRoute = read("app/api/admin/dekoclean/analyze-root-cause/route.ts");
assert.match(rootCauseRoute, /withDekoCleanAdmin/);

assert.match(read("app/components/home-v2/HomeHero.tsx"), /href=\{routes\.studio\}/);
assert.match(read("app/studio/page.tsx"), /StudioV2Shell/);
assert.match(read("app/studio-v2/page.tsx"), /redirect\("\/studio"\)/);

const participantDeployment = read("app/api/participant/studio-update/status/route.ts");
assert.match(participantDeployment, /requireAuthenticatedUser/);
assert.doesNotMatch(participantDeployment, /GITHUB_TOKEN|workflowId|repository/);
const adminDeployment = read("app/api/admin/studio-deployment/route.ts");
assert.match(adminDeployment, /withDekoCleanAdmin/);
assert.doesNotMatch(adminDeployment, /body\.(?:repository|workflow|branch|ref)/);
const clientDeployment = read("app/participant/components/StudioUpdatesCard.tsx");
assert.doesNotMatch(clientDeployment, /GITHUB_TOKEN|NEXT_PUBLIC_GITHUB|repository|branch/);
assert.match(clientDeployment, /viewerRole === "admin"/);
assert.match(clientDeployment, /href="\/studio"[\s\S]*?فتح الاستوديو/);
const deployEnvironment = { GITHUB_REPOSITORY: "owner/project", GITHUB_DEPLOY_WORKFLOW_ID: "deploy-pages.yml", GITHUB_DEPLOY_BRANCH: "main", GITHUB_TOKEN: "test-secret", GITHUB_SHA: "1234567890" };
const configured = deploymentConfiguration(deployEnvironment);
assert.deepEqual({ repository: configured.repository, workflowId: configured.workflowId, branch: configured.branch }, { repository: "owner/project", workflowId: "deploy-pages.yml", branch: "main" });
const sanitized = sanitizedDeploymentStatus(deployEnvironment);
assert.equal(JSON.stringify(sanitized).includes("test-secret"), false);
assert.equal(JSON.stringify(sanitized).includes("owner/project"), false);

const allSource = [
  read("app/participant/components/ParticipantStudioDashboard.tsx"),
  read("app/components/platform/DkDashboardGrid.tsx"),
  read("app/participant/components/StudioUpdatesCard.tsx"),
].join("\n");
assert.doesNotMatch(allSource, /window\.location|href="#?"(?:\s|>)/);
assert.match(allSource, /قريبًا/);

console.log("DekoClean root-cause and participant navigation tests passed.");
