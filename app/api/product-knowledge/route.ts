import { NextResponse } from "next/server";
import {
  readProductKnowledge,
  replaceProductKnowledge,
} from "@/app/lib/product-knowledge/repository";
import { ProductKnowledgeStore } from "@/app/lib/product-knowledge/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Veritabanı hatası";
}

export async function GET() {
  try {
    return NextResponse.json(await readProductKnowledge(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Product Knowledge GET failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      store?: ProductKnowledgeStore;
      sourceFilename?: string;
    };

    if (!body.store) {
      return NextResponse.json(
        { error: "Kaydedilecek ürün bilgisi bulunamadı." },
        { status: 400 },
      );
    }

    await replaceProductKnowledge(body.store, body.sourceFilename);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Product Knowledge PUT failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 503 });
  }
}
