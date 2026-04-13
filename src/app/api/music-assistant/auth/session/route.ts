import { NextResponse } from "next/server";

import { getMusicAssistantSessionToken } from "@/lib/music-assistant/session";

export async function GET() {
  const token = await getMusicAssistantSessionToken();

  return NextResponse.json(
    {
      success: true,
      authenticated: Boolean(token),
    },
    { status: 200 },
  );
}
