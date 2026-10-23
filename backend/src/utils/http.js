export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function dateKey(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}
