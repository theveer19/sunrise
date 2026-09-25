import React, { useState, useEffect } from "react";
import { IndianRupee, Printer, Trash2, Save } from "lucide-react";
import { CLASSES, fmtDate, today, inr } from "../lib/helpers";
import { Panel, Modal, Text, Pick, Empty, Tabs, DataTable, Pill, useToast, useConfirm } from "../lib/ui.jsx";
import { receiptHtml } from "../lib/templates";

export default function Fees({ students, school, openDoc }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState("collect");
  const [fees, setFees] = useState([]);
  const [structure, setStructure] = useState({});
  const [pay, setPay] = useState(null);
  const [paid, setPaid] = useState({});

  const load = async () => {
    setFees(await window.api.fees.list());
    setStructure(await window.api.fees.getStructure());
    const active = students.filter((s) => s.status === "Active");
    const map = {};
    for (const s of active) map[s.id] = await window.api.fees.paidFor(s.id);
    setPaid(map);
  };
  useEffect(() => { load(); }, [students]);

  const active = students.filter((s) => s.status === "Active");
  const totalCollected = fees.reduce((a, f) => a + Number(f.amount), 0);

  const openPay = (s) => setPay({
    student_id: s.id, amount: structure[s.class] || 0, mode: "Cash",
    date: today(), head: "Tuition fee", months: "1", remark: ""
  });

  const [saving, setSaving] = useState(false);
  const collect = async () => {
    if (!(Number(pay.amount) > 0)) return toast.warn("Enter an amount greater than 0.");
    if (!pay.date) return toast.warn("Select the payment date.");
    if (saving) return;
    setSaving(true);
    const rec = await window.api.fees.add({ ...pay, amount: Number(pay.amount) }).finally(() => setSaving(false));
    const s = students.find((x) => x.id === rec.student_id);
    setPay(null);
    await load();
    toast.ok(`Receipt ${rec.receipt_no} raised for ${inr(rec.amount)}.`);
    openDoc(receiptHtml(school, s, rec), `Receipt-${rec.receipt_no}-${s.name}.pdf`);
  };

  const removeReceipt = async (f) => {
    const ok = await confirm({
      title: "Delete this receipt?", danger: true, confirmLabel: "Delete receipt",
      message: `Receipt ${f.receipt_no} for ${inr(f.amount)} will be removed from the ledger. The receipt number is not reused.`
    });
    if (!ok) return;
    await window.api.fees.remove(f.id); load();
    toast.ok("Receipt deleted.");
  };

  const reprint = (f) => {
    const s = students.find((x) => x.id === f.student_id) || {};
    openDoc(receiptHtml(school, s, f), `Receipt-${f.receipt_no}.pdf`);
  };

  return (
    <>
      <Tabs value={tab} onChange={setTab}
        tabs={[["collect", "Collect fees"], ["ledger", "Receipt ledger"], ["structure", "Fee structure"]]} />

      {tab === "collect" && (
        <Panel title="Collect fees" note="Select a student to raise a receipt. The receipt opens for print/PDF right after.">
          {active.length === 0 ? <Empty>No active students.</Empty> : (
            <table className="grid">
              <thead><tr><th>Adm. No.</th><th>Name</th><th>Class</th><th>Monthly fee</th><th>Paid to date</th><th></th></tr></thead>
              <tbody>
                {active.map((s) => (
                  <tr key={s.id}>
                    <td>{s.adm_no}</td><td style={{ fontWeight: 600 }}>{s.name}</td><td>{s.class}-{s.section}</td>
                    <td>{inr(structure[s.class])}</td><td>{inr(paid[s.id])}</td>
                    <td><button className="btn btn-sm" onClick={() => openPay(s)}><IndianRupee size={12} /> Receive</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {tab === "ledger" && (
        <Panel title="Receipt ledger" note={`${fees.length} receipts · ${inr(totalCollected)} collected`}>
          {fees.length === 0 ? <Empty>No fees received yet.</Empty> : (
            <table className="grid">
              <thead><tr><th>Receipt</th><th>Date</th><th>Student</th><th>Head</th><th>Mode</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                {fees.map((f) => {
                  const s = students.find((x) => x.id === f.student_id) || {};
                  return (
                    <tr key={f.id}>
                      <td>{f.receipt_no}</td><td>{fmtDate(f.date)}</td><td>{s.name || "(deleted student)"}</td>
                      <td>{f.head}</td><td>{f.mode}</td><td style={{ fontWeight: 600 }}>{inr(f.amount)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => reprint(f)}><Printer size={12} /></button>{" "}
                        <button className="btn btn-ghost btn-sm" onClick={() => removeReceipt(f)}><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {tab === "structure" && (
        <Panel title="Fee structure" note="Monthly tuition fee by class. Click “Save all” after making changes."
          action={<button className="btn btn-ghost btn-sm" onClick={async () => { setStructure(await window.api.fees.setStructure(structure)); toast.ok("Fee structure saved."); }}><Save size={13} /> Save all</button>}>
          <div className="grid-form">
            {CLASSES.map((c) => (
              <Text key={c} label={`Class ${c}`} type="number" value={structure[c] ?? 0}
                onChange={(v) => setStructure({ ...structure, [c]: v })} />
            ))}
          </div>
        </Panel>
      )}

      {pay && (() => {
        const s = students.find((x) => x.id === pay.student_id);
        return (
          <Modal title={`Receive fees — ${s.name}`} onClose={() => setPay(null)}>
            <div className="grid-form">
              <Pick label="Fee head" value={pay.head} onChange={(v) => setPay({ ...pay, head: v })}
                options={["Tuition fee", "Admission fee", "Examination fee", "Transport fee", "Books & uniform", "Annual charges", "Late fine", "Other"]} />
              <Text label="Amount" type="number" value={pay.amount} onChange={(v) => setPay({ ...pay, amount: v })} />
              <Pick label="Mode" value={pay.mode} onChange={(v) => setPay({ ...pay, mode: v })} options={["Cash", "UPI", "Cheque", "Bank transfer", "Card"]} />
              <Text label="Date" type="date" value={pay.date} onChange={(v) => setPay({ ...pay, date: v })} />
              <Text label="Period / months" value={pay.months} onChange={(v) => setPay({ ...pay, months: v })} />
              <Text label="Remark" value={pay.remark} onChange={(v) => setPay({ ...pay, remark: v })} />
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setPay(null)}>Cancel</button>
              <button className="btn" onClick={collect} disabled={saving}><Printer size={14} /> {saving ? "Saving…" : "Save & open receipt"}</button>
            </div>
          </Modal>
        );
      })()}
    </>
  );
}
