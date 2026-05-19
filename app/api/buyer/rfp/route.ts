import { NextResponse } from "next/server";
import { createRfpRequest, listRfps } from "@/lib/store/rfp-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const buyerEmail = searchParams.get("buyerEmail");

  return NextResponse.json({
    ok: true,
    rfps: listRfps({ buyerEmail }),
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    supplierId?: string;
    supplierName?: string;
    buyerQuery?: string;
    buyerName?: string;
    buyerEmail?: string;
  };

  if (!body.supplierId || !body.supplierName) {
    return NextResponse.json(
      { ok: false, message: "supplierId and supplierName are required." },
      { status: 400 },
    );
  }

  const rfp = createRfpRequest({
    supplierId: body.supplierId,
    supplierName: body.supplierName,
    buyerName: body.buyerName,
    buyerEmail: body.buyerEmail,
    requirement: body.buyerQuery,
  });

  return NextResponse.json({
    ok: true,
    inviteId: rfp.id,
    rfp,
    status: rfp.status,
    message: `Invite sent to ${body.supplierName}. Requirement: ${rfp.requirement}`,
  });
}
