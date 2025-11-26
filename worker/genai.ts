import {GoogleGenAI} from '@google/genai';

const PROMPT = `
You are a helpful assistant that generates titles given a list of commits.
You will be given a list of commits of a software developer and you need to generate a fun and engaging title for the developer.
The title should be a single sentence, no more than 10 words.
The title should be in the same language as the commits.
The title should be unique and creative.
Each word in the title should start with a capital letter.
No punctuation should be used in the title.
No special characters should be used in the title.
No numbers should be used in the title.
Make use of real world software engineer titles that appear in linkedin and other similar job listing websites.
But also make sure to make it sound fun and engaging.
Your response should be just the title itself as described above, no other text, no markdown, no formatting, no nothing.

Here are the commits of this user that I want you to generate a title for:
`

export async function generateTitle(commits: string[], env: Env) {
  const ai = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: PROMPT + commits.join("\n"),
  });
  return response?.text ?? "";
}
