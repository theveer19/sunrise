import { fmtDate, words, dobWords, gradeOf, divisionOf, inr, today, escapeHtml as e } from "./helpers";

/* Sunrise palette: amber → coral gradient, teal accent, ink text */
const CSS = `
*{box-sizing:border-box}
.page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;color:#1c2430;position:relative;
  font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;padding:0}
.frame{position:absolute;inset:8mm;border:2px solid #E58A2E;border-radius:6px;pointer-events:none}
.frame:before{content:"";position:absolute;inset:3mm;border:1px solid #f0b878;border-radius:4px}
.corner{position:absolute;width:16mm;height:16mm;border:3px solid #17968f}
.c1{top:5mm;left:5mm;border-right:0;border-bottom:0;border-radius:6px 0 0 0}
.c2{top:5mm;right:5mm;border-left:0;border-bottom:0;border-radius:0 6px 0 0}
.c3{bottom:5mm;left:5mm;border-right:0;border-top:0;border-radius:0 0 0 6px}
.c4{bottom:5mm;right:5mm;border-left:0;border-top:0;border-radius:0 0 6px 0}
.wm{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:.05;
  font-size:150px;font-weight:800;color:#E58A2E;transform:rotate(-18deg);pointer-events:none;letter-spacing:8px}
.inner{position:relative;padding:16mm 16mm 14mm}
.head{display:flex;align-items:center;gap:14px;border-bottom:3px double #E58A2E;padding-bottom:12px}
.logo{width:64px;height:64px;border-radius:50%;flex:0 0 64px;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,#F6A623,#E5533B);color:#fff;font-weight:800;font-size:20px;
  box-shadow:0 4px 10px rgba(229,83,59,.35)}
.school{flex:1;text-align:center}
.school h1{margin:0;font-size:26px;letter-spacing:.5px;color:#C0392B;
  background:linear-gradient(90deg,#E5533B,#F6A623);-webkit-background-clip:text;background-clip:text;color:transparent}
.school .sub{font-size:12px;color:#5a6472;margin:2px 0}
.school .meta{font-size:10px;color:#7a8494}
.ribbon{display:inline-block;margin:14px auto 0;padding:6px 34px;color:#fff;font-weight:700;letter-spacing:3px;
  font-size:14px;text-transform:uppercase;background:linear-gradient(90deg,#17968f,#0f6f6a);border-radius:3px;
  box-shadow:0 3px 8px rgba(15,111,106,.3)}
.center{text-align:center}
table.kv{width:100%;border-collapse:collapse;margin-top:14px;font-size:12.5px}
table.kv td{border:1px solid #e0d3bf;padding:6px 9px}
table.kv td.k{background:#fdf4e6;font-weight:600;width:40%;color:#8a5a1a}
table.marks{width:100%;border-collapse:collapse;margin-top:14px;font-size:12.5px}
table.marks th{background:linear-gradient(90deg,#E5533B,#F6A623);color:#fff;padding:8px;font-size:11px;
  letter-spacing:.5px;text-transform:uppercase;border:1px solid #d98b3a}
table.marks td{border:1px solid #e6dccb;padding:7px 8px;text-align:center}
table.marks td.subj{text-align:left;font-weight:600}
table.marks tr:nth-child(even) td{background:#fffaf2}
.total td{background:#fdf0dc !important;font-weight:800;color:#8a5a1a}
.summary{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
.chip{flex:1;min-width:120px;border:1px solid #e0d3bf;border-radius:5px;padding:9px 12px;background:#fdf7ee}
.chip .lab{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#a07a3a}
.chip .val{font-size:17px;font-weight:800;color:#1c2430;margin-top:2px}
.pass{color:#0f8a4c!important}.fail{color:#c0392b!important}
.body-txt{font-size:15px;line-height:2.1;text-align:justify;margin-top:26px}
.sign{display:flex;justify-content:space-between;margin-top:56px;font-size:12px}
.sign .box{text-align:center;min-width:150px}
.sign .line{border-top:1.5px solid #1c2430;padding-top:5px}
.seal{position:absolute;right:26mm;bottom:34mm;width:110px;height:110px;border:2px dashed #17968f;border-radius:50%;
  display:flex;align-items:center;justify-content:center;text-align:center;color:#17968f;font-size:9px;font-weight:700;
  letter-spacing:1px;line-height:1.5;transform:rotate(-12deg);opacity:.7}
.note{font-size:10px;color:#7a8494;margin-top:12px}
.rowmeta{display:flex;justify-content:space-between;font-size:12px;margin-top:10px;color:#374151}
.rowmeta b{color:#1c2430}
`;

