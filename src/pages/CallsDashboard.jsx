// src/pages/CallsDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  LineChart, Line
} from "recharts";
import { fetchCalls } from "../services/api";
import { exportCallsCSV, exportCallsExcel } from "../utils/exports";
import config from "../config";
import {
  KpiCard, KpiSkeleton, Alert, PageLoader,
  ChartCard, EmptyChart, TOOLTIP_STYLE, CHART_COLORS,
  DashFilters, DataTable
} from "../components/shared/UI";

const DEF_F = { dateFrom:"", dateTo:"", government:"", project:"", callType:"", branchStatus:"" };

const STATUS_COLOR = {
  "Correct No.": "#059669",
  "No Answer":   "#f59e0b",
  "Wrong No.":   "#ef4444",
  "Invalid No.": "#8b5cf6",
  "Closed":      "#94a3b8",
};

function StatusBadge({ val }) {
  const c = { "Correct No.":"badge-green","No Answer":"badge-amber","Wrong No.":"badge-red","Invalid No.":"badge-purple","Closed":"badge-slate" }[val]||"badge-slate";
  return val ? <span className={`badge ${c} text-xs`}>{val}</span> : <span className="text-slate-300">—</span>;
}
function AwareBadge({ val }) {
  if (!val) return <span className="text-slate-300 text-xs">—</span>;
  return <span className={`badge ${val==="Aware"||val==="Yes"?"badge-green":"badge-red"} text-xs`}>{val==="Aware"||val==="Yes"?"✓":"✗"} {val}</span>;
}

