import { NextResponse } from "next/server";

import { logoutMusicAssistantSession } from "@/lib/music-assistant/server";

export async function POST() {
  await logoutMusicAssistantSession();
  return NextResponse.json({ success: true }, { status: 200 });
}
