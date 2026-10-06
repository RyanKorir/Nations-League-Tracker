"use client";
import {createContext,useCallback,useContext,useEffect,useState} from "react";
import {GROUPS,GROUP_IDS,leagueOf,Match} from "@/lib/data";
import {rank} from "@/lib/standings";
import TreeView from "./Tree";
import Scorers from "./Scorers";

interface Vid{id:string;date:string;home:string;away:string;title:string;src:string}
const HL=createContext<{find:(m:Match)=>Vid|undefined;play:(v:Vid)=>void}>({find:()=>undefined,play:()=>{}});
function Player({v,close}:{v:Vid;close:()=>void}){
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={close}>
    <div className="w-full max-w-3xl" onClick={e=>e.stopPropagation()}>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="truncate">{v.title}</span><button onClick={close} className="rounded bg-slate-700 px-3 py-1">Close ✕</button></div>
      <div className="aspect-video overflow-hidden rounded-xl bg-black"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`} title={v.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/></div>
      <p className="mt-2 text-xs text-slate-400">Video: {v.src} on YouTube. If it doesn't play in your region, <a className="underline" href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer">watch it on YouTube</a>.</p>
    </div></div>;
}

type Payload={health:"LIVE"|"CACHED"|"SEED";matches:Match[];at:number|null;error?:string};
const fmt=(iso?:string)=>iso?new Date(iso).toLocaleString(undefined,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",timeZoneName:"short"}):"Time TBC";
const ago=(t:number|null)=>{if(!t)return "never";const s=Math.round((Date.now()-t)/1000);return s<60?`${s}s ago`:`${Math.round(s/60)} min ago`};
const isLive=(m:Match)=>m.status==="LIVE"||m.status==="HALF_TIME";
const ZONE:Record<string,string>={g:"border-emerald-400",a:"border-amber-400",r:"border-rose-400","":"border-transparent"};
const zone=(L:string,p:number)=>L==="A"?(p<3?"g":p===3?"a":"r"):L==="B"?(p===1?"g":p===2||p===4?"a":""):L==="C"?(p===1?"g":p===2?"a":""):"g";
const LEGEND:Record<string,string>={A:"Green: quarter-finals · Amber: 3rd (stay or play-off) · Red: 4th (play-off or relegation)",B:"Green: promoted · Amber: 2nd (A/B play-off) or 4th (B/C play-off)",C:"Green: promoted to B · Amber: 2nd (B/C play-off)",D:"All League D teams are promoted to League C"};

function MatchRow({m}:{m:Match}){
  const live=isLive(m),done=m.status==="FULL_TIME",sc=m.hg!==null,{find,play}=useContext(HL),v=done?find(m):undefined;
  return <div className={`flex items-center gap-2 py-1.5 text-sm ${live?"text-emerald-300":""}`}>
    <span className="flex-1 text-right truncate">{m.home}</span>
    <span className="num w-14 text-center font-bold">{sc?`${m.hg} – ${m.ag}`:"vs"}</span>
    <span className="flex-1 truncate">{m.away}</span>
    <span className="w-28 text-right text-xs text-slate-400">{live?`● ${m.minute??"LIVE"}`:done?"FT":m.status==="UPCOMING"?fmt(m.kickoff):m.status.replace("_"," ")}</span>
    <span className="w-24 text-right text-xs">{v&&<button onClick={()=>play(v)} className="rounded bg-emerald-500 px-2 py-0.5 font-semibold text-slate-900">▶ Highlights</button>}</span>
  </div>;
}
function Group({id,ms}:{id:string;ms:Match[]}){
  const L=leagueOf(id),rows=rank(GROUPS[id],ms),mine=ms.filter(m=>m.group===id);
  return <details open className="rounded-xl bg-slate-800/60 p-4">
    <summary className="cursor-pointer font-semibold">League {L} · Group {id}</summary>
    <table className="num mt-3 w-full text-sm"><thead className="text-xs text-slate-400"><tr>
      <th className="text-left">#</th><th className="text-left">Team</th>{["P","W","D","L","GF","GA","GD","Pts"].map(h=><th key={h} className="w-8">{h}</th>)}</tr></thead>
      <tbody>{rows.map(r=><tr key={r.team} className={`border-l-4 text-center ${ZONE[zone(L,r.pos)]}`}>
        <td className="pl-2 text-left">{r.pos}</td><td className="text-left">{r.team}</td>
        <td>{r.p}</td><td>{r.w}</td><td>{r.d}</td><td>{r.l}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd>0?`+${r.gd}`:r.gd}</td><td className="font-bold">{r.pts}</td></tr>)}</tbody></table>
    <p className="mt-2 text-xs text-slate-500">{LEGEND[L]}. Colours show current position, not confirmed outcomes.</p>
    <div className="mt-3 divide-y divide-slate-700/50">{mine.map(m=><MatchRow key={m.id} m={m}/>)}</div>
  </details>;
}
const Sec=({t,children}:{t:string;children:React.ReactNode})=><section className="mt-10"><h2 className="mb-3 text-xl font-bold">{t}</h2>{children}</section>;
const Card=({children}:{children:React.ReactNode})=><div className="rounded-xl bg-slate-800/60 p-4 text-sm">{children}</div>;

export default function Page(){
  const [d,setD]=useState<Payload|null>(null),[busy,setBusy]=useState(false),[err,setErr]=useState(false),[league,setLeague]=useState("ALL"),[tree,setTree]=useState(false),[,tick]=useState(0),[vids,setVids]=useState<Vid[]>([]),[playing,setPlaying]=useState<Vid|null>(null);
  const load=useCallback(async(manual=false)=>{setBusy(true);try{const r=await fetch(manual?`/api/matches?t=${Date.now()}`:"/api/matches",{cache:"no-store"});if(!r.ok)throw 0;setD(await r.json());setErr(false)}catch{setErr(true)}setBusy(false)},[]);
  const live=!!d?.matches.some(isLive);
  useEffect(()=>{let on=true;const f=async()=>{try{const r=await fetch("/api/highlights");if(r.ok){const j=await r.json();if(on)setVids(j.videos)}}catch{}};f();const id=setInterval(f,300000);return()=>{on=false;clearInterval(id)}},[]);
  useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.key==="Escape")setPlaying(null)};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)},[]);
  const find=(m:Match)=>{const k=Date.parse(m.kickoff??"");return vids.find(v=>((v.home===m.home&&v.away===m.away)||(v.home===m.away&&v.away===m.home))&&(isNaN(k)||Math.abs(Date.parse(v.date)-k)<4*864e5))};
  useEffect(()=>{load();},[load]);
  useEffect(()=>{const f=()=>{if(!document.hidden)load(true)};document.addEventListener("visibilitychange",f);return()=>document.removeEventListener("visibilitychange",f)},[load]);
  useEffect(()=>{ // adaptive polling: 15s with live matches, else 30s; paused while tab hidden
    const id=setInterval(()=>{if(!document.hidden)load()},live?15000:30000);
    const t=setInterval(()=>tick(x=>x+1),10000);
    return()=>{clearInterval(id);clearInterval(t)};
  },[live,load]);

  const ms=d?.matches??[],played=ms.filter(m=>m.status==="FULL_TIME").length;
  const health=err&&!d?"ERROR":d?.health??"LOADING";
  const chip:Record<string,[string,string]>={LIVE:["text-emerald-400",`LIVE DATA · updated ${ago(d?.at??null)}`],CACHED:["text-amber-400",`CACHED · provider unavailable · last update ${ago(d?.at??null)}`],SEED:["text-sky-400","OFFLINE · showing UEFA results to 28 Sep only"],ERROR:["text-rose-400","DATA ERROR · unable to retrieve data"],LOADING:["text-slate-400","Loading…"]};
  const liveNow=ms.filter(isLive),latest=ms.filter(m=>m.status==="FULL_TIME").slice(-6).reverse();
  const next=ms.filter(m=>m.status==="UPCOMING"&&m.kickoff).sort((a,b)=>a.kickoff!.localeCompare(b.kickoff!)).slice(0,6);
  const ids=GROUP_IDS.filter(g=>league==="ALL"||leagueOf(g)===league);

  return <HL.Provider value={{find,play:setPlaying}}><main className="mx-auto max-w-6xl px-4 py-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-3xl font-extrabold tracking-tight">UEFA NATIONS LEAGUE <span className="text-emerald-400">2026/27</span></h1><p className="text-slate-400">Live Tournament Tracker</p></div>
      <div className="text-right text-sm"><div className={chip[health][0]}>● {chip[health][1]}</div>{d?.error&&health!=="LIVE"&&<div className="max-w-xs text-xs text-slate-500">{d.error}</div>}
        <button onClick={()=>load(true)} disabled={busy} className="mt-1 rounded bg-slate-700 px-3 py-1 hover:bg-slate-600 disabled:opacity-50">{busy?"Updating…":"↻ Refresh"}</button></div>
    </header>
    <p className="mt-2 text-sm text-slate-400 num">Matches played: {played} / 156</p>

    {!d&&!err&&<div className="mt-6 grid gap-3 sm:grid-cols-2">{[1,2,3,4].map(i=><div key={i} className="h-40 animate-pulse rounded-xl bg-slate-800/60"/>)}</div>}
    {err&&!d&&<p className="mt-6 text-rose-300">We couldn't retrieve data. Please try again.</p>}

    {d&&<>
      <Sec t="Live now">{liveNow.length?<Card>{liveNow.map(m=><MatchRow key={m.id} m={m}/>)}</Card>:<Card><span className="text-slate-400">No matches in play.</span></Card>}</Sec>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div><h2 className="mb-3 text-xl font-bold">Next up</h2><Card>{next.length?next.map(m=><MatchRow key={m.id} m={m}/>):<span className="text-slate-400">Kick-off times appear when the provider publishes them.</span>}</Card></div>
        <div><h2 className="mb-3 text-xl font-bold">Latest results</h2><Card>{latest.map(m=><MatchRow key={m.id} m={m}/>)}</Card></div>
      </div>

      <Sec t="Group stage">
        <div className="mb-4 flex flex-wrap gap-2">{["ALL","A","B","C","D"].map(l=><button key={l} onClick={()=>setLeague(l)} className={`rounded px-3 py-1 text-sm ${league===l?"bg-emerald-500 text-slate-900 font-semibold":"bg-slate-700"}`}>{l==="ALL"?"All":`League ${l}`}</button>)}<button onClick={()=>setTree(t=>!t)} className="ml-auto rounded border border-emerald-500 px-3 py-1 text-sm text-emerald-300">{tree?"Hide tree view":"🌳 Show tree view"}</button></div>
        {tree?<div className="space-y-8">{["A","B","C","D"].filter(l=>league==="ALL"||league===l).map(l=><div key={l}><h3 className="mb-2 font-semibold">League {l}</h3><TreeView league={l} ms={ms}/></div>)}</div>:<div className="grid gap-4 lg:grid-cols-2">{ids.map(g=><Group key={g} id={g} ms={ms}/>)}</div>}
      </Sec>
    </>}

    <Sec t="Top scorers & assisters"><Scorers/></Sec>

    <Sec t="Road to the Final">
      <Card><p className="mb-3 text-slate-300">League A quarter-finals (two legs, aggregate; group runner-up hosts leg 1). Pairings are not drawn until the league phase ends, so nothing below is predicted.</p>
      <div className="grid gap-3 sm:grid-cols-4">{["QF1","QF2","QF3","QF4"].map(q=><div key={q} className="rounded bg-slate-900/60 p-3"><b>{q}</b><div className="text-slate-400">DRAW PENDING</div></div>)}</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">{["SF1","SF2","Third place","Final"].map(q=><div key={q} className="rounded bg-slate-900/60 p-3"><b>{q}</b><div className="text-slate-400">TBD vs TBD</div></div>)}</div>
      <p className="mt-3 text-slate-400">Semi-finals, third-place match and final are single matches in June 2027; the host is not yet confirmed by UEFA.</p></Card>
    </Sec>

    <Sec t="Promotion & relegation">
      <div className="grid gap-3 md:grid-cols-2">
        <Card><b>League A</b><ul className="mt-1 list-disc pl-5 text-slate-300"><li>Winners &amp; runners-up → quarter-finals</li><li>Two best 3rd-placed teams stay in A</li><li>Two worst 3rd + two best 4th → A/B play-offs vs League B runners-up</li><li>Two worst 4th → relegated to B</li></ul></Card>
        <Card><b>League B</b><ul className="mt-1 list-disc pl-5 text-slate-300"><li>Winners → promoted to A</li><li>Runners-up → A/B play-offs</li><li>3rd place stays in B</li><li>4th place → B/C play-offs vs League C runners-up</li></ul></Card>
        <Card><b>League C</b><ul className="mt-1 list-disc pl-5 text-slate-300"><li>Winners → promoted to B</li><li>Runners-up → B/C play-offs</li><li>3rd and 4th stay in C</li></ul></Card>
        <Card><b>League D</b><p className="mt-1 text-slate-300">All teams promoted to League C. League D is removed after this edition (three-league system from 2028/29).</p></Card>
      </div>
    </Sec>

    <Sec t="Rules & dates">
      <div className="grid gap-3 md:grid-cols-2">
        <Card><b>Format</b><p className="mt-1 text-slate-300">Home-and-away round robin. Win 3, draw 1, loss 0. Leagues A–C: 4-team groups, 6 matches per team, 12 per group (4 × 12 = 48 per league). League D: 3-team groups, 4 matches per team, 6 per group (12 total). League phase total: 48 × 3 + 12 = 156.</p>
        <p className="mt-2 text-slate-400">Table order: points, then head-to-head (points, goal difference, goals, re-applied to teams still level), then overall goal difference, goals, away goals, wins, away wins. Disciplinary and coefficient tie-breakers are not available; check UEFA's regulations for final positions.</p></Card>
        <Card><b>Key dates (UEFA)</b><ul className="mt-1 text-slate-300"><li>MD1 24–26 Sep · MD2 27–29 Sep</li><li>MD3 30 Sep–3 Oct · MD4 4–6 Oct</li><li>MD5 12–14 Nov · MD6 15–17 Nov 2026</li><li>Quarter-finals &amp; A/B, B/C play-offs: 25–30 Mar 2027</li><li>Finals: 9–13 Jun 2027</li></ul></Card>
      </div>
    </Sec>

    <footer className="mt-12 border-t border-slate-800 pt-4 text-xs text-slate-500">
      Rules, groups and dates: <a className="underline" href="https://www.uefa.com/uefanationsleague/">UEFA</a> · Live match data: ESPN · Highlights: free official YouTube uploads (DAZN Football), shown only where they play in your country · Results to 28 Sep: UEFA.com. Data may be delayed; cached data is labelled.
    </footer>
  </main>{playing&&<Player v={playing} close={()=>setPlaying(null)}/>}</HL.Provider>;
}
