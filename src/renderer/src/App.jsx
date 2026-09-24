import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, GraduationCap, FileSpreadsheet, IndianRupee, Wallet,
  BadgeCheck, FileSignature, MessageCircle, Settings2, Menu
} from "lucide-react";
import Dashboard from "./pages/Dashboard.jsx";
import Students from "./pages/Students.jsx";
import Staff from "./pages/Staff.jsx";
import Exams from "./pages/Exams.jsx";
import Fees from "./pages/Fees.jsx";
import Expenses from "./pages/Expenses.jsx";
import Certificates from "./pages/Certificates.jsx";
import WhatsApp from "./pages/WhatsApp.jsx";
import Letterhead from "./pages/Letterhead.jsx";
import Settings from "./pages/Settings.jsx";
import { DocViewer } from "./lib/ui.jsx";

const NAV = [
  ["dash", "Dashboard", LayoutDashboard],
  ["students", "Students", Users],
  ["staff", "Staff & Teachers", GraduationCap],
  ["exams", "Examinations", FileSpreadsheet],
  ["certs", "Certificates & TC", BadgeCheck],
  ["fees", "Fees", IndianRupee],
  ["expenses", "Expenses", Wallet],
  ["letterhead", "Letter Pad", FileSignature],
  ["whatsapp", "WhatsApp", MessageCircle],
  ["settings", "Settings", Settings2],
];

export default function App() {
  const [view, setView] = useState("dash");
  const [school, setSchool] = useState(null);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [dash, setDash] = useState(null);
  const [doc, setDoc] = useState(null);
  const [open, setOpen] = useState(false);

  const reloadStudents = async () => setStudents(await window.api.students.list());
  const reloadStaff = async () => setStaff(await window.api.staff.list());
  const reloadDash = async () => setDash(await window.api.dashboard());
  const reloadAll = async () => { await reloadStudents(); await reloadStaff(); await reloadDash(); };

  useEffect(() => {
    window.api.settings.get().then(setSchool);
    reloadAll();
  }, []);

  // refresh dashboard whenever we land on it
  useEffect(() => { if (view === "dash") reloadDash(); }, [view]);

  const openDoc = (html, fileName) => setDoc({ html, fileName });

  if (!school) return <div style={{ padding: 40, fontFamily: "Inter" }}>Opening Sunrise Montessori ERP…</div>;

  const pages = {
    dash: <Dashboard data={dash} go={setView} />,
    students: <Students students={students} reload={reloadAll} />,
    staff: <Staff staff={staff} reload={reloadStaff} school={school} openDoc={openDoc} />,
    exams: <Exams students={students} school={school} openDoc={openDoc} />,
    certs: <Certificates students={students} school={school} openDoc={openDoc} reload={reloadAll} />,
    fees: <Fees students={students} school={school} openDoc={openDoc} />,
    expenses: <Expenses />,
    letterhead: <Letterhead school={school} openDoc={openDoc} />,
    whatsapp: <WhatsApp students={students} staff={staff} school={school} />,
    settings: <Settings school={school} setSchool={setSchool} />,
  };

  const current = NAV.find((n) => n[0] === view);

  return (
    <div className="app">
      <aside className={"side" + (open ? " open" : "")}>
        <div className="brand">
          <div className="mono">{school.initials}</div>
          <div>
            <div className="serif" style={{ color: "#fff", fontSize: 15, lineHeight: 1.15 }}>{school.name}</div>
            <div style={{ fontSize: 10, color: "#8b93a4", letterSpacing: ".08em", textTransform: "uppercase" }}>School office</div>
          </div>
        </div>
        {NAV.map(([k, label, Icon]) => (
          <button key={k} className={"navitem" + (view === k ? " on" : "")}
            onClick={() => { setView(k); setOpen(false); }}>
            <Icon size={15} /> {label}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: "16px 18px", fontSize: 10, color: "#5c657a", lineHeight: 1.5 }}>
          Session {school.session}<br />Data saved locally on this computer.
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-ghost btn-sm" style={{ display: "none" }} onClick={() => setOpen(!open)}><Menu size={14} /></button>
            <div>
              <div className="eyebrow">{current[1]}</div>
              <div className="serif" style={{ fontSize: 15 }}>{school.name} · {school.session}</div>
            </div>
          </div>
        </div>
        <div className="content">{pages[view]}</div>
      </div>

      {doc && <DocViewer html={doc.html} fileName={doc.fileName} onClose={() => setDoc(null)} />}
    </div>
  );
}