function shell(inner, school) {
  return `<style>${CSS}</style><div class="page">
    <div class="frame"></div>
    <div class="corner c1"></div><div class="corner c2"></div><div class="corner c3"></div><div class="corner c4"></div>
    <div class="wm">${e(school.initials)}</div>
    <div class="inner">${inner}</div>
  </div>`;
}

function head(school, title) {
  return `<div class="head">
    <div class="logo">${e(school.initials)}</div>
    <div class="school">
      <h1>${e(school.name)}</h1>
      <div class="sub">${e(school.line2)}</div>
      <div class="sub">${e(school.address)}</div>
      <div class="meta">Affiliation ${e(school.affiliation)} &middot; UDISE ${e(school.udise)} &middot; ${e(school.board)}</div>
      <div class="meta">${e(school.phone)} &middot; ${e(school.email)}</div>
    </div>
    <div class="logo" style="background:linear-gradient(135deg,#17968f,#0f6f6a)">${e(school.initials)}</div>
  </div>
  <div class="center"><span class="ribbon">${e(title)}</span></div>`;
}

function signRow(school, roles) {
  return `<div class="sign">${roles.map((r, i) => `<div class="box"><div class="line">${e(r)}</div>${i === roles.length - 1 ? `<div style="font-size:10px">${e(school.principal)}</div>` : ""}</div>`).join("")}</div>`;
}

const seal = (school, txt) => `<div class="seal">${e(school.initials)}<br>${txt}</div>`;
const sealLeft = (school, txt) => `<div class="seal" style="left:26mm;right:auto;bottom:30mm">${e(school.initials)}<br>${txt}</div>`;

