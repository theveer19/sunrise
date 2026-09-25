import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard, Users, GraduationCap, FileSpreadsheet, IndianRupee, Wallet,
  BadgeCheck, FileSignature, MessageCircle, Settings2, Menu, CalendarCheck, CalendarDays,
  Clock3, IdCard, Library, Bus, BedDouble, Megaphone, Banknote, BarChart3, Moon, Sun, Search, X,
  GraduationCap as GradCap, UserCircle2
} from "lucide-react";
import Dashboard from "./pages/Dashboard.jsx";
import Students from "./pages/Students.jsx";
import Staff from "./pages/Staff.jsx";
import Attendance from "./pages/Attendance.jsx";
import Timetable from "./pages/Timetable.jsx";
import Exams from "./pages/Exams.jsx";
import Certificates from "./pages/Certificates.jsx";
import IdCards from "./pages/IdCards.jsx";
import Fees from "./pages/Fees.jsx";
import Expenses from "./pages/Expenses.jsx";
import Payroll from "./pages/Payroll.jsx";
import LibraryPage from "./pages/LibraryPage.jsx";
import Transport from "./pages/Transport.jsx";
import Hostel from "./pages/Hostel.jsx";
import Communication from "./pages/Communication.jsx";
import Reports from "./pages/Reports.jsx";
import Letterhead from "./pages/Letterhead.jsx";
import WhatsApp from "./pages/WhatsApp.jsx";
import Settings from "./pages/Settings.jsx";
import StudentLogin from "./pages/StudentLogin.jsx";
import StudentPortal from "./pages/StudentPortal.jsx";
import { DocViewer, ToastHost, ConfirmHost } from "./lib/ui.jsx";
import { today } from "./lib/helpers";

/* nav: [key, label, icon, group] */
const NAV = [
  ["dash", "Dashboard", LayoutDashboard, "Overview"],
  ["students", "Students", Users, "People"],
  ["staff", "Staff & Teachers", GraduationCap, "People"],
  ["attendance", "Attendance", CalendarCheck, "Academics"],
  ["timetable", "Timetable", Clock3, "Academics"],
  ["exams", "Examinations", FileSpreadsheet, "Academics"],
  ["certs", "Certificates & TC", BadgeCheck, "Academics"],
  ["idcards", "ID Cards", IdCard, "Academics"],
  ["fees", "Fees", IndianRupee, "Accounts"],
  ["expenses", "Expenses", Wallet, "Accounts"],
  ["payroll", "Payroll", Banknote, "Accounts"],
  ["library", "Library", Library, "Facilities"],
  ["transport", "Transport", Bus, "Facilities"],
  ["hostel", "Hostel", BedDouble, "Facilities"],
  ["comms", "Notices & Events", Megaphone, "Communication"],
  ["whatsapp", "WhatsApp", MessageCircle, "Communication"],
  ["letterhead", "Letter Pad", FileSignature, "Communication"],
  ["reports", "Reports", BarChart3, "Office"],
  ["settings", "Settings", Settings2, "Office"],
];

const THEME_KEY = "sunrise-erp-theme";

export default function App() {
  return (
    <ToastHost>
      <ConfirmHost>
        <Shell />
      </ConfirmHost>
    </ToastHost>
  );
}

