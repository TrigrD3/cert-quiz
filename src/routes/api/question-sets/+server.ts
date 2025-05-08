import { json } from '@sveltejs/kit';
import { getAllQuestionSets } from '$lib/server/quiz';

export async function GET() {
  const questionSets = await getAllQuestionSets();
  return json(questionSets);
}