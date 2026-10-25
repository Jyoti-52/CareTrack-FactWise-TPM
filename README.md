# CareTrack – Patient Management System

CareTrack is a patient management system prototype designed for quarantine facility operations. It uses a React/Vite frontend and an Express API, with JSON files for local data storage.

The application supports patient registration, room management, daily temperature monitoring, doctor visits, recovery tracking, discharge recommendations, discharge approval, and reports.

The project uses local JSON storage and does not require MongoDB, MongoDB Atlas, or another external database for local development.

## Project Overview

- **Frontend:** React, Vite
- **Backend:** Node.js, Express
- **Database:** Local JSON file storage
- **Authentication:** JWT-based authentication
- **Deployment:** Vercel
- **Project Type:** Assessment and demonstration prototype

## Run Locally

### Requirements

- Node.js 20 or newer
- npm

### Installation

From the project root, install the dependencies:

```powershell
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Start the application

```powershell
npm run dev
```

Open the frontend:

**http://localhost:5173**

The Express API runs at:

**http://localhost:5000**

Backend health check:

**http://localhost:5000/api/health**

### Local Data Initialization

The backend automatically creates the `backend/data/` directory and its JSON files when the application starts.

When all data files are empty, the backend initializes demo data, including:

- Demo users
- 74 rooms
- 8 example patients
- Temperature readings
- Doctor visits
- A pending discharge recommendation
- An audit entry

The backend does not reseed or replace existing data after the JSON files contain records.

To check or initialize the local data files without starting the server:

```powershell
npm run seed --prefix backend
```

This command preserves existing data and creates initial demo data only when all local data files are empty.

## Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@caretrack.demo` | `AdminDemo123!` |
| Nurse | `nurse@caretrack.demo` | `NurseDemo123!` |
| Doctor | `doctor@caretrack.demo` | `DoctorDemo123!` |

These credentials are provided for demonstration purposes.

The local-only JWT fallback is not suitable for a public deployment.

## Main Workflow

1. **Patient Registration:** Admin registers a patient and assigns an available room.
2. **Temperature Monitoring:** Nurse records the patient's daily temperature.
3. **Doctor Visit:** Doctor reviews the temperature and documents the day's visit, diagnosis, and treatment notes.
4. **Recovery Tracking:** The system tracks recovery based on recorded temperatures over complete prior UTC calendar days.
5. **Discharge Recommendation:** Doctor recommends discharge when the patient meets the eligibility requirements.
6. **Discharge Approval:** Admin separately reviews and approves the recommendation.
7. **Room Release:** Approval marks the patient as discharged and releases the assigned room.

Admin can also record a patient's death. This releases the assigned room and updates outcome reporting.

## Roles and Features (Q1)

### Admin

- Sign in
- Register and view patients
- Assign rooms
- Monitor daily care
- Monitor room occupancy
- Review discharge recommendations
- Approve discharge recommendations
- Record a patient's death
- View reports

### Nurse

- Sign in
- View admitted patients
- View temperature history
- Identify patients awaiting temperature measurements
- Record one routine temperature per patient per day

Nurses cannot record doctor visits or discharge patients.

### Doctor

- Sign in
- Review patient temperatures
- Review recovery progress
- Record daily visits
- Document diagnosis and treatment notes
- Recommend discharge when eligible

Doctors cannot approve discharge recommendations.

## Application Overview (Q2)

The CareTrack prototype includes the following modules:

- Login and authentication
- Role-aware dashboards
- Patient list
- Patient registration
- Patient details
- Room management
- Temperature entry
- Temperature history
- Doctor visits
- Recovery tracking
- Discharge recommendations
- Discharge approval
- Reports

Application state and workflows are persisted in local JSON data files.

The frontend and backend are deployed on Vercel for assessment and demonstration.

The application uses local JSON file storage. Data persistence in the deployed environment is not guaranteed, so the deployment is intended for demonstration rather than production use.

## Business Constraints, Warnings, and Permissions (Q3)

