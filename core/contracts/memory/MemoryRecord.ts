export interface MemoryRecord<TValue = unknown> {
  readonly key: string;
  readonly kind: string;
  readonly value: TValue;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly expiresAt?: string;
  readonly protected: boolean;
}
