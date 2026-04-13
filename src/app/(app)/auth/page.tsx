import { getIsAuthenticatedFromSessionApi } from "../_lib/auth-session";
import { AuthSessionPanel } from "./_components/auth-session-panel";

export default async function AuthPage() {
  const isAuthenticated = await getIsAuthenticatedFromSessionApi();

  return <AuthSessionPanel initialIsAuthenticated={isAuthenticated} />;
}
