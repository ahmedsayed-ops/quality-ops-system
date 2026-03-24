// ================================================================
//  src/services/api.js
//  Field names match Excel sheets exactly:
//    Calls  → Quality H (2026) columns
//    Complaints → Complaints H (2026) columns
// ================================================================

import config from "../config";
const EP = config.APPS_SCRIPT_URL;

async function post(payload) {
  let res;
  try {
    res = await fetch(EP, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
  } catch { throw new Error("Network error — check your connection."); }
  if (!res.ok) throw new Error(`Server error ${res.status}.`);
  let r; try { r = await res.json(); } catch { return; }
  if (r && r.success === false) throw new Error(r.message || "Rejected by server.");
}

async function get(module, fallback) {
  let res;
  try { res = await fetch(`${EP}?module=${module}`, { method: "GET" }); }
  catch { console.warn(`[API] ${module} offline — demo data`); return fallback(); }
  if (!res.ok) { console.warn(`[API] HTTP ${res.status}`); return fallback(); }
  let r; try { r = await res.json(); } catch { return fallback(); }
  if (!r?.success) { console.warn(`[API] success=false`); return fallback(); }
  return r.data || [];
}

const byTsDesc = (a, b) => new Date(b.timestamp||0) - new Date(a.timestamp||0);

// ── VISITS ────────────────────────────────────────────────────────
export const submitVisit = p => post({ module:"visits", ...p });

export async function fetchVisits() {
  const rows = await get("visits", demoVisits);
  return rows.map(r => normalise(r, V_COL_MAP)).sort(byTsDesc);
}
const V_COL_MAP = {
  "Timestamp":"timestamp","Branch User":"branchUser","Field Agent User":"agentUser",
  "Branch Employee Name":"employeeName","Mobile Number":"mobile","Visit Date":"visitDate",
  "Project Awareness":"q1","Burn Methods Awareness":"q2",
  "Live Email Received":"q3","Support Number Awareness":"q4","Comments":"comments"
};

// ── CALLS — Quality H (2026) columns ─────────────────────────────
// POST fields (camelCase) → saved to sheet under original column names
export const submitCall = p => post({ module:"calls", ...p });

export async function fetchCalls() {
  const rows = await get("calls", demoCalls);
  return rows.map(r => normalise(r, C_COL_MAP)).sort(byTsDesc);
}

// Sheet col name → camelCase key used by the app
const C_COL_MAP = {
  "Timestamp":"timestamp",
  "Agent Name":"agentName",
  "Evaluator Name":"evaluatorName",
  "Call Date":"callDate",
  "Call Time":"callTime",
  "Customer Name":"customerName",
  "Customer Mobile":"customerMobile",
  "Branch":"branch",
  "Department":"department",
  "Call Type":"callType",
  "Call Result":"callResult",
  "Call Duration":"callDuration",
  "cq1":"cq1",
  "cq2":"cq2",
  "cq3":"cq3",
  "cq4":"cq4",
  "cq5":"cq5",
  "cq6":"cq6",
  "cq7":"cq7",
  "cq8":"cq8",
  "cq9":"cq9",
  "cq10":"cq10",
  "Score":"score",
  "Comments":"comments",
  "Follow Up":"followUp"
};

// ── COMPLAINTS — Complaints H (2026) columns ──────────────────────
export const submitComplaint = p => post({ module:"complaints", ...p });

export async function fetchComplaints() {
  const rows = await get("complaints", demoComplaints);
  return rows.map(r => normalise(r, K_COL_MAP)).sort(byTsDesc);
}

const K_COL_MAP = {
  "Timestamp":"timestamp",
  "Call Date":"callDate",
  "Visit Customer Date":"visitCustomerDate",
  "Username":"username",
  "Password":"password",
  "Merchant name ":"merchantName",
  "Merchant name":"merchantName",
  "Project ":"project",
  "Project":"project",
  "Address":"address",
  "District":"district",
  "Government":"government",
  "Employee Name":"employeeName",
  "Branch Number":"branchNumber",
  "Description":"description",
  "Solve The complaint ":"solveComplaint",
  "Solve The complaint":"solveComplaint",
  "Type Of Issue":"typeOfIssue",
  "Link":"link",
  "comment":"comment"
};

function normalise(raw, map) {
  const o = {};
  for (const [k, v] of Object.entries(raw)) o[map[k] ?? k] = v ?? "";
  return o;
}

// ── DEMO DATA ─────────────────────────────────────────────────────
function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

function demoVisits() {
  const agents = ["Ahmed Samy","Sara Khaled","Omar Tarek","Dina Fouad","Karim Hassan"];
  const branches = ["Branch Alpha","Branch Beta","Branch Gamma","Branch Delta"];
  const aw = ["Aware","Not Aware"], yn = ["Yes","No"];
  return Array.from({length:50}, (_, i) => {
    const d = daysAgo(i % 30);
    return { timestamp:d.toISOString(), branchUser:branches[i%branches.length],
      agentUser:agents[i%agents.length], employeeName:`Employee ${i+1}`,
      mobile:`010${String(10000007+i*7).slice(0,8)}`,
      visitDate:d.toISOString().slice(0,10),
      q1:rnd(aw), q2:rnd(aw), q3:rnd(yn), q4:rnd(aw),
      comments:`Visit note #${i+1}` };
  });
}

function demoCalls() {
  const execs   = ["Mohamed Elnagar","Sayed Ashraf","Hany Kamal","Ahmed AbdelLatif","Mohamed Gohar","Amr Tarek"];
  const merchants = ["B.Tech","Kheir Zaman","Gomla Market","Carrefour","Defacto","Kanses"];
  const govs    = ["Cairo","Alexandria","Giza","Delta","Qanal","Upper Egypt"];
  const projects = config.QUALITY_PROJECTS.slice(0, 6);
  const aw = ["Aware","Unaware"], yn = ["Yes","No"];
  const tools = ["Merchant Center","Device"];
  const statuses = config.BRANCH_STATUSES;
  const types = config.CALL_TYPES;
  return Array.from({length:60}, (_, i) => {
    const d = daysAgo(i % 30);
    const status = rnd(statuses);
    const reached = status === "Correct No.";
    return {
      timestamp: d.toISOString(),
      callDate: d.toISOString().slice(0,10),
      visitDate: "",
      filedExecutive: rnd(execs),
      userName: `DSQ0${String(14+i%6).padStart(2,"0")}.0${String(70+i%50).padStart(2,"0")}`,
      merchantName: rnd(merchants),
      address: `Address ${i+1}`,
      district: rnd(["Down Town","Nasr City","Maadi","Shoubra","Heliopolis"]),
      government: rnd(govs),
      project: rnd(projects),
      callType: rnd(types),
      employeeName: `Employee ${i+1}`,
      branchNumber: String(1000000000+i*7777).slice(0,10),
      branchStatus: status,
      projectAwareness: reached ? rnd(aw) : "",
      awareAfterCall:   reached ? rnd(aw) : "",
      burningTool:      reached ? rnd(tools) : "",
      burningSteps:     reached ? rnd(aw) : "",
      supportLine:      reached ? rnd(aw) : "",
      liveEmail:        reached ? rnd(yn) : "",
      deviceSimIssues:  rnd(["No Issues","SIM Issue",""]),
      comments: i % 4 === 0 ? `ملاحظة ${i+1}` : "",
      link: ""
    };
  });
}

function demoComplaints() {
  const merchants = ["Kheir Zaman","Defacto","Gomla Market","Kanses","B.Tech","Carrefour"];
  const projects  = config.COMPLAINT_PROJECTS.slice(0, 6);
  const govs      = ["Cairo","Alexandria","Giza","Delta"];
  const issues    = config.COMPLAINT_ISSUE_TYPES;
  const emps      = ["Ayman","Eslam","Norhan","Menna","Ahmed","Sara","Omar"];
  return Array.from({length:45}, (_, i) => {
    const d = daysAgo(i % 45);
    const solved = i % 3 !== 0;
    return {
      timestamp: d.toISOString(),
      callDate: d.toISOString().slice(0,10),
      visitCustomerDate: "",
      username: `DSQ${String(100+i*3).padStart(3,"0")}.0${String(10+i%90).padStart(2,"0")}`,
      password: "Dsq@****",
      merchantName: rnd(merchants),
      project: rnd(projects),
      address: `Address ${i+1}`,
      district: "",
      government: rnd(govs),
      employeeName: rnd(emps),
      branchNumber: String(1000000000+i*3333).slice(0,10),
      description: `Customer complaint #${i+1}: detailed description of the issue`,
      solveComplaint: solved ? "تم التواصل مع الفرع وتم حل المشكلة" : "",
      typeOfIssue: rnd(issues),
      link: i % 3 === 0 ? `https://app.asana.com/task/${1200000000+i}` : "",
      comment: ""
    };
  });
}
