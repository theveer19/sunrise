import { contextBridge, ipcRenderer } from "electron";

const api = {
  platform: "desktop",
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    save: (s) => ipcRenderer.invoke("settings:save", s)
  },
  students: {
    list: () => ipcRenderer.invoke("students:list"),
    save: (s) => ipcRenderer.invoke("students:save", s),
    remove: (id) => ipcRenderer.invoke("students:delete", id)
  },
  staff: {
    list: () => ipcRenderer.invoke("staff:list"),
    save: (s) => ipcRenderer.invoke("staff:save", s),
    remove: (id) => ipcRenderer.invoke("staff:delete", id)
  },
  exams: {
    list: () => ipcRenderer.invoke("exams:list"),
    save: (e) => ipcRenderer.invoke("exams:save", e),
    remove: (id) => ipcRenderer.invoke("exams:delete", id),
    marks: (examId) => ipcRenderer.invoke("marks:get", examId),
    setMark: (examId, sid, sub, m) => ipcRenderer.invoke("marks:set", examId, sid, sub, m)
  },
  fees: {
    list: () => ipcRenderer.invoke("fees:list"),
    paidFor: (id) => ipcRenderer.invoke("fees:paidFor", id),
    add: (f) => ipcRenderer.invoke("fees:add", f),
    remove: (id) => ipcRenderer.invoke("fees:delete", id),
    getStructure: () => ipcRenderer.invoke("fees:structure:get"),
    setStructure: (m) => ipcRenderer.invoke("fees:structure:set", m)
  },
  expenses: {
    list: () => ipcRenderer.invoke("expenses:list"),
    add: (x) => ipcRenderer.invoke("expenses:add", x),
    remove: (id) => ipcRenderer.invoke("expenses:delete", id)
  },
  cert: {
    list: (type) => ipcRenderer.invoke("cert:list", type),
    issueTC: (p) => ipcRenderer.invoke("cert:issueTC", p)
  },
  auth: {
    staffLogin: (empId, password) => ipcRenderer.invoke("auth:staffLogin", empId, password),
    setStaffPassword: (id, password) => ipcRenderer.invoke("auth:setStaffPassword", id, password),
    studentLogin: (admNo, password) => ipcRenderer.invoke("auth:studentLogin", admNo, password),
    setStudentPassword: (id, password) => ipcRenderer.invoke("auth:setStudentPassword", id, password)
  },
  attendance: {
    forDay: (date, cls, sec) => ipcRenderer.invoke("att:forDay", date, cls, sec),
    forMonth: (month, cls, sec) => ipcRenderer.invoke("att:forMonth", month, cls, sec),
    mark: (rows) => ipcRenderer.invoke("att:mark", rows),
    summary: (month) => ipcRenderer.invoke("att:summary", month),
    staffForDay: (date) => ipcRenderer.invoke("att:staffForDay", date),
    staffMark: (rows) => ipcRenderer.invoke("att:staffMark", rows),
    staffSummary: (month) => ipcRenderer.invoke("att:staffSummary", month)
  },
  timetable: {
    list: () => ipcRenderer.invoke("tt:list"),
    forClass: (cls, sec) => ipcRenderer.invoke("tt:forClass", cls, sec),
    forTeacher: (id) => ipcRenderer.invoke("tt:forTeacher", id),
    save: (row) => ipcRenderer.invoke("tt:save", row),
    remove: (id) => ipcRenderer.invoke("tt:delete", id),
    clearClass: (cls, sec) => ipcRenderer.invoke("tt:clear", cls, sec)
  },
  library: {
    books: () => ipcRenderer.invoke("lib:books"),
    saveBook: (b) => ipcRenderer.invoke("lib:saveBook", b),
    removeBook: (id) => ipcRenderer.invoke("lib:deleteBook", id),
    issues: () => ipcRenderer.invoke("lib:issues"),
    issue: (rec) => ipcRenderer.invoke("lib:issue", rec),
    returnBook: (id, date, fine) => ipcRenderer.invoke("lib:return", id, date, fine),
    removeIssue: (id) => ipcRenderer.invoke("lib:deleteIssue", id)
  },
  transport: {
    routes: () => ipcRenderer.invoke("tr:routes"),
    saveRoute: (r) => ipcRenderer.invoke("tr:saveRoute", r),
    removeRoute: (id) => ipcRenderer.invoke("tr:deleteRoute", id),
    allotments: () => ipcRenderer.invoke("tr:allotments"),
    allot: (a) => ipcRenderer.invoke("tr:allot", a),
    unallot: (id) => ipcRenderer.invoke("tr:unallot", id)
  },
  hostel: {
    rooms: () => ipcRenderer.invoke("hs:rooms"),
    saveRoom: (r) => ipcRenderer.invoke("hs:saveRoom", r),
    removeRoom: (id) => ipcRenderer.invoke("hs:deleteRoom", id),
    allotments: () => ipcRenderer.invoke("hs:allotments"),
    allot: (a) => ipcRenderer.invoke("hs:allot", a),
    unallot: (id) => ipcRenderer.invoke("hs:unallot", id)
  },
  comms: {
    notices: () => ipcRenderer.invoke("cm:notices"),
    saveNotice: (n) => ipcRenderer.invoke("cm:saveNotice", n),
    removeNotice: (id) => ipcRenderer.invoke("cm:deleteNotice", id),
    homework: () => ipcRenderer.invoke("cm:homework"),
    saveHomework: (h) => ipcRenderer.invoke("cm:saveHomework", h),
    removeHomework: (id) => ipcRenderer.invoke("cm:deleteHomework", id),
    events: () => ipcRenderer.invoke("cm:events"),
    saveEvent: (e) => ipcRenderer.invoke("cm:saveEvent", e),
    removeEvent: (id) => ipcRenderer.invoke("cm:deleteEvent", id)
  },
  payroll: {
    list: () => ipcRenderer.invoke("pr:list"),
    save: (p) => ipcRenderer.invoke("pr:save", p),
    remove: (id) => ipcRenderer.invoke("pr:delete", id),
    generate: (month) => ipcRenderer.invoke("pr:generate", month)
  },
  dashboard: () => ipcRenderer.invoke("dashboard:get"),
  pdf: {
    save: (html, name) => ipcRenderer.invoke("pdf:save", html, name),
    print: (html) => ipcRenderer.invoke("pdf:print", html)
  },
  wa: {
    status: () => ipcRenderer.invoke("wa:status"),
    connect: () => ipcRenderer.invoke("wa:connect"),
    send: (num, text) => ipcRenderer.invoke("wa:send", num, text),
    quick: (num, text) => ipcRenderer.invoke("wa:quick", num, text),
    disconnect: () => ipcRenderer.invoke("wa:disconnect"),
    onEvent: (cb) => {
      const listener = (_e, s) => cb(s);
      ipcRenderer.on("wa:event", listener);
      return () => ipcRenderer.removeListener("wa:event", listener);
    }
  }
};

contextBridge.exposeInMainWorld("api", api);