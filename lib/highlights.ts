import {canon} from "./data";
// Free, official highlights only: discovered from the public YouTube RSS feed of a licensed publisher and played in
// YouTube's official embedded player. Each video is checked for country availability so a visitor is only ever
// shown a highlight that actually plays where they are. Add more official channels to FEEDS to widen coverage.
const FEEDS=[{name:"DAZN Football",id:"UCSZ21xyG8w_33KriMM69IxQ"}];
export interface Vid{id:string;date:string;home:string;away:string;title:string;src:string;countries?:string[]|null;chk?:number}
const known=new Map<string,Vid>(); // the feed only keeps ~15 latest uploads, so we accumulate what we've seen
let at=0;
const dec=(s:string)=>s.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'");
// countries: list of country codes where the video plays; null = no restriction; undefined = not verified yet (never shown)
async function avail(v:Vid){
  if(v.chk&&Date.now()-v.chk<216e5)return; // re-check every 6 hours
  try{
    const r=await fetch(`https://www.youtube.com/watch?v=${v.id}`,{signal:AbortSignal.timeout(8000),cache:"no-store",headers:{"Accept-Language":"en"}});
    const h=await r.text();
    if(!h.includes('"playabilityStatus"'))return;
    const c=h.match(/"availableCountries":\[([^\]]*)\]/);
    v.countries=c?c[1].replace(/"/g,"").split(",").filter(Boolean):null;v.chk=Date.now();
  }catch{}
}
export async function getHighlights():Promise<Vid[]>{
  if(Date.now()-at>300000){
    at=Date.now();
    await Promise.allSettled(FEEDS.map(async f=>{
      const r=await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${f.id}`,{signal:AbortSignal.timeout(8000),cache:"no-store"});
      if(!r.ok)throw new Error("HTTP "+r.status);
      for(const m of (await r.text()).matchAll(/<entry>[\s\S]*?<yt:videoId>([^<]+)<\/yt:videoId>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<published>([^<]+)<\/published>/g)){
        const title=dec(m[2]);
        if(!/nations league/i.test(title)||!/highlights/i.test(title))continue;
        const t=title.match(/^(.+?)\s+(?:vs\.?|v)\s+(.+?)\s*[|:–-]/i);
        if(!t)continue;
        const home=canon(t[1].trim()),away=canon(t[2].trim());
        if(!home||!away)continue;
        if(!known.has(m[1]))known.set(m[1],{id:m[1],date:m[3],home,away,title,src:f.name});
      }
    }));
    await Promise.allSettled([...known.values()].map(avail));
  }
  return [...known.values()].sort((a,b)=>b.date.localeCompare(a.date));
}
