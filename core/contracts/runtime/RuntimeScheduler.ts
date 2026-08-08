import type { RuntimeTask } from "./RuntimeTask";

export interface RuntimeScheduler {
  schedule(task: RuntimeTask): Promise<void>;
}
