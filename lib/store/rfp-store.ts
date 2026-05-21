export type RfpStatus = "requested" | "viewed" | "responded" | "declined";

export type RfpRequest = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  supplierId: string;
  supplierName: string;
  requirement: string;
  status: RfpStatus;
  requestedAt: string;
  updatedAt: string;
  sellerResponse?: string;
  sellerRespondedAt?: string;
};

const globalRfpStore = global as typeof global & {
  rfpRequests?: Map<string, RfpRequest>;
};

const rfpRequests = globalRfpStore.rfpRequests || new Map<string, RfpRequest>();
if (!globalRfpStore.rfpRequests) globalRfpStore.rfpRequests = rfpRequests;

function seedRfps() {
  if (rfpRequests.size > 0) return;

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const seeded: RfpRequest[] = [
    // {
    //   id: "RFP-DEMO-1024",
    //   buyerName: "Global Retail Sourcing",
    //   buyerEmail: "buyer@weconnect.demo",
    //   supplierId: "supplier-1",
    //   supplierName: "Nile Logistics",
    //   requirement: "Regional warehousing and last-mile distribution support for Q3 retail expansion.",
    //   status: "responded",
    //   requestedAt: daysAgo(4),
    //   updatedAt: daysAgo(2),
    //   sellerResponse:
    //     "We can support the Q3 rollout with two regional hubs, weekly SLA reporting, and a 14-day onboarding window.",
    //   sellerRespondedAt: daysAgo(2),
    // },
    // {
    //   id: "RFP-DEMO-1025",
    //   buyerName: "Enterprise Procurement Team",
    //   buyerEmail: "buyer@weconnect.demo",
    //   supplierId: "supplier-2",
    //   supplierName: "Global Tech Solutions",
    //   requirement: "Cybersecurity assessment partner for supplier risk review across priority vendors.",
    //   status: "viewed",
    //   requestedAt: daysAgo(1),
    //   updatedAt: daysAgo(1),
    // },
  ];

  for (const rfp of seeded) rfpRequests.set(rfp.id, rfp);
}

seedRfps();

export function listRfps(filters?: { supplierId?: string | null; supplierName?: string | null; buyerEmail?: string | null }) {
  const supplierId = filters?.supplierId?.trim().toLowerCase();
  const supplierName = filters?.supplierName?.trim().toLowerCase();
  const buyerEmail = filters?.buyerEmail?.trim().toLowerCase();

  return [...rfpRequests.values()]
    .filter((rfp) => (supplierId ? rfp.supplierId.toLowerCase() === supplierId : true))
    .filter((rfp) => (supplierName ? rfp.supplierName.toLowerCase() === supplierName : true))
    .filter((rfp) => (buyerEmail ? rfp.buyerEmail.toLowerCase() === buyerEmail : true))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function createRfpRequest(input: {
  supplierId: string;
  supplierName: string;
  buyerName?: string;
  buyerEmail?: string;
  requirement?: string;
}) {
  const now = new Date().toISOString();
  const id = `RFP-${Date.now().toString(36).toUpperCase()}`;
  const requirement = input.requirement?.trim() || "Requirement details to be shared by buyer.";
  const rfp: RfpRequest = {
    id,
    buyerName: input.buyerName?.trim() || "Demo Buyer",
    buyerEmail: input.buyerEmail?.trim() || "buyer@weconnect.demo",
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    requirement,
    status: "requested",
    requestedAt: now,
    updatedAt: now,
  };

  rfpRequests.set(id, rfp);
  return rfp;
}

export function respondToRfp(input: { id: string; response: string; status?: RfpStatus }) {
  const existing = rfpRequests.get(input.id);
  if (!existing) return null;

  const response = input.response.trim();
  const now = new Date().toISOString();
  const next: RfpRequest = {
    ...existing,
    sellerResponse: response || existing.sellerResponse,
    sellerRespondedAt: response ? now : existing.sellerRespondedAt,
    status: input.status ?? (response ? "responded" : "viewed"),
    updatedAt: now,
  };

  rfpRequests.set(next.id, next);
  return next;
}
