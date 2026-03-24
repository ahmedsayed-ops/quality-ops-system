// src/pages/ComplaintsForm.jsx
import React, { useState, useCallback } from "react";
import config from "../config";
import { submitComplaint } from "../services/api";
import { FormSection, FormField, Alert, Spinner, SuccessScreen } from "../components/shared/UI";

const EMPTY = {
  callDate:          new Date().toISOString().slice(0,10),
  visitCustomerDate: "",
  username:          "",
  password:          "",
  merchantName:      "",
  project:           "",
  address:           "",
  district:          "",
  government:        "",
  employeeName:      "",
  branchNumber:      "",
  description:       "",
  solveComplaint:    "",
  typeOfIssue:       "",
  link:              "",
  comment:           "",
};

const ISSUE_BADGE_COLOR = {
  "Not Issues":           "bg-emerald-50 border-emerald-400 text-emerald-700",
  "DSQ App/Link Issue":   "bg-brand-50 border-brand-400 text-brand-700",
  "Branch Issue":         "bg-amber-50 border-amber-400 text-amber-700",
  "Customer Issue":       "bg-purple-50 border-purple-400 text-purple-700",
  "Device Issues":        "bg-slate-100 border-slate-300 text-slate-600",
  "Internet Bundle Issue":"bg-sky-50 border-sky-400 text-sky-700",
  "Confirm TRX":          "bg-teal-50 border-teal-400 text-teal-700",
  "Unaware":              "bg-orange-50 border-orange-400 text-orange-700",
  "Hold":                 "bg-yellow-50 border-yellow-400 text-yellow-700",
  "Other":                "bg-slate-100 border-slate-300 text-slate-600",
};

