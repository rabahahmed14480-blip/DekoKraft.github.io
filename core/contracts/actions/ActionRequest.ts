export interface ActionRequest<TParameters = unknown> {
  readonly id: string;
  readonly type: string;
  readonly parameters: TParameters;
  readonly requiresConfirmation: boolean;
}
