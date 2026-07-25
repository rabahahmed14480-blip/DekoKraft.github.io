import { rollbackRecovery } from "../../../../../lib/dekorebuild/operations";
import { readRequiredString, withDekoRebuildAdmin } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  return withDekoRebuildAdmin(async () => {
    const body = await request.json().catch(() => ({})) as { operationId?: unknown; confirmed?: unknown };
    if (body.confirmed !== true) throw new Error("Explicit rollback confirmation is required.");
    return { operation: await rollbackRecovery({ operationId: readRequiredString(body.operationId, "operationId"), confirmed: true }) };
  });
}
