import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler, dateKey } from "../utils/http.js";
import { feverThresholdC, recoveryStatus } from "../utils/recovery.js";
import { dischargeWithRelations, patientWithRoom, store } from "../storage/jsonStore.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(async (_req, res) => {
  const data = Object.fromEntries(["patients", "rooms", "temperatures", "visits", "discharges", "users"].map((name) => [name, store.read(name)]));
  const today = dateKey();
  const threshold = feverThresholdC();
  const admittedPatients = data.patients.filter((patient) => patient.status === "admitted");
  const discharged = data.patients.filter((patient) => patient.status === "discharged").length;
  const deceased = data.patients.filter((patient) => patient.status === "deceased").length;
  const tempsToday = new Set(data.temperatures.filter((record) => record.dateKey === today).map((record) => record.patient));
  const visitsToday = new Set(data.visits.filter((visit) => visit.dateKey === today).map((visit) => visit.patient));
  const firstRecoveryDay = dateKey(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() - 3)));
  const eligiblePatients = admittedPatients.filter((patient) => recoveryStatus(
    data.temperatures.filter((record) =>
      record.patient === patient._id && record.dateKey >= firstRecoveryDay && record.dateKey <= today),
    new Date(),
    threshold,
  ).eligible);
  const pendingDischarges = data.discharges
    .filter((item) => item.status === "pending")
    .map((item) => dischargeWithRelations(item, data));
  const occupiedRooms = data.rooms.filter((room) => room.status === "occupied").length;
  const availableRooms = data.rooms.filter((room) => room.status === "available").length;
  const resolved = discharged + deceased;

  res.json({
    metrics: {
      admitted: admittedPatients.length,
      occupiedRooms,
      availableRooms,
      awaitingTemperature: admittedPatients.filter((patient) => !tempsToday.has(patient._id)).length,
      awaitingDoctorVisit: admittedPatients.filter((patient) => !visitsToday.has(patient._id)).length,
      eligibleForDischarge: eligiblePatients.length,
      awaitingDischargeApproval: pendingDischarges.length,
      discharged,
      deceased,
      treatmentSuccessRate: resolved ? Number(((discharged / resolved) * 100).toFixed(1)) : null,
      mortalityRate: resolved ? Number(((deceased / resolved) * 100).toFixed(1)) : null,
      resolvedOutcomes: resolved,
    },
    patientsAwaitingTemperature: admittedPatients.filter((patient) => !tempsToday.has(patient._id)).map((patient) => patientWithRoom(patient, data.rooms)),
    patientsAwaitingDoctorVisit: admittedPatients.filter((patient) => !visitsToday.has(patient._id)).map((patient) => patientWithRoom(patient, data.rooms)),
    eligiblePatients: eligiblePatients.map((patient) => patientWithRoom(patient, data.rooms)),
    pendingDischarges,
    temperatureThresholdC: threshold,
    date: today,
  });
}));

export default router;
