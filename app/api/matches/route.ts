import {NextResponse} from "next/server";
import {seeded,applyLive,Match} from "@/lib/data";
import {fetchEspn} from "@/lib/espn";
export const dynamic="force-dynamic";
let snap:{matches:Match[];at:number}|null=null; // last good snapshot (per instance; use KV/Redis for a shared cache)
const H={"Cache-Control":"public, s-maxage=10, stale-while-revalidate=20"};
export async function GET(){
  try{
    const matches=applyLive(seeded(),await fetchEspn());
    snap={matches,at:Date.now()};
    return NextResponse.json({health:"LIVE",matches,at:snap.at},{headers:H});
  }catch(e){
    const error=String((e as Error).message??e).slice(0,300);
    console.error("Provider failed:",error);
    if(snap)return NextResponse.json({health:"CACHED",...snap,error},{headers:H});
    return NextResponse.json({health:"SEED",matches:seeded(),at:null,error},{headers:H});
  }
}
