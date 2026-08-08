export interface RuntimeTask {
  readonly id: string;
  readonly priority: number;
  readonly scheduledAt: string;
}
