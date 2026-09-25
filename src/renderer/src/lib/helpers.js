export const CLASSES = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
export const SECTIONS = ["A", "B", "C", "D"];
export const SUBJECTS = ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit",
  "Computer", "Environmental Studies", "Physics", "Chemistry", "Biology", "Drawing", "General Knowledge"];

export const today = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const nextClass = (c) => {
  const i = CLASSES.indexOf(c);
  return i >= 0 && i < CLASSES.length - 1 ? CLASSES[i + 1] : null;
};
export const fmtDate = (d) => (d ? d.split("-").reverse().join("/") : "—");
export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const two = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : ""));

export function words(n) {
  n = Math.round(Number(n) || 0);
  if (!n) return "Zero";
  let out = "";
  const cr = Math.floor(n / 10000000); n %= 10000000;
  const lk = Math.floor(n / 100000); n %= 100000;
  const th = Math.floor(n / 1000); n %= 1000;
  const hu = Math.floor(n / 100); n %= 100;
  if (cr) out += two(cr) + " Crore ";
  if (lk) out += two(lk) + " Lakh ";
  if (th) out += two(th) + " Thousand ";
  if (hu) out += ONES[hu] + " Hundred ";
  if (n) out += (out ? "and " : "") + two(n) + " ";
  return out.trim();
}

export function dobWords(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  const M = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"][m - 1];
  return `${two(day)} ${M} ${words(y)}`;
}

const GRADES = [[91, "A1", 10], [81, "A2", 9], [71, "B1", 8], [61, "B2", 7],
  [51, "C1", 6], [41, "C2", 5], [33, "D", 4], [0, "E", 0]];
export const gradeOf = (pct) => GRADES.find((g) => pct >= g[0]) || GRADES[GRADES.length - 1];
export const divisionOf = (p) => (p >= 60 ? "First Division" : p >= 45 ? "Second Division" : p >= 33 ? "Third Division" : "—");
export const escapeHtml = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---- school calendar & module constants ---------------------------- */
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
export const PERIOD_TIMES = {
  1: "08:00 – 08:45", 2: "08:45 – 09:30", 3: "09:30 – 10:15", 4: "10:35 – 11:20",
  5: "11:20 – 12:05", 6: "12:05 – 12:50", 7: "13:20 – 14:05", 8: "14:05 – 14:50"
};
export const ATTENDANCE_STATUS = ["Present", "Absent", "Late", "Leave"];
export const ATT_COLOR = { Present: "var(--ok)", Absent: "var(--danger)", Late: "var(--warn)", Leave: "var(--teal)" };
export const ATT_SHORT = { Present: "P", Absent: "A", Late: "L", Leave: "LV" };
export const BOOK_CATEGORIES = ["Textbook", "Reference", "Story & Fiction", "General Knowledge",
  "Competition", "Magazine", "Biography", "Science", "Hindi Literature", "English Literature"];
export const NOTICE_AUDIENCE = ["All", "Students & Parents", "Teachers", "Staff", "Class-specific"];
export const EVENT_TYPES = ["Holiday", "Examination", "Function", "Sports", "PTM", "Trip", "Competition", "Other"];
export const HOSTEL_ROOM_TYPES = ["Dormitory", "4-Seater", "3-Seater", "2-Seater", "Single"];

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

/* "2026-09" -> "September 2026" */
export const fmtMonth = (m) => {
  if (!m) return "—";
  const [y, mo] = m.split("-").map(Number);
  return `${MONTH_NAMES[mo - 1] || ""} ${y}`;
};
export const thisMonth = () => today().slice(0, 7);
/* month string offset by n months */
export function monthOffset(m, n) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export const daysInMonth = (m) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo, 0).getDate();
};
/* weekday name for a YYYY-MM-DD date */
export const dayName = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(y, m - 1, day).getDay()];
};
export const isSunday = (d) => dayName(d) === "Sunday";
/* days between two YYYY-MM-DD dates (b - a) */
export function daysBetween(a, b) {
  if (!a || !b) return 0;
  const p = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(b) - p(a)) / 86400000);
}
export function addDays(d, n) {
  const [y, m, day] = d.split("-").map(Number);
  const x = new Date(y, m - 1, day + n);
  const p = (v) => String(v).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}
/* age in whole years from a date of birth */
export const ageOf = (dob) => {
  if (!dob) return "—";
  const t = today();
  let a = Number(t.slice(0, 4)) - Number(dob.slice(0, 4));
  if (t.slice(5) < dob.slice(5)) a -= 1;
  return a >= 0 ? a : "—";
};

export const pct = (a, b) => (b ? (a / b) * 100 : 0);
export const initialsOf = (name) => String(name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();

/* download any text content as a file (works in Electron and the browser) */
export function downloadFile(filename, content, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["﻿" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
/* rows: array of objects, cols: [{key,label}] */
export function toCsv(rows, cols) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.map((c) => esc(c.label)).join(","),
    ...rows.map((r) => cols.map((c) => esc(typeof c.value === "function" ? c.value(r) : r[c.key])).join(","))].join("\n");
}
