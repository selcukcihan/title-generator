import { DurableObject } from "cloudflare:workers";
import { Octokit } from "octokit";
import type { User, Title, UserWithTitles } from "../types";
import { generateTitle } from "./genai";
import { getLastCommitsOfUser } from "./github";

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
		this.ctx.storage.put("timestamp", 0);
	}

	async getUser(): Promise<UserWithTitles> {
		return {
			...(await this.ctx.storage.get("user")) as User,
			titles: (await this.ctx.storage.get("titles")) as Title[] ?? [],
		}
	}

	async newTitle(): Promise<UserWithTitles> {
		const octokit = new Octokit({ auth: await this.ctx.storage.get("accessToken") as string });
		const user = await this.getUser();
		const timestamp = await this.ctx.storage.get("timestamp") as number;
		if (timestamp > Date.now() - 1000 * 60 * 60 * 1) {
			return user;
		}
		const commits = await getLastCommitsOfUser(octokit, ((await this.ctx.storage.get("user")) as User).login);
		const title = {
			text: await generateTitle(commits, this.env),
			id: crypto.randomUUID(),
		};
		const titles = [title, ...user.titles];
		this.ctx.storage.put("titles", titles);
		this.ctx.storage.put("timestamp", Date.now());
		return {
			...user,
			titles,
		};
	}
}

export async function getUser(githubId: number, env: Env): Promise<Response> {
	// This is an authenticated request, we should return the title data for this user
  const id = env.GITHUB_USER.idFromName(githubId.toString());
  const stub = env.GITHUB_USER.get(id);
	const user = await stub.getUser();
	return new Response(JSON.stringify(user), { status: 200 });
}

export async function createTitle(githubId: number, env: Env): Promise<Response> {
	const id = env.GITHUB_USER.idFromName(githubId.toString());
  const stub = env.GITHUB_USER.get(id);
  const user = await stub.newTitle();
	return new Response(JSON.stringify(user), { status: 200 });
}
