import { json } from '@sveltejs/kit';
import { getUserStats, getUserQuizHistory } from '$lib/server/quiz';
import { validateToken } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const userData = validateToken(token);
      const history = await getUserQuizHistory(userData.id);
      const stats = await getUserStats(userData.id);
      
      return json({ history, stats });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error getting user stats:', error);
    return new Response(JSON.stringify({ error: 'Failed to retrieve user statistics' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};