/* ------- Marksheet -------------------------------------------------- */
export function marksheetHtml(school, student, exam, markMap) {
  const total = exam.max_marks * exam.subjects.length;
  const got = exam.subjects.reduce((a, s) => a + Number(markMap[s] || 0), 0);
  const pct = total ? (got / total) * 100 : 0;
  const failed = exam.subjects.filter((s) => Number(markMap[s] || 0) < exam.pass_marks);
  const rows = exam.subjects.map((s, i) => {
    const v = Number(markMap[s] || 0);
    const p = (v / exam.max_marks) * 100;
    const pass = v >= exam.pass_marks;
    return `<tr><td>${i + 1}</td><td class="subj">${e(s)}</td><td>${exam.max_marks}</td>
      <td><b>${markMap[s] ?? "&mdash;"}</b></td><td>${gradeOf(p)[1]}</td>
      <td class="${pass ? "pass" : "fail"}"><b>${pass ? "Pass" : "Fail"}</b></td></tr>`;
  }).join("");
  const inner = head(school, "Statement of Marks") + `
    <div class="center" style="margin-top:8px;font-size:13px;color:#5a6472">${e(exam.name)} &nbsp;&middot;&nbsp; Session ${e(school.session)}</div>
    <table class="kv">
      <tr><td class="k">Examination Roll No.</td><td><b>${e(student.exam_no || student.roll || "—")}</b></td><td class="k">Admission No.</td><td>${e(student.adm_no)}</td></tr>
      <tr><td class="k">Student's Name</td><td>${e(student.name)}</td><td class="k">Class Roll No.</td><td>${e(student.roll)}</td></tr>
      <tr><td class="k">Father's Name</td><td>${e(student.father)}</td><td class="k">Mother's Name</td><td>${e(student.mother)}</td></tr>
      <tr><td class="k">Class / Section</td><td>${e(student.class)} &mdash; ${e(student.section)}</td><td class="k">Date of Birth</td><td>${fmtDate(student.dob)}</td></tr>
      <tr><td class="k">PEN Number</td><td>${e(student.pen_no)}</td><td class="k">Samagra ID</td><td>${e(student.samagra_no)}</td></tr>
    </table>
    <table class="marks">
      <thead><tr><th style="width:34px">S.No</th><th>Subject</th><th>Max</th><th>Obtained</th><th>Grade</th><th>Result</th></tr></thead>
      <tbody>${rows}
        <tr class="total"><td colspan="2" style="text-align:right">Grand Total</td><td>${total}</td><td>${got}</td><td colspan="2"></td></tr>
      </tbody>
    </table>
    <div class="summary">
      <div class="chip"><div class="lab">Percentage</div><div class="val">${pct.toFixed(2)}%</div></div>
      <div class="chip"><div class="lab">Grade</div><div class="val">${gradeOf(pct)[1]}</div></div>
      <div class="chip"><div class="lab">Division</div><div class="val">${divisionOf(pct)}</div></div>
      <div class="chip"><div class="lab">Result</div><div class="val ${failed.length ? "fail" : "pass"}">${failed.length ? "FAIL" : "PASS"}</div></div>
    </div>
    <div class="note">Marks in words: ${words(got)} out of ${words(total)}. &nbsp; Grading &mdash; A1 91-100 &middot; A2 81-90 &middot; B1 71-80 &middot; B2 61-70 &middot; C1 51-60 &middot; C2 41-50 &middot; D 33-40 &middot; E below 33.</div>
    <div class="note">Date of declaration: ${fmtDate(exam.exam_date)}</div>
    ${signRow(school, ["Class Teacher", "Exam In-charge", "Principal"])}
    ${seal(school, "EXAM<br>CELL")}`;
  return shell(inner, school);
}

