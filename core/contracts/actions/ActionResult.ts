export interface ActionResult<TValue = unknown> {
  readonly actionId: string;
  readonly status: string;
  readonly value?: TValue;
}
