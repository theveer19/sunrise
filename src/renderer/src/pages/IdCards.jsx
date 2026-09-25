import React, { useState } from "react";
import { IdCard, Printer, CheckSquare, Square } from "lucide-react";
import { CLASSES, initialsOf } from "../lib/helpers";
import { Panel, Pick, Empty, Tabs, SearchBox, useToast } from "../lib/ui.jsx";
import { idCardSheetHtml } from "../lib/templates";

export default function IdCards(props) {
  const [tab, setTab] = useState("students");
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[["students", "Student ID cards"], ["staff", "Staff ID cards"]]} />
      {tab === "students" ? <Cards {...props} kind="student" /> : <Cards {...props} kind="staff" />}
    </>
  );
}

function Cards({ students, staff, school, openDoc, kind }) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("All");
  const [picked, setPicked] = useState({});

  const isStudent = kind === "student";
  const source = isStudent
    ? students.filter((s) => s.status === "Active")
    : staff.filter((s) => s.status === "Active");

  const rows = source.filter((p) => {
    if (isStudent && cls !== "All" && p.class !== cls) return false;
    const hay = [p.name, p.adm_no, p.emp_id, p.father, p.designation, p.phone].map((v) => v ?? "").join(" ").toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  const chosen = rows.filter((p) => picked[p.id]);
  const allOn = rows.length > 0 && rows.every((p) => picked[p.id]);
  const toggleAll = () => {
    const v = !allOn;
    const m = { ...picked };
    rows.forEach((p) => (m[p.id] = v));
    setPicked(m);
  };

  const generate = () => {
    const list = chosen.length ? chosen : rows;
    if (!list.length) return toast.warn("No records to print.");
    if (list.length > 40) return toast.warn("Select 40 cards or fewer at a time so the layout stays clean.");
    openDoc(idCardSheetHtml(school, list, kind),
      `ID-Cards-${isStudent ? "Students" : "Staff"}.pdf`);
    toast.ok(`${list.length} ID card${list.length === 1 ? "" : "s"} ready — 8 cards per A4 sheet.`);
  };

  const classList = CLASSES.filter((c) => students.some((s) => s.status === "Active" && s.class === c));

  return (
    <>
      <Panel title={isStudent ? "Student ID cards" : "Staff ID cards"}
        note="Select who you need cards for, then generate a print-ready A4 sheet — 8 cards per page, cut along the guides."
        action={
          <button className="btn" onClick={generate} disabled={!rows.length}>
            <Printer size={14} /> Generate {chosen.length ? `${chosen.length} card${chosen.length === 1 ? "" : "s"}` : "all shown"}
          </button>
        }>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <SearchBox value={q} onChange={setQ}
            placeholder={isStudent ? "Search name, admission no., father" : "Search name, employee ID, designation"} />
          {isStudent && (
            <select className="inp" style={{ width: 150 }} value={cls} onChange={(e) => setCls(e.target.value)}>
              {["All", ...classList].map((c) => <option key={c}>{c}</option>)}
            </select>
          )}
          <button className="btn btn-ghost btn-sm" onClick={toggleAll} disabled={!rows.length}>
            {allOn ? <CheckSquare size={13} /> : <Square size={13} />} {allOn ? "Clear all" : "Select all"}
          </button>
        </div>
        <p className="hint">
          Cards carry the school monogram, the holder{"’"}s photo box, class/designation, contact and a validity line —
          ready to laminate. Nothing is selected means every row shown is printed.
        </p>
      </Panel>

      <Panel title={`${rows.length} record${rows.length === 1 ? "" : "s"}`} note={`${chosen.length} selected`}>
        {rows.length === 0 ? <Empty>No matching records.</Empty> : (
          <div className="idcard-grid">
            {rows.map((p) => (
              <button key={p.id} className={"idcard-pick" + (picked[p.id] ? " on" : "")}
                onClick={() => setPicked((m) => ({ ...m, [p.id]: !m[p.id] }))}>
                {picked[p.id] ? <CheckSquare size={15} style={{ color: "var(--sun)", flex: "0 0 auto" }} />
                  : <Square size={15} style={{ color: "var(--slate)", flex: "0 0 auto" }} />}
                <span className={"avatar" + (isStudent ? "" : " teal")}>{initialsOf(p.name)}</span>
                <span style={{ minWidth: 0, textAlign: "left" }}>
                  <span style={{ display: "block", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.name}
                  </span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--slate)" }}>
                    {isStudent ? `Class ${p.class}-${p.section} · ${p.adm_no || "—"}` : `${p.designation || "Staff"} · ${p.emp_id || "—"}`}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