### Role-Based Permissions

- Role permissions are enforced through Express API middleware as well as the frontend UI.
- Admin, Nurse, and Doctor have different permissions.
- Nurses cannot record doctor visits or discharge patients.
- Doctors cannot approve discharge recommendations.
- Only Admin can approve discharge recommendations.

### Patient Admission

- Admission requires an available room.
- Admission is blocked when the 74-patient capacity limit is reached.
- Only admitted patients can receive routine temperature readings or doctor visits.

### Temperature Monitoring

- Temperature readings must be between 30°C and 45°C.
- A unique patient/day check prevents duplicate routine temperature records.
- Routine temperature recording is limited to one reading per patient per day.

### Doctor Visits

- A doctor visit requires the patient's temperature to be recorded for that day.
- A patient can have only one doctor visit per day.
- Doctors document diagnosis and treatment notes during visits.

### Recovery Tracking

- Discharge eligibility requires three complete prior UTC calendar days with recorded temperatures below the fever threshold.
- Today's partial day does not count.
- A missed measurement does not count.
- A fever reading resets the consecutive recovery streak.

### Discharge Approval

- Only doctors can recommend eligible discharges.
- Only admins can approve discharge recommendations.
- Approval rechecks eligibility and room ownership.
- An admin account cannot approve a recommendation created by that same account.

### Room Management

- Discharge releases the assigned room.
- Recording a patient's death releases the assigned room.
- Nurses cannot discharge patients.

### Reports

Success rate:

`discharged / (discharged + deceased)`

Mortality rate:

`deceased / (discharged + deceased)`

Active patients are excluded from outcome calculations.

When there is no outcome history, the report displays `—`.

### Validation and Audit

- Failed validations return explicit API errors.
- Duplicate records are rejected.
- Authorization errors are returned for unauthorized actions.
- Ineligible workflow actions return visible UI messages.
- Actions are recorded in the audit log.

## Prototype Assumptions

### Fever Threshold

The fever threshold defaults to **38°C**.

It can be configured through the optional environment variable:

```text
FEVER_THRESHOLD_C
```

This threshold is a prototype assumption and is not medical guidance.

### Date Handling

Day boundaries use UTC.

### Storage

Local JSON files are intended for a single-user demonstration.

They are not a production database.

## Sprint Planning Answer (Q4)

Velocity is 25 points, and 15 points are already committed.

Remaining capacity:

**25 − 15 = 10 points**

Given:

- High priority = 6 relative value
- Medium priority = 3 relative value
- Low priority = 1 relative value

The selected combination is:

| Option | Priority | Effort | Relative Value |
|---|---|---:|---:|
| A | High | 1 | 6 |
| B | High | 3 | 6 |
| D | Medium | 2 | 3 |
| F | Medium | 1 | 3 |
| G | Low | 0.4 | 1 |
| H | Low | 0.5 | 1 |
| I | Low | 0.3 | 1 |
| J | Low | 0.1 | 1 |
| **Total** | | **8.3 / 10** | **22** |

This combination reaches the maximum weighted value of 22 with the least effort, leaving 1.7 points available.

## Deployment

### Frontend

The frontend is deployed on Vercel:

https://care-track-fact-wise-tpm-vstm.vercel.app

### Backend API

The backend is deployed on Vercel:

https://caretrack-backend.vercel.app/api

### Backend Health Check

https://caretrack-backend.vercel.app/api/health

The application is deployed for assessment and demonstration purposes.

The backend uses local JSON storage, and persistence in the deployed environment is not guaranteed.

## Validation

Run backend tests:

```powershell
npm test --prefix backend
```

Build the frontend:

```powershell
npm run build --prefix frontend
```

## Project Repository

GitHub:

https://github.com/Jyoti-52/CareTrack-FactWise-TPM

## Disclaimer

CareTrack is an assessment prototype for demonstration purposes.

The recovery tracking rules, fever threshold, and discharge workflow are application assumptions. They are not intended to replace professional medical judgment or clinical guidelines.
