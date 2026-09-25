import React, { useState, useEffect } from "react";
import { LogIn, Eye, EyeOff, Building2, UserCircle2, Moon, Sun } from "lucide-react";
import { useToast } from "../lib/ui.jsx";
import { ROLES, roleOf } from "../lib/roles";

const TABS = [
  ["staff", "School office", Building2],
  ["student", "Student / Parent", UserCircle2],
];

export default function Login({ school, onStaff, onStudent, theme, setTheme }) {
  const toast = useToast();
  const [tab, setTab] = useState("staff");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState({ staff: [], student: null });

  // build the demo credential list from whatever is actually in the database
  useEffect(() => {
    (async () => {
      const [staff, students] = await Promise.all([window.api.staff.list(), window.api.students.list()]);
      const pick = (role) => staff.find((s) => s.status === "Active" && s.password && roleOf(s) === role);
      const list = ["admin", "accounts", "teacher"].map(pick).filter(Boolean);
      const st = [...students].filter((s) => s.status === "Active" && s.adm_no && s.dob).sort((a, b) => a.id - b.id)[0];
      setDemo({
        staff: list.map((s) => ({ id: s.emp_id, password: s.password, label: `${ROLES[roleOf(s)].label} — ${s.name}` })),
        student: st ? { id: st.adm_no, password: st.dob.split("-").reverse().join(""), label: `Student — ${st.name}` } : null,
      });
    })();
  }, []);

  const switchTab = (t) => {
    setTab(t); setUser(""); setPassword(""); setError("");
  };

  const submit = async (ev) => {
    ev?.preventDefault();
    if (busy) return;
    setError(""); setBusy(true);
    const res = tab === "staff"
      ? await window.api.auth.staffLogin(user, password)
      : await window.api.auth.studentLogin(user, password);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    if (tab === "staff") {
      toast.ok(`Welcome, ${res.staff.name}.`);
      onStaff(res.staff);
    } else {
      toast.ok(`Welcome, ${res.student.name}.`);
      onStudent(res.student);
    }
  };

  const fill = (d) => { setUser(d.id); setPassword(d.password); setError(""); };
  const demoList = tab === "staff" ? demo.staff : (demo.student ? [demo.student] : []);

  return (
    <div className="login-wrap">
      <button className="login-theme btn btn-ghost btn-sm btn-icon" aria-label="Toggle colour theme"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      <div className="login-card">
        <div className="login-brand">
          <div className="login-mono">{school.initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="serif login-school">{school.name}</div>
            <div className="login-sub">{school.address}</div>
          </div>
        </div>

        <div className="login-tabs" role="tablist">
          {TABS.map(([k, label, Icon]) => (
            <button key={k} role="tab" aria-selected={tab === k}
              className={"login-tab" + (tab === k ? " on" : "")} onClick={() => switchTab(k)}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="login-body">
          <h1 className="serif login-title">
            {tab === "staff" ? "School office sign in" : "Student & parent sign in"}
          </h1>
          <p className="login-lead">
            {tab === "staff"
              ? "Sign in with your employee ID. What you can open depends on your designation on the staff register."
              : "Check attendance, results, fees, timetable and homework. Use the admission number printed on the student’s ID card."}
          </p>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 13 }}>
              <label className="lbl" htmlFor="user">
                {tab === "staff" ? "Employee ID" : "Admission number"}
              </label>
              <input id="user" className="inp" value={user} autoFocus autoComplete="username"
                placeholder={tab === "staff" ? "SMS-T01" : "2020/0142"}
                onChange={(e) => { setUser(e.target.value); setError(""); }} />
            </div>
            <div style={{ marginBottom: 6 }}>
              <label className="lbl" htmlFor="pw">Password</label>
              <div style={{ position: "relative" }}>
                <input id="pw" className="inp" type={show ? "text" : "password"} value={password}
                  autoComplete="current-password" placeholder={tab === "staff" ? "" : "DDMMYYYY"}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }} />
                <button type="button" className="pw-toggle" onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {tab === "student" && (
              <p className="hint" style={{ marginBottom: 16 }}>
                First time signing in? The password is the student{"’"}s date of birth written as
                DDMMYYYY — for 18 April 2012 that is 18042012.
              </p>
            )}
            {tab === "staff" && <div style={{ height: 10 }} />}

            {error && <div className="login-error" role="alert">{error}</div>}

            <button className="btn" type="submit" disabled={busy} style={{ width: "100%", padding: "11px 14px" }}>
              <LogIn size={15} /> {busy ? "Checking…" : "Sign in"}
            </button>
          </form>

          {demoList.length > 0 && (
            <div className="demo-box">
              <p className="eyebrow" style={{ margin: "0 0 7px" }}>Demo accounts — tap to fill</p>
              {demoList.map((d) => (
                <button key={d.id} className="demo-row" onClick={() => fill(d)}>
                  <span className="demo-label">{d.label}</span>
                  <span className="demo-cred">{d.id} · {d.password}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="login-foot">
          Trouble signing in? Call the school office on {school.phone}.
        </div>
      </div>
    </div>
  );
}
