// src/pages/ComplaintsDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  LineChart, Line
} from "recharts";
import { fetchComplaints } from "../services/api";
import { exportComplaintsCSV, exportComplaintsExcel } from "../utils/exports";
import config from "../config";
import {
  KpiCard, KpiSkeleton, Alert, PageLoader,
  ChartCard, EmptyChart, TOOLTIP_STYLE, CHART_COLORS,
  DashFilters, DataTable
} from "../components/shared/UI";

const DEF_F = { dateFrom:"", dateTo:"", government:"", project:"", typeOfIssue:"" };

const ISSUE_COLORS = {
  "Not Issues":           "#059669",
  "DSQ App/Link Issue":   "#2563eb",
  "Branch Issue":         "#f59e0b",
  "Customer Issue":       "#8b5cf6",
  "Device Issues":        "#64748b",
  "Internet Bundle Issue":"#0ea5e9",
  "Confirm TRX":          "#14b8a6",
  "Unaware":              "#ea580c",
  "Hold":                 "#eab308",
  "Other":                "#94a3b8",
};

export default function ComplaintsDashboard() {
  const [all,setAll]=useState([]); const [loading,setLoading]=useState(true);
  const [err,setErr]=useState(""); const [ts,setTs]=useState(null);
  const [filters,setFilters]=useState(DEF_F);
  const [xC,setXC]=useState(false); const [xX,setXX]=useState(false);

  const load = useCallback(async (s=false) => {
    if (!s) setLoading(true); setErr("");
    try { const d = await fetchComplaints(); setAll(d); setTs(new Date()); }
    catch(e) { setErr(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!config.DASHBOARD_REFRESH_MS) return;
    const t = setInterval(() => load(true), config.DASHBOARD_REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const recs = useMemo(() => all.filter(r => {
    const d = (r.callDate||"").slice(0,10);
    if (filters.dateFrom  && d < filters.dateFrom)  return false;
    if (filters.dateTo    && d > filters.dateTo)    return false;
    if (filters.government && r.government !== filters.government) return false;
    if (filters.project   && r.project    !== filters.project)   return false;
    if (filters.typeOfIssue && r.typeOfIssue !== filters.typeOfIssue) return false;
    return true;
  }), [all, filters]);

  const governments = useMemo(() => [...new Set(all.map(r=>r.government).filter(Boolean))].sort(), [all]);
  const projects    = useMemo(() => [...new Set(all.map(r=>r.project).filter(Boolean))].sort(), [all]);

  // KPIs
  const total   = recs.length;
  const solved  = recs.filter(r=>r.solveComplaint&&r.solveComplaint.trim()).length;
  const pending = total - solved;
  const solvedP = total>0 ? Math.round(solved/total*100) : 0;

  // By issue type
  const byType = useMemo(() => {
    const m={};
    recs.forEach(r=>{ const k=r.typeOfIssue||"Unknown"; m[k]=(m[k]||0)+1; });
    return Object.entries(m).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
  }, [recs]);

  // By project
  const byProject = useMemo(() => {
    const m={};
    recs.forEach(r=>{ const k=r.project||"Unknown"; m[k]=(m[k]||0)+1; });
    return Object.entries(m).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
  }, [recs]);

  // By government
  const byGov = useMemo(() => {
    const m={};
    recs.forEach(r=>{
      const k=(r.government||"Unknown").trim();
      if(!m[k]) m[k]={name:k,total:0,solved:0};
      m[k].total++;
      if(r.solveComplaint&&r.solveComplaint.trim()) m[k].solved++;
    });
    return Object.values(m)
      .map(a=>({...a, solvedP:a.total>0?Math.round(a.solved/a.total*100):0}))
      .sort((a,b)=>b.total-a.total).slice(0,8);
  }, [recs]);

  // By employee
  const byEmployee = useMemo(() => {
    const m={};
    recs.forEach(r=>{
      const k=(r.employeeName||"Unknown").trim();
      if(!m[k]) m[k]={name:k,total:0,solved:0};
      m[k].total++;
      if(r.solveComplaint&&r.solveComplaint.trim()) m[k].solved++;
    });
    return Object.values(m)
      .map(a=>({...a, solvedP:a.total>0?Math.round(a.solved/a.total*100):0}))
      .sort((a,b)=>b.total-a.total).slice(0,8);
  }, [recs]);

  // Daily trend
  const trend = useMemo(() => {
    const m={};
    recs.forEach(r=>{
      const d=(r.callDate||r.timestamp||"").slice(0,10);
      if(!d||d.length<10) return;
      if(!m[d]) m[d]={date:d,total:0,solved:0};
      m[d].total++;
      if(r.solveComplaint&&r.solveComplaint.trim()) m[d].solved++;
    });
    return Object.values(m).sort((a,b)=>a.date.localeCompare(b.date));
  }, [recs]);

  const hasF = Object.values(filters).some(v=>v), empty = recs.length===0;

  const COLS = [
    { key:"callDate",      label:"Date",        width:"w-24",  render:v=><span className="font-mono text-xs text-slate-500">{(v||"").slice(0,10)}</span> },
    { key:"username",      label:"Username",    width:"w-28",  render:v=><span className="font-mono text-xs badge badge-slate">{v||"—"}</span> },
    { key:"merchantName",  label:"Merchant",    width:"w-28",  render:v=><span className="font-semibold">{v||"—"}</span> },
    { key:"project",       label:"Project",     width:"w-28",  render:v=>v?<span className="badge badge-blue text-xs">{v}</span>:"—" },
    { key:"government",    label:"Gov",         width:"w-20"  },
    { key:"employeeName",  label:"Employee",    width:"w-24"  },
    { key:"typeOfIssue",   label:"Issue Type",  width:"w-32",  render:v=>{
      const color = { "Not Issues":"badge-green","DSQ App/Link Issue":"badge-blue","Branch Issue":"badge-amber","Customer Issue":"badge-purple","Unaware":"badge-orange","Device Issues":"badge-slate" }[v]||"badge-slate";
      return v?<span className={`badge ${color} text-xs`}>{v}</span>:"—";
    }},
    { key:"solveComplaint",label:"Solved",      width:"w-20",  render:v=><span className={`badge text-xs ${v&&v.trim()?"badge-green":"badge-red"}`}>{v&&v.trim()?"✓ Yes":"Pending"}</span> },
    { key:"description",   label:"Description", cls:"text-slate-500 text-xs max-w-[200px] truncate" },
  ];

  if (loading && !all.length) return <PageLoader message="Loading complaints dashboard…"/>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="page-pill bg-orange-50 text-orange-700 border-orange-200">📋 Complaints</div>
          <h1 className="page-title">
            Complaints Dashboard
            {hasF && <span className="badge badge-amber ml-2 text-xs align-middle">Filtered</span>}
          </h1>
          {ts && <p className="page-subtitle">{all.length} complaints · {ts.toLocaleTimeString()}{loading&&<span className="ml-2 text-orange-600 text-xs">Refreshing…</span>}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>load(true)} disabled={loading} className="btn-secondary text-sm">
            <svg className={`w-4 h-4 ${loading?"animate-spin":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Refresh
          </button>
          <button onClick={()=>{setXC(true);exportComplaintsCSV(recs);setTimeout(()=>setXC(false),800);}} disabled={xC||empty} className="btn-secondary text-sm">{xC?"…":"📄"} CSV</button>
          <button onClick={()=>{setXX(true);exportComplaintsExcel(recs);setTimeout(()=>setXX(false),800);}} disabled={xX||empty} className="btn-secondary text-sm">{xX?"…":"📊"} Excel</button>
        </div>
      </div>

      {err && <Alert type="warning" title="Could not reach Google Sheets" message={`${err} — showing demo data.`} onClose={()=>setErr("")} className="mb-5"/>}

      <DashFilters filters={filters} setFilters={setFilters} onReset={()=>setFilters(DEF_F)}
        dropdowns={[
          { key:"government",  label:"Government",  options:governments },
          { key:"project",     label:"Project",     options:projects },
          { key:"typeOfIssue", label:"Issue Type",  options:config.COMPLAINT_ISSUE_TYPES },
        ]}/>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {loading ? Array.from({length:4}).map((_,i)=><KpiSkeleton key={i}/>) : <>
          <KpiCard title="Total Complaints" value={total}         icon="📋" color="orange" subtitle={hasF?"filtered":"all"}/>
          <KpiCard title="Solved"           value={solved}        icon="✅" color="green"  subtitle="تم الحل" barPercent={solvedP}/>
          <KpiCard title="Pending"          value={pending}       icon="⏳" color="amber"  subtitle="قيد المعالجة" barPercent={total?Math.round(pending/total*100):0}/>
          <KpiCard title="Solved %"         value={`${solvedP}%`} icon="📈" color="sky"   subtitle="نسبة الحل" barPercent={solvedP}/>
        </>}
      </div>

      {/* Row 1: Issue type + Project */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <ChartCard title="Issue Type Breakdown" subtitle="توزيع الشكاوى بحسب نوع المشكلة" icon="📊">
          {empty ? <EmptyChart/> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byType} margin={{top:16,right:16,left:-8,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:8,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={n=>n.length>10?n.slice(0,10)+"…":n}/>
                <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,n)=>[`${v} complaints`,n]}/>
                <Bar dataKey="count" radius={[8,8,0,0]} maxBarSize={44}>
                  {byType.map(e=><Cell key={e.name} fill={ISSUE_COLORS[e.name]||"#94a3b8"}/>)}
                  <LabelList dataKey="count" position="top" style={{fontSize:11,fill:"#475569",fontWeight:600}}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Complaints by Project" subtitle="الشكاوى لكل مشروع" icon="🗂️">
          {empty ? <EmptyChart/> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byProject} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="count" nameKey="name" paddingAngle={3}>
                  {byProject.map((_,i)=><Cell key={i} fill={CHART_COLORS.seq[i%CHART_COLORS.seq.length]} stroke="none"/>)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,n)=>[`${v} complaints`,n]}/>
                <Legend iconType="circle" iconSize={10} formatter={v=><span style={{fontSize:11,color:"#64748b"}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 2: Government + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <ChartCard title="By Government" subtitle="الشكاوى والمحلولة لكل محافظة" icon="🗺️">
          {empty ? <EmptyChart/> : (
            <ResponsiveContainer width="100%" height={Math.max(160, byGov.length*44)}>
              <BarChart layout="vertical" data={byGov} margin={{top:0,right:48,left:8,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                <XAxis type="number" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <YAxis dataKey="name" type="category" width={90} tick={{fontSize:11,fill:"#475569"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,n,p)=>[`${v} (${p.payload.solvedP}% solved)`,n]}/>
                <Legend iconType="circle" iconSize={8} formatter={v=><span style={{fontSize:12,color:"#64748b"}}>{v}</span>}/>
                <Bar dataKey="total"  name="Total"  radius={[0,4,4,0]} maxBarSize={14} fill="#ea580c" fillOpacity={0.3}/>
                <Bar dataKey="solved" name="Solved" radius={[0,4,4,0]} maxBarSize={14} fill="#059669">
                  <LabelList dataKey="solved" position="right" style={{fontSize:11,fill:"#475569",fontWeight:700}}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Daily Trend" subtitle="الشكاوى والمحلولة يومياً" icon="📅">
          {trend.length < 2 ? <EmptyChart message="Not enough data"/> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend} margin={{top:8,right:16,left:-8,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="date" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={d=>`Date: ${d}`}/>
                <Legend iconType="circle" iconSize={8} formatter={v=><span style={{fontSize:12,color:"#64748b"}}>{v}</span>}/>
                <Line type="monotone" dataKey="total"  name="Total"  stroke="#ea580c" strokeWidth={2.5} dot={{r:4,strokeWidth:0}} activeDot={{r:6}}/>
                <Line type="monotone" dataKey="solved" name="Solved" stroke="#059669" strokeWidth={2.5} dot={{r:4,strokeWidth:0}} activeDot={{r:6}}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Employee performance */}
      <div className="chart-card mb-6">
        <div className="mb-5">
          <h3 className="font-display font-bold text-slate-800 text-sm">👤 Employee Performance</h3>
          <p className="text-slate-400 text-xs mt-0.5">الشكاوى والمحلولة لكل موظف</p>
        </div>
        {empty ? <EmptyChart/> : (
          <ResponsiveContainer width="100%" height={Math.max(140, Math.min(byEmployee.length*44, 280))}>
            <BarChart layout="vertical" data={byEmployee} margin={{top:0,right:60,left:8,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
              <XAxis type="number" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <YAxis dataKey="name" type="category" width={80} tick={{fontSize:11,fill:"#475569"}} axisLine={false} tickLine={false} tickFormatter={n=>n.length>12?n.slice(0,12)+"…":n}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,n,p)=>[`${v} (${p.payload.solvedP}% solved)`,n]}/>
              <Legend iconType="circle" iconSize={8} formatter={v=><span style={{fontSize:12,color:"#64748b"}}>{v}</span>}/>
              <Bar dataKey="total"  name="Total"  fill="#ea580c" fillOpacity={0.25} radius={[0,4,4,0]} maxBarSize={14}/>
              <Bar dataKey="solved" name="Solved" fill="#059669" radius={[0,4,4,0]} maxBarSize={14}>
                <LabelList dataKey="solvedP" position="right" formatter={v=>`${v}%`} style={{fontSize:11,fill:"#475569",fontWeight:700}}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <DataTable title="Complaint Records" records={recs} columns={COLS} loading={loading&&all.length>0}
        searchFields={["username","merchantName","project","government","typeOfIssue","employeeName","description"]}/>
    </div>
  );
}
