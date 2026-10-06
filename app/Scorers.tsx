"use client";
import {useEffect,useState} from "react";
type P={name:string;team:string;n:number};
type S={leagues:Record<string,{scorers:P[];assisters:P[]}>;used:number;total:number};
function List({title,unit,rows}:{title:string;unit:string;rows:P[]}){
  return <div className="rounded-xl bg-slate-800/60 p-4 text-sm"><h3 className="mb-2 font-semibold">{title}</h3>
    {rows.length?<ol className="divide-y divide-slate-700/50">{rows.map((p,i)=><li key={p.name+p.team} className="flex items-center gap-3 py-1.5">
      <span className="w-5 text-slate-500 num">{i+1}</span><span className="flex-1 truncate">{p.name} <span className="text-slate-400">· {p.team}</span></span>
      <span className="num font-bold text-emerald-300">{p.n}</span><span className="w-12 text-xs text-slate-500">{unit}{p.n===1?"":"s"}</span></li>)}</ol>
      :<p className="text-slate-400">No data yet.</p>}</div>;
}
export default function Scorers(){
  const [s,setS]=useState<S|null>(null),[lg,setLg]=useState("A"),[err,setErr]=useState(false);
  useEffect(()=>{
    let on=true;const f=async()=>{try{const r=await fetch("/api/stats");if(!r.ok)throw 0;const j=await r.json();if(on){setS(j);setErr(false)}}catch{if(on)setErr(true)}};
    f();const id=setInterval(()=>{if(!document.hidden)f()},60000);return()=>{on=false;clearInterval(id)};
  },[]);
  const d=s?.leagues[lg];
  return <div>
    <div className="mb-4 flex gap-2">{["A","B","C","D"].map(l=><button key={l} onClick={()=>setLg(l)} className={`rounded px-3 py-1 text-sm ${lg===l?"bg-emerald-500 text-slate-900 font-semibold":"bg-slate-700"}`}>League {l}</button>)}</div>
    {!s&&!err&&<div className="h-40 animate-pulse rounded-xl bg-slate-800/60"/>}
    {err&&!s&&<p className="text-rose-300">Couldn't load player stats.</p>}
    {d&&<div className="grid gap-4 md:grid-cols-2"><List title="Top scorers" unit="goal" rows={d.scorers}/><List title="Top assisters" unit="assist" rows={d.assisters}/></div>}
    {s&&<p className="mt-2 text-xs text-slate-500">Top 5 per league from ESPN match reports ({s.used} of {s.total} played or live matches). Own goals excluded; ties sorted alphabetically.</p>}
  </div>;
}
