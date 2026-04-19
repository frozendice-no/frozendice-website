import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

type WebhookPayload = {
  _type?: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: "Missing SANITY_WEBHOOK_SECRET" },
      { status: 500 },
    );
  }

  try {
    const { isValidSignature, body } = await parseBody<WebhookPayload>(req, secret, true);

    if (!isValidSignature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    if (!body?._type) {
      return NextResponse.json({ message: "Missing _type in payload" }, { status: 400 });
    }

    revalidateTag(body._type, { expire: 0 });
    console.log(`Revalidated tag: ${body._type}`);

    return NextResponse.json({ revalidated: body._type });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Revalidation webhook error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
