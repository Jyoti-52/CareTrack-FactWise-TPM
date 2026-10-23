import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const collectionNames = ["users", "rooms", "patients", "temperatures", "visits", "discharges", "auditLogs"];
const dataDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data");

function makeId() {
  return randomUUID().replaceAll("-", "");
}

function dayKey(offset = 0) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function isoDayTime(offset, hour = 9) {
  return `${dayKey(offset)}T${String(hour).padStart(2, "0")}:00:00.000Z`;
}

function makeDemoData(users) {
  const rooms = Array.from({ length: 74 }, (_, index) => ({
    _id: makeId(),
    number: `R-${String(index + 1).padStart(2, "0")}`,
    status: index < 5 ? "occupied" : "available",
    patient: null,
    createdAt: isoDayTime(-7),
    updatedAt: isoDayTime(0),
  }));
  const profiles = [
    { patientId: "CT-DEMO-001", name: "Maya Chen", age: 34, sex: "Female", diagnosis: "Viral infection; recovering", status: "admitted", roomIndex: 0 },
    { patientId: "CT-DEMO-002", name: "Noah Williams", age: 46, sex: "Male", diagnosis: "Persistent fever", status: "admitted", roomIndex: 1 },
    { patientId: "CT-DEMO-003", name: "Priya Shah", age: 28, sex: "Female", diagnosis: "Observation and supportive care", status: "admitted", roomIndex: 2 },
    { patientId: "CT-DEMO-004", name: "Leo Martinez", age: 57, sex: "Male", diagnosis: "Fever monitoring", status: "admitted", roomIndex: 3 },
    { patientId: "CT-DEMO-005", name: "Ava Thompson", age: 39, sex: "Female", diagnosis: "Viral infection; stable", status: "admitted", roomIndex: 4 },
    { patientId: "CT-DEMO-006", name: "Samira Patel", age: 31, sex: "Female", diagnosis: "Recovered", status: "discharged", roomIndex: null },
    { patientId: "CT-DEMO-007", name: "Ethan Brown", age: 63, sex: "Male", diagnosis: "Recovered", status: "discharged", roomIndex: null },
    { patientId: "CT-DEMO-008", name: "Olivia Davis", age: 71, sex: "Female", diagnosis: "Historical outcome", status: "deceased", roomIndex: null },
  ];
  const patients = profiles.map((profile, index) => {
    const patient = {
      _id: makeId(),
      patientId: profile.patientId,
      name: profile.name,
      age: profile.age,
      sex: profile.sex,
      phone: "",
      diagnosis: profile.diagnosis,
      admittedAt: isoDayTime(-(index + 6)),
      room: profile.roomIndex === null ? null : rooms[profile.roomIndex]._id,
      status: profile.status,
      outcomeAt: profile.status === "admitted" ? null : isoDayTime(-(index + 1)),
      createdBy: users.admin._id,
      createdAt: isoDayTime(-(index + 6)),
      updatedAt: isoDayTime(0),
    };
    if (patient.room) rooms[profile.roomIndex].patient = patient._id;
    return patient;
  });

  const temperatures = [];
  const temperatureFor = (patientIndex, offset, celsius) => {
    const record = {
      _id: makeId(),
      patient: patients[patientIndex]._id,
      celsius,
      dateKey: dayKey(offset),
      measuredAt: isoDayTime(offset),
      notes: "",
      recordedBy: users.nurse._id,
      createdAt: isoDayTime(offset),
      updatedAt: isoDayTime(offset),
    };
    temperatures.push(record);
    return record;
  };

  for (const offset of [-3, -2, -1, 0]) temperatureFor(0, offset, 36.8 + Math.abs(offset) * 0.1);
  temperatureFor(1, -2, 38.2);
  temperatureFor(1, -1, 38.4);
  temperatureFor(1, 0, 38.1);
  temperatureFor(2, -2, 37.4);
  temperatureFor(2, -1, 37.2);
  temperatureFor(3, -3, 37.3);
  temperatureFor(3, -2, 38.1);
  temperatureFor(3, -1, 37.0);
  temperatureFor(3, 0, 36.9);
  temperatureFor(4, -2, 37.0);
  temperatureFor(4, -1, 36.9);
  temperatureFor(4, -3, 37.1);
  temperatureFor(4, 0, 36.8);

  const visits = [0, 1, 3, 4].map((patientIndex) => {
    const temperatureReviewed = temperatures.find((record) =>
      record.patient === patients[patientIndex]._id && record.dateKey === dayKey(0));
    return {
      _id: makeId(),
      patient: patients[patientIndex]._id,
      dateKey: dayKey(0),
      visitedAt: isoDayTime(0, 11),
      diagnosis: patients[patientIndex].diagnosis,
      treatmentNotes: patientIndex === 0 ? "Continue observation; recovery progressing." : "Clinical review completed.",
      temperatureReviewed: temperatureReviewed._id,
      recordedBy: users.doctor._id,
      createdAt: isoDayTime(0, 11),
      updatedAt: isoDayTime(0, 11),
    };
  });

  const discharge = {
    _id: makeId(),
    patient: patients[0]._id,
    recommendedBy: users.doctor._id,
    recommendedAt: isoDayTime(0, 12),
    approvedBy: null,
    approvedAt: null,
    status: "pending",
    feverFreeDays: [dayKey(-1), dayKey(-2), dayKey(-3)],
    createdAt: isoDayTime(0, 12),
    updatedAt: isoDayTime(0, 12),
  };

  return {
    users: Object.values(users),
    rooms,
    patients,
    temperatures,
    visits,
    discharges: [discharge],
    auditLogs: [{
      _id: makeId(),
      actor: users.doctor._id,
      action: "discharge.recommended",
      resourceType: "DischargeRecord",
      resourceId: discharge._id,
      details: { patient: patients[0].patientId },
      createdAt: isoDayTime(0, 12),
    }],
  };
}

