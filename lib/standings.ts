import type {Match} from "./data";
export interface Row{team:string;p:number;w:number;d:number;l:number;gf:number;ga:number;gd:number;pts:number;awayGoals:number;awayWins:number;pos:number}
const fin=(ms:Match[])=>ms.filter(m=>m.status==="FULL_TIME"&&m.hg!==null&&m.ag!==null);

export function tally(teams:string[],ms:Match[]):Row[]{
  const t=new Map<string,Row>(teams.map(n=>[n,{team:n,p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0,awayGoals:0,awayWins:0,pos:0}]));
  for(const m of fin(ms)){
    const h=t.get(m.home),a=t.get(m.away);if(!h||!a)continue;const x=m.hg!,y=m.ag!;
    h.p++;a.p++;h.gf+=x;h.ga+=y;a.gf+=y;a.ga+=x;a.awayGoals+=y;
    if(x>y){h.w++;a.l++;h.pts+=3}else if(x<y){a.w++;a.awayWins++;h.l++;a.pts+=3}else{h.d++;a.d++;h.pts++;a.pts++}
  }
  t.forEach(r=>r.gd=r.gf-r.ga);
  return [...t.values()];
}
const cmp=(a:number[],b:number[])=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return b[i]-a[i];return 0};
function split(rows:Row[],k:(r:Row)=>number[]):Row[][]{
  const s=[...rows].sort((a,b)=>cmp(k(a),k(b))),out:Row[][]=[];
  for(const r of s){const l=out[out.length-1];if(l&&cmp(k(l[0]),k(r))===0)l.push(r);else out.push([r])}
  return out;
}
// Points → head-to-head (points, GD, goals; re-applied to teams still level) → overall GD, goals, away goals, wins, away wins.
// Disciplinary points and coefficient position are not available, so remaining ties fall back to alphabetical.
export function rank(teams:string[],ms:Match[]):Row[]{
  const overall=(r:Row)=>[r.gd,r.gf,r.awayGoals,r.w,r.awayWins];
  const resolve=(bucket:Row[]):Row[]=>{
    if(bucket.length<2)return bucket;
    const names=bucket.map(r=>r.team);
    const by=new Map(tally(names,fin(ms).filter(m=>names.includes(m.home)&&names.includes(m.away))).map(r=>[r.team,r]));
    const groups=split(bucket,r=>{const s=by.get(r.team)!;return [s.pts,s.gd,s.gf]});
    if(groups.length===1)return split(bucket,overall).flatMap(g=>g.sort((a,b)=>a.team.localeCompare(b.team)));
    return groups.flatMap(resolve);
  };
  return split(tally(teams,ms),r=>[r.pts]).flatMap(resolve).map((r,i)=>({...r,pos:i+1}));
}
