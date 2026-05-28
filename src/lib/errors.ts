/** Machine-readable error for UI translation via `t(code)`. */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    /** Shown in dev builds to surface the underlying WebAuthn message. */
    public readonly detail?: string,
  ) {
    super(code);
    this.name = "AppError";
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
