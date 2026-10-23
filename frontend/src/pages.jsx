import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, jsonRequest } from "./api";
import { useAuth } from "./auth";
import { EmptyState, Loading, Notice, PageTitle } from "./components";
import { Activity, ArrowDownRight, ArrowUpRight, BedDouble, Check, ChevronRight, ClipboardCheck, Clock3, HeartPulse, Plus, Thermometer, Users } from "lucide-react";

const roleNames = { admin: "Facility overview", nurse: "Nursing overview", doctor: "Clinical overview" };
const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const temp = (value) => `${Number(value).toFixed(1)}°C`;

export function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); setError("");
    try { await login(form.email, form.password); navigate("/", { replace: true }); }
    catch (e) { setError(e.message); }
  }
  return <div className="login-layout">
    <div className="login-art"><div className="login-brand"><span className="brand-mark"><HeartPulse size={23} /></span><span>caretrack</span></div><div className="login-message"><div className="live-kicker"><span className="live-dot" /> FACILITY OPERATIONS</div><h1>Every check-in.<br />Every vital sign.<br /><em>One clear picture.</em></h1><p>Coordinate quarantine care with confidence, from admission through recovery.</p><div className="login-stat-row"><div><b>74</b><span>patient rooms</span></div><div><b>24/7</b><span>care coordination</span></div></div></div><div className="login-foot">CARE THAT CONNECTS.</div></div>
    <div className="login-form-wrap"><form className="login-card" onSubmit={submit}><div className="eyebrow">WELCOME BACK</div><h2>Sign in to CareTrack</h2><p>Use your facility account to continue.</p>{error && <Notice notice={{ message: error }} />}
      <label>Email address<input type="email" autoComplete="username" required placeholder="you@caretrack.demo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label>Password<input type="password" autoComplete="current-password" required placeholder="Enter your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
      <button className="btn btn-primary btn-full" disabled={loading}>{loading ? <><span className="spinner spinner-white" /> Signing in…</> : "Sign in securely"}</button>
      <div className="demo-note"><b>Demo accounts</b><span>Admin, nurse and doctor credentials are in the project README.</span></div>
    </form></div>
  </div>;
}

function MetricCard({ label, value, icon: Icon, tone = "teal", hint, trend }) {
  return <div className="metric-card"><div className={`metric-icon metric-${tone}`}><Icon size={19} /></div><div className="metric-label">{label}</div><div className="metric-value">{value ?? "—"}</div><div className="metric-hint">{trend && <span className="trend"><ArrowUpRight size={13} />{trend}</span>}{hint}</div></div>;
}

