import React from "react";
import { ChevronRight } from "lucide-react";
import { CLASSES, fmtDate, inr } from "../lib/helpers";
import { Panel, Stat, Empty } from "../lib/ui.jsx";

export default function Dashboard({ data, go }) {
  if (!data) return <Empty>Loading dashboard…</Empty>;
  const stats = [
    { label: "Students on roll", value: data.totalStudents, sub: `${data.leftStudents} left / TC issued`, tone: "var(--sun)" },
    { label: "Fees collected", value: inr(data.feesTotal), sub: `${data.receiptCount} receipts`, tone: "var(--ok)" },
    { label: "Total expenses", value: inr(data.expenseTotal), sub: "paid out", tone: "var(--warn)" },
    { label: "Net balance", value: inr(data.netBalance), sub: "collection − expenses", tone: "var(--teal)" },
    { label: "Monthly demand", value: inr(data.monthlyDemand), sub: "at current strength", tone: "var(--amber)" },
    { label: "TCs issued", value: data.tcCount, sub: "transfer certificates", tone: "var(--ink2)" },
  ];
  const byClass = CLASSES.map((c) => ({ c, n: data.byClass[c] || 0 })).filter((x) => x.n);
  const max = Math.max(1, ...byClass.map((b) => b.n));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 18 }}>
        {stats.map((s) => <Stat key={s.label} {...s} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18 }}>
        <Panel title="Strength by class">
          {byClass.length === 0 ? <Empty>No students on roll yet.</Empty> : byClass.map((b) => (
            <div key={b.c} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ width: 64, fontSize: 12, color: "var(--slate)" }}>Class {b.c}</span>
              <div className="bar" style={{ flex: 1 }}><span style={{ width: `${(b.n / max) * 100}%` }} /></div>
              <span style={{ width: 24, fontSize: 12, fontWeight: 700, textAlign: "right" }}>{b.n}</span>
            </div>
          ))}
        </Panel>

        <Panel title="Recent fee receipts" action={<button className="btn btn-ghost btn-sm" onClick={() => go("fees")}>Open fees <ChevronRight size={13} /></button>}>
          {data.recentFees.length === 0 ? <Empty>No fees received yet.</Empty> : (
            <table className="grid">
              <thead><tr><th>Receipt</th><th>Student</th><th>Head</th><th>Amount</th></tr></thead>
              <tbody>{data.recentFees.map((f) => (
                <tr key={f.id}><td>{f.receipt_no}</td><td>{f.name}</td><td>{f.head}</td><td style={{ fontWeight: 600 }}>{inr(f.amount)}</td></tr>
              ))}</tbody>
            </table>
          )}
        </Panel>

        <Panel title="Latest admissions" action={<button className="btn btn-ghost btn-sm" onClick={() => go("students")}>Register <ChevronRight size={13} /></button>}>
          <table className="grid">
            <thead><tr><th>Adm. No.</th><th>Name</th><th>Class</th><th>Admitted</th></tr></thead>
            <tbody>{data.recentAdmissions.map((s) => (
              <tr key={s.id}><td>{s.adm_no}</td><td>{s.name}</td><td>{s.class}-{s.section}</td><td>{fmtDate(s.doa)}</td></tr>
            ))}</tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}
