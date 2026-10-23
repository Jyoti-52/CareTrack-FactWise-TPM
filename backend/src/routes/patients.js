import { Router } from "express";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";
import { asyncHandler, dateKey, httpError } from "../utils/http.js";
import { feverThresholdC, recoveryStatus } from "../utils/recovery.js";
import {
  createId, dischargeWithRelations, patientWithRoom, recordWithUser, store,
} from "../storage/jsonStore.js";

const router = Router();
router.use(authenticate);

router.get("/recovery", asyncHandler(async (_req, res) => {
  const data = Object.fromEntries(["patients", "rooms", "temperatures"].map((name) => [name, store.read(name)]));
  const threshold = feverThresholdC();
  const today = new Date();
  const todayKey = dateKey(today);
  const firstDay = dateKey(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 3)));
  const admitted = data.patients.filter((patient) => patient.status === "admitted");
  res.json({
    thresholdC: threshold,
    patients: admitted.sort((a, b) => a.name.localeCompare(b.name)).map((patient) => {
      const temperatures = data.temperatures
        .filter((record) => record.patient === patient._id && record.dateKey >= firstDay && record.dateKey <= todayKey)
        .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
      return {
        ...patientWithRoom(patient, data.rooms),
        recovery: recoveryStatus(temperatures, today, threshold),
        lastTemp: temperatures[0] ? { ...temperatures[0], isFever: temperatures[0].celsius >= threshold } : null,
      };
    }),
  });
}));

router.get("/", asyncHandler(async (req, res) => {
  const data = { patients: store.read("patients"), rooms: store.read("rooms") };
  const patients = data.patients
    .filter((patient) => !req.query.status || patient.status === req.query.status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((patient) => patientWithRoom(patient, data.rooms));
  res.json({ patients });
}));

router.post("/", allowRoles("admin"), asyncHandler(async (req, res) => {
  const { patientId, name, age, sex, phone = "", diagnosis = "", roomId } = req.body;
  const numericAge = Number(age);
  if (!patientId || !String(name || "").trim() || age === undefined || !sex || !roomId) {
    throw httpError(400, "Patient ID, name, age, sex, and an available room are required.");
  }
  if (!Number.isInteger(numericAge) || numericAge < 0 || numericAge > 125) {
    throw httpError(400, "Age must be a whole number between 0 and 125.");
  }
  if (!["Female", "Male", "Other"].includes(sex)) throw httpError(400, "Select a valid sex value.");
  if (String(patientId).length > 32 || String(name).trim().length > 120) throw httpError(400, "Patient ID or name is too long.");

  const patient = await store.transaction((data) => {
    const room = data.rooms.find((item) => item._id === roomId);
    if (!room) throw httpError(404, "Room not found.");
    if (room.status !== "available" || room.patient) throw httpError(409, "That room is no longer available.");
    if (data.patients.some((item) => item.patientId.toLowerCase() === String(patientId).trim().toLowerCase())) {
      throw httpError(409, "A patient with this ID already exists.");
    }
    if (data.patients.filter((item) => item.status === "admitted").length >= 74) {
      throw httpError(409, "Facility capacity is 74 admitted patients.");
    }
    const now = new Date().toISOString();
    const created = {
      _id: createId(), patientId: String(patientId).trim(), name: String(name).trim(), age: numericAge, sex,
      phone: String(phone).trim().slice(0, 30), diagnosis: String(diagnosis).trim().slice(0, 1000),
      admittedAt: now, room: room._id, status: "admitted", outcomeAt: null,
      createdBy: req.user.id, createdAt: now, updatedAt: now,
    };
    room.status = "occupied";
    room.patient = created._id;
    room.updatedAt = now;
    data.patients.push(created);
    data.auditLogs.push({
      _id: createId(), actor: req.user.id, action: "patient.admitted",
      resourceType: "Patient", resourceId: created._id,
      details: { room: room.number }, createdAt: now,
    });
    return patientWithRoom(created, data.rooms);
  });
  res.status(201).json({ patient });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const data = Object.fromEntries(["patients", "rooms", "temperatures", "visits", "discharges", "users"].map((name) => [name, store.read(name)]));
  const patient = data.patients.find((item) => item._id === req.params.id);
  if (!patient) throw httpError(404, "Patient not found.");
  const temperatures = data.temperatures
    .filter((item) => item.patient === patient._id)
    .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
    .slice(0, 60)
    .map((item) => ({ ...recordWithUser(item, data.users), isFever: item.celsius >= feverThresholdC() }));
  const visits = data.visits
    .filter((item) => item.patient === patient._id)
    .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
    .slice(0, 60)
    .map((item) => recordWithUser(item, data.users));
  const discharge = data.discharges.find((item) => item.patient === patient._id);
  const threshold = feverThresholdC();
  res.json({
    patient: patientWithRoom(patient, data.rooms),
    temperatures,
    visits,
    discharge: dischargeWithRelations(discharge, data),
    recovery: recoveryStatus(data.temperatures.filter((item) => item.patient === patient._id), new Date(), threshold),
  });
}));

router.post("/:id/death", allowRoles("admin"), asyncHandler(async (req, res) => {
  const patient = await store.transaction((data) => {
    const item = data.patients.find((record) => record._id === req.params.id && record.status === "admitted");
    if (!item) throw httpError(409, "Only an admitted patient can be recorded as deceased.");
    const room = data.rooms.find((record) => record._id === item.room && record.patient === item._id && record.status === "occupied");
    if (!room) throw httpError(409, "The patient's room assignment is inconsistent; resolve it before recording the outcome.");
    const now = new Date().toISOString();
    item.status = "deceased";
    item.outcomeAt = now;
    item.updatedAt = now;
    room.status = "available";
    room.patient = null;
    room.updatedAt = now;
    data.auditLogs.push({
      _id: createId(), actor: req.user.id, action: "patient.deceased",
      resourceType: "Patient", resourceId: item._id, details: {}, createdAt: now,
    });
    return patientWithRoom(item, data.rooms);
  });
  res.json({ patient });
}));

export default router;