class JsonStore {
  state = Object.fromEntries(collectionNames.map((name) => [name, []]));
  writeQueue = Promise.resolve();

  async initialize() {
    await fs.mkdir(dataDirectory, { recursive: true });
    for (const name of collectionNames) {
      const filePath = path.join(dataDirectory, `${name}.json`);
      try {
        const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
        if (!Array.isArray(parsed)) throw new Error(`${filePath} must contain a JSON array.`);
        this.state[name] = parsed;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        await fs.writeFile(filePath, "[]\n", "utf8");
      }
    }

    if (collectionNames.every((name) => this.state[name].length === 0)) {
      const demoUsers = [
        { _id: makeId(), name: "CareTrack Administrator", email: "admin@caretrack.demo", role: "admin", password: "AdminDemo123!" },
        { _id: makeId(), name: "Jordan Nurse", email: "nurse@caretrack.demo", role: "nurse", password: "NurseDemo123!" },
        { _id: makeId(), name: "Taylor Doctor", email: "doctor@caretrack.demo", role: "doctor", password: "DoctorDemo123!" },
      ];
      const users = {};
      for (const user of demoUsers) {
        users[user.role] = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          passwordHash: await bcrypt.hash(user.password, 12),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      this.state = makeDemoData(users);
      await this.persist(this.state);
      console.info("Created CareTrack demo data: 74 rooms, 8 patients, care records, and demo accounts.");
    }
  }

  read(name) {
    if (!collectionNames.includes(name)) throw new Error(`Unknown local data file: ${name}`);
    return structuredClone(this.state[name]);
  }

  async transaction(update) {
    const execute = async () => {
      const draft = structuredClone(this.state);
      const result = await update(draft);
      await this.persist(draft);
      this.state = draft;
      return structuredClone(result);
    };
    const pending = this.writeQueue.then(execute, execute);
    this.writeQueue = pending.then(() => undefined, () => undefined);
    return pending;
  }

  async persist(state) {
    for (const name of collectionNames) {
      const filePath = path.join(dataDirectory, `${name}.json`);
      const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
      await fs.writeFile(temporaryPath, `${JSON.stringify(state[name], null, 2)}\n`, "utf8");
      await fs.rename(temporaryPath, filePath);
    }
  }
}

export const store = new JsonStore();
export const createId = makeId;
export const localDataDirectory = dataDirectory;
export const localCollections = collectionNames;

export async function initializeStore() {
  await store.initialize();
}

export function publicUser(user) {
  if (!user) return null;
  return { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role };
}

export function roomWithPatient(room, patients) {
  if (!room) return null;
  const result = { ...room };
  result.patient = room.patient
    ? patients.find((patient) => patient._id === room.patient) || null
    : null;
  return result;
}

export function patientWithRoom(patient, rooms) {
  if (!patient) return null;
  return {
    ...patient,
    room: patient.room ? rooms.find((room) => room._id === patient.room) || null : null,
  };
}

export function recordWithUser(record, users, field = "recordedBy") {
  if (!record) return null;
  const user = users.find((item) => item._id === record[field]);
  return { ...record, [field]: user ? publicUser(user) : null };
}

export function dischargeWithRelations(discharge, data) {
  if (!discharge) return null;
  const patient = data.patients.find((item) => item._id === discharge.patient);
  const recommender = data.users.find((item) => item._id === discharge.recommendedBy);
  const approver = data.users.find((item) => item._id === discharge.approvedBy);
  return {
    ...discharge,
    patient: patientWithRoom(patient, data.rooms),
    recommendedBy: publicUser(recommender),
    approvedBy: publicUser(approver),
  };
}