function Shell() {
  const [view, setView] = useState("dash");
  const [school, setSchool] = useState(null);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [dash, setDash] = useState(null);
  const [doc, setDoc] = useState(null);
  const [open, setOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [palette, setPalette] = useState(false);
  // null = school office (no login, as configured), otherwise the signed-in student
  const [portal, setPortal] = useState(null);   // "login" | { student }

  const [theme, setTheme] = useState(() => {
    try { return window.localStorage.getItem(THEME_KEY) || "light"; } catch { return "light"; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { window.localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const reloadStudents = async () => setStudents(await window.api.students.list());
  const reloadStaff = async () => setStaff(await window.api.staff.list());
  const reloadDash = async () => setDash(await window.api.dashboard());
  const reloadAll = useCallback(async () => {
    await Promise.all([reloadStudents(), reloadStaff(), reloadDash()]);
  }, []);

  useEffect(() => {
    window.api.settings.get().then(setSchool).catch((err) => setLoadError(String(err?.message || err)));
    reloadAll().catch((err) => setLoadError(String(err?.message || err)));
  }, [reloadAll]);

  useEffect(() => { if (view === "dash") reloadDash(); }, [view]);

  // Ctrl/Cmd+K opens the global search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openDoc = useCallback((html, fileName) => setDoc({ html, fileName }), []);
  const isWeb = window.api?.platform === "web";

  if (loadError) {
    return (
      <div style={{ padding: 40, fontFamily: "Inter", color: "var(--danger)" }}>
        Could not open the school database: {loadError}
      </div>
    );
  }
  if (!school) {
    return <div style={{ padding: 40, fontFamily: "Inter" }}>Opening {"“"}Sunrise Montessori ERP{"”"}…</div>;
  }

  if (portal === "login") {
    // the earliest-admitted active student has the fullest demo record (marks, fees, library)
    const demo = [...students]
      .filter((s) => s.status === "Active" && s.adm_no && s.dob)
      .sort((a, b) => a.id - b.id)[0];
    return (
      <>
        <StudentLogin school={school} onBack={() => setPortal(null)}
          onSuccess={(student) => setPortal({ student })}
          demoHint={demo ? { adm_no: demo.adm_no, password: demo.dob.split("-").reverse().join("") } : null} />
        {doc && <DocViewer html={doc.html} fileName={doc.fileName} onClose={() => setDoc(null)} />}
      </>
    );
  }

  if (portal?.student) {
    return (
      <>
        <StudentPortal student={portal.student} school={school} openDoc={openDoc}
          theme={theme} setTheme={setTheme} onSignOut={() => setPortal(null)} />
        {doc && <DocViewer html={doc.html} fileName={doc.fileName} onClose={() => setDoc(null)} />}
      </>
    );
  }

  const shared = { school, students, staff, openDoc, reload: reloadAll, go: setView };
  const pages = {
    dash: <Dashboard data={dash} students={students} staff={staff} go={setView} />,
    students: <Students students={students} reload={reloadAll} />,
    staff: <Staff staff={staff} reload={reloadStaff} school={school} openDoc={openDoc} />,
    attendance: <Attendance {...shared} />,
    timetable: <Timetable {...shared} />,
    exams: <Exams students={students} school={school} openDoc={openDoc} />,
    certs: <Certificates students={students} school={school} openDoc={openDoc} reload={reloadAll} />,
    idcards: <IdCards {...shared} />,
    fees: <Fees students={students} school={school} openDoc={openDoc} />,
    expenses: <Expenses />,
    payroll: <Payroll {...shared} />,
    library: <LibraryPage {...shared} />,
    transport: <Transport {...shared} />,
    hostel: <Hostel {...shared} />,
    comms: <Communication {...shared} />,
    reports: <Reports {...shared} />,
    letterhead: <Letterhead school={school} openDoc={openDoc} />,
    whatsapp: <WhatsApp students={students} staff={staff} school={school} />,
    settings: <Settings school={school} setSchool={setSchool} />,
  };

  const current = NAV.find((n) => n[0] === view) || NAV[0];
  let lastGroup = "";

  return (
    <div className="app">
      <aside className={"side" + (open ? " open" : "")}>
        <div className="brand">
          <div className="mono">{school.initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="serif" style={{ color: "#fff", fontSize: 14.5, lineHeight: 1.2 }}>{school.name}</div>
            <div style={{ fontSize: 10, color: "#8b93a4", letterSpacing: ".08em", textTransform: "uppercase" }}>
              School office
            </div>
          </div>
        </div>

        {NAV.map(([k, label, Icon, group]) => {
          const header = group !== lastGroup ? group : null;
          lastGroup = group;
          return (
            <React.Fragment key={k}>
              {header && <div className="nav-group">{header}</div>}
              <button className={"navitem" + (view === k ? " on" : "")}
                onClick={() => { setView(k); setOpen(false); }}>
                <Icon size={15} /> {label}
              </button>
            </React.Fragment>
          );
        })}

        <div className="side-foot">
          Session {school.session}<br />
          {isWeb ? "Demo version — data is saved in this browser." : "Data saved locally on this computer."}
          {isWeb && <ResetDemo />}
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <button className="btn btn-ghost btn-sm menu-btn" aria-label="Open menu" onClick={() => setOpen(!open)}>
              <Menu size={14} />
            </button>
            <div className="tb-title" style={{ minWidth: 0 }}>
              <div className="eyebrow">{current[3]}</div>
              <div className="serif" style={{ fontSize: 15 }}>{current[1]}</div>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="kbd-hint" onClick={() => setPalette(true)}>
              <Search size={13} /> Search <kbd>Ctrl</kbd><kbd>K</kbd>
            </button>
            <button className="btn btn-ghost btn-sm portal-btn" onClick={() => setPortal("login")}
              title="Open the student and parent portal">
              <UserCircle2 size={14} /> Student portal
            </button>
            <button className="btn btn-ghost btn-sm btn-icon" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle colour theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
        <div className="content">{pages[view]}</div>
      </div>

      {open && <div className="side-backdrop" onClick={() => setOpen(false)} />}
      {palette && (
        <CommandPalette students={students} staff={staff} nav={NAV}
          onClose={() => setPalette(false)} go={(v) => { setView(v); setPalette(false); }} />
      )}
      {doc && <DocViewer html={doc.html} fileName={doc.fileName} onClose={() => setDoc(null)} />}
    </div>
  );
}

function ResetDemo() {
  const reset = async () => {
    if (!window.confirm("Reset all demo data back to the original sample records?")) return;
    await window.api.resetDemo();
    window.location.reload();
  };
  return <button onClick={reset}>Reset demo data</button>;
}

/* ==================================================================== */
/*  Global search (Ctrl+K) — students, staff and every screen           */
/* ==================================================================== */
function CommandPalette({ students, staff, nav, onClose, go }) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = React.useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const pages = nav
      .filter(([, label, , group]) => !term || (label + " " + group).toLowerCase().includes(term))
      .map(([k, label, Icon, group]) => ({ kind: "Screen", title: label, sub: group, Icon, action: () => go(k) }));
    if (!term) return pages;

    const match = (v) => String(v ?? "").toLowerCase().includes(term);
    const st = students
      .filter((s) => match(s.name) || match(s.adm_no) || match(s.father) || match(s.phone) || match(s.pen_no))
      .slice(0, 6)
      .map((s) => ({
        kind: "Student", title: s.name, sub: `Class ${s.class}-${s.section} · Adm ${s.adm_no || "—"}`,
        Icon: Users, action: () => go("students")
      }));
    const tf = staff
      .filter((s) => match(s.name) || match(s.emp_id) || match(s.designation) || match(s.phone))
      .slice(0, 4)
      .map((s) => ({
        kind: "Staff", title: s.name, sub: `${s.designation || "Staff"} · ${s.emp_id || "—"}`,
        Icon: GraduationCap, action: () => go("staff")
      }));
    return [...pages.slice(0, 5), ...st, ...tf];
  }, [q, students, staff, nav, go]);

  useEffect(() => { setCursor(0); }, [q]);

  const onKey = (e) => {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(results.length - 1, c + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    if (e.key === "Enter") { e.preventDefault(); results[cursor]?.action(); }
  };

  return (
    <div className="overlay" style={{ alignItems: "flex-start", paddingTop: "12vh", zIndex: 100 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette">
        <div className="palette-input">
          <Search size={17} style={{ color: "var(--slate)" }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Search students, staff or jump to a screen…" aria-label="Global search" />
          <button className="searchbox-clear" style={{ position: "static" }} onClick={onClose} aria-label="Close search">
            <X size={14} />
          </button>
        </div>
        <div className="palette-list">
          {results.length === 0 && (
            <p style={{ padding: 22, textAlign: "center", color: "var(--slate)", fontSize: 13, margin: 0 }}>
              Nothing matches {"“"}{q}{"”"}.
            </p>
          )}
          {results.map((r, i) => (
            <button key={r.kind + r.title + i} className={"palette-item" + (i === cursor ? " on" : "")}
              onMouseEnter={() => setCursor(i)} onClick={r.action}>
              <r.Icon size={15} style={{ color: "var(--slate)", flex: "0 0 auto" }} />
              <span className="pi-main">
                <span className="pi-title">{r.title}</span>
                <span className="pi-sub">{r.sub}</span>
              </span>
              <span className="pi-kind">{r.kind}</span>
            </button>
          ))}
        </div>
        <div className="palette-foot">
          <span>↑↓ to move</span><span>↵ to open</span><span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
