import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Save, FileText, Award, LogOut, RotateCcw } from "lucide-react";
import { fmtDate, today } from "../lib/helpers";
import { Panel, Modal, Text, Pick, Area, SearchBox, Empty, useToast, useConfirm } from "../lib/ui.jsx";
import { experienceLetterHtml, joiningLetterHtml } from "../lib/templates";

const DESIGNATIONS = ["Principal", "Vice Principal", "PGT", "TGT", "PRT", "Nursery Teacher",
  "Sports Teacher", "Music Teacher", "Computer Instructor", "Librarian", "Lab Assistant",
  "Accountant", "Office Clerk", "Receptionist", "Peon", "Security Guard", "Driver", "Helper"];
const DEPARTMENTS = ["Pre-Primary", "Primary", "Middle", "Secondary", "Senior Secondary",
  "Administration", "Accounts", "Sports", "Library", "IT", "Support Staff"];

const blank = () => ({
  emp_id: "", name: "", guardian: "", gender: "Male", designation: "TGT", department: "Secondary",
  qualification: "", subject: "", doj: today(), dol: "", dob: "", aadhar_no: "",
  phone: "", whatsapp: "", email: "", address: "", salary: "", status: "Active"
});

export default function Staff({ staff, reload, school, openDoc }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [showLeft, setShowLeft] = useState(false);
  const [edit, setEdit] = useState(null);

  const rows = staff.filter((s) =>
    (showLeft || s.status === "Active") &&
    [s.name, s.emp_id, s.designation, s.department, s.subject, s.phone]
      .map((v) => v ?? "").join(" ").toLowerCase().includes(q.trim().toLowerCase()));

  const save = async () => {
    if (!(edit.name || "").trim()) return toast.warn("Enter the staff member's name.");
    const isNew = !edit.id;
    await window.api.staff.save(edit);
    setEdit(null); reload();
    toast.ok(isNew ? `${edit.name} added to the staff register.` : "Staff record updated.");
  };
  const remove = async (st) => {
    const ok = await confirm({
      title: "Delete this staff record?", danger: true, confirmLabel: "Delete permanently",
      message: `${st.name} will be removed along with their payroll and attendance history.`
    });
    if (!ok) return;
    await window.api.staff.remove(st.id); reload();
    toast.ok("Staff record deleted.");
  };
  const toggleLeft = async (s) => {
    const leaving = s.status === "Active";
    const ok = await confirm({
      title: leaving ? "Mark as relieved?" : "Re-activate staff member?",
      message: leaving
        ? `${s.name} will be marked relieved and the date of leaving set to today. Their record and letters stay available.`
        : `${s.name} will appear in attendance, payroll and WhatsApp lists again.`,
      confirmLabel: leaving ? "Mark relieved" : "Re-activate"
    });
    if (!ok) return;
    await window.api.staff.save({ ...s, status: leaving ? "Left" : "Active", dol: leaving && !s.dol ? today() : s.dol });
    reload();
    toast.ok(leaving ? `${s.name} marked relieved.` : `${s.name} is active again.`);
  };

  const expLetter = (s) => openDoc(experienceLetterHtml(school, s), `Experience-${s.name}.pdf`);
  const joinLetter = (s) => openDoc(joiningLetterHtml(school, s), `Joining-Letter-${s.name}.pdf`);

  return (
    <Panel title="Staff & teachers" note={`${rows.length} record(s) shown`}
      action={<button className="btn" onClick={() => setEdit(blank())}><Plus size={14} /> Add staff</button>}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search name, emp ID, designation, department, subject, phone" />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--slate)" }}>
          <input type="checkbox" checked={showLeft} onChange={(e) => setShowLeft(e.target.checked)} /> show relieved / left
        </label>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="grid">
          <thead><tr>
            <th>Emp ID</th><th>Name</th><th>Designation</th><th>Department</th><th>Subject</th>
            <th>Joined</th><th>Phone</th><th>Status</th><th>Letters & actions</th>
          </tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>{s.emp_id}</td>
                <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{s.name}</td>
                <td>{s.designation}</td><td>{s.department}</td><td>{s.subject}</td>
                <td>{fmtDate(s.doj)}</td><td>{s.phone}</td>
                <td><span className="pill" style={{ color: s.status === "Active" ? "var(--ok)" : "var(--danger)", borderColor: "currentColor" }}>{s.status}</span></td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="btn btn-ghost btn-sm" title="Joining letter" onClick={() => joinLetter(s)}><FileText size={12} /></button>{" "}
                  <button className="btn btn-ghost btn-sm" title="Experience letter" onClick={() => expLetter(s)}><Award size={12} /></button>{" "}
                  <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setEdit(s)}><Pencil size={12} /></button>{" "}
                  <button className="btn btn-ghost btn-sm" title={s.status === "Active" ? "Relieve / left" : "Re-activate"} onClick={() => toggleLeft(s)}>
                    {s.status === "Active" ? <LogOut size={12} /> : <RotateCcw size={12} />}
                  </button>{" "}
                  <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => remove(s)}><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty>No staff yet. Add teachers and staff to generate joining and experience letters.</Empty>}
      </div>

      {edit && (
        <Modal wide title={edit.id ? "Edit staff record" : "Add staff / teacher"} onClose={() => setEdit(null)}>
          <p className="eyebrow" style={{ marginTop: 0 }}>Identity & role</p>
          <div className="grid-form" style={{ marginBottom: 16 }}>
            <Text label="Employee ID" value={edit.emp_id} onChange={(v) => setEdit({ ...edit, emp_id: v })} />
            <Text label="Full name" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} />
            <Text label="S/o · D/o · W/o" value={edit.guardian} onChange={(v) => setEdit({ ...edit, guardian: v })} />
            <Pick label="Gender" value={edit.gender} onChange={(v) => setEdit({ ...edit, gender: v })} options={["Male", "Female", "Other"]} />
            <Pick label="Designation" value={edit.designation} onChange={(v) => setEdit({ ...edit, designation: v })} options={DESIGNATIONS} />
            <Pick label="Department" value={edit.department} onChange={(v) => setEdit({ ...edit, department: v })} options={DEPARTMENTS} />
            <Text label="Subject (if teacher)" value={edit.subject} onChange={(v) => setEdit({ ...edit, subject: v })} />
            <Text label="Qualification" value={edit.qualification} onChange={(v) => setEdit({ ...edit, qualification: v })} />
          </div>
          <p className="eyebrow">Service & contact</p>
          <div className="grid-form" style={{ marginBottom: 12 }}>
            <Text label="Date of joining" type="date" value={edit.doj} onChange={(v) => setEdit({ ...edit, doj: v })} />
            <Text label="Date of leaving" type="date" value={edit.dol} onChange={(v) => setEdit({ ...edit, dol: v })} />
            <Text label="Date of birth" type="date" value={edit.dob} onChange={(v) => setEdit({ ...edit, dob: v })} />
            <Text label="Monthly salary" type="number" value={edit.salary} onChange={(v) => setEdit({ ...edit, salary: v })} />
            <Text label="Aadhaar number" value={edit.aadhar_no} onChange={(v) => setEdit({ ...edit, aadhar_no: v })} />
            <Text label="Phone" value={edit.phone} onChange={(v) => setEdit({ ...edit, phone: v })} />
            <Text label="WhatsApp no." value={edit.whatsapp} onChange={(v) => setEdit({ ...edit, whatsapp: v })} />
            <Text label="Email" value={edit.email} onChange={(v) => setEdit({ ...edit, email: v })} />
            <Pick label="Status" value={edit.status} onChange={(v) => setEdit({ ...edit, status: v })} options={["Active", "Left"]} />
          </div>
          <Area label="Address" value={edit.address} onChange={(v) => setEdit({ ...edit, address: v })} />
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
            <button className="btn" onClick={save}><Save size={14} /> Save record</button>
          </div>
        </Modal>
      )}
    </Panel>
  );
}