/* ------- Consolidated Final Result marksheet ------------------------ */
/* ctx = { terms:[{label,obtained,total,pct}], finalExam, finalMarks, summary } */
export function finalMarksheetHtml(school, student, ctx) {
  const { terms, finalExam, finalMarks, summary } = ctx;
  const subjRows = finalExam.subjects.map((s, i) => {
    const v = Number(finalMarks[s] || 0);
    const p = (v / finalExam.max_marks) * 100;
    const pass = v >= finalExam.pass_marks;
    return `<tr><td>${i + 1}</td><td class="subj">${e(s)}</td><td>${finalExam.max_marks}</td>
      <td><b>${finalMarks[s] ?? "&mdash;"}</b></td><td>${gradeOf(p)[1]}</td>
      <td class="${pass ? "pass" : "fail"}"><b>${pass ? "Pass" : "Fail"}</b></td></tr>`;
  }).join("");
  const finalGot = finalExam.subjects.reduce((a, s) => a + Number(finalMarks[s] || 0), 0);
  const finalTot = finalExam.max_marks * finalExam.subjects.length;

  const termRows = terms.map((t) =>
    `<tr><td class="subj">${e(t.label)}</td><td>${t.obtained}</td><td>${t.total}</td><td>${t.pct.toFixed(2)}%</td><td>${gradeOf(t.pct)[1]}</td></tr>`
  ).join("");

  const inner = head(school, "Final Result - Consolidated Marksheet") + `
    <div class="center" style="margin-top:8px;font-size:13px;color:#5a6472">Annual Result &middot; Session ${e(school.session)}</div>
    <table class="kv">
      <tr><td class="k">Examination Roll No.</td><td><b>${e(student.exam_no || student.roll || "&mdash;")}</b></td><td class="k">Admission No.</td><td>${e(student.adm_no)}</td></tr>
      <tr><td class="k">Student's Name</td><td>${e(student.name)}</td><td class="k">Class / Section</td><td>${e(student.class)} &mdash; ${e(student.section)}</td></tr>
      <tr><td class="k">Father's Name</td><td>${e(student.father)}</td><td class="k">Mother's Name</td><td>${e(student.mother)}</td></tr>
      <tr><td class="k">Date of Birth</td><td>${fmtDate(student.dob)}</td><td class="k">PEN / Samagra</td><td>${e(student.pen_no)} / ${e(student.samagra_no)}</td></tr>
    </table>

    <div class="note" style="margin-top:14px;font-weight:700;color:#8a5a1a">A. Final Examination — subject-wise</div>
    <table class="marks" style="margin-top:6px">
      <thead><tr><th style="width:34px">S.No</th><th>Subject</th><th>Max</th><th>Obtained</th><th>Grade</th><th>Result</th></tr></thead>
      <tbody>${subjRows}
        <tr class="total"><td colspan="2" style="text-align:right">Final Total</td><td>${finalTot}</td><td>${finalGot}</td><td colspan="2"></td></tr>
      </tbody>
    </table>

    <div class="note" style="margin-top:14px;font-weight:700;color:#8a5a1a">B. Term-wise performance & average</div>
    <table class="marks" style="margin-top:6px">
      <thead><tr><th>Examination</th><th>Obtained</th><th>Total</th><th>Percentage</th><th>Grade</th></tr></thead>
      <tbody>${termRows}
        <tr class="total"><td style="text-align:right">Average of ${terms.length} exam(s)</td><td colspan="2"></td><td>${summary.averagePct.toFixed(2)}%</td><td>${summary.grade}</td></tr>
      </tbody>
    </table>

    <div class="summary">
      <div class="chip"><div class="lab">Average</div><div class="val">${summary.averagePct.toFixed(2)}%</div></div>
      <div class="chip"><div class="lab">Grade</div><div class="val">${summary.grade}</div></div>
      <div class="chip"><div class="lab">Division</div><div class="val">${summary.division}</div></div>
      <div class="chip"><div class="lab">Class Rank</div><div class="val">${summary.rank} / ${summary.outOf}</div></div>
      <div class="chip"><div class="lab">Result</div><div class="val ${summary.result === "PASS" ? "pass" : "fail"}">${summary.result}</div></div>
    </div>
    <div class="note">Average is the mean of the term percentages shown above. Rank is by average within the class/section. Grading &mdash; A1 91-100 &middot; A2 81-90 &middot; B1 71-80 &middot; B2 61-70 &middot; C1 51-60 &middot; C2 41-50 &middot; D 33-40 &middot; E below 33.</div>
    ${signRow(school, ["Class Teacher", "Exam In-charge", "Principal"])}
    ${seal(school, "RESULT")}`;
  return shell(inner, school);
}
export function tcHtml(school, student, tc) {
  const g = student.gender === "Female" ? "her" : "his";
  const row = (n, k, v) => `<tr><td class="k" style="padding:4px 9px">${n}. ${k}</td><td colspan="3" style="padding:4px 9px">${e(v || "&mdash;")}</td></tr>`;
  const inner = head(school, "Transfer Certificate") + `
    <div class="rowmeta" style="margin-top:8px"><span><b>TC No.:</b> ${e(tc.number)}</span><span><b>Admission No.:</b> ${e(student.adm_no)}</span><span><b>Date of Issue:</b> ${fmtDate(tc.date)}</span></div>
    <table class="kv" style="margin-top:8px;font-size:12px">
      ${row(1, "Name of the Student", student.name)}
      ${row(2, "Father's / Guardian's Name", student.father)}
      ${row(3, "Mother's Name", student.mother)}
      ${row(4, "PEN Number", student.pen_no)}
      ${row(5, "Samagra ID", student.samagra_no)}
      ${row(6, "Aadhaar Number", student.aadhar_no)}
      ${row(7, "Nationality / Category", student.nationality + " / " + student.category)}
      ${row(8, "Date of First Admission", fmtDate(student.doa))}
      ${row(9, "Date of Birth (figures)", fmtDate(student.dob))}
      ${row(10, "Date of Birth (words)", dobWords(student.dob))}
      ${row(11, "Class in which last studied", "Class " + tc.lastClass)}
      ${row(12, "Board examination last taken", school.board + ", " + school.session)}
      ${row(13, "Qualified for promotion", tc.qualifiedForPromotion + (tc.promotedTo ? " &mdash; promoted to Class " + tc.promotedTo : ""))}
      ${row(14, "Subjects studied", tc.subjectsStudied)}
      ${row(15, "Total working days", tc.workingDays)}
      ${row(16, "Days present", tc.daysPresent)}
      ${row(17, "Games / co-curricular activities", tc.gamesActivities)}
      ${row(18, "General conduct", tc.conduct)}
      ${row(19, "Whether all dues paid", tc.dues)}
      ${row(20, "Date of leaving school", fmtDate(tc.leavingDate))}
      ${row(21, "Reason for leaving", tc.reason)}
      ${row(22, "Any other remarks", tc.remarks)}
    </table>
    <div class="note">Certified that the above particulars are in accordance with the school Admission Register and that no entry has been erased or altered.</div>
    <div class="sign" style="margin-top:34px">
      <div class="box"><div class="line">Prepared by</div></div>
      <div class="box"><div class="line">Checked by</div></div>
      <div class="box"><div class="line">Principal</div><div style="font-size:10px">${e(school.principal)}</div></div>
    </div>
    ${sealLeft(school, "OFFICE<br>SEAL")}`;
  return shell(inner, school);
}

