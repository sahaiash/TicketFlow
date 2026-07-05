// Small error helper so the service layer can signal an HTTP status without
// touching req/res. Controllers throw/propagate AppError; handleError maps it.
// Phase A bridge — replaced by a central error-handling middleware in Phase B.

export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

// Maps an error to the same responses the old controllers produced:
//   - known AppError  -> its status + message
//   - anything else   -> 500 "Internal Server Error" (logged)
export const handleError = (res, err, logLabel = "Error") => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(logLabel, err.message);
  return res.status(500).json({ message: "Internal Server Error" });
};
