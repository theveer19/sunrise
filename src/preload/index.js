import { contextBridge, ipcRenderer } from "electron";

const api = {
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
    onEvent: (cb) => { ipcRenderer.on("wa:event", (_e, s) => cb(s)); }
  }
};

contextBridge.exposeInMainWorld("api", api);