export type League = "A"|"B"|"C"|"D";
export type Status = "UPCOMING"|"LIVE"|"HALF_TIME"|"FULL_TIME"|"POSTPONED"|"CANCELLED";
export interface Match{id:string;group:string;home:string;away:string;hg:number|null;ag:number|null;status:Status;kickoff?:string;minute?:string;source:string}

// Groups: verified against UEFA "All you need to know" (28 Sep 2026)
export const GROUPS:Record<string,string[]>={
A1:["France","Italy","Belgium","Türkiye"],A2:["Germany","Netherlands","Serbia","Greece"],
A3:["Spain","Croatia","England","Czechia"],A4:["Portugal","Denmark","Norway","Wales"],
B1:["Scotland","Switzerland","Slovenia","North Macedonia"],B2:["Hungary","Ukraine","Georgia","Northern Ireland"],
B3:["Israel","Austria","Republic of Ireland","Kosovo"],B4:["Poland","Bosnia and Herzegovina","Romania","Sweden"],
C1:["Albania","Finland","Belarus","San Marino"],C2:["Montenegro","Armenia","Cyprus","Latvia"],
C3:["Kazakhstan","Slovakia","Faroe Islands","Moldova"],C4:["Iceland","Bulgaria","Estonia","Luxembourg"],
D1:["Gibraltar","Malta","Andorra"],D2:["Lithuania","Azerbaijan","Liechtenstein"]};
export const GROUP_IDS=Object.keys(GROUPS);
export const leagueOf=(g:string)=>g[0] as League;
export const groupOf:Record<string,string>=Object.fromEntries(Object.entries(GROUPS).flatMap(([g,t])=>t.map(x=>[x,g])));
const ALIAS:Record<string,string>={Turkey:"Türkiye",Turkiye:"Türkiye","Czech Republic":"Czechia","Bosnia-Herzegovina":"Bosnia and Herzegovina","Bosnia & Herzegovina":"Bosnia and Herzegovina",Ireland:"Republic of Ireland","Rep. of Ireland":"Republic of Ireland"};
export const canon=(n:string)=>{const c=ALIAS[n]??n;return groupOf[c]?c:null};

export function skeleton():Match[]{
  const out:Match[]=[];
  for(const [g,t] of Object.entries(GROUPS)) for(const h of t) for(const a of t) if(h!==a)
    out.push({id:`${h}|${a}`,group:g,home:h,away:a,hg:null,ag:null,status:"UPCOMING",source:"fixture list"});
  return out;
}
// Results confirmed on uefa.com up to 28 Sep 2026. Live provider data overrides these.
const SEED=`Andorra 1-2 Malta
Netherlands 1-1 Germany
Serbia 1-2 Greece
Norway 3-2 Denmark
Portugal 1-0 Wales
Austria 3-1 Israel
Kosovo 1-0 Republic of Ireland
Liechtenstein 0-2 Lithuania
Georgia 0-1 Northern Ireland
Armenia 2-0 Latvia
Italy 0-2 Belgium
Türkiye 0-1 France
Hungary 0-1 Ukraine
Poland 0-0 Bosnia and Herzegovina
Sweden 2-1 Romania
Montenegro 2-1 Cyprus
Slovenia 0-0 Scotland
San Marino 0-7 Finland
Faroe Islands 1-1 Kazakhstan
Bulgaria 1-2 Luxembourg
Iceland 1-1 Estonia
Czechia 1-2 Croatia
England 2-3 Spain
North Macedonia 0-3 Switzerland
Albania 2-0 Belarus
Slovakia 2-0 Moldova
Denmark 2-0 Wales
Serbia 1-2 Netherlands
Germany 0-1 Greece
Norway 1-2 Portugal
Austria 3-1 Kosovo
Israel 0-3 Republic of Ireland
Georgia 0-0 Ukraine
Armenia 2-3 Montenegro
Latvia 0-0 Cyprus
Belgium 0-1 France
Türkiye 1-4 Italy
Northern Ireland 0-0 Hungary
Romania 2-4 Bosnia and Herzegovina
Sweden 3-1 Poland`;
export function seeded():Match[]{
  const ms=skeleton(),idx=new Map(ms.map(m=>[m.id,m]));
  for(const line of SEED.split("\n")){
    const r=line.match(/^(.+) (\d+)-(\d+) (.+)$/);const m=r&&idx.get(`${r[1]}|${r[4]}`);
    if(r&&m){m.hg=+r[2];m.ag=+r[3];m.status="FULL_TIME";m.source="UEFA (to 28 Sep)"}
  }
  return ms;
}
export function applyLive(base:Match[],live:Match[]){
  const idx=new Map(base.map(m=>[m.id,m]));
  for(const l of live){const m=idx.get(l.id);if(m)Object.assign(m,l)}
  return base;
}
