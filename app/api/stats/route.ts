import {NextResponse} from "next/server";
import {getStats} from "@/lib/stats";
export const dynamic="force-dynamic";
export async function GET(req:Request){
  try{return NextResponse.json(await getStats(new URL(req.url).searchParams.has("debug")),{headers:{"Cache-Control":"public, s-maxage=30, stale-while-revalidate=60"}})}
  catch(e){return NextResponse.json({error:String((e as Error).message)},{status:502})}
}
