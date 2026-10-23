<<<<<<< HEAD
# CareTrack

CareTrack is a local assessment prototype for quarantine facility operations. It uses the existing React/Vite frontend and Express API, with persistent JSON files stored in `backend/data/`. It does not require MongoDB, Atlas, or any other external database.

## Run locally

Requirements: Node.js 20 or newer and npm.

From the project root, install the dependencies and start both apps:

```powershell
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev
```

Open **http://localhost:5173**. The Express API runs at **http://localhost:5000** and its health check is **http://localhost:5000/api/health**.

The backend creates `backend/data/` and its JSON files automatically on first start. When all data files are empty, it creates demo users, 74 rooms, 8 example patients, temperature readings, doctor visits, a pending discharge recommendation, and an audit entry. It does not reseed or replace data after the JSON files contain records.

To check or initialize the local data files without starting the server:

```powershell
npm run seed --prefix backend
```

This command preserves existing data. It creates initial demo data only when all local data files are empty.

### Demo logins

| Role | Email | Password |
|---|---|---|
| Admin | `admin@caretrack.demo` | `AdminDemo123!` |
| Nurse | `nurse@caretrack.demo` | `NurseDemo123!` |
| Doctor | `doctor@caretrack.demo` | `DoctorDemo123!` |

These are demonstration credentials. The local-only JWT fallback is not suitable for a public deployment.

## Main workflow

1. Admin registers a patient in an available room.
2. Nurse records that patient's daily temperature (one routine reading per day).
3. Doctor reviews the recorded temperature and documents the day's visit, diagnosis, and treatment notes.
4. Recovery tracking counts three complete prior UTC calendar days with recorded readings below the fever threshold. Today's partial day, a missed reading, or a fever reading does not count.
5. Doctor recommends discharge only when eligible; an admin separately approves it.
6. Approval marks the patient discharged and releases the assigned room.

Admin can also record a patient's death. This releases the room and updates outcome reporting.

## Roles and features (Q1)

- **Admin:** sign in, register and view patients, assign rooms, monitor daily care and room occupancy, review and approve discharge recommendations, record a death, and view reports.
- **Nurse:** sign in, view admitted patients and temperature history, see who is awaiting a measurement, and record one routine temperature per patient per day. Nurses cannot record doctor visits or discharge patients.
- **Doctor:** sign in, review patient temperatures and recovery progress, record a daily visit with diagnosis and treatment notes after today's temperature is available, and recommend discharge when eligible. Doctors cannot approve discharge recommendations.

## Application overview (Q2)

The working local prototype contains login; role-aware dashboards; patient list, registration and details; room management; temperature entry and history; doctor visits; recovery tracking; discharge recommendation and approval; and reports. Application state and workflows are persisted in the local JSON data files. No public deployment has been created.

## Business constraints, warnings, and permissions (Q3)

- Role permissions are enforced by Express API middleware as well as the UI.
- Admission requires an available room and is blocked at the 74-patient capacity limit.
- Only admitted patients can receive routine temperatures or visits. Temperatures must be between 30°C and 45°C.
- A unique patient/day check prevents duplicate routine temperature records. A visit requires that same day's temperature and is limited to one visit per patient per day.
- Three **complete prior UTC calendar days**, each with a recorded temperature below the fever threshold, are required for discharge eligibility. A missing measurement or a fever reading resets the consecutive streak.
- Only doctors can recommend eligible discharges. Only admins can approve. Approval rechecks eligibility and room ownership. An admin account cannot approve a recommendation created by that same account.
- Discharge and death release the room. Nurses cannot discharge patients.
- Success rate is `discharged / (discharged + deceased)`; mortality rate is `deceased / (discharged + deceased)`. Active patients are excluded. Empty outcome history is shown as `—`.
- Failed validations, duplicates, authorization errors, and ineligible workflow actions return explicit API errors and visible UI messages. Actions are recorded in the audit log.

### Prototype assumption

The fever threshold defaults to **38°C**, configurable through the optional `FEVER_THRESHOLD_C` environment variable. This is a prototype assumption, not medical guidance. Day boundaries use UTC. Local JSON files are intended for a single-user demo and are not a production database.

## Sprint planning answer (Q4)

Velocity is 25 points, and 15 are already committed, so 10 points remain. Given High = 6 relative value, Medium = 3, and Low = 1, the following is the maximum-value combination with the least effort:

| Option | Priority | Effort | Relative value |
|---|---|---:|---:|
| A | High | 1 | 6 |
| B | High | 3 | 6 |
| D | Medium | 2 | 3 |
| F | Medium | 1 | 3 |
| G | Low | 0.4 | 1 |
| H | Low | 0.5 | 1 |
| I | Low | 0.3 | 1 |
| J | Low | 0.1 | 1 |
| **Total** |  | **8.3 / 10** | **22** |

This reaches the maximum weighted value of 22 with the least effort, leaving 1.7 points available.

## Validation

```powershell
npm test --prefix backend
npm run build --prefix frontend
```
=======
# CareTrack-FactWise-TPM
CareTrack – Patient Management System
>>>>>>> b863b5615ebaabcc70d8b53f99646175fc001222