function ProgressBar({ value, color = "teal" }) {
  const width = Math.max(0, Math.min(100, Number(value) || 0));
  return <div className="progress-track"><span className={`progress-fill progress-${color}`} style={{ width: `${width}%` }} /></div>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/dashboard").then(setData).catch((e) => setError(e.message)); }, []);
  if (error) return <><PageTitle eyebrow="CARE OPERATIONS" title={roleNames[user.role]} /><Notice notice={{ message: error }} /></>;
  if (!data) return <Loading />;
  const m = data.metrics;
  const capacity = m.admitted + m.discharged + m.deceased;
  const roomUsage = Math.round((m.occupiedRooms / 74) * 100);
  return <div>
    <PageTitle eyebrow="CARE OPERATIONS" title={roleNames[user.role]} description={`A live view of today's patient care · ${data.date}`} action={<span className="live-badge"><span className="live-dot" /> Live facility data</span>} />
    <div className="metric-grid">
      <MetricCard label="Admitted patients" value={m.admitted} icon={Users} hint={`${capacity} patients seen to date`} />
      <MetricCard label="Occupied rooms" value={`${m.occupiedRooms} / 74`} icon={BedDouble} tone="blue" hint={`${m.availableRooms} rooms available`} />
      <MetricCard label="Awaiting temperature" value={m.awaitingTemperature} icon={Thermometer} tone={m.awaitingTemperature ? "amber" : "teal"} hint="Daily round · today" />
      <MetricCard label="Awaiting doctor visit" value={m.awaitingDoctorVisit} icon={Activity} tone={m.awaitingDoctorVisit ? "amber" : "teal"} hint="Temperature review required" />
    </div>
    <div className="dashboard-grid">
      <section className="panel occupancy-panel"><div className="panel-heading"><div><div className="eyebrow">FACILITY CAPACITY</div><h2>Room occupancy</h2></div><Link to="/rooms" className="text-link">View rooms <ChevronRight size={15} /></Link></div><div className="occupancy-figure"><div><b>{m.occupiedRooms}</b><span>of 74 rooms occupied</span></div><div className="occupancy-percent">{roomUsage}%</div></div><ProgressBar value={roomUsage} /><div className="occupancy-footer"><span><i className="legend-dot occupied-dot" /> Occupied <b>{m.occupiedRooms}</b></span><span><i className="legend-dot available-dot" /> Available <b>{m.availableRooms}</b></span></div></section>
      <section className="panel outcomes-panel"><div className="panel-heading"><div><div className="eyebrow">ACTUAL PATIENT OUTCOMES</div><h2>Outcome monitoring</h2></div><span className="benchmark-pill">Benchmarks: 85% / 15%</span></div><div className="outcome-line"><div><span className="outcome-dot success-dot" /> Treatment success</div><b>{m.treatmentSuccessRate === null ? "—" : `${m.treatmentSuccessRate}%`}</b></div><ProgressBar value={m.treatmentSuccessRate || 0} color="green" /><div className="outcome-line second"><div><span className="outcome-dot mortality-dot" /> Mortality</div><b>{m.mortalityRate === null ? "—" : `${m.mortalityRate}%`}</b></div><ProgressBar value={m.mortalityRate || 0} color="red" /><div className="outcome-caption">Based on {m.resolvedOutcomes} actual resolved outcomes (discharges + deaths). No outcome data yet is shown as —.</div></section>
    </div>
    <section className="panel daily-panel"><div className="panel-heading"><div><div className="eyebrow">TODAY'S WORKLIST</div><h2>Care completion</h2></div><span className="date-chip"><Clock3 size={14} />{data.date}</span></div><div className="worklist-grid"><Worklist icon={Thermometer} title="Temperature rounds" count={m.awaitingTemperature} complete={m.admitted - m.awaitingTemperature} total={m.admitted} to="/temperatures" action="Open rounds" /><Worklist icon={Activity} title="Doctor visits" count={m.awaitingDoctorVisit} complete={m.admitted - m.awaitingDoctorVisit} total={m.admitted} to="/visits" action="Review visits" /><Worklist icon={ClipboardCheck} title="Discharge approvals" count={m.awaitingDischargeApproval} complete={m.discharged} total={m.admitted + m.discharged} to="/discharges" action="Manage discharges" /></div></section>
    <div className="bottom-grid"><section className="panel list-panel"><div className="panel-heading"><div><div className="eyebrow">NURSING QUEUE</div><h2>Awaiting temperature</h2></div><Link to="/temperatures" className="text-link">See all <ChevronRight size={15} /></Link></div><PatientQueue patients={data.patientsAwaitingTemperature} empty="All patients have today's measurement." /></section><section className="panel list-panel"><div className="panel-heading"><div><div className="eyebrow">DISCHARGE REVIEW</div><h2>Pending approval</h2></div><Link to="/discharges" className="text-link">Review <ChevronRight size={15} /></Link></div><PatientQueue patients={data.pendingDischarges.map((item) => ({ ...item.patient, extra: `Recommended by ${item.recommendedBy?.name || "doctor"}`, id: item._id }))} empty="No recommendations awaiting approval." /></section></div>
  </div>;
}

function Worklist({ icon: Icon, title, count, complete, total, to, action }) {
  return <div className="worklist-card"><div className="worklist-top"><span className="worklist-icon"><Icon size={17} /></span><span className={`worklist-count ${count ? "count-pending" : "count-done"}`}>{count ? `${count} pending` : "Complete"}</span></div><h3>{title}</h3><p>{complete} of {total} completed</p><ProgressBar value={total ? complete / total * 100 : 0} /><Link to={to} className="worklist-link">{action} <ChevronRight size={14} /></Link></div>;
}

