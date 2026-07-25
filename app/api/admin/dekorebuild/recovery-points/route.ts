import { createRecoveryPoint, getDekoRebuildSummary } from "../../../../../lib/dekorebuild/recoveryPoints";
import { readRecoveryPoints } from "../../../../../lib/dekorebuild/storage";
import type { RecoveryPointType } from "../../../../../lib/dekorebuild/types";
import { withDekoRebuildAdmin } from "../_shared";

const pointTypes: RecoveryPointType[] = ["automatic", "manual", "before-repair", "after-repair", "before-feature", "release", "emergency"];
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  return withDekoRebuildAdmin(async () => ({ points: readRecoveryPoints().slice(0, 100), summary: getDekoRebuildSummary() }));
}

export async function POST(request: Request) {
  return withDekoRebuildAdmin(async (adminReference) => {
    const body = await request.json().catch(() => ({})) as { type?: unknown; operationId?: unknown };
    const type = pointTypes.includes(body.type as RecoveryPointType) ? body.type as RecoveryPointType : "manual";
    if (type === "emergency") throw new Error("Emergency recovery points are created only by an active recovery operation.");
    if (body.operationId !== undefined && (typeof body.operationId !== "string" || !/^[\w.-]{6,128}$/.test(body.operationId))) throw new Error("Invalid operationId.");
    return { point: await createRecoveryPoint({ type, createdBy: adminReference, operationId: body.operationId }) };
  });
}
