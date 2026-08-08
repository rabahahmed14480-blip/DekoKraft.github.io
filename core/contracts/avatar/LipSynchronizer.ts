export interface LipSynchronizer {
  synchronize(avatarId: string, phonemes: readonly unknown[]): Promise<readonly unknown[]>;
}
