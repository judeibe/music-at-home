import { GET as getAuthSession } from "@/app/api/music-assistant/auth/session/route";

type SessionStateResponse = {
  authenticated?: boolean;
};

export async function getIsAuthenticatedFromSessionApi(): Promise<boolean> {
  const response = await getAuthSession();

  if (!response.ok) {
    return false;
  }

  const payload = (await response.json().catch(() => null)) as SessionStateResponse | null;
  return Boolean(payload?.authenticated);
}
