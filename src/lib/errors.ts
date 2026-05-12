/** Machine-readable error for UI translation via `t(code)`. */
export class AppError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "AppError";
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
