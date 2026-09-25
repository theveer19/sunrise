import { app, shell, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as DB from "./db.js";
import * as WA from "./whatsapp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    title: "Sunrise Montessori ERP",
    backgroundColor: "#f7f3ec",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });

  mainWindow.on("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler((d) => { shell.openExternal(d.url); return { action: "deny" }; });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  DB.initDB();
  registerIpc();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

/* -------------------------------------------------------------------- */
/*  IPC                                                                  */
/* -------------------------------------------------------------------- */
function registerIpc() {
  const h = (channel, fn) => ipcMain.handle(channel, (_e, ...a) => fn(...a));

  // settings
  h("settings:get", () => DB.getSettings());
  h("settings:save", (s) => DB.saveSettings(s));

  // students
  h("students:list", () => DB.listStudents());
  h("students:save", (s) => DB.saveStudent(s));
  h("students:delete", (id) => DB.deleteStudent(id));

  // staff / teachers
  h("staff:list", () => DB.listStaff());
  h("staff:save", (s) => DB.saveStaff(s));
  h("staff:delete", (id) => DB.deleteStaff(id));

  // exams
  h("exams:list", () => DB.listExams());
  h("exams:save", (e) => DB.saveExam(e));
  h("exams:delete", (id) => DB.deleteExam(id));
  h("marks:get", (examId) => DB.getMarks(examId));
  h("marks:set", (examId, sid, sub, m) => DB.setMark(examId, sid, sub, m));

  // fees
  h("fees:list", () => DB.listFees());
  h("fees:paidFor", (id) => DB.feesForStudent(id));
  h("fees:add", (f) => DB.addFee(f));
  h("fees:delete", (id) => DB.deleteFee(id));
  h("fees:structure:get", () => DB.getFeeStructure());
  h("fees:structure:set", (m) => DB.setFeeStructure(m));

  // expenses
  h("expenses:list", () => DB.listExpenses());
  h("expenses:add", (x) => DB.addExpense(x));
  h("expenses:delete", (id) => DB.deleteExpense(id));

  // certificates
  h("cert:list", (type) => DB.listCertificates(type));
  h("cert:issueTC", (p) => DB.issueTC(p));

  // attendance
  h("att:forDay", (d, c, s) => DB.attendanceForDay(d, c, s));
  h("att:forMonth", (m, c, s) => DB.attendanceForMonth(m, c, s));
  h("att:mark", (rows) => DB.markAttendance(rows));
  h("att:summary", (m) => DB.attendanceSummary(m));
  h("att:staffForDay", (d) => DB.staffAttendanceForDay(d));
  h("att:staffMark", (rows) => DB.markStaffAttendance(rows));
  h("att:staffSummary", (m) => DB.staffAttendanceSummary(m));

  // timetable
  h("tt:list", () => DB.listTimetable());
  h("tt:forClass", (c, s) => DB.listTimetable().filter((t) => t.class === c && t.section === s));
  h("tt:forTeacher", (id) => DB.listTimetable().filter((t) => Number(t.staff_id) === Number(id)));
  h("tt:save", (row) => DB.saveTimetable(row));
  h("tt:delete", (id) => DB.deleteTimetable(id));
  h("tt:clear", (c, s) => DB.clearTimetable(c, s));

  // library
  h("lib:books", () => DB.listBooks());
  h("lib:saveBook", (b) => DB.saveBook(b));
  h("lib:deleteBook", (id) => DB.deleteBook(id));
  h("lib:issues", () => DB.listIssues());
  h("lib:issue", (rec) => DB.issueBook(rec));
  h("lib:return", (id, date, fine) => DB.returnBook(id, date, fine));
  h("lib:deleteIssue", (id) => DB.deleteIssue(id));

  // transport
  h("tr:routes", () => DB.listRoutes());
  h("tr:saveRoute", (r) => DB.saveRoute(r));
  h("tr:deleteRoute", (id) => DB.deleteRoute(id));
  h("tr:allotments", () => DB.listTransportAllot());
  h("tr:allot", (a) => DB.allotTransport(a));
  h("tr:unallot", (id) => DB.unallotTransport(id));

  // hostel
  h("hs:rooms", () => DB.listRooms());
  h("hs:saveRoom", (r) => DB.saveRoom(r));
  h("hs:deleteRoom", (id) => DB.deleteRoom(id));
  h("hs:allotments", () => DB.listHostelAllot());
  h("hs:allot", (a) => DB.allotHostel(a));
  h("hs:unallot", (id) => DB.unallotHostel(id));

  // notices / homework / events
  h("cm:notices", () => DB.listNotices());
  h("cm:saveNotice", (n) => DB.saveNotice(n));
  h("cm:deleteNotice", (id) => DB.deleteNotice(id));
  h("cm:homework", () => DB.listHomework());
  h("cm:saveHomework", (x) => DB.saveHomework(x));
  h("cm:deleteHomework", (id) => DB.deleteHomework(id));
  h("cm:events", () => DB.listEvents());
  h("cm:saveEvent", (e) => DB.saveEvent(e));
  h("cm:deleteEvent", (id) => DB.deleteEvent(id));

  // payroll
  h("pr:list", () => DB.listPayroll());
  h("pr:save", (p) => DB.savePayroll(p));
  h("pr:delete", (id) => DB.deletePayroll(id));
  h("pr:generate", (m) => DB.generatePayroll(m));

  // dashboard
  h("dashboard:get", () => DB.dashboard());

  // pdf export — receives ready-to-print HTML, returns saved path
  h("pdf:save", async (html, suggestedName) => savePdf(html, suggestedName));
  h("pdf:print", async (html) => printHtml(html));

  // whatsapp
  h("wa:status", () => WA.getStatus());
  h("wa:connect", () => WA.connect((s) => mainWindow?.webContents.send("wa:event", s)));
  h("wa:send", (num, text) => WA.sendMessage(num, text));
  h("wa:disconnect", () => WA.disconnect());
  h("wa:quick", (num, text) => {
    let n = String(num || "").replace(/\D/g, "");
    if (n.length === 10) n = "91" + n;
    shell.openExternal(`https://wa.me/${n}?text=${encodeURIComponent(text)}`);
    return { ok: true };
  });
}

/* ---- PDF / print via a hidden window ------------------------------- */
function pageHtml(inner) {
  return `<!doctype html><html><head><meta charset="utf-8">
  <style>@page{size:A4;margin:0} html,body{margin:0;padding:0;background:#fff}</style>
  </head><body>${inner}</body></html>`;
}

async function withHiddenWindow(html, cb) {
  const win = new BrowserWindow({ show: false, webPreferences: { offscreen: false } });
  await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(pageHtml(html)));
  await new Promise((r) => setTimeout(r, 350)); // let fonts/layout settle
  try { return await cb(win); } finally { win.destroy(); }
}

async function savePdf(html, suggestedName = "document.pdf") {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "Save PDF",
    defaultPath: suggestedName,
    filters: [{ name: "PDF", extensions: ["pdf"] }]
  });
  if (canceled || !filePath) return { ok: false, canceled: true };
  return withHiddenWindow(html, async (win) => {
    const data = await win.webContents.printToPDF({ printBackground: true, pageSize: "A4" });
    fs.writeFileSync(filePath, data);
    shell.showItemInFolder(filePath);
    return { ok: true, path: filePath };
  });
}

async function printHtml(html) {
  return withHiddenWindow(html, (win) => new Promise((resolve) => {
    win.webContents.print({ printBackground: true }, (success) => resolve({ ok: success }));
  }));
}