/* ------- Letter-style certificates ---------------------------------- */
function letter(school, student, title, ref, bodyHtml, roles) {
  const inner = head(school, title) + `
    <div class="rowmeta"><span><b>Ref. No.:</b> ${e(ref)}</span><span><b>Date:</b> ${fmtDate(today())}</span></div>
    <div class="body-txt">${bodyHtml}</div>
    ${signRow(school, roles)}
    ${seal(school, "SCHOOL<br>SEAL")}`;
  return shell(inner, school);
}

export function bonafideHtml(school, s) {
  const rel = s.gender === "Female" ? "daughter" : "son";
  const she = s.gender === "Female" ? "She" : "He";
  const her = s.gender === "Female" ? "her" : "his";
  const body = `This is to certify that <b>${e(s.name)}</b>, ${rel} of Shri <b>${e(s.father)}</b> and Smt. <b>${e(s.mother)}</b>,
    is a bonafide student of this school. ${she} is studying in <b>Class ${e(s.class)}, Section ${e(s.section)}</b>,
    bearing Admission No. <b>${e(s.adm_no)}</b>${s.pen_no ? `, PEN <b>${e(s.pen_no)}</b>` : ""}${s.samagra_no ? `, Samagra ID <b>${e(s.samagra_no)}</b>` : ""},
    during the academic session <b>${e(school.session)}</b>. As per the school Admission Register, ${her} date of birth is
    <b>${fmtDate(s.dob)}</b> (${dobWords(s.dob)}).<br><br>This certificate is issued on the request of the parent for official purposes.`;
  return letter(school, s, "Bonafide Certificate", `${school.initials}/BON/${s.adm_no}`, body, ["Office Clerk", "Class Teacher", "Principal"]);
}

