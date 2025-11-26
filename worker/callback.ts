import { Octokit } from "octokit";
import { createJwt } from "./jwt";

export async function callback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  console.log("Oauth callback received");

  if (error) {
    console.log(error);
    return new Response(`OAuth error: ${error}`, { status: 400 });
  }

  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  const redirectUri = env.OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return new Response("Missing required environment variables", { status: 500 });
  }

  // Exchange authorization code for tokens
  const tokenUrl = "https://github.com/login/oauth/access_token";
  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    return new Response(`Failed to exchange code for tokens: ${errorText}`, { 
      status: tokenResponse.status 
    });
  }

  const responseText = await tokenResponse.text();
  const accessToken = responseText.split("&")[0].split("=")[1];
  const octokit = new Octokit({ auth: accessToken });
  const user = await octokit.rest.users.getAuthenticated();
  if (!user?.data?.id) {
    return new Response("Failed to get user id", { status: 500 });
  }
  console.log(user.data);
  const githubId = user.data.id
  const id = env.GITHUB_USER.idFromName(githubId.toString());
  const stub = env.GITHUB_USER.get(id);
  await stub.initialize({
    githubId: user.data.id,
    name: user.data.name ?? undefined,
    email: user.data.email ?? undefined,
    login: user.data.login,
    avatarUrl: user.data.avatar_url,
  }, accessToken);

  try {
    const jwt = await createJwt(githubId, env);

    // Create secure, httpOnly cookie
    // Only use Secure flag on HTTPS (production)
    const isSecure = request.url.startsWith("https://");
    const cookie = `auth_token=${jwt}; HttpOnly; ${isSecure ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=3600`;
    // Redirect to main page with cookie
    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/",
        "Set-Cookie": cookie,
      },
    });
  } catch (error) {
    return new Response(`Failed to create JWT: ${error instanceof Error ? error.message : String(error)}`, { 
      status: 500 
    });
  }
}
