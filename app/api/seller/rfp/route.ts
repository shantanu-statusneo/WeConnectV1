import { NextResponse } from "next/server";
import { listRfps, respondToRfp } from "@/lib/store/rfp-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplierId");
  const supplierName = searchParams.get("supplierName");

  return NextResponse.json({
    ok: true,
    rfps: listRfps({ supplierId, supplierName }),
  });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as {
    id?: string;
    response?: string;
    status?: "viewed" | "responded" | "declined";
  };

  if (!body.id) {
    return NextResponse.json({ ok: false, message: "RFP id is required." }, { status: 400 });
  }

  const updated = respondToRfp({
    id: body.id,
    response: body.response ?? "",
    status: body.status,
  });

  if (!updated) {
    return NextResponse.json({ ok: false, message: "RFP request was not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, rfp: updated });
}
