// ================================================================
//  Quality Operations Platform — Apps Script Backend
//  Columns match real Excel sheets exactly:
//    Calls_Data     ← Quality H (2026) structure
//    Complaints_Data ← Complaints H (2026) structure
// ================================================================

var SHEETS = {
  visits:     "Visits_Data",
  calls:      "Calls_Data",
  complaints: "Complaints_Data"
};

// Visits columns
var VISIT_COLS = [
  "Timestamp","Branch User","Field Agent User","Branch Employee Name",
  "Mobile Number","Visit Date","Project Awareness","Burn Methods Awareness",
  "Live Email Received","Support Number Awareness","Comments"
];

// Calls columns — Quality H (2026) exact structure
var CALL_COLS = [
  "Timestamp",
  "Call Date",         // callDate
  "Visit Date",        // visitDate
  "Filed Excutive",    // filedExecutive (note: original typo preserved)
  "User Name",         // userName
  "Merchant Name",     // merchantName
  "Address",           // address
  "District",          // district
  "Government",        // government
  "Project",           // project
  "Call Type",         // callType
  "Employee Name",     // employeeName
  "Branch Number",     // branchNumber
  "Branch No. Status", // branchStatus
  "Project Awareness", // projectAwareness
  "Aware After Call",  // awareAfterCall
  "Burning Tool",      // burningTool
  "Burning Steps",     // burningSteps
  "Support Line",      // supportLine
  "Live Email",        // liveEmail
  "Device Or SIM Issues", // deviceSimIssues
  "Comments",          // comments
  "Link"               // link
];

// Complaints columns — Complaints H (2026) exact structure
var COMPLAINT_COLS = [
  "Timestamp",
  "Call Date",              // callDate
  "Visit Customer Date",    // visitCustomerDate
  "Username",               // username
  "Password",               // password
  "Merchant name ",         // merchantName (note: trailing space in original)
  "Project ",               // project (note: trailing space in original)
  "Address",                // address
  "District",               // district
  "Government",             // government
  "Employee Name",          // employeeName
  "Branch Number",          // branchNumber
  "Description",            // description
  "Solve The complaint ",   // solveComplaint (note: trailing space)
  "Type Of Issue",          // typeOfIssue
  "Link",                   // link
  "comment"                 // comment
];

// ── doPost ───────────────────────────────────────────────────────
function doPost(e) {
  try {
    var body   = JSON.parse(e.postData.contents);
    var module = body.module;
    if (module === "visits")     return saveVisit(body);
    if (module === "calls")      return saveCall(body);
    if (module === "complaints") return saveComplaint(body);
    return ok({ success:false, message:"Unknown module: " + module });
  } catch(err) {
    Logger.log("doPost error: " + err.message);
    return ok({ success:false, message:"Server error: " + err.message });
  }
}

function saveVisit(b) {
  var ts    = new Date().toISOString();
  var sheet = getOrCreate(SHEETS.visits, VISIT_COLS);
  sheet.appendRow([
    ts, b.branchUser||"", b.agentUser||"", b.employeeName||"",
    b.mobile||"", b.visitDate||"",
    b.q1||"", b.q2||"", b.q3||"", b.q4||"", b.comments||""
  ]);
  return ok({ success:true, message:"Visit saved" });
}

function saveCall(b) {
  var ts    = new Date().toISOString();
  var sheet = getOrCreate(SHEETS.calls, CALL_COLS);
  sheet.appendRow([
    ts,
    b.callDate||"",
    b.visitDate||"",
    b.filedExecutive||"",
    b.userName||"",
    b.merchantName||"",
    b.address||"",
    b.district||"",
    b.government||"",
    b.project||"",
    b.callType||"",
    b.employeeName||"",
    b.branchNumber||"",
    b.branchStatus||"",
    b.projectAwareness||"",
    b.awareAfterCall||"",
    b.burningTool||"",
    b.burningSteps||"",
    b.supportLine||"",
    b.liveEmail||"",
    b.deviceSimIssues||"",
    b.comments||"",
    b.link||""
  ]);
  return ok({ success:true, message:"Call saved" });
}

