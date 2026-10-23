import { Router } from "express";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { asyncHandler, httpError } from "../utils/http.js";
import { roomWithPatient, store } from "../storage/jsonStore.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(async (_req, res) => {
  const patients = store.read("patients");
  const rooms = store.read("rooms")
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))
    .map((room) => roomWithPatient(room, patients));
  res.json({ rooms });
}));

router.get("/:id", allowRoles("admin"), asyncHandler(async (req, res) => {
  const room = store.read("rooms").find((item) => item._id === req.params.id);
  if (!room) throw httpError(404, "Room not found.");
  res.json({ room: roomWithPatient(room, store.read("patients")) });
}));

export default router;
