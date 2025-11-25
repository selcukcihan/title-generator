import { DurableObject } from "cloudflare:workers";
import { Octokit } from "octokit";

export interface User {
	githubId: number;
	name?: string;
	email?: string;
	avatarUrl: string;
}

async function fetchUserCommits(octokit: Octokit, username: string) {
  let page = 1;
  const results = [];

  while (true) {
    const res = await octokit.request("GET /search/commits", {
      q: `author:${username}`,
      sort: "author-date",
      order: "desc",
      per_page: 100,
      page,
      headers: {
        accept: "application/vnd.github.cloak-preview+json"
      }
    });

    results.push(...res.data.items);

    if (res.data.items.length < 100) break;
    page++;
    break;
  }

  return results.map(item => ({
    repo: item.repository.full_name,
    message: item.commit.message,
    date: item.commit.author.date,
    url: item.html_url
  }));
}

/** A Durable Object's behavior is defined in an exported Javascript class */
export class GithubUser extends DurableObject<Env> {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async initialize(user: User, accessToken: string): Promise<void> {
		this.ctx.storage.put("user", user);
		this.ctx.storage.put("accessToken", accessToken);
	}

	async getUser(): Promise<User & { titles: string[]}> {
		return {
			...(await this.ctx.storage.get("user")) as User,
			titles: (await this.ctx.storage.get("titles")) as string[] ?? [],
		}
	}
}

export async function getUser(githubId: number, env: Env): Promise<Response> {
	// This is an authenticated request, we should return the title data for this user
  const id = env.GITHUB_USER.idFromName(githubId.toString());
  const stub = env.GITHUB_USER.get(id);
	const user = await stub.getUser();
	return new Response(JSON.stringify(user), { status: 200 });
}

export async function getTitle(githubId: number, titleId: string, env: Env): Promise<Response> {
	return new Response(titleId, { status: 200 });
}

export async function createTitle(githubId: number, env: Env): Promise<Response> {
	return new Response("ok", { status: 200 });
}
