import { json } from '@sveltejs/kit';
import { createChallengeQuestionSet } from '$lib/server/quiz';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { questionSetId, shuffle = false } = data;
    
    if (!questionSetId) {
      return new Response(JSON.stringify({ error: 'Question set ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const challengeQuestionSet = await createChallengeQuestionSet(questionSetId, shuffle);
    
    if (!challengeQuestionSet) {
      return new Response(JSON.stringify({ error: 'Failed to create challenge version' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return json({ 
      success: true, 
      questionSet: challengeQuestionSet
    });
  } catch (error) {
    console.error('Error creating challenge question set:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create challenge question set';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};