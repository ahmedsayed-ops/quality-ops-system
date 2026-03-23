// src/pages/CallsForm.jsx
// Form fields match Quality H (2026) sheet exactly:
// Call Date | Visit Date | Filed Executive | User Name | Merchant Name
// Address | District | Government | Project | Call Type | Employee Name
// Branch Number | Branch No. Status | Project Awareness | Aware After Call
// Burning Tool | Burning Steps | Support Line | Live Email
// Device Or SIM Issues | Comments | Link

import React, { useState, useCallback } from "react";
import config from "../config";
import { submitCall } from "../services/api";
import { FormSection, FormField, Alert, Spinner, SuccessScreen } from "../components/shared/UI";

const EMPTY = {
  callDate:         new Date().toISOString().slice(0,10),
  visitDate:        "",
  filedExecutive:   "",
  userName:         "",
  merchantName:     "",
  address:          "",
  district:         "",
  government:       "",
  project:          "",
  callType:         "",
  employeeName:     "",
  branchNumber:     "",
  branchStatus:     "",
  projectAwareness: "",
  awareAfterCall:   "",
  burningTool:      "",
  burningSteps:     "",
  supportLine:      "",
  liveEmail:        "",
  deviceSimIssues:  "",
  comments:         "",
  link:             "",
};

