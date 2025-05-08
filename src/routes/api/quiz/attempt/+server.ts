import { json } from '@sveltejs/kit';
import { createQuizAttempt } from '$lib/server/quiz';
import { validateToken } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { questionSetId, token, shuffleQuestions } = data;
    
    if (!questionSetId) {
      return new Response(JSON.stringify({ error: 'Question set ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get user ID from token if available
    let userId: string | undefined;
    if (token) {
      try {
        const userData = validateToken(token);
        userId = userData.id;
      } catch (err) {
        // Token validation failed, but we'll still allow anonymous attempt
      }
    }
    
    // Create the quiz attempt with optional question shuffling
    const quizAttempt = await createQuizAttempt(
      questionSetId, 
      userId, 
      !!shuffleQuestions
    );
    
    return json(quizAttempt);
  } catch (error) {
    console.error('Error creating quiz attempt:', error);
    return new Response(JSON.stringify({ error: 'Failed to create quiz attempt' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};