import { Router } from "express";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { asyncHandler, httpError } from "../utils/http.js";
import { feverThresholdC, recoveryStatus } from "../utils/recovery.js";
import { createId, dischargeWithRelations, store } from "../storage/jsonStore.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(async (_req, res) => {
  const data = Object.fromEntries(["discharges", "patients", "rooms", "users"].map((name) => [name, store.read(name)]));
  res.json({
    discharges: data.discharges
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((discharge) => dischargeWithRelations(discharge, data)),
  });
}));

router.post("/recommend", allowRoles("doctor"), asyncHandler(async (req, res) => {
  const discharge = await store.transaction((data) => {
    const patient = data.patients.find((item) => item._id === req.body.patientId && item.status === "admitted");
    if (!patient) throw httpError(404, "An admitted patient is required.");
    const prior = data.discharges.find((item) => item.patient === patient._id);
    if (prior?.status === "pending") throw httpError(409, "A discharge recommendation is already awaiting approval.");
    if (prior?.status === "approved" || patient.status === "discharged") throw httpError(409, "This patient has already been discharged.");
    const temperatures = data.temperatures.filter((item) => item.patient === patient._id);
    const recovery = recoveryStatus(temperatures, new Date(), feverThresholdC());
    if (!recovery.eligible) {
      throw httpError(409, `Discharge requires 3 complete fever-free days with recorded temperatures. Current streak: ${recovery.consecutiveFeverFreeDays} day(s).`);
    }
    const now = new Date().toISOString();
    const created = {
      _id: createId(), patient: patient._id, recommendedBy: req.user.id,
      recommendedAt: now, approvedBy: null, approvedAt: null,
      status: "pending", feverFreeDays: recovery.feverFreeDays,
      createdAt: now, updatedAt: now,
    };
    data.discharges.push(created);
    data.auditLogs.push({
      _id: createId(), actor: req.user.id, action: "discharge.recommended",
      resourceType: "DischargeRecord", resourceId: created._id,
      details: { patient: patient.patientId }, createdAt: now,
    });
    return created;
  });
  res.status(201).json({ discharge });
}));

router.post("/:id/approve", allowRoles("admin"), asyncHandler(async (req, res) => {
  const discharge = await store.transaction((data) => {
    const item = data.discharges.find((record) => record._id === req.params.id && record.status === "pending");
    if (!item) throw httpError(404, "Pending discharge recommendation not found.");
    if (item.recommendedBy === req.user.id) {
      throw httpError(403, "A doctor cannot approve their own recommendation using the admin role.");
    }
    const patient = data.patients.find((record) => record._id === item.patient && record.status === "admitted");
    if (!patient) throw httpError(409, "Patient is no longer admitted.");
    const recovery = recoveryStatus(
      data.temperatures.filter((record) => record.patient === patient._id),
      new Date(),
      feverThresholdC(),
    );
    if (!recovery.eligible) throw httpError(409, "Patient no longer meets the 3 full fever-free day requirement.");
    const room = data.rooms.find((record) => record._id === patient.room && record.patient === patient._id && record.status === "occupied");
    if (!room) throw httpError(409, "The patient's room assignment is inconsistent; resolve it before discharge.");
    const now = new Date().toISOString();
    item.status = "approved";
    item.approvedBy = req.user.id;
    item.approvedAt = now;
    item.updatedAt = now;
    patient.status = "discharged";
    patient.outcomeAt = now;
    patient.updatedAt = now;
    room.status = "available";
    room.patient = null;
    room.updatedAt = now;
    data.auditLogs.push({
      _id: createId(), actor: req.user.id, action: "discharge.approved",
      resourceType: "DischargeRecord", resourceId: item._id,
      details: { patient: patient.patientId, room: room.number }, createdAt: now,
    });
    return dischargeWithRelations(item, data);
  });
  res.json({ discharge });
}));

export default router;
