import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { today, fmtDate, inr } from "../lib/helpers";
import { Panel, Modal, Text, Pick, Area, Empty, Stat, DataTable, useToast, useConfirm } from "../lib/ui.jsx";

const CATS = ["Rent", "Electricity & water", "Maintenance", "Stationery", "Books & uniform",
  "Transport & fuel", "Events & functions", "Marketing", "Furniture & equipment", "Miscellaneous"];

export default function Expenses() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [add, setAdd] = useState(null);
  const [month, setMonth] = useState(today().slice(0, 7));

  const load = async () => setRows(await window.api.expenses.list());
  useEffect(() => { load(); }, []);

  const blank = { date: today(), category: "Rent", description: "", amount: "", paid_to: "", mode: "Cash" };
  const remove = async (r) => {
    const ok = await confirm({
      title: "Delete this expense?", danger: true, confirmLabel: "Delete entry",
      message: `${inr(r.amount)} — ${r.category}${r.description ? ` (${r.description})` : ""} will be removed.`
    });
    if (!ok) return;
    await window.api.expenses.remove(r.id); load();
    toast.ok("Expense deleted.");
  };
  const save = async () => {
    if (!(Number(add.amount) > 0)) return toast.warn("Enter an amount greater than 0.");
    if (!add.date) return toast.warn("Select the date.");
    await window.api.expenses.add({ ...add, amount: Number(add.amount) });
    setAdd(null); load();
    toast.ok(`${inr(add.amount)} recorded under ${add.category}.`);
  };

  const inMonth = rows.filter((r) => (r.date || "").startsWith(month));
  const total = rows.reduce((a, r) => a + Number(r.amount), 0);
  const monthTotal = inMonth.reduce((a, r) => a + Number(r.amount), 0);
  const byCat = {};
  inMonth.forEach((r) => (byCat[r.category] = (byCat[r.category] || 0) + Number(r.amount)));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 18 }}>
        <Stat label="Total expenses" value={inr(total)} sub={`${rows.length} entries`} tone="var(--warn)" />
        <Stat label="This month" value={inr(monthTotal)} sub={`${inMonth.length} entries`} tone="var(--sun)" />
        <Stat label="Top head (month)" value={Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"}
          sub={inr(Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[1] || 0)} tone="var(--teal)" />
      </div>

      <Panel title="Expense register" note={`${inMonth.length} entr${inMonth.length === 1 ? "y" : "ies"} this month. Staff salaries are recorded separately under Payroll.`}
        action={<div style={{ display: "flex", gap: 8 }}>
          <input className="inp" type="month" style={{ width: 150 }} value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="btn" onClick={() => setAdd(blank)}><Plus size={14} /> Add expense</button>
        </div>}>
        {inMonth.length === 0 ? <Empty>{rows.length ? "No expenses in this month. Pick another month above." : "No expenses recorded yet."}</Empty> : (
          <table className="grid">
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Paid to</th><th>Mode</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              {inMonth.map((r) => (
                <tr key={r.id}>
                  <td>{fmtDate(r.date)}</td><td>{r.category}</td><td>{r.description}</td>
                  <td>{r.paid_to}</td><td>{r.mode}</td><td style={{ fontWeight: 600 }}>{inr(r.amount)}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => remove(r)}><Trash2 size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {add && (
        <Modal title="Add expense" onClose={() => setAdd(null)}>
          <div className="grid-form">
            <Text label="Date" type="date" value={add.date} onChange={(v) => setAdd({ ...add, date: v })} />
            <Pick label="Category" value={add.category} onChange={(v) => setAdd({ ...add, category: v })} options={CATS} />
            <Text label="Amount" type="number" value={add.amount} onChange={(v) => setAdd({ ...add, amount: v })} />
            <Text label="Paid to" value={add.paid_to} onChange={(v) => setAdd({ ...add, paid_to: v })} />
            <Pick label="Mode" value={add.mode} onChange={(v) => setAdd({ ...add, mode: v })} options={["Cash", "UPI", "Cheque", "Bank transfer", "Card"]} />
          </div>
          <div style={{ marginTop: 12 }}>
            <Area label="Description" value={add.description} onChange={(v) => setAdd({ ...add, description: v })} />
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setAdd(null)}>Cancel</button>
            <button className="btn" onClick={save}><Save size={14} /> Save expense</button>
          </div>
        </Modal>
      )}
    </>
  );
}