// Simple toggle button group
function ToggleGroup({ value, onChange, options, disabled }) {
  const COLORS = {
    "Aware":           "bg-emerald-50 border-emerald-500 text-emerald-700",
    "Unaware":         "bg-red-50 border-red-400 text-red-700",
    "Yes":             "bg-emerald-50 border-emerald-500 text-emerald-700",
    "No":              "bg-red-50 border-red-400 text-red-700",
    "Merchant Center": "bg-brand-50 border-brand-500 text-brand-700",
    "Device":          "bg-purple-50 border-purple-400 text-purple-700",
    "Other":           "bg-slate-100 border-slate-400 text-slate-600",
    "No Issues":       "bg-emerald-50 border-emerald-500 text-emerald-700",
    "SIM Issue":       "bg-amber-50 border-amber-400 text-amber-700",
  };
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map(opt => (
        <button key={opt} type="button" disabled={disabled}
          onClick={() => onChange(value === opt ? "" : opt)}
          className={`px-4 py-2 rounded-xl text-sm font-display font-semibold border-2 transition-all duration-150 select-none
            ${value === opt
              ? (COLORS[opt] || "bg-brand-50 border-brand-400 text-brand-700")
              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"}
            ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
          {value === opt && <span className="mr-1">{["Aware","Yes","Merchant Center","Device","No Issues"].includes(opt)?"✓":"✗"}</span>}
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function CallsForm() {
  const [form,   setForm]   = useState(EMPTY);
  const [errs,   setErrs]   = useState({});
  const [status, setStatus] = useState("idle");
  const [msg,    setMsg]    = useState("");

  const set = useCallback((k, v) => {
    setForm(p => ({...p, [k]: v}));
    setErrs(p => { const n={...p}; delete n[k]; return n; });
  }, []);

  // Disable quality fields if branch was not reached
  const reached = form.branchStatus === "Correct No.";

  const validate = () => {
    const e = {};
    if (!form.callDate)               e.callDate        = "مطلوب";
    if (!form.filedExecutive.trim())  e.filedExecutive  = "مطلوب";
    if (!form.userName.trim())        e.userName        = "مطلوب";
    if (!form.merchantName.trim())    e.merchantName    = "مطلوب";
    if (!form.government)             e.government      = "مطلوب";
    if (!form.project)                e.project         = "مطلوب";
    if (!form.callType)               e.callType        = "مطلوب";
    if (!form.employeeName.trim())    e.employeeName    = "مطلوب";
    if (!form.branchStatus)           e.branchStatus    = "مطلوب";
    return e;
  };

  const handleSubmit = async () => {
    const ve = validate();
    if (Object.keys(ve).length) {
      setErrs(ve);
      const firstKey = Object.keys(ve)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({behavior:"smooth",block:"center"});
      return;
    }
    setStatus("loading"); setMsg("");
    try {
      await submitCall(form);
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
      title="Call Record Saved!"
      subtitle="تم حفظ المكالمة في Google Sheets."
      date={form.callDate}
      onNew={reset}
      btnLabel="تسجيل مكالمة جديدة"
    />
  );

  const ec = Object.keys(errs).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      <div className="mb-6">
        <div className="page-pill bg-green-50 text-green-700 border-green-200">📞 Calls Quality</div>
        <h1 className="page-title">Quality Call Form</h1>
        <p className="page-subtitle">نموذج متابعة جودة المكالمات — Quality H (2026)</p>
      </div>

      {status==="error" && <Alert type="error" title="Submission Failed" message={msg} onClose={()=>setStatus("idle")} className="mb-5"/>}
      {ec>0 && <Alert type="warning" title={`${ec} حقل${ec>1?"":""}  مطلوب`} message="برجاء ملء الحقول المميزة." className="mb-5"/>}

      {/* ── Section 1: بيانات المكالمة ── */}
      <FormSection title="بيانات المكالمة" icon="📞" number={1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <FormField id="callDate" label="Call Date" error={errs.callDate} required>
            <input id="field-callDate" type="date"
              className={`input-field ${errs.callDate?"has-error":""}`}
              value={form.callDate} onChange={e=>set("callDate",e.target.value)}/>
          </FormField>

          <FormField id="visitDate" label="Visit Date" hint="اختياري">
            <input type="date" className="input-field" value={form.visitDate}
              onChange={e=>set("visitDate",e.target.value)}/>
          </FormField>

          <FormField id="filedExecutive" label="Filed Executive" error={errs.filedExecutive} required>
            <input id="field-filedExecutive"
              className={`input-field ${errs.filedExecutive?"has-error":""}`}
              placeholder="اسم المسؤول" value={form.filedExecutive}
              onChange={e=>set("filedExecutive",e.target.value)} autoComplete="off"/>
          </FormField>

          <FormField id="callType" label="Call Type" error={errs.callType} required>
            <select id="field-callType"
              className={`input-field ${errs.callType?"has-error":""}`}
              value={form.callType} onChange={e=>set("callType",e.target.value)}>
              <option value="">اختر نوع المكالمة…</option>
              {config.CALL_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>

          <FormField id="project" label="Project" error={errs.project} required>
            <select id="field-project"
              className={`input-field ${errs.project?"has-error":""}`}
              value={form.project} onChange={e=>set("project",e.target.value)}>
              <option value="">اختر المشروع…</option>
              {config.QUALITY_PROJECTS.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </FormField>

          <FormField id="government" label="Government" error={errs.government} required>
            <select id="field-government"
              className={`input-field ${errs.government?"has-error":""}`}
              value={form.government} onChange={e=>set("government",e.target.value)}>
              <option value="">اختر المحافظة…</option>
              {config.GOVERNMENTS.map(g=><option key={g} value={g}>{g}</option>)}
            </select>
          </FormField>

          <FormField id="district" label="District" hint="اختياري">
            <input className="input-field" placeholder="المنطقة / الحي"
              value={form.district} onChange={e=>set("district",e.target.value)}/>
          </FormField>

          <FormField id="address" label="Address" hint="اختياري">
            <input className="input-field" placeholder="العنوان"
              value={form.address} onChange={e=>set("address",e.target.value)}/>
          </FormField>

        </div>
      </FormSection>

      {/* ── Section 2: بيانات الفرع ── */}
      <FormSection title="بيانات الفرع والموظف" icon="🏪" number={2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <FormField id="userName" label="User Name" error={errs.userName} required>
            <input id="field-userName"
              className={`input-field font-mono ${errs.userName?"has-error":""}`}
              placeholder="DSQ014.075" value={form.userName}
              onChange={e=>set("userName",e.target.value)} autoComplete="off"/>
          </FormField>

          <FormField id="merchantName" label="Merchant Name" error={errs.merchantName} required>
            <input id="field-merchantName"
              className={`input-field ${errs.merchantName?"has-error":""}`}
              placeholder="اسم المنشأة / التاجر" value={form.merchantName}
              onChange={e=>set("merchantName",e.target.value)} autoComplete="off"/>
          </FormField>

          <FormField id="employeeName" label="Employee Name" error={errs.employeeName} required>
            <input id="field-employeeName"
              className={`input-field ${errs.employeeName?"has-error":""}`}
              placeholder="اسم الموظف" value={form.employeeName}
              onChange={e=>set("employeeName",e.target.value)} autoComplete="off"/>
          </FormField>

          <FormField id="branchNumber" label="Branch Number / Mobile">
            <input className="input-field font-mono" placeholder="رقم الفرع / موبايل"
              value={form.branchNumber} onChange={e=>set("branchNumber",e.target.value)}/>
          </FormField>

          <FormField id="branchStatus" label="Branch No. Status" error={errs.branchStatus} required span2>
            <div id="field-branchStatus" className={`mt-1 p-3 rounded-xl border ${errs.branchStatus?"border-red-300 bg-red-50/30":"border-slate-200 bg-slate-50/40"}`}>
              <ToggleGroup value={form.branchStatus}
                onChange={v=>set("branchStatus",v)}
                options={config.BRANCH_STATUSES}/>
              {errs.branchStatus && <p className="text-red-500 text-xs mt-2">{errs.branchStatus}</p>}
            </div>
          </FormField>

        </div>
      </FormSection>

      {/* ── Section 3: تقييم الجودة ── */}
      <FormSection title="تقييم الجودة" icon="✅" number={3}>
        {!reached && (
          <div className="alert alert-warn mb-5">
            <span className="text-lg">ℹ️</span>
            <span>حقول التقييم تفعّل فقط عند اختيار <strong>Correct No.</strong> في Branch Status</span>
          </div>
        )}
        <div className="space-y-5">

          {/* Project Awareness */}
          <div className={`p-4 rounded-xl border ${!reached?"opacity-50":""}`}>
            <div className="text-sm font-display font-semibold text-slate-700 mb-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-2">1</span>
              Project Awareness
            </div>
            <ToggleGroup value={form.projectAwareness} onChange={v=>set("projectAwareness",v)}
              options={config.AWARENESS_OPTIONS} disabled={!reached}/>
          </div>

          {/* Aware After Call */}
          <div className={`p-4 rounded-xl border ${!reached?"opacity-50":""}`}>
            <div className="text-sm font-display font-semibold text-slate-700 mb-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-2">2</span>
              Aware After Call
            </div>
            <ToggleGroup value={form.awareAfterCall} onChange={v=>set("awareAfterCall",v)}
              options={config.AWARENESS_OPTIONS} disabled={!reached}/>
          </div>

          {/* Burning Tool */}
          <div className={`p-4 rounded-xl border ${!reached?"opacity-50":""}`}>
            <div className="text-sm font-display font-semibold text-slate-700 mb-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-2">3</span>
              Burning Tool
            </div>
            <ToggleGroup value={form.burningTool} onChange={v=>set("burningTool",v)}
              options={config.BURNING_TOOLS} disabled={!reached}/>
          </div>

          {/* Burning Steps */}
          <div className={`p-4 rounded-xl border ${!reached?"opacity-50":""}`}>
            <div className="text-sm font-display font-semibold text-slate-700 mb-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-2">4</span>
              Burning Steps
            </div>
            <ToggleGroup value={form.burningSteps} onChange={v=>set("burningSteps",v)}
              options={config.AWARENESS_OPTIONS} disabled={!reached}/>
          </div>

          {/* Support Line */}
          <div className={`p-4 rounded-xl border ${!reached?"opacity-50":""}`}>
            <div className="text-sm font-display font-semibold text-slate-700 mb-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-2">5</span>
              Support Line
            </div>
            <ToggleGroup value={form.supportLine} onChange={v=>set("supportLine",v)}
              options={config.AWARENESS_OPTIONS} disabled={!reached}/>
          </div>

          {/* Live Email */}
          <div className={`p-4 rounded-xl border ${!reached?"opacity-50":""}`}>
            <div className="text-sm font-display font-semibold text-slate-700 mb-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-2">6</span>
              Live Email
            </div>
            <ToggleGroup value={form.liveEmail} onChange={v=>set("liveEmail",v)}
              options={config.YES_NO_OPTIONS} disabled={!reached}/>
          </div>

          {/* Device Or SIM Issues */}
          <div className="p-4 rounded-xl border">
            <div className="text-sm font-display font-semibold text-slate-700 mb-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-2">7</span>
              Device Or SIM Issues
            </div>
            <ToggleGroup value={form.deviceSimIssues} onChange={v=>set("deviceSimIssues",v)}
              options={["No Issues","SIM Issue","Device Issue","Other"]}/>
          </div>

        </div>
      </FormSection>

      {/* ── Section 4: ملاحظات ── */}
      <FormSection title="ملاحظات ورابط" icon="💬" number={4}>
        <div className="space-y-4">
          <FormField id="comments" label="Comments / ملاحظات">
            <textarea rows={3} className="input-field resize-none"
              placeholder="أي ملاحظات إضافية..."
              value={form.comments} onChange={e=>set("comments",e.target.value)}/>
          </FormField>
          <FormField id="link" label="Asana Link" hint="اختياري">
            <input className="input-field text-xs font-mono"
              placeholder="https://app.asana.com/..."
              value={form.link} onChange={e=>set("link",e.target.value)}/>
          </FormField>
        </div>
      </FormSection>

      <button onClick={handleSubmit} disabled={status==="loading"}
        className="btn-primary w-full py-4 text-base" style={{background:"#16a34a"}}>
        {status==="loading"
          ? <><svg className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>&nbsp;جاري الحفظ…</>
          : <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>حفظ المكالمة</>}
      </button>
      <p className="text-center text-xs text-slate-400 mt-3">
        الحقول المميزة بـ <span className="text-red-400 font-semibold">*</span> مطلوبة.
      </p>
    </div>
  );
}
