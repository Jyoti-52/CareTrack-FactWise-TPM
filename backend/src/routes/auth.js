import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticate, localJwtSecret } from "../middleware/auth.js";
import { asyncHandler, httpError } from "../utils/http.js";
import { createId, publicUser, store } from "../storage/jsonStore.js";
import { audit } from "../middleware/audit.js";

const router = Router();

router.post("/login", asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) throw httpError(400, "Email and password are required.");
  const user = store.read("users").find((item) => item.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError(401, "Email or password is incorrect.");
  }
  const token = jwt.sign({ sub: user._id, role: user.role }, localJwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || "12h" });
  res.json({ token, user: publicUser(user) });
}));

router.post("/register", authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") throw httpError(403, "Only admins can create staff accounts.");
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !["admin", "nurse", "doctor"].includes(role)) {
    throw httpError(400, "Name, email, password, and a valid role are required.");
  }
  if (String(password).length < 8) throw httpError(400, "Password must be at least 8 characters.");
  const normalizedEmail = String(email).trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await store.transaction((data) => {
    if (data.users.some((item) => item.email === normalizedEmail)) throw httpError(409, "An account with this email already exists.");
    const created = {
      _id: createId(), name: String(name).trim(), email: normalizedEmail, passwordHash, role,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    data.users.push(created);
    data.auditLogs.push({
      _id: createId(), actor: req.user.id, action: "user.registered", resourceType: "User",
      resourceId: created._id, details: { email: normalizedEmail, role }, createdAt: new Date().toISOString(),
    });
    return created;
  });
  res.status(201).json({ user: publicUser(user) });
}));

router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
