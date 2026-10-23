import { Router } from "express";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { asyncHandler, dateKey, httpError } from "../utils/http.js";
import { createId, patientWithRoom, recordWithUser, store } from "../storage/jsonStore.js";

const router = Router();
router.use(authenticate);

router.post("/", allowRoles("doctor"), asyncHandler(async (req, res) => {
  const { patientId, diagnosis = "", treatmentNotes = "" } = req.body;
  if (!patientId) throw httpError(400, "Select a patient.");
  const visit = await store.transaction((data) => {
    const patient = data.patients.find((item) => item._id === patientId && item.status === "admitted");
    if (!patient) throw httpError(404, "An admitted patient is required.");
    const key = dateKey();
    const temperature = data.temperatures.find((item) => item.patient === patient._id && item.dateKey === key);
    if (!temperature) throw httpError(409, "Record today's temperature before completing the doctor visit.");
    if (data.visits.some((item) => item.patient === patient._id && item.dateKey === key)) {
      throw httpError(409, "A doctor visit is already recorded for this patient today.");
    }
    const now = new Date().toISOString();
    const created = {
      _id: createId(), patient: patient._id, dateKey: key, visitedAt: now,
      diagnosis: String(diagnosis).trim().slice(0, 1000),
      treatmentNotes: String(treatmentNotes).trim().slice(0, 2000),
      temperatureReviewed: temperature._id, recordedBy: req.user.id,
      createdAt: now, updatedAt: now,
    };
    data.visits.push(created);
    data.auditLogs.push({
      _id: createId(), actor: req.user.id, action: "doctor-visit.recorded",
      resourceType: "DoctorVisit", resourceId: created._id,
      details: { patient: patient.patientId }, createdAt: now,
    });
    return created;
  });
  res.status(201).json({ visit });
}));

router.get("/today", asyncHandler(async (_req, res) => {
  const data = { visits: store.read("visits"), patients: store.read("patients"), rooms: store.read("rooms"), users: store.read("users") };
  const visits = data.visits.filter((visit) => visit.dateKey === dateKey()).map((visit) => ({
    ...recordWithUser(visit, data.users),
    patient: patientWithRoom(data.patients.find((patient) => patient._id === visit.patient), data.rooms),
  }));
  res.json({ visits });
}));

export default router;
