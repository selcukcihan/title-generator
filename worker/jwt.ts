import { jwtVerify, SignJWT } from "jose";

export const createJwt = async (githubId: number, env: Env) => {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Missing JWT secret");
  }

  const secret = new TextEncoder().encode(jwtSecret);
  return new SignJWT({ githubId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .setIssuer("https://title-generator.selcukcihan.workers.dev")
    .setAudience("https://title-generator.selcukcihan.workers.dev")
    .sign(secret);

}

export const checkAuth = async (request: Request, env: Env): Promise<{ response?: Response, githubId?: number }> => {
  // Extract auth_token cookie
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return { response: Response.json({ error: "No cookies found" }, { status: 401 }) };
  }

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const authToken = cookies.auth_token;
  if (!authToken) {
    return { response: Response.json({ error: "No auth token found" }, { status: 401 }) };
  }

  // Verify JWT token
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    return { response: Response.json({ error: "Missing JWT secret" }, { status: 500 }) };
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(authToken, secret, {
      issuer: "https://title-generator.selcukcihan.workers.dev",
      audience: "https://title-generator.selcukcihan.workers.dev",
    });

    const githubId = payload.githubId as number | undefined;
    if (!githubId) {
      return { response: Response.json({ error: "githubId not found in token" }, { status: 401 }) };
    }

    return { githubId };
  } catch (error) {
    return { response: Response.json(
        { error: `Token verification failed: ${error instanceof Error ? error.message : String(error)}` },
        { status: 401 }
      )
    };
  }
}