export default function ComplaintsForm() {
  const [form,   setForm]   = useState(EMPTY);
  const [errs,   setErrs]   = useState({});
  const [status, setStatus] = useState("idle");
  const [msg,    setMsg]    = useState("");

  const set = useCallback((k, v) => {
    setForm(p => ({...p, [k]: v}));
    setErrs(p => { const n={...p}; delete n[k]; return n; });
  }, []);

  const validate = () => {
    const e = {};
    if (!form.callDate)              e.callDate       = "Required";
    if (!form.username.trim())       e.username       = "Required";
    if (!form.merchantName.trim())   e.merchantName   = "Required";
    if (!form.project)               e.project        = "Required";
    if (!form.government)            e.government     = "Required";
    if (!form.employeeName.trim())   e.employeeName   = "Required";
    if (!form.description.trim())    e.description    = "Required";
    if (!form.typeOfIssue)           e.typeOfIssue    = "Required";
    return e;
  };

  const handleSubmit = async () => {
    const ve = validate();
    if (Object.keys(ve).length) {
      setErrs(ve);
      document.getElementById(`field-${Object.keys(ve)[0]}`)?.scrollIntoView({behavior:"smooth",block:"center"});
      return;
    }
    setStatus("loading"); setMsg("");
    try {
      await submitComplaint(form);
      setStatus("success");
    } catch(err) { setStatus("error"); setMsg(err.message||"Submission failed."); }
  };

  const reset = () => {
    setForm({...EMPTY, callDate: new Date().toISOString().slice(0,10)});
    setErrs({}); setStatus("idle"); setMsg("");
    window.scrollTo({top:0,behavior:"smooth"});
  };

  if (status === "success") return (
    <SuccessScreen
      title="Complaint Saved!"
      subtitle="The complaint has been saved to Google Sheets."
      date={form.callDate}
      onNew={reset}
      btnLabel="Record Another Complaint"
    />
  );

  const ec = Object.keys(errs).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      <div className="mb-6">
        <div className="page-pill bg-orange-50 text-orange-700 border-orange-200">📋 Complaints</div>
        <h1 className="page-title">Complaint Entry Form</h1>
        <p className="page-subtitle">Log a new customer complaint</p>
      </div>

      {status==="error" && <Alert type="error" title="Submission Failed" message={msg} onClose={()=>setStatus("idle")} className="mb-5"/>}
      {ec>0 && <Alert type="warning" title={`${ec} field${ec>1?"s":""} required`} message="Please fill in the highlighted fields." className="mb-5"/>}

      {/* Section 1: Complaint Information */}
      <FormSection title="Complaint Information" icon="📋" number={1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <FormField id="callDate" label="Call Date" error={errs.callDate} required>
            <input id="field-callDate" type="date"
              className={`input-field ${errs.callDate?"has-error":""}`}
              value={form.callDate} onChange={e=>set("callDate",e.target.value)}/>
          </FormField>

          <FormField id="visitCustomerDate" label="Visit Customer Date" hint="Optional">
            <input type="date" className="input-field" value={form.visitCustomerDate}
              onChange={e=>set("visitCustomerDate",e.target.value)}/>
          </FormField>

          <FormField id="project" label="Project" error={errs.project} required>
            <select id="field-project"
              className={`input-field ${errs.project?"has-error":""}`}
              value={form.project} onChange={e=>set("project",e.target.value)}>
              <option value="">Select project…</option>
              {config.COMPLAINT_PROJECTS.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </FormField>

          <FormField id="government" label="Government" error={errs.government} required>
            <select id="field-government"
              className={`input-field ${errs.government?"has-error":""}`}
              value={form.government} onChange={e=>set("government",e.target.value)}>
              <option value="">Select government…</option>
              {config.GOVERNMENTS.map(g=><option key={g} value={g}>{g}</option>)}
            </select>
          </FormField>

          <FormField id="district" label="District" hint="Optional">
            <input className="input-field" placeholder="District / Area"
              value={form.district} onChange={e=>set("district",e.target.value)}/>
          </FormField>

          <FormField id="address" label="Address" hint="Optional">
            <input className="input-field" placeholder="Full address"
              value={form.address} onChange={e=>set("address",e.target.value)}/>
          </FormField>

        </div>
      </FormSection>

      {/* Section 2: Merchant & Branch Details */}
      <FormSection title="Merchant & Branch Details" icon="🏪" number={2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <FormField id="username" label="Username" error={errs.username} required>
            <input id="field-username"
              className={`input-field font-mono ${errs.username?"has-error":""}`}
              placeholder="DSQ336.021" value={form.username}
              onChange={e=>set("username",e.target.value)} autoComplete="off"/>
          </FormField>

          <FormField id="password" label="Password" hint="Optional">
            <input className="input-field font-mono" placeholder="Dsq@1156"
              value={form.password} onChange={e=>set("password",e.target.value)}
              autoComplete="new-password"/>
          </FormField>

          <FormField id="merchantName" label="Merchant Name" error={errs.merchantName} required>
            <input id="field-merchantName"
              className={`input-field ${errs.merchantName?"has-error":""}`}
              placeholder="Merchant / branch name" value={form.merchantName}
              onChange={e=>set("merchantName",e.target.value)} autoComplete="off"/>
          </FormField>

          <FormField id="employeeName" label="Employee Name" error={errs.employeeName} required>
            <input id="field-employeeName"
              className={`input-field ${errs.employeeName?"has-error":""}`}
              placeholder="Employee full name" value={form.employeeName}
              onChange={e=>set("employeeName",e.target.value)} autoComplete="off"/>
          </FormField>

          <FormField id="branchNumber" label="Branch Number / Mobile">
            <input className="input-field font-mono" placeholder="Branch number or mobile"
              value={form.branchNumber} onChange={e=>set("branchNumber",e.target.value)}/>
          </FormField>

        </div>
      </FormSection>

      {/* Section 3: Issue Type */}
      <FormSection title="Issue Type" icon="🗂️" number={3}>
        <div id="field-typeOfIssue"
          className={`p-3 rounded-xl border ${errs.typeOfIssue?"border-red-300 bg-red-50/30":"border-slate-100"}`}>
          <div className="text-xs font-display font-semibold text-slate-600 mb-3">
            Type Of Issue <span className="text-red-400">*</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.COMPLAINT_ISSUE_TYPES.map(t => (
              <button key={t} type="button"
                onClick={()=>set("typeOfIssue", form.typeOfIssue===t?"":t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold border-2 transition-all duration-150 select-none
                  ${form.typeOfIssue===t
                    ? (ISSUE_BADGE_COLOR[t]||"bg-brand-50 border-brand-400 text-brand-700")
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                {form.typeOfIssue===t && "✓ "}{t}
              </button>
            ))}
          </div>
          {errs.typeOfIssue && <p className="text-red-500 text-xs mt-2">{errs.typeOfIssue}</p>}
        </div>
      </FormSection>

      {/* Section 4: Complaint Details */}
      <FormSection title="Complaint Details" icon="📝" number={4}>
        <div className="space-y-4">

          <FormField id="description" label="Description — Customer Complaint" error={errs.description} required>
            <textarea id="field-description" rows={4}
              className={`input-field resize-none ${errs.description?"has-error":""}`}
              placeholder="Describe the complaint in detail…"
              value={form.description} onChange={e=>set("description",e.target.value)}/>
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${form.description.length>800?"text-amber-500":"text-slate-300"}`}>
                {form.description.length} chars
              </span>
            </div>
          </FormField>

          <FormField id="solveComplaint" label="Resolution — Solve The Complaint">
            <textarea rows={3} className="input-field resize-none"
              placeholder="Describe how the complaint was resolved…"
              value={form.solveComplaint} onChange={e=>set("solveComplaint",e.target.value)}/>
          </FormField>

          <FormField id="link" label="Asana Link" hint="Optional">
            <input className="input-field text-xs font-mono"
              placeholder="https://app.asana.com/..."
              value={form.link} onChange={e=>set("link",e.target.value)}/>
          </FormField>

          <FormField id="comment" label="Comment" hint="Optional">
            <input className="input-field" placeholder="Additional notes…"
              value={form.comment} onChange={e=>set("comment",e.target.value)}/>
          </FormField>

        </div>
      </FormSection>

      <button onClick={handleSubmit} disabled={status==="loading"}
        className="btn-primary w-full py-4 text-base" style={{background:"#ea580c"}}>
        {status==="loading"
          ? <><svg className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>&nbsp;Saving…</>
          : <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Save Complaint</>}
      </button>
      <p className="text-center text-xs text-slate-400 mt-3">
        Fields marked <span className="text-red-400 font-semibold">*</span> are required.
      </p>
    </div>
  );
}
