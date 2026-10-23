import { NavLink, useLocation } from "react-router-dom";
import {
  Activity, BedDouble, ClipboardCheck, ClipboardList, HeartPulse, LayoutDashboard,
  LogOut, Menu, Stethoscope, Thermometer, UserPlus, Users, X, ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "./auth";

const navigation = [
  { label: "Overview", path: "/", icon: LayoutDashboard, roles: ["admin", "nurse", "doctor"] },
  { label: "Patients", path: "/patients", icon: Users, roles: ["admin", "nurse", "doctor"] },
  { label: "Register patient", path: "/patients/new", icon: UserPlus, roles: ["admin"] },
  { label: "Temperature rounds", path: "/temperatures", icon: Thermometer, roles: ["admin", "nurse", "doctor"] },
  { label: "Doctor visits", path: "/visits", icon: Stethoscope, roles: ["admin", "doctor"] },
  { label: "Recovery tracking", path: "/recovery", icon: Activity, roles: ["admin", "doctor", "nurse"] },
  { label: "Discharge management", path: "/discharges", icon: ClipboardCheck, roles: ["admin", "doctor"] },
  { label: "Room management", path: "/rooms", icon: BedDouble, roles: ["admin"] },
  { label: "Reports", path: "/reports", icon: ClipboardList, roles: ["admin"] },
];

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const heading = navigation.find((item) => item.path === location.pathname)?.label || "Patient record";
  return (
    <div className="app-shell">
      {open && <button className="scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><HeartPulse size={21} /></span><span>caretrack<small>FACILITY OPERATIONS</small></span><button className="icon-btn mobile-close" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
        <div className="facility-chip"><span className="live-dot" /> Quarantine facility <span>74 rooms</span></div>
        <nav className="nav-list">
          <p className="nav-caption">WORKSPACE</p>
          {navigation.filter((item) => item.roles.includes(user.role)).map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === "/"} className={({ isActive }) => `nav-link ${isActive ? "nav-active" : ""}`} onClick={() => setOpen(false)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === "Temperature rounds" && <span className="nav-pulse" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="security-note"><ShieldCheck size={16} /><span>Role-secured workspace<br /><b>Clinical data protected</b></span></div>
          <div className="profile"><div className="avatar">{user.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div className="profile-copy"><b>{user.name}</b><span>{user.role}</span></div><button className="icon-btn" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button></div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar"><button className="icon-btn menu-toggle" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button><div className="crumb">CareTrack <span>/</span> <b>{heading}</b></div><div className="topbar-right"><span className="today-pill">{new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</span><div className="avatar small-avatar">{user.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div></div></header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}

export function PageTitle({ eyebrow, title, description, action }) {
  return <div className="page-title-row"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="title-action">{action}</div>}</div>;
}

export function Notice({ notice, onDismiss }) {
  if (!notice) return null;
  return <div className={`notice notice-${notice.type || "error"}`} role="status"><span>{notice.message}</span>{onDismiss && <button className="notice-close" onClick={onDismiss} aria-label="Dismiss">×</button>}</div>;
}

export function Loading({ label = "Loading facility data…" }) {
  return <div className="loading"><span className="spinner" />{label}</div>;
}

export function EmptyState({ children = "No records to show." }) {
  return <div className="empty-state">{children}</div>;
}