function PatientQueue({ patients = [], empty }) {
  return patients.length ? <div className="queue-list">{patients.slice(0, 4).map((patient) => <Link to={`/patients/${patient._id}`} key={patient._id || patient.id} className="queue-item"><div className="patient-mini-avatar">{patient.name?.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div><div className="queue-copy"><b>{patient.name}</b><span>{patient.patientId} · Room {patient.room?.number || "—"}{patient.extra ? ` · ${patient.extra}` : ""}</span></div><ChevronRight size={15} /></Link>)}</div> : <EmptyState>{empty}</EmptyState>;
}

export function PatientsPage() {
  const [patients, setPatients] = useState(null);
  const [status, setStatus] = useState("admitted");
  const [error, setError] = useState("");
  const { user } = useAuth();
  useEffect(() => { setPatients(null); api(`/patients${status ? `?status=${status}` : ""}`).then((res) => setPatients(res.patients)).catch((e) => setError(e.message)); }, [status]);
  return <><PageTitle eyebrow="PATIENT DIRECTORY" title="Patients" description="View admissions and follow patient care through discharge." action={user.role === "admin" && <Link className="btn btn-primary" to="/patients/new"><Plus size={16} /> Register patient</Link>} />
    <Notice notice={error && { message: error }} />
    <div className="filter-bar"><div className="filter-label">Patient status</div><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="admitted">Admitted</option><option value="discharged">Discharged</option><option value="deceased">Deceased</option><option value="">All patients</option></select><span className="filter-count">{patients?.length ?? "…"} records</span></div>
    <section className="panel table-panel">{!patients ? <Loading /> : patients.length ? <div className="table-scroll"><table><thead><tr><th>Patient</th><th>Patient ID</th><th>Room</th><th>Admitted</th><th>Diagnosis</th><th>Status</th><th /></tr></thead><tbody>{patients.map((p) => <tr key={p._id}><td><Link to={`/patients/${p._id}`} className="table-person"><span className="patient-mini-avatar">{p.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</span><b>{p.name}</b></Link></td><td>{p.patientId}</td><td>{p.room?.number || "—"}</td><td>{formatDate(p.admittedAt)}</td><td>{p.diagnosis || "—"}</td><td><StatusBadge status={p.status} /></td><td><Link to={`/patients/${p._id}`} className="table-arrow" aria-label={`Open ${p.name}`}><ChevronRight size={17} /></Link></td></tr>)}</tbody></table></div> : <EmptyState>No patients match this filter.</EmptyState>}</section>
  </>;
}

function StatusBadge({ status }) { return <span className={`status-badge status-${status}`}>{status === "admitted" ? "Admitted" : status === "discharged" ? "Discharged" : "Deceased"}</span>; }

export function RegisterPatientPage() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ patientId: "", name: "", age: "", sex: "Female", phone: "", diagnosis: "", roomId: "" });
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => { api("/rooms").then((result) => setRooms(result.rooms.filter((room) => room.status === "available"))).catch((e) => setNotice({ message: e.message })); }, []);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setNotice(null);
    try {
      const result = await api("/patients", jsonRequest("POST", { ...form, age: Number(form.age) }));
      setNotice({ type: "success", message: `${result.patient.name} admitted to room ${result.patient.room.number}.` });
      setTimeout(() => navigate(`/patients/${result.patient._id}`), 700);
    } catch (e) { setNotice({ message: e.message }); }
    finally { setBusy(false); }
  }
  return <><PageTitle eyebrow="PATIENT INTAKE" title="Register patient" description="Create an admission and reserve an available room." /><Notice notice={notice} />
    <form className="panel form-panel" onSubmit={submit}><div className="form-section-title"><span className="section-icon"><Users size={17} /></span><div><b>Patient information</b><small>Enter the details required for admission.</small></div></div>
      <div className="form-grid"><FormField label="Patient ID" required><input required maxLength="32" placeholder="e.g. CT-2026-001" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} /></FormField><FormField label="Full name" required><input required maxLength="120" placeholder="Patient's full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField><FormField label="Age" required><input type="number" min="0" max="125" required placeholder="Age in years" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></FormField><FormField label="Sex" required><select required value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}><option>Female</option><option>Male</option><option>Other</option></select></FormField><FormField label="Contact number"><input type="tel" maxLength="30" placeholder="Optional" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField><FormField label="Room assignment" required><select required value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}><option value="">Select an available room</option>{rooms.map((room) => <option key={room._id} value={room._id}>{room.number}</option>)}</select>{rooms.length === 0 && <small className="field-hint">No available rooms or rooms are loading.</small>}</FormField><FormField label="Initial diagnosis" wide><textarea rows="3" maxLength="1000" placeholder="Enter initial diagnosis or reason for admission" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></FormField></div>
      <div className="form-footer"><span><BedDouble size={15} />{rooms.length} available room{rooms.length === 1 ? "" : "s"} · 74-room capacity</span><button className="btn btn-primary" disabled={busy || !rooms.length}>{busy ? <><span className="spinner spinner-white" /> Saving…</> : <><Plus size={16} /> Admit patient</>}</button></div>
    </form></>;
}

