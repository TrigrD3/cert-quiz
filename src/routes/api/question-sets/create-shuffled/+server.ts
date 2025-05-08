import { json } from '@sveltejs/kit';
import { createShuffledQuestionSet } from '$lib/server/quiz';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { questionSetId } = data;
    
    if (!questionSetId) {
      return new Response(JSON.stringify({ error: 'Question set ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const shuffledQuestionSet = await createShuffledQuestionSet(questionSetId);
    
    if (!shuffledQuestionSet) {
      return new Response(JSON.stringify({ error: 'Failed to create shuffled version' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return json({ 
      success: true, 
      questionSet: shuffledQuestionSet 
    });
  } catch (error) {
    console.error('Error creating shuffled question set:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create shuffled question set';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};