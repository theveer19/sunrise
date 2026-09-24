export const CLASSES = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
export const SECTIONS = ["A", "B", "C", "D"];
export const SUBJECTS = ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit",
  "Computer", "Environmental Studies", "Physics", "Chemistry", "Biology", "Drawing", "General Knowledge"];

export const today = () => new Date().toISOString().slice(0, 10);
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
