import React, { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Save, Printer, Wand2, Banknote } from "lucide-react";
import { thisMonth, monthOffset, fmtMonth, fmtDate, today, inr } from "../lib/helpers";
import {
  Panel, Modal, Text, Pick, Empty, DataTable, Pill, Stat, useToast, useConfirm
} from "../lib/ui.jsx";
import { salarySlipHtml } from "../lib/templates";

export default function Payroll({ staff, school, openDoc }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [month, setMonth] = useState(monthOffset(thisMonth(), -1));
  const [all, setAll] = useState([]);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => setAll(await window.api.payroll.list());
  useEffect(() => { load(); }, []);

  const rows = all.filter((p) => p.month === month);
  const staffById = useMemo(() => Object.fromEntries(staff.map((s) => [s.id, s])), [staff]);
  const nameOf = (id) => staffById[id]?.name || "(deleted staff)";

  const totals = rows.reduce((a, p) => ({
    basic: a.basic + Number(p.basic || 0),
    allowances: a.allowances + Number(p.allowances || 0),
    deductions: a.deductions + Number(p.deductions || 0),
    net: a.net + Number(p.net || 0),
  }), { basic: 0, allowances: 0, deductions: 0, net: 0 });

  const paidCount = rows.filter((p) => p.paid_date).length;

  const generate = async () => {
    const ok = await confirm({
      title: `Generate salary slips for ${fmtMonth(month)}?`,
      message: "A draft slip is created for every active staff member who has a salary on record and does not already have a slip this month. "
        + "Loss of pay is worked out from staff attendance. You can edit any slip afterwards.",
      confirmLabel: "Generate slips"
    });
    if (!ok) return;
    setBusy(true);
    const res = await window.api.payroll.generate(month);
    setBusy(false);
    await load();
    if (res.made) toast.ok(`${res.made} salary slip${res.made === 1 ? "" : "s"} generated for ${fmtMonth(month)}.`);
    else toast.info("Every active staff member already has a slip for this month.");
  };

  const blankFor = () => {
    const s = staff.find((x) => x.status === "Active");
    const basic = Number(s?.salary) || 0;
    return {
      staff_id: String(s?.id || ""), month, basic,
      allowances: Math.round(basic * 0.1), deductions: Math.round(basic * 0.04),
      lop_days: 0, paid_date: "", mode: "Bank transfer", remark: ""
    };
  };

  const save = async () => {
    if (!edit.staff_id) return toast.warn("Choose the staff member.");
    if (!(Number(edit.basic) > 0)) return toast.warn("Basic salary must be more than 0.");
    await window.api.payroll.save({ ...edit, staff_id: Number(edit.staff_id) });
    setEdit(null); await load();
    toast.ok("Salary slip saved.");
  };

  const remove = async (p) => {
    const ok = await confirm({
      title: "Delete this salary slip?", danger: true, confirmLabel: "Delete slip",
      message: `The ${fmtMonth(p.month)} slip for ${nameOf(p.staff_id)} will be removed.`
    });
    if (!ok) return;
    await window.api.payroll.remove(p.id);
    await load();
    toast.ok("Salary slip deleted.");
  };

  const markPaid = async (p) => {
    await window.api.payroll.save({ ...p, paid_date: today() });
    await load();
    toast.ok(`${nameOf(p.staff_id)} marked paid.`);
  };

  const slip = (p) => openDoc(
    salarySlipHtml(school, staffById[p.staff_id] || { name: nameOf(p.staff_id) }, p),
    `Salary-${nameOf(p.staff_id)}-${p.month}.pdf`
  );

  const net = Number(edit?.basic || 0) + Number(edit?.allowances || 0) - Number(edit?.deductions || 0);

  return (
    <>
      <div className="stat-grid">
        <Stat label="Slips this month" value={rows.length} sub={fmtMonth(month)} tone="var(--teal)" />
        <Stat label="Net payable" value={inr(totals.net)} sub="after deductions" tone="var(--sun)" />
        <Stat label="Paid" value={`${paidCount} / ${rows.length}`} sub={`${rows.length - paidCount} pending`} tone={paidCount === rows.length && rows.length ? "var(--ok)" : "var(--warn)"} />
        <Stat label="Total deductions" value={inr(totals.deductions)} sub="PF, LOP and others" tone="var(--warn)" />
      </div>

      <Panel title="Staff payroll" note="Generate monthly slips, edit any of them, then print a salary slip for the staff member."
        action={
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="btn btn-ghost btn-sm" onClick={generate} disabled={busy}>
              <Wand2 size={13} /> {busy ? "Generating…" : "Generate slips"}
            </button>
            <button className="btn" onClick={() => setEdit(blankFor())}><Plus size={14} /> Add slip</button>
          </div>
        }>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ width: 180 }}>
            <label className="lbl">Salary month</label>
            <input className="inp" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <p className="hint" style={{ marginBottom: 6 }}>
            Loss of pay comes from Attendance {"→"} Staff attendance for the same month.
          </p>
        </div>
      </Panel>

      <Panel title={`Salary slips — ${fmtMonth(month)}`} note={`${rows.length} slip(s)`}>
        {rows.length === 0 ? (
          <Empty>No salary slips for {fmtMonth(month)} yet. Use {"“"}Generate slips{"”"} to create them for every active staff member.</Empty>
        ) : (
          <DataTable exportName={`Payroll-${month}`} rows={rows}
            cols={[
              { key: "name", label: "Staff", value: (p) => nameOf(p.staff_id), render: (p) => <b>{nameOf(p.staff_id)}</b> },
              { key: "designation", label: "Designation", value: (p) => staffById[p.staff_id]?.designation || "—" },
              { key: "basic", label: "Basic", align: "right", value: (p) => Number(p.basic || 0), render: (p) => inr(p.basic) },
              { key: "allowances", label: "Allowances", align: "right", value: (p) => Number(p.allowances || 0), render: (p) => inr(p.allowances) },
              {
                key: "deductions", label: "Deductions", align: "right", value: (p) => Number(p.deductions || 0),
                render: (p) => (
                  <span>{inr(p.deductions)}
                    {Number(p.lop_days) > 0 && <span style={{ display: "block", fontSize: 10, color: "var(--slate)" }}>
                      incl. {p.lop_days} day LOP
                    </span>}
                  </span>
                )
              },
              { key: "net", label: "Net pay", align: "right", value: (p) => Number(p.net || 0), render: (p) => <b>{inr(p.net)}</b> },
              {
                key: "paid_date", label: "Status",
                render: (p) => (p.paid_date
                  ? <Pill tone="var(--ok)">Paid {fmtDate(p.paid_date)}</Pill>
                  : <Pill tone="var(--warn)">Pending</Pill>)
              },
              {
                key: "act", label: "", sortable: false, csv: false, align: "right",
                render: (p) => (
                  <span className="row-actions" style={{ justifyContent: "flex-end" }}>
                    {!p.paid_date && (
                      <button className="btn btn-ghost btn-sm" title="Mark as paid" onClick={() => markPaid(p)}>
                        <Banknote size={12} />
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" title="Salary slip" onClick={() => slip(p)}><Printer size={12} /></button>
                    <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setEdit(p)}><Pencil size={12} /></button>
                    <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => remove(p)}><Trash2 size={12} /></button>
                  </span>
                )
              },
            ]}
            footer={
              <tr>
                <td colSpan={2} style={{ textAlign: "right" }}>Total</td>
                <td style={{ textAlign: "right" }}>{inr(totals.basic)}</td>
                <td style={{ textAlign: "right" }}>{inr(totals.allowances)}</td>
                <td style={{ textAlign: "right" }}>{inr(totals.deductions)}</td>
                <td style={{ textAlign: "right" }}>{inr(totals.net)}</td>
                <td colSpan={2} />
              </tr>
            } />
        )}
      </Panel>

      {edit && (
        <Modal title={edit.id ? "Edit salary slip" : "Add salary slip"}
          subtitle={`Net pay works out to ${inr(net)}`} onClose={() => setEdit(null)}>
          <div className="grid-form">
            <Pick label="Staff member" value={String(edit.staff_id)}
              onChange={(v) => {
                const s = staff.find((x) => x.id === Number(v));
                const basic = Number(s?.salary) || 0;
                setEdit({ ...edit, staff_id: v, basic, allowances: Math.round(basic * 0.1), deductions: Math.round(basic * 0.04) });
              }}
              options={staff.filter((s) => s.status === "Active")
                .map((s) => ({ value: String(s.id), label: `${s.name} — ${s.designation}` }))} />
            <Text label="Salary month" type="month" value={edit.month} onChange={(v) => setEdit({ ...edit, month: v })} />
            <Text label="Basic salary" type="number" value={edit.basic} onChange={(v) => setEdit({ ...edit, basic: v })} />
            <Text label="Allowances" type="number" value={edit.allowances} onChange={(v) => setEdit({ ...edit, allowances: v })}
              hint="HRA, travel, special pay" />
            <Text label="Deductions" type="number" value={edit.deductions} onChange={(v) => setEdit({ ...edit, deductions: v })}
              hint="PF, advance, loss of pay" />
            <Text label="Loss-of-pay days" type="number" value={edit.lop_days} onChange={(v) => setEdit({ ...edit, lop_days: v })} />
            <Text label="Paid on" type="date" value={edit.paid_date} onChange={(v) => setEdit({ ...edit, paid_date: v })}
              hint="Leave blank while it is pending" />
            <Pick label="Payment mode" value={edit.mode} onChange={(v) => setEdit({ ...edit, mode: v })}
              options={["Bank transfer", "Cash", "Cheque", "UPI"]} />
            <Text label="Remark" value={edit.remark} onChange={(v) => setEdit({ ...edit, remark: v })} />
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
            <button className="btn" onClick={save}><Save size={14} /> Save slip</button>
          </div>
        </Modal>
      )}
    </>
  );
}
