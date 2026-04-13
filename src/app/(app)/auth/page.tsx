import { getMusicAssistantSessionToken } from "@/lib/music-assistant/session";
import { AuthSessionPanel } from "./_components/auth-session-panel";

export default async function AuthPage() {
  const sessionToken = await getMusicAssistantSessionToken();

  return <AuthSessionPanel initialIsAuthenticated={Boolean(sessionToken)} />;
}
