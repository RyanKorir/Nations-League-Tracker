import {store,fetchEspn} from "./espn";
import {canon,groupOf,leagueOf} from "./data";
// Top scorers / assisters per league, built from ESPN match reports (key events). Own goals are excluded.
const SUMMARY="https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.nations/summary?event=";
interface Goal{scorer:string;team:string;assist?:string}
const done=new Map<string,Goal[]>(),live=new Map<string,Goal[]>();
let out:any=null,outAt=0,sample:any=null;
function parse(j:any):Goal[]{
  const ks:any[]=j.keyEvents??[],any=ks.some(k=>k.scoringPlay===true),goals:Goal[]=[];
  for(const k of ks){
    const ty=String(k.type?.text??""),tx=String(k.text??"");
    const isGoal=any?k.scoringPlay===true:/^(goal|penalty - scored)/i.test(ty);
    if(!isGoal||/own goal/i.test(ty+" "+tx))continue;
    const scorer=k.participants?.[0]?.athlete?.displayName;
    if(!scorer)continue;
    const m=tx.match(/Assisted by (.+?)(?:\s+with\b|\s+following\b|\s+from\b|\.|$)/i);
    const assist=m?m[1].trim():(/assist/i.test(tx)?k.participants?.[1]?.athlete?.displayName:undefined);
    goals.push({scorer,team:canon(k.team?.displayName??"")??String(k.team?.displayName??""),assist});
  }
  return goals;
}
const top=(m:Map<string,number>)=>[...m].map(([k,n])=>{const [name,team]=k.split("|");return{name,team,n}}).sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name)).slice(0,5);
export async function getStats(debug=false){
  if(!debug&&out&&Date.now()-outAt<45000)return out;
  if(!store.size)await fetchEspn().catch(()=>{});
  const evs=[...store.values()].filter(e=>["in","post"].includes(e.status?.type?.state));
  const todo=evs.filter(e=>e.status.type.state==="in"||!done.has(String(e.id)));
  for(let i=0;i<todo.length;i+=8)await Promise.allSettled(todo.slice(i,i+8).map(async e=>{
    const r=await fetch(SUMMARY+e.id,{signal:AbortSignal.timeout(8000),cache:"no-store"});
    if(!r.ok)throw new Error("HTTP "+r.status);
    const j=await r.json();if(!sample)sample=(j.keyEvents??[]).slice(0,3);
    (e.status.type.state==="post"?done:live).set(String(e.id),parse(j));
  }));
  const sc:Record<string,Map<string,number>>={},as:Record<string,Map<string,number>>={};
  for(const L of "ABCD"){sc[L]=new Map();as[L]=new Map()}
  let used=0;
  for(const e of evs){
    const g=done.get(String(e.id))??live.get(String(e.id));if(!g)continue;used++;
    const cs=e.competitions?.[0]?.competitors??[],hn=canon(cs.find((x:any)=>x.homeAway==="home")?.team?.displayName??"");
    if(!hn)continue;const L=leagueOf(groupOf[hn]);
    for(const x of g){
      const k=`${x.scorer}|${x.team}`;sc[L].set(k,(sc[L].get(k)??0)+1);
      if(x.assist){const a=`${x.assist}|${x.team}`;as[L].set(a,(as[L].get(a)??0)+1)}
    }
  }
  const leagues:any={};for(const L of "ABCD")leagues[L]={scorers:top(sc[L]),assisters:top(as[L])};
  out={leagues,used,total:evs.length,at:Date.now(),...(debug?{sample}:{})};outAt=Date.now();return out;
}