function saveComplaint(b) {
  var ts    = new Date().toISOString();
  var sheet = getOrCreate(SHEETS.complaints, COMPLAINT_COLS);
  sheet.appendRow([
    ts,
    b.callDate||"",
    b.visitCustomerDate||"",
    b.username||"",
    b.password||"",
    b.merchantName||"",
    b.project||"",
    b.address||"",
    b.district||"",
    b.government||"",
    b.employeeName||"",
    b.branchNumber||"",
    b.description||"",
    b.solveComplaint||"",
    b.typeOfIssue||"",
    b.link||"",
    b.comment||""
  ]);
  return ok({ success:true, message:"Complaint saved" });
}

// ── doGet ─────────────────────────────────────────────────────────
function doGet(e) {
  try {
    var module = (e.parameter || {}).module || "visits";
    if (module === "visits")     return readSheet(SHEETS.visits);
    if (module === "calls")      return readSheet(SHEETS.calls);
    if (module === "complaints") return readSheet(SHEETS.complaints);
    return ok({ success:false, message:"Unknown module: " + module });
  } catch(err) {
    Logger.log("doGet error: " + err.message);
    return ok({ success:false, message:"Server error: " + err.message });
  }
}

function readSheet(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return ok({ success:true, data:[], count:0 });

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return ok({ success:true, data:[], count:0 });

  var headers = data[0];
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var record = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val instanceof Date)
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
      record[String(headers[j])] = val !== undefined ? String(val) : "";
    }
    records.push(record);
  }

  // Sort newest first
  records.sort(function(a,b) {
    return (b["Timestamp"]||"").localeCompare(a["Timestamp"]||"");
  });

  return ok({ success:true, data:records, count:records.length });
}

// ── Helpers ───────────────────────────────────────────────────────
function getOrCreate(sheetName, headers) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    var rng = sheet.getRange(1, 1, 1, headers.length);
    rng.setBackground("#1d4ed8");
    rng.setFontColor("#ffffff");
    rng.setFontWeight("bold");
    rng.setFontSize(10);
    sheet.setFrozenRows(1);
    for (var i = 0; i < headers.length; i++) sheet.setColumnWidth(i+1, 160);
    Logger.log("Created sheet: " + sheetName);
  }
  return sheet;
}

function ok(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run once to create all sheets
function initAllSheets() {
  getOrCreate(SHEETS.visits,     VISIT_COLS);
  getOrCreate(SHEETS.calls,      CALL_COLS);
  getOrCreate(SHEETS.complaints, COMPLAINT_COLS);
  Logger.log("All sheets ready.");
}

// Test functions
function testCall() {
  var r = doPost({ postData:{ contents: JSON.stringify({
    module:"calls", callDate:"2026-01-15", visitDate:"", filedExecutive:"Mohamed Elnagar",
    userName:"DSQ014.075", merchantName:"B.Tech", address:"El Zaher - Portsaid St",
    district:"Down Town", government:"Cairo", project:"Pril 2025", callType:"Re - check",
    employeeName:"Mohamed", branchNumber:"1067805278", branchStatus:"Correct No.",
    projectAwareness:"Unaware", awareAfterCall:"Aware", burningTool:"Merchant Center",
    burningSteps:"Aware", supportLine:"Aware", liveEmail:"Yes",
    deviceSimIssues:"No Issues", comments:"", link:""
  })}});
  Logger.log(r.getContent());
}

function testComplaint() {
  var r = doPost({ postData:{ contents: JSON.stringify({
    module:"complaints", callDate:"2026-01-15", visitCustomerDate:"",
    username:"DSQ336.021", password:"Dsq@1156", merchantName:"Kheir zaman",
    project:"Exxon Mobile", address:"J040 Luxor - Esna", district:"", government:"Upper Egypt",
    employeeName:"Ayman", branchNumber:"1157375558",
    description:"The customer complains that he was at the branch to burn the voucher.",
    solveComplaint:"تم التواصل مع الفرع وافاد بوجود مشكلة بالشبكة وتم حلها",
    typeOfIssue:"Not Issues", link:"https://app.asana.com/task/123", comment:""
  })}});
  Logger.log(r.getContent());
}
