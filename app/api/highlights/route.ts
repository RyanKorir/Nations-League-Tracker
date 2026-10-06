import {NextResponse} from "next/server";
import {getHighlights} from "@/lib/highlights";
export const dynamic="force-dynamic";
// Returns only highlights verified as playable in the visitor's country (Vercel provides it; ?country=XX overrides for testing).
export async function GET(req:Request){
  const country=(new URL(req.url).searchParams.get("country")||req.headers.get("x-vercel-ip-country")||"").toUpperCase();
  try{
    const all=await getHighlights();
    const videos=all.filter(v=>v.countries===null||(!!country&&!!v.countries?.includes(country))).map(({countries,chk,...v})=>v);
    return NextResponse.json({country,videos,checked:all.length},{headers:{"Cache-Control":"private, max-age=120"}});
  }catch{return NextResponse.json({country,videos:[],checked:0})}
}
