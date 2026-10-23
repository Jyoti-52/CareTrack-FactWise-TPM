import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { AppShell, Loading } from "./components";
import { DashboardPage, DischargesPage, LoginPage, PatientDetailPage, PatientsPage, RecoveryPage, RegisterPatientPage, ReportsPage, RoomsPage, TemperaturePage, VisitsPage } from "./pages";
import "./styles.css";

function ProtectedLayout() {
  const { user } = useAuth();
  return user ? <AppShell><Routes>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/patients" element={<PatientsPage />} />
    <Route path="/patients/new" element={user.role === "admin" ? <RegisterPatientPage /> : <Navigate to="/patients" replace />} />
    <Route path="/patients/:id" element={<PatientDetailPage />} />
    <Route path="/temperatures" element={<TemperaturePage />} />
    <Route path="/visits" element={user.role === "doctor" || user.role === "admin" ? <VisitsPage /> : <Navigate to="/" replace />} />
    <Route path="/recovery" element={<RecoveryPage />} />
    <Route path="/discharges" element={user.role === "doctor" || user.role === "admin" ? <DischargesPage /> : <Navigate to="/" replace />} />
    <Route path="/rooms" element={user.role === "admin" ? <RoomsPage /> : <Navigate to="/" replace />} />
    <Route path="/reports" element={user.role === "admin" ? <ReportsPage /> : <Navigate to="/" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AppShell> : <Navigate to="/login" replace />;
}

function App() {
  return <AuthProvider><BrowserRouter><Routes><Route path="/login" element={<LoginRoute />} /><Route path="/*" element={<ProtectedLayout />} /></Routes></BrowserRouter></AuthProvider>;
}
function LoginRoute() { const { user } = useAuth(); return user ? <Navigate to="/" replace /> : <LoginPage />; }

ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
