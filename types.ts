export interface User {
	githubId: number;
  login: string;
	name?: string;
	email?: string;
	avatarUrl: string;
}

export interface Title {
	id: string;
	text: string;
}

export type UserWithTitles = User & { titles: Title[] };
