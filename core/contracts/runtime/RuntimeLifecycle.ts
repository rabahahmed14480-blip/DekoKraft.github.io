export interface RuntimeLifecycle {
  start(): Promise<void>;
  stop(): Promise<void>;
}
