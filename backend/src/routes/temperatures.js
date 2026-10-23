import { Router } from "express";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { asyncHandler, dateKey, httpError } from "../utils/http.js";
import { feverThresholdC } from "../utils/recovery.js";
import { createId, patientWithRoom, recordWithUser, store } from "../storage/jsonStore.js";

const router = Router();
router.use(authenticate);

router.get("/today", asyncHandler(async (_req, res) => {
  const data = { temperatures: store.read("temperatures"), patients: store.read("patients"), rooms: store.read("rooms"), users: store.read("users") };
  const key = dateKey();
  const thresholdC = feverThresholdC();
  const records = data.temperatures.filter((record) => record.dateKey === key).map((record) => {
    const patient = data.patients.find((item) => item._id === record.patient);
    return {
      ...recordWithUser(record, data.users),
      patient: patientWithRoom(patient, data.rooms),
      isFever: record.celsius >= thresholdC,
    };
  });
  res.json({ records, thresholdC });
}));

router.post("/", allowRoles("nurse"), asyncHandler(async (req, res) => {
  const { patientId, celsius, notes = "" } = req.body;
  const value = Number(celsius);
  if (!patientId || !Number.isFinite(value) || value < 30 || value > 45) {
    throw httpError(400, "Select a patient and enter a temperature between 30°C and 45°C.");
  }
  const record = await store.transaction((data) => {
    const patient = data.patients.find((item) => item._id === patientId && item.status === "admitted");
    if (!patient) throw httpError(404, "An admitted patient is required.");
    const key = dateKey();
    if (data.temperatures.some((item) => item.patient === patient._id && item.dateKey === key)) {
      throw httpError(409, "A routine temperature measurement is already recorded for this patient today.");
    }
    const now = new Date().toISOString();
    const created = {
      _id: createId(), patient: patient._id, celsius: value, dateKey: key, measuredAt: now,
      notes: String(notes).trim().slice(0, 500), recordedBy: req.user.id,
      createdAt: now, updatedAt: now,
    };
    data.temperatures.push(created);
    data.auditLogs.push({
      _id: createId(), actor: req.user.id, action: "temperature.recorded",
      resourceType: "TemperatureRecord", resourceId: created._id,
      details: { patient: patient.patientId, celsius: value }, createdAt: now,
    });
    return created;
  });
  res.status(201).json({ record });
}));

router.get("/patient/:patientId", asyncHandler(async (req, res) => {
  const users = store.read("users");
  const records = store.read("temperatures")
    .filter((record) => record.patient === req.params.patientId)
    .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
    .slice(0, 90)
    .map((record) => ({ ...recordWithUser(record, users), isFever: record.celsius >= feverThresholdC() }));
  res.json({ records });
}));

export default router;
