"use client";
import {GROUPS,GROUP_IDS,leagueOf,Match} from "@/lib/data";
import {rank} from "@/lib/standings";

type N={t:string;s?:string[]};
const W=170,G=64,NH=92;

function Tree({cols,all}:{cols:N[][];all:number[]}){
  const H=Math.max(...cols.map(c=>c.length))*100,ys=(n:number,j:number)=>(j+0.5)*H/n,x=(i:number)=>i*(W+G),lines:string[]=[];
  cols.slice(0,-1).forEach((c,i)=>{
    const a=c.length,b=cols[i+1].length;
    c.forEach((_,j)=>cols[i+1].forEach((__,k)=>{
      const ok=all.includes(i)||(a===b?j===k:a>b?Math.floor(j*b/a)===k:Math.floor(k*a/b)===j);
      if(ok){const x1=x(i)+W,x2=x(i+1),y1=ys(a,j),y2=ys(b,k);lines.push(`M${x1} ${y1}C${x1+30} ${y1} ${x2-30} ${y2} ${x2} ${y2}`)}
    }));
  });
  const total=cols.length*(W+G)-G;
  return <div className="overflow-x-auto pb-2"><div className="relative" style={{width:total,height:H}}>
    <svg className="absolute inset-0" width={total} height={H}>{lines.map((d,i)=><path key={i} d={d} fill="none" stroke="#475569" strokeWidth={1.5}/>)}</svg>
    {cols.map((c,i)=>c.map((n,j)=><div key={`${i}-${j}`} className="absolute overflow-hidden rounded-lg border border-slate-600 bg-slate-800 p-2 text-xs" style={{left:x(i),top:ys(c.length,j)-NH/2,width:W,height:NH}}>
      <div className="font-bold text-emerald-300">{n.t}</div>{n.s?.map(s=><div key={s} className="truncate text-slate-300">{s}</div>)}</div>))}
  </div></div>;
}

export default function TreeView({league,ms}:{league:string;ms:Match[]}){
  const groups:N[]=GROUP_IDS.filter(g=>leagueOf(g)===league).map(g=>({t:`Group ${g}`,s:rank(GROUPS[g],ms).map(r=>`${r.pos}. ${r.team} (${r.pts})`)}));
  let cols:N[][],all:number[]=[0];
  if(league==="A"){all=[];cols=[groups,[{t:"League phase ends",s:["Quarter-final draw"]}],
    [1,2,3,4].map(i=>({t:`QF${i}`,s:["DRAW PENDING","Two legs, aggregate"]})),
    [{t:"SF1",s:["Single match"]},{t:"SF2",s:["Single match"]}],
    [{t:"FINAL",s:["TBD vs TBD","+ Third-place match"]}],[{t:"CHAMPION",s:["TBD"]}]]}
  else if(league==="B")cols=[groups,[{t:"Winners",s:["Promoted to League A"]},{t:"Runners-up",s:["A/B play-off","vs A's 3rd/4th"]},{t:"3rd place",s:["Stay in League B"]},{t:"4th place",s:["B/C play-off","vs C runners-up"]}]];
  else if(league==="C")cols=[groups,[{t:"Winners",s:["Promoted to League B"]},{t:"Runners-up",s:["B/C play-off","vs B's 4th place"]},{t:"3rd & 4th",s:["Stay in League C"]}]];
  else cols=[groups,[{t:"All teams",s:["Promoted to League C"]}]];
  return <>
    <Tree cols={cols} all={all}/>
    {league==="A"&&<p className="mt-1 text-xs text-slate-500">Lines show the stages only. Pairings are set by UEFA's draw after the league phase; nothing is predicted. Group boxes show live positions and points.</p>}
  </>;
}