function FormField({ label, required, wide, children }) { return <label className={`form-field ${wide ? "field-wide" : ""}`}>{label}{required && <span className="required-mark"> *</span>}{children}</label>; }

export function PatientDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const refresh = useCallback(() => api(`/patients/${id}`).then(setData).catch((e) => setError(e.message)), [id]);
  useEffect(() => { refresh(); }, [refresh]);
  async function markDeath() {
    if (!window.confirm("Record this patient as deceased? This releases the assigned room and updates outcome statistics.")) return;
    setBusy(true);
    try { await api(`/patients/${id}/death`, { method: "POST" }); navigate("/patients"); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  if (error && !data) return <><PageTitle eyebrow="PATIENT RECORD" title="Patient details" /><Notice notice={{ message: error }} /></>;
  if (!data) return <Loading />;
  const { patient, temperatures, visits, recovery } = data;
  return <><PageTitle eyebrow={`PATIENT RECORD · ${patient.patientId}`} title={patient.name} description={`Room ${patient.room?.number || "—"} · Admitted ${formatDate(patient.admittedAt)}`} action={<Link to="/patients" className="btn btn-secondary">Back to patients</Link>} />
    <Notice notice={error && { message: error }} />
    <div className="detail-grid"><section className="panel detail-summary"><div className="detail-avatar">{patient.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div><div className="detail-name"><h2>{patient.name}</h2><StatusBadge status={patient.status} /><p>{patient.age} years · {patient.sex} · {patient.patientId}</p></div><div className="detail-fields"><DetailField label="Assigned room" value={patient.room?.number || "—"} /><DetailField label="Contact" value={patient.phone || "Not provided"} /><DetailField label="Diagnosis" value={patient.diagnosis || "Not recorded"} /><DetailField label="Admitted" value={formatDate(patient.admittedAt)} /></div>{patient.status === "admitted" && <div className="detail-actions">{user.role === "nurse" && <Link className="btn btn-primary" to="/temperatures"><Thermometer size={16} /> Record temperature</Link>}{user.role === "doctor" && <Link className="btn btn-primary" to="/visits"><Activity size={16} /> Record doctor visit</Link>}{user.role === "admin" && <button className="btn btn-danger-outline" onClick={markDeath} disabled={busy}>{busy ? "Saving…" : "Record death"}</button>}</div>}</section>
      <section className="panel recovery-panel"><div className="panel-heading"><div><div className="eyebrow">DISCHARGE READINESS</div><h2>Recovery tracking</h2></div><span className={`readiness-tag ${recovery.eligible ? "ready" : ""}`}>{recovery.eligible ? "Eligible" : "In progress"}</span></div><div className="streak-count"><b>{recovery.consecutiveFeverFreeDays}</b><span>of 3 full fever-free days</span></div><div className="streak-days">{[2, 1, 0].map((day) => { const key = recovery.feverFreeDays[day]; return <div key={day} className={`streak-day ${key ? "day-complete" : ""}`}><span>{day === 0 ? "Yesterday" : `${day + 1} days ago`}</span><b>{key ? <><Check size={15} /> Fever-free</> : "No qualifying record"}</b></div>; })}</div><p className="microcopy">Only complete prior UTC calendar days count. Missing or fever-range readings break the streak.</p>{user.role === "doctor" && recovery.eligible && <Link to="/discharges" className="btn btn-primary btn-full">Recommend discharge</Link>}</section></div>
    <div className="history-grid"><HistoryPanel title="Temperature history" icon={Thermometer} empty="No temperatures recorded yet." headers={["Date", "Reading", "Recorded by"]}>{temperatures.slice(0, 8).map((record) => <tr key={record._id}><td>{formatDate(record.measuredAt)}</td><td><span className={record.celsius >= recovery.thresholdC ? "fever-reading" : ""}>{temp(record.celsius)}</span></td><td>{record.recordedBy?.name || "—"}</td></tr>)}</HistoryPanel><HistoryPanel title="Doctor visits" icon={Activity} empty="No visits recorded yet." headers={["Date", "Diagnosis", "Doctor"]}>{visits.slice(0, 8).map((visit) => <tr key={visit._id}><td>{formatDate(visit.visitedAt)}</td><td>{visit.diagnosis || visit.treatmentNotes || "Clinical review"}</td><td>{visit.recordedBy?.name || "—"}</td></tr>)}</HistoryPanel></div>
  </>;
}

function DetailField({ label, value }) { return <div><span>{label}</span><b>{value}</b></div>; }
function HistoryPanel({ title, icon: Icon, empty, headers, children }) { return <section className="panel history-panel"><div className="panel-heading"><div className="history-title"><span className="section-icon"><Icon size={16} /></span><h2>{title}</h2></div></div>{children.length ? <div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div> : <EmptyState>{empty}</EmptyState>}</section>; }

export function TemperaturePage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ patientId: "", celsius: "", notes: "" });
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [thresholdC, setThresholdC] = useState(38);
  async function refresh() {
    setLoading(true);
    try {
      const [patientResult, recordResult] = await Promise.all([api("/patients?status=admitted"), api("/temperatures/today")]);
      setPatients(patientResult.patients); setRecords(recordResult.records); setThresholdC(recordResult.thresholdC);
    } catch (e) { setNotice({ message: e.message }); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  const done = new Set(records.map((record) => String(record.patient?._id || record.patient)));
  const pending = patients.filter((patient) => !done.has(String(patient._id)));
  async function submit(event) {
    event.preventDefault(); setBusy(true); setNotice(null);
    try { const result = await api("/temperatures", jsonRequest("POST", form)); setNotice({ type: "success", message: `${result.record.celsius.toFixed(1)}°C measurement saved.` }); setForm({ patientId: "", celsius: "", notes: "" }); await refresh(); }
    catch (e) { setNotice({ message: e.message }); }
    finally { setBusy(false); }
  }
  return <><PageTitle eyebrow="DAILY NURSING ROUND" title="Temperature rounds" description={`Record one routine temperature per admitted patient · ${new Date().toISOString().slice(0, 10)}`} action={<span className="threshold-pill"><Thermometer size={15} /> Fever threshold: {thresholdC}°C</span>} /><Notice notice={notice} />
    <div className="round-summary"><div className="round-progress"><div><b>{records.length}</b><span>measured today</span></div><div className="round-separator" /><div><b>{pending.length}</b><span>awaiting measurement</span></div></div><ProgressBar value={patients.length ? records.length / patients.length * 100 : 0} /><div className="round-caption">{patients.length ? `${Math.round(records.length / patients.length * 100)}% of admitted patients measured` : "No admitted patients"}</div></div>
    <div className="round-layout"><section className="panel form-panel compact-form"><div className="panel-heading"><div><div className="eyebrow">NEW MEASUREMENT</div><h2>Record temperature</h2></div><span className="section-icon"><Thermometer size={17} /></span></div><Notice notice={user.role !== "nurse" ? { type: "info", message: "Temperature entry is restricted to nurses. You can review today's measurements here." } : null} />
      {user.role === "nurse" && <form onSubmit={submit}><FormField label="Patient" required><select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Choose an awaiting patient</option>{pending.map((patient) => <option key={patient._id} value={patient._id}>{patient.name} · {patient.patientId} · {patient.room?.number}</option>)}</select></FormField><FormField label="Temperature (°C)" required><input type="number" step="0.1" min="30" max="45" required placeholder="e.g. 37.2" value={form.celsius} onChange={(e) => setForm({ ...form, celsius: e.target.value })} /></FormField><FormField label="Notes"><textarea rows="3" maxLength="500" placeholder="Optional observations" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormField><div className="inline-warning"><Thermometer size={15} /> Measurements at or above {thresholdC}°C are flagged as fever.</div><button className="btn btn-primary btn-full" disabled={busy || !pending.length}>{busy ? "Saving…" : "Save measurement"}</button></form>}
    </section><section className="panel rounds-panel"><div className="panel-heading"><div><div className="eyebrow">COMPLETED TODAY</div><h2>Today's measurements</h2></div><span className="count-tag">{records.length}</span></div>{loading ? <Loading /> : records.length ? <div className="round-records">{records.map((record) => <Link to={`/patients/${record.patient?._id}`} key={record._id} className="round-record"><div className="patient-mini-avatar"><Thermometer size={15} /></div><div className="queue-copy"><b>{record.patient?.name || "Patient"}</b><span>{record.patient?.patientId} · Room {record.patient?.room?.number || "—"}</span></div><span className={`temperature-value ${record.celsius >= thresholdC ? "fever-reading" : ""}`}>{temp(record.celsius)}</span>{record.celsius >= thresholdC && <span className="fever-tag">FEVER</span>}</Link>)}</div> : <EmptyState>No temperature measurements recorded today.</EmptyState>}</section></div></>;
}

export function VisitsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [temperatures, setTemperatures] = useState([]);
  const [visits, setVisits] = useState([]);
  const [form, setForm] = useState({ patientId: "", diagnosis: "", treatmentNotes: "" });
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  async function refresh() {
    setLoading(true);
    try {
      const [p, t, v] = await Promise.all([api("/patients?status=admitted"), api("/temperatures/today"), api("/visits/today")]);
      setPatients(p.patients); setTemperatures(t.records); setVisits(v.visits);
    } catch (e) { setNotice({ message: e.message }); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  const tempByPatient = new Map(temperatures.map((record) => [String(record.patient?._id || record.patient), record]));
  const visited = new Set(visits.map((visit) => String(visit.patient?._id || visit.patient)));
  const ready = patients.filter((patient) => tempByPatient.has(String(patient._id)) && !visited.has(String(patient._id)));
  async function submit(event) {
    event.preventDefault(); setBusy(true); setNotice(null);
    try { await api("/visits", jsonRequest("POST", form)); setNotice({ type: "success", message: "Doctor visit recorded. Today's temperature was reviewed." }); setForm({ patientId: "", diagnosis: "", treatmentNotes: "" }); await refresh(); }
    catch (e) { setNotice({ message: e.message }); }
    finally { setBusy(false); }
  }
  return <><PageTitle eyebrow="CLINICAL ROUNDS" title="Doctor visits" description="Review today's temperature before documenting each patient visit." /><Notice notice={notice} /><div className="round-layout"><section className="panel form-panel compact-form"><div className="panel-heading"><div><div className="eyebrow">NEW CLINICAL VISIT</div><h2>Record doctor visit</h2></div><span className="section-icon"><Activity size={17} /></span></div>{user.role !== "doctor" ? <Notice notice={{ type: "info", message: "Only doctors can record clinical visits." }} /> : <form onSubmit={submit}><FormField label="Patient" required><select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select a patient with today's temperature</option>{ready.map((patient) => <option key={patient._id} value={patient._id}>{patient.name} · {temp(tempByPatient.get(String(patient._id)).celsius)} today</option>)}</select></FormField>{form.patientId && <div className="reviewed-temperature"><Check size={16} /> Today's temperature reviewed: <b>{temp(tempByPatient.get(form.patientId)?.celsius)}</b></div>}<FormField label="Diagnosis / assessment"><textarea rows="3" maxLength="1000" placeholder="Clinical assessment" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></FormField><FormField label="Treatment notes"><textarea rows="4" maxLength="2000" placeholder="Treatment plan, observations, follow-up" value={form.treatmentNotes} onChange={(e) => setForm({ ...form, treatmentNotes: e.target.value })} /></FormField><button className="btn btn-primary btn-full" disabled={busy || !ready.length}>{busy ? "Saving…" : "Save doctor visit"}</button></form>}</section><section className="panel rounds-panel"><div className="panel-heading"><div><div className="eyebrow">TODAY'S VISITS</div><h2>Visit completion</h2></div><span className="count-tag">{visits.length}</span></div><div className="visit-summary"><span>{visited.size} completed</span><span>{patients.length - visited.size} awaiting visit</span></div><ProgressBar value={patients.length ? visited.size / patients.length * 100 : 0} />{loading ? <Loading /> : visits.length ? <div className="round-records">{visits.map((visit) => <Link to={`/patients/${visit.patient?._id}`} key={visit._id} className="round-record"><span className="completed-icon"><Check size={16} /></span><div className="queue-copy"><b>{visit.patient?.name}</b><span>{visit.patient?.patientId} · {visit.diagnosis || "Clinical review"}</span></div><span className="temperature-value">{visit.recordedBy?.name || "Doctor"}</span></Link>)}</div> : <EmptyState>No visits recorded today.</EmptyState>}</section></div></>;
}

export function RecoveryPage() {
  const [patients, setPatients] = useState(null);
  const [notice, setNotice] = useState("");
  useEffect(() => { api("/patients/recovery").then((result) => setPatients(result.patients)).catch((e) => setNotice(e.message)); }, []);
  return <><PageTitle eyebrow="CLINICAL PROGRESS" title="Recovery tracking" description="Three full fever-free days are required before a doctor can recommend discharge." /><Notice notice={notice && { message: notice }} /><section className="panel table-panel">{!patients ? <Loading /> : patients.length ? <div className="table-scroll"><table><thead><tr><th>Patient</th><th>Room</th><th>Latest temperature</th><th>Fever-free streak</th><th>Discharge readiness</th><th /></tr></thead><tbody>{patients.map((patient) => <tr key={patient._id}><td><Link className="table-person" to={`/patients/${patient._id}`}><span className="patient-mini-avatar">{patient.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</span><b>{patient.name}</b></Link></td><td>{patient.room?.number}</td><td>{patient.lastTemp ? <span className={patient.lastTemp.isFever ? "fever-reading" : ""}>{temp(patient.lastTemp.celsius)} · {formatDate(patient.lastTemp.measuredAt)}</span> : <span className="muted">No reading</span>}</td><td><div className="streak-meter">{[0, 1, 2].map((day) => <i key={day} className={day < (patient.recovery?.consecutiveFeverFreeDays || 0) ? "streak-on" : ""} />)}<b>{patient.recovery?.consecutiveFeverFreeDays || 0}/3</b></div></td><td><span className={`readiness-tag ${patient.recovery?.eligible ? "ready" : ""}`}>{patient.recovery?.eligible ? "Eligible" : "In progress"}</span></td><td><Link to={`/patients/${patient._id}`} className="table-arrow"><ChevronRight size={17} /></Link></td></tr>)}</tbody></table></div> : <EmptyState>No admitted patients to track.</EmptyState>}</section></>;
}

export function DischargesPage() {
  const { user } = useAuth();
  const [discharges, setDischarges] = useState(null);
  const [eligible, setEligible] = useState([]);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState("");
  async function refresh() {
    try {
      const [d, p] = await Promise.all([api("/discharges"), api("/patients/recovery")]);
      setDischarges(d.discharges);
      setEligible(p.patients.filter((patient) => patient.recovery.eligible));
    } catch (e) { setNotice({ message: e.message }); }
  }
  useEffect(() => { refresh(); }, []);
  async function recommend(patientId) {
    setBusy(patientId); setNotice(null);
    try { await api("/discharges/recommend", jsonRequest("POST", { patientId })); setNotice({ type: "success", message: "Recommendation sent to an admin for approval." }); await refresh(); }
    catch (e) { setNotice({ message: e.message }); }
    finally { setBusy(""); }
  }
  async function approve(id) {
    setBusy(id); setNotice(null);
    try { await api(`/discharges/${id}/approve`, { method: "POST" }); setNotice({ type: "success", message: "Discharge approved. Patient room has been released." }); await refresh(); }
    catch (e) { setNotice({ message: e.message }); }
    finally { setBusy(""); }
  }
  return <><PageTitle eyebrow="DISCHARGE WORKFLOW" title="Discharge management" description="Doctors recommend eligible patients. An admin independently reviews and approves." /><Notice notice={notice} />
    {user.role === "doctor" && <section className="panel table-panel discharges-section"><div className="panel-heading section-heading"><div><div className="eyebrow">DOCTOR ACTION</div><h2>Eligible for recommendation</h2></div><span className="count-tag">{eligible.length}</span></div>{!discharges ? <Loading /> : eligible.length ? <div className="discharge-cards">{eligible.map((patient) => <div className="discharge-card" key={patient._id}><div><b>{patient.name}</b><span>{patient.patientId} · Room {patient.room?.number} · 3 fever-free days</span></div><button className="btn btn-primary" disabled={busy === patient._id} onClick={() => recommend(patient._id)}>{busy === patient._id ? "Sending…" : "Recommend discharge"}</button></div>)}</div> : <EmptyState>No patients currently meet the discharge criteria.</EmptyState>}</section>}
    <section className="panel table-panel discharges-section"><div className="panel-heading section-heading"><div><div className="eyebrow">{user.role === "admin" ? "ADMIN APPROVAL QUEUE" : "RECOMMENDATION STATUS"}</div><h2>Discharge recommendations</h2></div><span className="count-tag">{discharges?.filter((item) => item.status === "pending").length ?? "…" } pending</span></div>{!discharges ? <Loading /> : discharges.length ? <div className="table-scroll"><table><thead><tr><th>Patient</th><th>Room</th><th>Recommended by</th><th>Date</th><th>Fever-free days</th><th>Status</th>{user.role === "admin" && <th>Action</th>}</tr></thead><tbody>{discharges.map((item) => <tr key={item._id}><td><Link to={`/patients/${item.patient?._id}`} className="table-person"><b>{item.patient?.name}</b></Link></td><td>{item.patient?.room?.number || "—"}</td><td>{item.recommendedBy?.name || "—"}</td><td>{formatDate(item.recommendedAt)}</td><td>{item.feverFreeDays?.length || 0} days</td><td><span className={`status-badge ${item.status === "approved" ? "status-discharged" : "status-pending"}`}>{item.status === "approved" ? "Approved" : "Awaiting approval"}</span></td>{user.role === "admin" && <td>{item.status === "pending" && <button className="btn btn-primary btn-small" disabled={busy === item._id} onClick={() => approve(item._id)}>{busy === item._id ? "Approving…" : "Approve"}</button>}</td>}</tr>)}</tbody></table></div> : <EmptyState>No discharge recommendations yet.</EmptyState>}</section></>;
}

export function RoomsPage() {
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/rooms").then((res) => setRooms(res.rooms)).catch((e) => setError(e.message)); }, []);
  const occupied = rooms?.filter((room) => room.status === "occupied").length || 0;
  return <><PageTitle eyebrow="FACILITY CAPACITY" title="Room management" description="View all 74 patient rooms and their current assignments." action={<span className="capacity-chip"><BedDouble size={15} /> {occupied} / 74 occupied</span>} /><Notice notice={error && { message: error }} />{!rooms ? <Loading /> : <div className="room-grid">{rooms.map((room) => <div key={room._id} className={`room-card ${room.status}`}><div className="room-card-top"><BedDouble size={17} /><span className={`room-state ${room.status}`}>{room.status}</span></div><b>{room.number}</b>{room.patient ? <Link to={`/patients/${room.patient._id}`} className="room-patient"><span>{room.patient.name}</span><small>{room.patient.patientId}</small></Link> : <div className="room-empty">Ready for admission</div>}</div>)}</div>}</>;
}

export function ReportsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/dashboard").then(setData).catch((e) => setError(e.message)); }, []);
  if (error) return <><PageTitle eyebrow="FACILITY PERFORMANCE" title="Reports" /><Notice notice={{ message: error }} /></>;
  if (!data) return <Loading />;
  const m = data.metrics;
  return <><PageTitle eyebrow="FACILITY PERFORMANCE" title="Basic reports" description="Operational and clinical outcome measures from recorded patient data." action={<span className="date-chip"><Clock3 size={14} /> Updated {data.date}</span>} />
    <div className="report-grid"><MetricCard label="Treatment success rate" value={m.treatmentSuccessRate === null ? "—" : `${m.treatmentSuccessRate}%`} icon={HeartPulse} tone="green" hint="Target benchmark: 85%" /><MetricCard label="Mortality rate" value={m.mortalityRate === null ? "—" : `${m.mortalityRate}%`} icon={ArrowDownRight} tone="red" hint="Expected benchmark: 15%" /><MetricCard label="Completed outcomes" value={m.resolvedOutcomes} icon={ClipboardCheck} tone="blue" hint={`${m.discharged} discharged · ${m.deceased} deceased`} /><MetricCard label="Room utilization" value={`${Math.round(m.occupiedRooms / 74 * 100)}%`} icon={BedDouble} hint={`${m.availableRooms} of 74 rooms available`} /></div>
    <section className="panel report-panel"><div className="panel-heading"><div><div className="eyebrow">OUTCOME DEFINITIONS</div><h2>How to read these metrics</h2></div></div><div className="definition-grid"><div><b>Treatment success rate</b><p>Patients discharged alive ÷ all resolved outcomes (discharged + deceased). Active patients are excluded.</p></div><div><b>Mortality rate</b><p>Patients recorded deceased ÷ all resolved outcomes. This is actual facility data, not a forecast.</p></div><div><b>Benchmarks</b><p>The 85% success and 15% mortality values are expected reference targets from the assessment, not calculated results.</p></div></div></section></>;
}
