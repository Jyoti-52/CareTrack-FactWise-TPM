import jwt from "jsonwebtoken";
import { publicUser, store } from "../storage/jsonStore.js";
import { asyncHandler, httpError } from "../utils/http.js";

export const localJwtSecret = process.env.JWT_SECRET || "caretrack-local-demo-secret-change-before-sharing";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) throw httpError(401, "Sign in to continue.");
  let payload;
  try {
    payload = jwt.verify(token, localJwtSecret);
  } catch {
    throw httpError(401, "Your session is invalid or expired. Sign in again.");
  }
  const user = store.read("users").find((item) => item._id === payload.sub);
  if (!user) throw httpError(401, "Account no longer exists.");
  req.user = publicUser(user);
  next();
});

export function allowRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(httpError(403, "You do not have permission to perform this action."));
    }
    next();
  };
}
