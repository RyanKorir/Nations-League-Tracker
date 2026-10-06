import {Match,Status,canon,groupOf} from "./data";
// Unofficial ESPN endpoint (no SLA). Isolated here so the provider can be swapped.
// ESPN rejects date *ranges* for this competition (HTTP 400) but accepts single days, so we query day by day.
const BASE="https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.nations/scoreboard";
const day=864e5,ymd=(t:number)=>new Date(t).toISOString().slice(0,10).replace(/-/g,"");
// League-phase matchday windows (UEFA): 24 Sep–6 Oct and 12–17 Nov 2026
const ALL_DAYS:string[]=[];
for(const [a,b] of [[Date.UTC(2026,8,24),Date.UTC(2026,9,6)],[Date.UTC(2026,10,12),Date.UTC(2026,10,17)]])
  for(let t=a;t<=b;t+=day)ALL_DAYS.push(ymd(t));

export const store=new Map<string,any>(); // event id → latest raw event (kept between requests)
let fullAt=0;
async function fetchDay(d:string):Promise<any[]>{
  const r=await fetch(`${BASE}?dates=${d}`,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(8000),cache:"no-store"});
  if(!r.ok)throw new Error(`${d}: HTTP ${r.status}`);
  const j=await r.json();
  if(!Array.isArray(j.events))throw new Error(`${d}: unexpected response shape`);
  return j.events;
}
export async function fetchEspn():Promise<Match[]>{
  const now=Date.now(),full=now-fullAt>300000; // full sweep every 5 min; otherwise only yesterday/today/tomorrow
  const days=full?ALL_DAYS:[-1,0,1].map(o=>ymd(now+o*day));
  const res=await Promise.allSettled(days.map(fetchDay));
  const ok=res.filter((r):r is PromiseFulfilledResult<any[]>=>r.status==="fulfilled");
  if(!ok.length)throw new Error((res[0] as PromiseRejectedResult).reason?.message??"ESPN unreachable");
  for(const r of ok)for(const e of r.value)store.set(String(e.id),e);
  if(full&&ok.length===res.length)fullAt=now;
  const out=new Map<string,Match>();
  for(const e of store.values()){
    const cs=e.competitions?.[0]?.competitors??[];
    const h=cs.find((x:any)=>x.homeAway==="home"),a=cs.find((x:any)=>x.homeAway==="away");
    const hn=canon(h?.team?.displayName??""),an=canon(a?.team?.displayName??"");
    if(!hn||!an||groupOf[hn]!==groupOf[an]){console.warn("Unmapped fixture",h?.team?.displayName,a?.team?.displayName);continue}
    const t=e.status?.type;let status:Status="UPCOMING";
    if(/POSTPONED/.test(t?.name))status="POSTPONED";else if(/CANCEL/.test(t?.name))status="CANCELLED";
    else if(t?.state==="in")status=t.name==="STATUS_HALFTIME"?"HALF_TIME":"LIVE";
    else if(t?.state==="post")status="FULL_TIME";
    const scored=status==="LIVE"||status==="HALF_TIME"||status==="FULL_TIME";
    const id=`${hn}|${an}`;
    out.set(id,{id,group:groupOf[hn],home:hn,away:an,hg:scored?Number(h.score):null,ag:scored?Number(a.score):null,status,kickoff:e.date,
      minute:status==="LIVE"?e.status?.displayClock:status==="HALF_TIME"?"HT":undefined,source:"ESPN"});
  }
  return [...out.values()];
}
