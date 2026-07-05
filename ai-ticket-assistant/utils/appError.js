// Small error helper so the service layer can signal an HTTP status without
// touching req/res. Controllers throw/propagate AppError; handleError maps it.
// Phase A bridge — replaced by a central error-handling middleware in Phase B.

export class AppError extends Error {
  // body (optional): the exact JSON payload to return. When omitted the
  // handler falls back to { message }. Some endpoints (user/auth) use custom
  // shapes like { error, message }, so they pass an explicit body.
  constructor(message, status = 500, body = null) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.body = body;
  }
}

// Maps an error to the same responses the old controllers produced:
//   - known AppError  -> its status + (custom body, or { message })
//   - anything else   -> 500 "Internal Server Error" (logged)
export const handleError = (res, err, logLabel = "Error") => {
  if (err instanceof AppError) {
    return res.status(err.status).json(err.body ?? { message: err.message });
  }
  console.error(logLabel, err.message);
  return res.status(500).json({ message: "Internal Server Error" });
};
