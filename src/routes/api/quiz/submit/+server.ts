import { json } from '@sveltejs/kit';
import { submitAnswer, completeQuizAttempt } from '$lib/server/quiz';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { 
      quizAttemptId, 
      questionId, 
      answerId, 
      timeSpent, 
      complete, 
      isMultipleAnswer 
    } = data;
    
    if (!quizAttemptId || (!complete && (!questionId || !answerId))) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // If this is a completion request
    if (complete) {
      const completedAttempt = await completeQuizAttempt(quizAttemptId);
      return json(completedAttempt);
    }
    
    // Otherwise it's an answer submission
    const isCorrect = await submitAnswer(quizAttemptId, questionId, answerId, timeSpent);
    
    // If this is part of a multiple answer question, just return the individual result
    // The client will determine overall correctness
    return json({ isCorrect, isMultipleAnswer });
  } catch (error) {
    console.error('Error in quiz submission:', error);
    return new Response(JSON.stringify({ error: 'Failed to process submission' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};