export default function CallsDashboard() {
  const [all,setAll]=useState([]); const [loading,setLoading]=useState(true);
  const [err,setErr]=useState(""); const [ts,setTs]=useState(null);
  const [filters,setFilters]=useState(DEF_F);
  const [xC,setXC]=useState(false); const [xX,setXX]=useState(false);

  const load = useCallback(async (s=false) => {
    if (!s) setLoading(true); setErr("");
    try { const d = await fetchCalls(); setAll(d); setTs(new Date()); }
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
    if (filters.dateFrom && d < filters.dateFrom) return false;
    if (filters.dateTo   && d > filters.dateTo)   return false;
    if (filters.government  && r.government  !== filters.government)  return false;
    if (filters.project     && r.project     !== filters.project)     return false;
    if (filters.callType    && r.callType    !== filters.callType)    return false;
    if (filters.branchStatus && r.branchStatus !== filters.branchStatus) return false;
    return true;
  }), [all, filters]);

  const governments = useMemo(() => [...new Set(all.map(r=>r.government).filter(Boolean))].sort(), [all]);
  const projects    = useMemo(() => [...new Set(all.map(r=>r.project).filter(Boolean))].sort(), [all]);
  const executives  = useMemo(() => [...new Set(all.map(r=>r.filedExecutive).filter(Boolean))].sort(), [all]);

  // KPIs
  const total    = recs.length;
  const reached  = recs.filter(r=>r.branchStatus==="Correct No.").length;
  const noAnswer = recs.filter(r=>r.branchStatus==="No Answer").length;
  const wrongNo  = recs.filter(r=>r.branchStatus==="Wrong No.").length;
  const aware    = recs.filter(r=>r.projectAwareness==="Aware").length;
  const awareAfter = recs.filter(r=>r.awareAfterCall==="Aware").length;
  const awareP   = reached > 0 ? Math.round(aware/reached*100) : 0;
  const awareAfterP = reached > 0 ? Math.round(awareAfter/reached*100) : 0;
  const reachedP = total > 0 ? Math.round(reached/total*100) : 0;

  // Status distribution
  const statusDist = useMemo(() => {
    const m={};
    recs.forEach(r=>{ const k=r.branchStatus||"Unknown"; m[k]=(m[k]||0)+1; });
    return Object.entries(m).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
  }, [recs]);

  // Per Government awareness
  const byGov = useMemo(() => {
    const m={};
    recs.forEach(r=>{
      const k=(r.government||"Unknown").trim();
      if(!m[k]) m[k]={name:k,total:0,reached:0,aware:0};
      m[k].total++;
      if(r.branchStatus==="Correct No.") m[k].reached++;
      if(r.projectAwareness==="Aware") m[k].aware++;
    });
    return Object.values(m)
      .map(a=>({...a, awareP: a.reached>0?Math.round(a.aware/a.reached*100):0}))
      .sort((a,b)=>b.total-a.total).slice(0,8);
  }, [recs]);

  // Per Executive
  const byExec = useMemo(() => {
    const m={};
    recs.forEach(r=>{
      const k=(r.filedExecutive||"Unknown").trim();
      if(!m[k]) m[k]={name:k,total:0,reached:0,aware:0};
      m[k].total++;
      if(r.branchStatus==="Correct No.") m[k].reached++;
      if(r.projectAwareness==="Aware") m[k].aware++;
    });
    return Object.values(m)
      .map(a=>({...a, awareP: a.reached>0?Math.round(a.aware/a.reached*100):0}))
      .sort((a,b)=>b.total-a.total);
  }, [recs]);

  // Per Project
  const byProject = useMemo(() => {
    const m={};
    recs.forEach(r=>{ const k=r.project||"Unknown"; m[k]=(m[k]||0)+1; });
    return Object.entries(m).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
  }, [recs]);

  // Daily trend
  const trend = useMemo(() => {
    const m={};
    recs.forEach(r=>{
      const d=(r.callDate||r.timestamp||"").slice(0,10);
      if(!d||d.length<10) return;
      if(!m[d]) m[d]={date:d,total:0,reached:0,aware:0,noAnswer:0};
      m[d].total++;
      if(r.branchStatus==="Correct No.") m[d].reached++;
      if(r.projectAwareness==="Aware")   m[d].aware++;
      if(r.branchStatus==="No Answer")   m[d].noAnswer++;
    });
    return Object.values(m).sort((a,b)=>a.date.localeCompare(b.date));
  }, [recs]);

  // Awareness breakdown per question
  const awarenessBreakdown = useMemo(() => {
    const fields = [
      { key:"projectAwareness", label:"Project Awareness" },
      { key:"awareAfterCall",   label:"Aware After Call"  },
      { key:"burningSteps",     label:"Burning Steps"     },
      { key:"supportLine",      label:"Support Line"      },
      { key:"liveEmail",        label:"Live Email"        },
    ];
    return fields.map(f => {
      const answered = recs.filter(r=>r[f.key]==="Aware"||r[f.key]==="Unaware"||r[f.key]==="Yes"||r[f.key]==="No");
      const pos = recs.filter(r=>r[f.key]==="Aware"||r[f.key]==="Yes").length;
      const pct = answered.length>0?Math.round(pos/answered.length*100):0;
      return { name:f.label, posPercent:pct, pos, total:answered.length };
    });
  }, [recs]);

  const hasF = Object.values(filters).some(v=>v), empty = recs.length===0;

  const COLS = [
    { key:"callDate",          label:"Date",        width:"w-24",  render:v=><span className="font-mono text-xs text-slate-500">{(v||"").slice(0,10)}</span> },
    { key:"filedExecutive",    label:"Executive",   width:"w-28",  render:v=><span className="font-semibold text-slate-700">{v||"—"}</span> },
    { key:"userName",          label:"User Name",   width:"w-28",  render:v=><span className="font-mono text-xs badge badge-slate">{v||"—"}</span> },
    { key:"merchantName",      label:"Merchant",    width:"w-28"  },
    { key:"government",        label:"Gov",         width:"w-20"  },
    { key:"project",           label:"Project",     width:"w-32",  render:v=>v?<span className="badge badge-blue text-xs">{v}</span>:"—" },
    { key:"callType",          label:"Type",        width:"w-24",  render:v=>v?<span className="badge badge-purple text-xs">{v}</span>:"—" },
    { key:"branchStatus",      label:"Status",      width:"w-28",  render:v=><StatusBadge val={v}/> },
    { key:"projectAwareness",  label:"Awareness",   width:"w-24",  render:v=><AwareBadge val={v}/> },
    { key:"awareAfterCall",    label:"After Call",  width:"w-24",  render:v=><AwareBadge val={v}/> },
    { key:"liveEmail",         label:"Live Email",  width:"w-22",  render:v=><AwareBadge val={v}/> },
    { key:"comments",          label:"Comments",    cls:"text-slate-500 text-xs max-w-[150px] truncate" },
  ];

  if (loading && !all.length) return <PageLoader message="Loading calls dashboard…"/>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="page-pill bg-green-50 text-green-700 border-green-200">📞 Calls Quality</div>
          <h1 className="page-title">
            Calls Dashboard
            {hasF && <span className="badge badge-amber ml-2 text-xs align-middle">Filtered</span>}
          </h1>
          {ts && <p className="page-subtitle">{all.length} calls · {ts.toLocaleTimeString()}{loading&&<span className="ml-2 text-green-600 text-xs">Refreshing…</span>}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>load(true)} disabled={loading} className="btn-secondary text-sm">
            <svg className={`w-4 h-4 ${loading?"animate-spin":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Refresh
          </button>
          <button onClick={()=>{setXC(true);exportCallsCSV(recs);setTimeout(()=>setXC(false),800);}} disabled={xC||empty} className="btn-secondary text-sm">{xC?"…":"📄"} CSV</button>
          <button onClick={()=>{setXX(true);exportCallsExcel(recs);setTimeout(()=>setXX(false),800);}} disabled={xX||empty} className="btn-secondary text-sm">{xX?"…":"📊"} Excel</button>
        </div>
      </div>

      {err && <Alert type="warning" title="Could not reach Google Sheets" message={`${err} — showing demo data.`} onClose={()=>setErr("")} className="mb-5"/>}

      <DashFilters filters={filters} setFilters={setFilters} onReset={()=>setFilters(DEF_F)}
        dropdowns={[
          { key:"government",   label:"Government",  options:governments },
          { key:"project",      label:"Project",     options:projects },
          { key:"callType",     label:"Call Type",   options:config.CALL_TYPES },
          { key:"branchStatus", label:"Status",      options:config.BRANCH_STATUSES },
        ]}/>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {loading ? Array.from({length:6}).map((_,i)=><KpiSkeleton key={i}/>) : <>
          <KpiCard title="Total Calls"  value={total}            icon="📞" color="green"  subtitle={hasF?"filtered":"all"}/>
          <KpiCard title="Reached"      value={reached}          icon="✅" color="green"  subtitle={`${reachedP}% — Correct No.`} barPercent={reachedP}/>
          <KpiCard title="No Answer"    value={noAnswer}         icon="📵" color="amber"  subtitle="لم يرد" barPercent={total?Math.round(noAnswer/total*100):0}/>
          <KpiCard title="Wrong No."    value={wrongNo}          icon="❌" color="red"    subtitle="رقم خاطئ" barPercent={total?Math.round(wrongNo/total*100):0}/>
          <KpiCard title="Aware %"      value={`${awareP}%`}    icon="🧠" color="sky"    subtitle="من الفروع المتصل بها" barPercent={awareP}/>
          <KpiCard title="After Call %" value={`${awareAfterP}%`} icon="📈" color="blue" subtitle="وعي بعد المكالمة" barPercent={awareAfterP}/>
        </>}
      </div>

      {/* Row 1: Status distribution + Project distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <ChartCard title="Branch Status Distribution" subtitle="توزيع حالات التواصل بالفروع" icon="📊">
          {empty ? <EmptyChart/> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="count" nameKey="name" paddingAngle={3}>
                  {statusDist.map(e=><Cell key={e.name} fill={STATUS_COLOR[e.name]||"#94a3b8"} stroke="none"/>)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,n)=>[`${v} calls`,n]}/>
                <Legend iconType="circle" iconSize={10} formatter={v=><span style={{fontSize:12,color:"#64748b"}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Quality Assessment Breakdown" subtitle="نسبة الوعي لكل محور من محاور التقييم" icon="✅">
          {empty ? <EmptyChart/> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={awarenessBreakdown} margin={{top:20,right:16,left:-8,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:9,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={n=>n.length>12?n.slice(0,12)+"…":n}/>
                <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,_,p)=>[`${v}% (${p.payload.pos}/${p.payload.total})`,"Positive"]}/>
                <Bar dataKey="posPercent" radius={[8,8,0,0]} maxBarSize={56}>
                  {awarenessBreakdown.map((_,i)=><Cell key={i} fill={CHART_COLORS.seq[i%CHART_COLORS.seq.length]}/>)}
                  <LabelList dataKey="posPercent" position="top" formatter={v=>`${v}%`} style={{fontSize:11,fill:"#475569",fontWeight:600}}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Government awareness bar */}
      <div className="chart-card mb-5">
        <div className="mb-5">
          <h3 className="font-display font-bold text-slate-800 text-sm">🗺️ Awareness % by Government</h3>
          <p className="text-slate-400 text-xs mt-0.5">نسبة الوعي لكل محافظة (من الفروع المتصل بها فقط)</p>
        </div>
        {empty ? <EmptyChart/> : (
          <ResponsiveContainer width="100%" height={Math.max(160, byGov.length*44)}>
            <BarChart layout="vertical" data={byGov} margin={{top:0,right:60,left:8,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
              <XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize:11,fill:"#475569"}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,_,p)=>[`${v}% aware | ${p.payload.reached} reached | ${p.payload.total} total`,"Gov"]}/>
              <Bar dataKey="awareP" radius={[0,6,6,0]} maxBarSize={26}>
                {byGov.map((e,i)=><Cell key={i} fill={CHART_COLORS.perf(e.awareP)}/>)}
                <LabelList dataKey="awareP" position="right" formatter={v=>`${v}%`} style={{fontSize:11,fill:"#475569",fontWeight:700}}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Executive ranking + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <ChartCard title="Filed Executive Ranking" subtitle="ترتيب المسؤولين بناءً على نسبة الوعي" icon="🏆">
          {!byExec.length ? <EmptyChart/> : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(140,Math.min(byExec.slice(0,8).length*44,280))}>
                <BarChart layout="vertical" data={byExec.slice(0,8)} margin={{top:0,right:48,left:8,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                  <XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize:11,fill:"#475569"}} axisLine={false} tickLine={false} tickFormatter={n=>n.length>14?n.slice(0,14)+"…":n}/>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,_,p)=>[`${v}% aware | ${p.payload.reached} reached | ${p.payload.total} calls`,"Exec"]}/>
                  <Bar dataKey="awareP" radius={[0,6,6,0]} maxBarSize={24}>
                    {byExec.slice(0,8).map((e,i)=><Cell key={i} fill={CHART_COLORS.perf(e.awareP)}/>)}
                    <LabelList dataKey="awareP" position="right" formatter={v=>`${v}%`} style={{fontSize:11,fill:"#475569",fontWeight:700}}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <table className="w-full text-xs mt-4">
                <thead><tr className="border-b border-slate-100">{["#","Executive","Calls","Reached","Aware%"].map(h=><th key={h} className={`py-2 px-2 font-display font-semibold uppercase tracking-wide text-slate-400 ${h==="#"||h==="Executive"?"text-left":"text-right"}`}>{h}</th>)}</tr></thead>
                <tbody>{byExec.slice(0,6).map((r,i)=>(
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-1.5 px-2 text-slate-300 font-mono">{i+1}</td>
                    <td className="py-1.5 px-2 font-semibold text-slate-700 truncate max-w-[120px]" title={r.name}>{r.name}</td>
                    <td className="py-1.5 px-2 text-right text-slate-500">{r.total}</td>
                    <td className="py-1.5 px-2 text-right text-slate-500">{r.reached}</td>
                    <td className="py-1.5 px-2 text-right font-bold" style={{color:CHART_COLORS.perf(r.awareP)}}>{r.awareP}%</td>
                  </tr>
                ))}</tbody>
              </table>
              {byExec.length>6 && <p className="text-xs text-slate-400 text-center py-2">+{byExec.length-6} more</p>}
            </>
          )}
        </ChartCard>

        <ChartCard title="Daily Trend" subtitle="المكالمات والوعي يومياً" icon="📅">
          {trend.length < 2 ? <EmptyChart message="Not enough data for a trend"/> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trend} margin={{top:8,right:16,left:-8,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="date" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={d=>`Date: ${d}`}/>
                <Legend iconType="circle" iconSize={8} formatter={v=><span style={{fontSize:12,color:"#64748b"}}>{v}</span>}/>
                <Line type="monotone" dataKey="total"    name="Total Calls" stroke="#2563eb" strokeWidth={2.5} dot={{r:4,strokeWidth:0}} activeDot={{r:6}}/>
                <Line type="monotone" dataKey="reached"  name="Reached"     stroke="#059669" strokeWidth={2}   dot={{r:3,strokeWidth:0}}/>
                <Line type="monotone" dataKey="aware"    name="Aware"       stroke="#10b981" strokeWidth={2}   strokeDasharray="5 3" dot={{r:3,strokeWidth:0}}/>
                <Line type="monotone" dataKey="noAnswer" name="No Answer"   stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" dot={{r:3,strokeWidth:0}}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <DataTable title="Call Records" records={recs} columns={COLS} loading={loading&&all.length>0}
        searchFields={["filedExecutive","userName","merchantName","government","project","callType","branchStatus","comments"]}/>
    </div>
  );
}
