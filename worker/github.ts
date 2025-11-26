import type { Octokit } from "octokit";

export async function getLastCommitsOfUser(octokit: Octokit, username: string) {
  console.log("Getting last commits of user", username);
	const res = await octokit.request("GET /search/commits", {
		q: `author:${username}`,
		sort: "author-date",
		order: "desc",
		per_page: 100,
		page: 1,
		headers: {
			accept: "application/vnd.github.cloak-preview+json"
		}
	});
  console.log(`Found ${res.data.items.length} commits for user ${username}`);
  return res.data.items.map(item => item.commit.message);
}
