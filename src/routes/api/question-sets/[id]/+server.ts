import { json } from '@sveltejs/kit';
import { getQuestionSet } from '$lib/server/quiz';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
  const { id } = params;
  
  // Check for shuffle parameter in the query string
  const shuffle = url.searchParams.get('shuffle') === 'true';
  
  // Get question set with optional shuffling
  const questionSet = await getQuestionSet(id, shuffle);
  
  if (!questionSet) {
    return new Response(JSON.stringify({ error: 'Question set not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return json(questionSet);
};