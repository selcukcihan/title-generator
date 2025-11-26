import { checkAuth } from "./jwt";

export async function login(request: Request, env: Env): Promise<Response> {
  // Check if user is already authenticated
  const { githubId } = await checkAuth(request, env);
  if (githubId) {
    // User is already logged in, redirect to home
    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/",
      },
    });
  }

  const clientId = env.GITHUB_CLIENT_ID;
  const redirectUri = env.OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return new Response("Missing required environment variables", { status: 500 });
  }

  // Build GitHub OAuth URL
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "read:user");
  // Force GitHub to show account picker instead of auto-redirecting
  githubAuthUrl.searchParams.set("prompt", "select_account");
  // Add state parameter for CSRF protection
  const state = crypto.randomUUID();
  githubAuthUrl.searchParams.set("state", state);

  // Redirect to GitHub OAuth endpoint
  return Response.redirect(githubAuthUrl.toString(), 302);
}
