// ================================================================
//  src/config.js
//  Built directly from Quality_Checks_2026 Excel structure
// ================================================================

const config = {

  APPS_SCRIPT_URL:
    process.env.REACT_APP_APPS_SCRIPT_URL ||
    "https://script.google.com/macros/s/AKfycbzmZgc0R0BvGZdUCS6JAZEsnn2nCSWeMsoTNyiZA0eVA9ODhzLcdtY_mE8PHFoRL2YZ/exec",

  COMPANY_NAME: "Your Company",
  SYSTEM_TITLE: "Quality Operations Platform",
  LOGO_URL: null,

  // ── Module 1: Visits (existing) ───────────────────────────────
  VISIT_QUESTIONS: [
    { key:"q1", label:"Is the branch aware of the project?",        answerType:"aware" },
    { key:"q2", label:"Is the branch aware of burn methods?",       answerType:"aware" },
    { key:"q3", label:"Has the branch received the Live Email?",    answerType:"yn"    },
    { key:"q4", label:"Is the branch aware of the support number?", answerType:"aware" }
  ],

  // ── Module 2: Calls Quality ───────────────────────────────────
  // From: Quality H (2026) sheet
  CALL_TYPES:   ["New project", "Re - check"],

  BRANCH_STATUSES: ["Correct No.", "No Answer", "Wrong No.", "Invalid No.", "Closed"],

  GOVERNMENTS: [
    "Cairo", "Alexandria", "Giza", "Delta",
    "Qanal", "Upper Egypt", "North Coast", "Red Sea"
  ],

  QUALITY_PROJECTS: [
    "Pril 2025", "NBE", "QNB", "Exxonmobil 7000",
    "Vodafone RED Egypt Consumer", "Vodafone RED Egypt Consumer(DOM)",
    "WE Consumer", "WE Consumer / Vodafone RED Egypt Consumer",
    "Exxonmobile / Vodafone RED Egypt Consumer",
    "FAB El Ahlaweya", "FAB Misr / Vodafone RED Egypt Consumer",
    "Banque Misr", "Other"
  ],

  BURNING_TOOLS: ["Merchant Center", "Device", "Other"],

  // Quality assessment answer options (from real data)
  AWARENESS_OPTIONS: ["Aware", "Unaware"],
  YES_NO_OPTIONS:    ["Yes", "No"],

  // ── Module 3: Complaints ─────────────────────────────────────
  // From: Complaints H (2026) sheet
  COMPLAINT_PROJECTS: [
    "Exxon Mobile", "Wadi Degla", "Bank Misr", "NBE",
    "CIB", "FAB", "Credit Agricole", "HSBC",
    "Mashreq Bank", "VF Red", "WE", "Other"
  ],

  COMPLAINT_ISSUE_TYPES: [
    "Not Issues",
    "DSQ App/Link Issue",
    "Branch Issue",
    "Customer Issue",
    "Device Issues",
    "Internet Bundle Issue",
    "Confirm TRX",
    "Unaware",
    "Hold",
    "Other"
  ],

  // ── Answer normalisation ──────────────────────────────────────
  POSITIVE_ANSWERS: new Set(["Aware", "Yes"]),
  NEGATIVE_ANSWERS: new Set(["Unaware", "No"]),

  DASHBOARD_REFRESH_MS: 60000,
};

export default config;
