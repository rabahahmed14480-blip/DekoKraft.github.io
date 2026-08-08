export class ErrorRecovery {
  private recoveryCount = 0;
  recover(error: unknown) {
    this.recoveryCount += 1;
    const code = error instanceof Error ? error.message.split(":")[0].slice(0, 120) : "RUNTIME_OPERATION_FAILED";
    return { recovered: !/ACCESS_DENIED|PERMISSION_DENIED|INVALID_RUNTIME_TRANSITION/.test(code), code, recoveryCount: this.recoveryCount };
  }
}

