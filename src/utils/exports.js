import * as XLSX from "xlsx";

function dl(blob, fn) {
  const a = Object.assign(document.createElement("a"), { href:URL.createObjectURL(blob), download:fn });
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
}
function mkCSV(h, rows) {
  return [h,...rows].map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
}
function mkXLSX(h, rows, sheet, fn) {
  const ws = XLSX.utils.aoa_to_sheet([h,...rows]);
  ws["!cols"] = h.map(()=>({wch:20}));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,sheet);
  XLSX.writeFile(wb,fn);
}

// Visits
const VH = ["Timestamp","Branch User","Agent","Employee","Mobile","Visit Date","Q1 Project","Q2 Burn Methods","Q3 Live Email","Q4 Support","Comments"];
const vr = r => [r.timestamp,r.branchUser,r.agentUser,r.employeeName,r.mobile,r.visitDate,r.q1,r.q2,r.q3,r.q4,r.comments];
export const exportVisitsCSV   = rs => dl(new Blob(["\uFEFF"+mkCSV(VH,rs.map(vr))],{type:"text/csv;charset=utf-8;"}),"visits.csv");
export const exportVisitsExcel = rs => mkXLSX(VH,rs.map(vr),"Visits","visits.xlsx");

// Calls — Quality H (2026) format
const CH = ["Timestamp","Call Date","Visit Date","Filed Executive","User Name","Merchant Name","Address","District","Government","Project","Call Type","Employee Name","Branch Number","Branch Status","Project Awareness","Aware After Call","Burning Tool","Burning Steps","Support Line","Live Email","Device/SIM Issues","Comments","Link"];
const cr = r => [r.timestamp,r.callDate,r.visitDate,r.filedExecutive,r.userName,r.merchantName,r.address,r.district,r.government,r.project,r.callType,r.employeeName,r.branchNumber,r.branchStatus,r.projectAwareness,r.awareAfterCall,r.burningTool,r.burningSteps,r.supportLine,r.liveEmail,r.deviceSimIssues,r.comments,r.link];
export const exportCallsCSV   = rs => dl(new Blob(["\uFEFF"+mkCSV(CH,rs.map(cr))],{type:"text/csv;charset=utf-8;"}),"calls.csv");
export const exportCallsExcel = rs => mkXLSX(CH,rs.map(cr),"Calls Quality","calls.xlsx");

// Complaints — Complaints H (2026) format
const KH = ["Timestamp","Call Date","Visit Customer Date","Username","Password","Merchant Name","Project","Address","District","Government","Employee Name","Branch Number","Description","Solve The Complaint","Type Of Issue","Link","Comment"];
const kr = r => [r.timestamp,r.callDate,r.visitCustomerDate,r.username,r.password,r.merchantName,r.project,r.address,r.district,r.government,r.employeeName,r.branchNumber,r.description,r.solveComplaint,r.typeOfIssue,r.link,r.comment];
export const exportComplaintsCSV   = rs => dl(new Blob(["\uFEFF"+mkCSV(KH,rs.map(kr))],{type:"text/csv;charset=utf-8;"}),"complaints.csv");
export const exportComplaintsExcel = rs => mkXLSX(KH,rs.map(kr),"Complaints","complaints.xlsx");
