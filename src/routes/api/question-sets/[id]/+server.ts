import { json } from '@sveltejs/kit';
import { getQuestionSet } from '$lib/server/quiz';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;
  const questionSet = await getQuestionSet(id);
  
  if (!questionSet) {
    return new Response(JSON.stringify({ error: 'Question set not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return json(questionSet);
};