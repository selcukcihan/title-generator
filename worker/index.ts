import { login } from "./login";
import { callback } from "./callback";
import { createTitle, getUser } from "./github-user";
import { checkAuth } from "./jwt";
import { GithubUser } from "./github-user";

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    console.log(request.method + " " + request.url);
    if (url.pathname.startsWith("/auth/login")) {
      return login(request, env);
    } else if (url.pathname.startsWith("/auth/callback")) {
      return callback(request, env);
    } else if (url.pathname.startsWith("/api/user/") && url.pathname.split("/").length === 4) {
      // const userId = url.pathname.split("/")[2];
      // const titleId = url.pathname.split("/")[3];
      // return getTitle(userId, titleId, env);
    } else if (url.pathname == "/api/user") {
			const { response, githubId } = await checkAuth(request, env);
			if (!githubId) {
				return response!;
			}
			if (request.method == "POST") {
				return createTitle(githubId, env);
			} else {
				return getUser(githubId, env);
			}
    } else if (url.pathname == "/auth/logout") {
			// Clear the auth cookie
			const isSecure = request.url.startsWith("https://");
			const cookie = `auth_token=; HttpOnly; ${isSecure ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=0`;
			return new Response(null, {
				status: 302,
				headers: {
					"Location": "/",
					"Set-Cookie": cookie,
				},
			});
    }

		return new Response(null, { status: 404 });
	},
} satisfies ExportedHandler<Env>;

export { GithubUser };
