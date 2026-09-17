import { NextResponse } from "next/server";
import { readProductKnowledge, replaceProductKnowledge } from "@/app/lib/product-knowledge/repository";
export async function GET(){try{return NextResponse.json(await readProductKnowledge())}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Veritabanı hatası"},{status:503})}}
export async function PUT(request:Request){try{const {store,sourceFilename}=await request.json();await replaceProductKnowledge(store,sourceFilename);return NextResponse.json({ok:true})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Kayıt hatası"},{status:400})}}
