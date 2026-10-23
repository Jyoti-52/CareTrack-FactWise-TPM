export function notFound(_req, res) {
  res.status(404).json({ message: "API endpoint not found." });
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ message: error.message || "An unexpected server error occurred." });
}
