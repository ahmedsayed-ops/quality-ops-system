powershell -Command "Set-Content -Path src\utils\analytics.js -Value 'import { isPositive, isNegative } from ""./answers"";

export function countPosNeg(records, qKeys) {
  let p = 0, n = 0;
  for (const r of records) for (const k of qKeys) {
    if (isPositive(r[k])) p++;
    else if (isNegative(r[k])) n++;
  }
  return { p, n, total: p + n };
}

export function questionBreakdown(records, questions) {
  return questions.map(q => {
    let pos = 0, neg = 0;
    for (const r of records) {
      if (isPositive(r[q.key])) pos++;
      else if (isNegative(r[q.key])) neg++;
    }
    const total = pos + neg;
    return { name: q.label.slice(0,28), pos, neg, total, posPercent: total>0?Math.round(pos/total*100):0 };
  });
}

export function rankByRate(records, groupField, qKeys) {
  const map = {};
  for (const r of records) {
    const name = (r[groupField] || ""Unknown"").trim();
    if (!map[name]) map[name] = { name, pos:0, neg:0, count:0 };
    map[name].count++;
    for (const k of qKeys) {
      if (isPositive(r[k])) map[name].pos++;
      else if (isNegative(r[k])) map[name].neg++;
    }
  }
  return Object.values(map).map(a => ({ ...a, total: a.pos+a.neg, rate: (a.pos+a.neg)>0 ? Math.round(a.pos/(a.pos+a.neg)*100) : 0 })).sort((a, b) => b.rate - a.rate || b.count - a.count);
}

export function groupByField(records, field, limit) {
  const map = {};
  for (const r of records) { const k=(r[field]||""Unknown"").trim(); map[k]=(map[k]||0)+1; }
  const arr = Object.entries(map).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
  return limit ? arr.slice(0,limit) : arr;
}

export function avgField(records, field) {
  const vals = records.map(r=>parseFloat(r[field])).filter(v=>!isNaN(v));
  return vals.length ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length) : 0;
}

export function applyFilters(records, filters) {
  const { search, dateFrom, dateTo, ...fields } = filters || {};
  const q = (search || """").toLowerCase();
  return records.filter(r => {
    const d = (r.visitDate||r.callDate||r.timestamp||"""").slice(0,10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    for (const [k, v] of Object.entries(fields)) { if (v && r[k] !== v) return false; }
    if (q && !Object.values(r).join("" "").toLowerCase().includes(q)) return false;
    return true;
  });
}'"
ده أمر طويل جداً وممكن يتكسر. الأسهل خالص:
افتح الفولدر src\utils وابعتلي صورة من محتوى ملف analytics.js الموجود دلوقتي — عشان أشوف هو بيحتوي على إيه بالظبط.This content is no longer available.export function applyFilters(records,filters){const{search="",dateFrom="",dateTo="",...fields}=filters||{};const q=search.toLowerCase();return records.filter(r= d=(r.visitDate||r.callDate||r.timestamp||"").slice(0,10);if(dateFrom&&d<dateFrom)return false;if(dateTo&&d>dateTo)return false;for(const[k,v]of Object.entries(fields))if(v&&r[k]!==v)return false;if(q&&!Object.values(r).join(" ").toLowerCase().includes(q))return false;return true;});}12:39شايف المشكلة — الملف فيه "This content is no longer available." في الأول وده بيكسر الكود.
هنحل بطريقة مختلفة. شغّل الأمر ده في الـ Terminal:
powershell -Command "(Get-Content src\utils\analytics.js | Select-String -NotMatch 'no longer available') | Set-Content src\utils\analytics.js"
ادوس Enter وبعدين:
git add .
git commit -m "fix analytics file"
git push
ابعتلي صورة ✅12:40الملف لسه مش اتغيّر. هنكتبه من الصفر مباشرة في الـ Terminal.
شغّل الأمر ده كامل (كوبي والصقه كله مرة واحدة):
powershell -Command "$content = 'import { isPositive, isNegative } from \"./answers\";`n`nexport function countPosNeg(records, qKeys) {`n  let p = 0, n = 0;`n  for (const r of records) for (const k of qKeys) {`n    if (isPositive(r[k])) p++;`n    else if (isNegative(r[k])) n++;`n  }`n  return { p, n, total: p + n };`n}`n`nexport function groupByField(records, field, limit) {`n  const map = {};`n  for (const r of records) { const k=(r[field]||`"Unknown`").trim(); map[k]=(map[k]||0)+1; }`n  const arr = Object.entries(map).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);`n  return limit ? arr.slice(0,limit) : arr;`n}`n`nexport function avgField(records, field) {`n  const vals = records.map(r=>parseFloat(r[field])).filter(v=>!isNaN(v));`n  return vals.length ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length) : 0;`n}`n`nexport function applyFilters(records, filters) {`n  const { search, dateFrom, dateTo, ...fields } = filters || {};`n  const q = (search || `"`").toLowerCase();`n  return records.filter(r => {`n    const d = (r.visitDate||r.callDate||r.timestamp||`"`").slice(0,10);`n    if (dateFrom && d < dateFrom) return false;`n    if (dateTo && d > dateTo) return false;`n    for (const [k, v] of Object.entries(fields)) { if (v && r[k] !== v) return false; }`n    if (q && !Object.values(r).join(`" `").toLowerCase().includes(q)) return false;`n    return true;`n  });`n}'; Set-Content -Path src\utils\analytics.js -Value $content -Encoding UTF8"
بعدين:
git add .
git commit -m "rewrite analytics"
git pushقالي git push12:41ممتاز! شغّل:
git push
ابعتلي صورة النتيجة ✅12:41الملف لسه مش بيتغيّر على الجهاز. هنحله بطريقة مختلفة خالص.
افتح الفولدر ده مباشرة:
explorer src\utils
هيفتح نافذة الـ File Explorer — احذف ملف analytics.js يدوياً، وبعدين اعمل ملف جديد اسمه analytics.js وافتحه بـ Notepad والصق فيه الكود ده بالظبط:
javascriptimport { isPositive, isNegative } from "./answers";

export function countPosNeg(records, qKeys) {
  let p = 0, n = 0;
  for (const r of records) for (const k of qKeys) {
    if (isPositive(r[k])) p++;
    else if (isNegative(r[k])) n++;
  }
  return { p, n, total: p + n };
}

export function groupByField(records, field, limit) {
  const map = {};
  for (const r of records) { const k=(r[field]||"Unknown").trim(); map[k]=(map[k]||0)+1; }
  const arr = Object.entries(map).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
  return limit ? arr.slice(0,limit) : arr;
}

export function avgField(records, field) {
  const vals = records.map(r=>parseFloat(r[field])).filter(v=>!isNaN(v));
  return vals.length ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length) : 0;
}

export function applyFilters(records, filters) {
  const { search, dateFrom, dateTo, ...fields } = filters || {};
  const q = (search || "").toLowerCase();
  return records.filter(r => {
    const d = (r.visitDate||r.callDate||r.timestamp||"").slice(0,10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    for (const [k, v] of Object.entries(fields)) {
      if (v && r[k] !== v) return false;
    }
    if (q && !Object.values(r).join(" ").toLowerCase().includes(q)) return false;
    return true;
  });
}