export function characterHtml(school, s) {
  const rel = s.gender === "Female" ? "daughter" : "son";
  const she = s.gender === "Female" ? "She" : "He";
  const her = s.gender === "Female" ? "her" : "his";
  const body = `This is to certify that <b>${e(s.name)}</b>, ${rel} of Shri <b>${e(s.father)}</b>, was a student of this school
    in Class ${e(s.class)}, Section ${e(s.section)}, bearing Admission No. <b>${e(s.adm_no)}</b>. During ${her} stay in the school,
    ${her} conduct and character were found to be <b>good</b>. ${she} was never involved in any act of indiscipline.<br><br>
    We wish ${her} success in all future endeavours.`;
  return letter(school, s, "Character Certificate", `${school.initials}/CHR/${s.adm_no}`, body, ["Office Clerk", "Class Teacher", "Principal"]);
}

export function studyHtml(school, s) {
  const rel = s.gender === "Female" ? "daughter" : "son";
  const she = s.gender === "Female" ? "She" : "He";
  const body = `This is to certify that <b>${e(s.name)}</b>, ${rel} of Shri <b>${e(s.father)}</b>, has been studying in this school
    since <b>${fmtDate(s.doa)}</b> and is presently enrolled in <b>Class ${e(s.class)}, Section ${e(s.section)}</b> for the
    session <b>${e(school.session)}</b>. ${she} bears Admission No. ${e(s.adm_no)}${s.samagra_no ? `, Samagra ID ${e(s.samagra_no)}` : ""}.<br><br>
    This certificate is issued on request for official purposes.`;
  return letter(school, s, "Study Certificate", `${school.initials}/STD/${s.adm_no}`, body, ["Office Clerk", "Class Teacher", "Principal"]);
}

/* ------- Fee receipt ------------------------------------------------ */
export function receiptHtml(school, student, p) {
  const inner = head(school, "Fee Receipt") + `
    <div class="rowmeta"><span><b>Receipt No.:</b> ${e(p.receipt_no)}</span><span><b>Date:</b> ${fmtDate(p.date)}</span><span><b>Session:</b> ${e(school.session)}</span></div>
    <table class="kv">
      <tr><td class="k">Received from</td><td>${e(student.name)}</td><td class="k">Admission No.</td><td>${e(student.adm_no)}</td></tr>
      <tr><td class="k">Father's Name</td><td>${e(student.father)}</td><td class="k">Class / Section</td><td>${e(student.class)} &mdash; ${e(student.section)}</td></tr>
    </table>
    <table class="marks" style="margin-top:14px">
      <thead><tr><th>Particulars</th><th style="width:120px">Period</th><th style="width:130px">Amount</th></tr></thead>
      <tbody>
        <tr><td class="subj">${e(p.head)}${p.remark ? " &mdash; " + e(p.remark) : ""}</td><td>${e(p.months)}</td><td>${inr(p.amount)}</td></tr>
        <tr class="total"><td colspan="2" style="text-align:right">Total Received</td><td>${inr(p.amount)}</td></tr>
      </tbody>
    </table>
    <div class="note"><b>Rupees in words:</b> ${words(p.amount)} only &nbsp;&middot;&nbsp; <b>Mode:</b> ${e(p.mode)}</div>
    <div class="note">Fees once paid are not refundable. Please retain this receipt for your records.</div>
    ${signRow(school, ["Received by", "Accountant", "Principal"])}
    ${seal(school, "ACCOUNTS")}`;
  return shell(inner, school);
}

/* ------- Staff letters: generic letter on letterhead ---------------- */
function staffLetter(school, title, ref, bodyHtml, roles, sealTxt) {
  const inner = head(school, title) + `
    <div class="rowmeta" style="margin-top:6px"><span><b>Ref. No.:</b> ${e(ref)}</span><span><b>Date:</b> ${fmtDate(today())}</span></div>
    <div class="body-txt">${bodyHtml}</div>
    ${signRow(school, roles)}
    ${seal(school, sealTxt || "SCHOOL<br>SEAL")}`;
  return shell(inner, school);
}

