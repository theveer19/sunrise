import React, { useState } from "react";
import { LogIn, ArrowLeft, GraduationCap, Eye, EyeOff } from "lucide-react";
import { useToast } from "../lib/ui.jsx";

export default function StudentLogin({ school, onSuccess, onBack, demoHint }) {
  const toast = useToast();
  const [admNo, setAdmNo] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (ev) => {
    ev?.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    const res = await window.api.auth.studentLogin(admNo, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.ok(`Welcome, ${res.student.name}.`);
    onSuccess(res.student);
  };

  const fillDemo = () => {
    if (!demoHint) return;
    setAdmNo(demoHint.adm_no);
    setPassword(demoHint.password);
    setError("");
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-mono">{school.initials}</div>
          <div>
            <div className="serif login-school">{school.name}</div>
            <div className="login-sub">{school.address}</div>
          </div>
        </div>

        <div className="login-body">
          <p className="eyebrow" style={{ margin: 0 }}>Student &amp; Parent Portal</p>
          <h1 className="serif login-title">Sign in</h1>
          <p className="login-lead">
            Check attendance, results, fees, timetable and homework. Use the admission number printed
            on the student{"’"}s ID card.
          </p>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 13 }}>
              <label className="lbl" htmlFor="adm">Admission number</label>
              <input id="adm" className="inp" value={admNo} autoFocus autoComplete="username"
                placeholder="2020/0142" onChange={(e) => { setAdmNo(e.target.value); setError(""); }} />
            </div>
            <div style={{ marginBottom: 6 }}>
              <label className="lbl" htmlFor="pw">Password</label>
              <div style={{ position: "relative" }}>
                <input id="pw" className="inp" type={show ? "text" : "password"} value={password}
                  autoComplete="current-password" placeholder="DDMMYYYY"
                  onChange={(e) => { setPassword(e.target.value); setError(""); }} />
                <button type="button" className="pw-toggle" onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <p className="hint" style={{ marginBottom: 16 }}>
              First time signing in? Your password is the student{"’"}s date of birth written as
              DDMMYYYY — for 18 April 2012 that is 18042012.
            </p>

            {error && <div className="login-error" role="alert">{error}</div>}

            <button className="btn" type="submit" disabled={busy} style={{ width: "100%", padding: "11px 14px" }}>
              <LogIn size={15} /> {busy ? "Checking…" : "Sign in"}
            </button>
          </form>

          {demoHint && (
            <button className="btn btn-ghost btn-sm" onClick={fillDemo} style={{ width: "100%", marginTop: 10 }}>
              <GraduationCap size={13} /> Fill demo login ({demoHint.adm_no})
            </button>
          )}

          <button className="login-back" onClick={onBack}>
            <ArrowLeft size={13} /> Back to the school office
          </button>
        </div>

        <div className="login-foot">
          Trouble signing in? Call the school office on {school.phone}.
        </div>
      </div>
    </div>
  );
}
