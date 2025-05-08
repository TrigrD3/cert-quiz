import { json } from '@sveltejs/kit';
import prisma from '$lib/server/database';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Quiz attempt ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const quizAttempt = await prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        questionSet: true,
        _count: {
          select: { questionAttempts: true }
        }
      }
    });
    
    if (!quizAttempt) {
      return new Response(JSON.stringify({ error: 'Quiz attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return json(quizAttempt);
  } catch (error) {
    console.error('Error fetching quiz attempt:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch quiz attempt' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};