export function experienceLetterHtml(school, st) {
  const title = st.gender === "Female" ? "Ms." : "Mr.";
  const she = st.gender === "Female" ? "She" : "He";
  const her = st.gender === "Female" ? "her" : "his";
  const period = `${fmtDate(st.doj)}${st.dol ? " to " + fmtDate(st.dol) : " till date"}`;
  const body = `This is to certify that <b>${title} ${e(st.name)}</b>${st.guardian ? `, ${e(st.guardian)}` : ""} has worked at
    <b>${e(school.name)}</b> as <b>${e(st.designation || "a member of staff")}</b>${st.department ? ` in the ${e(st.department)} department` : ""}
    ${st.subject ? `(teaching ${e(st.subject)}) ` : ""}for the period <b>${period}</b>.
    <br><br>During ${her} tenure, ${she} was found to be sincere, hardworking and professionally competent.
    ${she} maintained good conduct and discharged all assigned duties to our satisfaction.
    <br><br>We wish ${her} continued success in ${her} future endeavours.`;
  return staffLetter(school, "Experience Certificate", `${school.initials}/EXP/${st.emp_id || st.id || ""}`, body,
    ["HR / Office", "Principal"], "HR<br>SEAL");
}

export function joiningLetterHtml(school, st) {
  const title = st.gender === "Female" ? "Ms." : "Mr.";
  const body = `Dear <b>${title} ${e(st.name)}</b>,<br><br>
    With reference to your application and subsequent interview, we are pleased to appoint you as
    <b>${e(st.designation || "a member of staff")}</b>${st.department ? ` in the <b>${e(st.department)}</b> department` : ""} at
    <b>${e(school.name)}</b>${st.subject ? `, primarily for teaching <b>${e(st.subject)}</b>` : ""}.
    <br><br>Your date of joining is <b>${fmtDate(st.doj)}</b>${st.salary ? `, and your consolidated monthly remuneration will be <b>${inr(st.salary)}</b>` : ""}.
    You will be governed by the rules, regulations and code of conduct of the school as amended from time to time.
    <br><br>We welcome you to the ${e(school.name)} family and look forward to a long and mutually rewarding association.`;
  return staffLetter(school, "Appointment / Joining Letter", `${school.initials}/APPT/${st.emp_id || st.id || ""}`, body,
    ["Candidate's Signature", "Principal"], "OFFICE<br>SEAL");
}

/* ------- Blank letterhead / letter pad ------------------------------ */
/* opts = { title, ref, date, to, subject, body(plain text with \n), signOff, signatory } */
export function letterheadHtml(school, opts) {
  const paras = String(opts.body || "").split(/\n{1,}/).map((p) => `<p style="margin:0 0 12px">${e(p)}</p>`).join("");
  const inner = head(school, opts.title || "Official Letter") + `
    <div class="rowmeta" style="margin-top:6px">
      <span><b>Ref. No.:</b> ${e(opts.ref || "—")}</span>
      <span><b>Date:</b> ${opts.date ? fmtDate(opts.date) : fmtDate(today())}</span>
    </div>
    ${opts.to ? `<div class="body-txt" style="margin-top:20px">To,<br>${e(opts.to).replace(/\n/g, "<br>")}</div>` : ""}
    ${opts.subject ? `<div style="margin-top:14px;font-weight:700">Subject: ${e(opts.subject)}</div>` : ""}
    <div class="body-txt" style="margin-top:14px">${paras}</div>
    <div style="margin-top:44px">
      <div>${e(opts.signOff || "Yours faithfully,")}</div>
      <div style="height:46px"></div>
      <div style="font-weight:700">${e(opts.signatory || school.principal)}</div>
      <div style="font-size:11px;color:#5a6472">${e(school.name)}</div>
    </div>
    ${seal(school, "SCHOOL<br>SEAL")}`;
  return shell(inner, school);
}