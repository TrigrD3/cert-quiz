import { json } from '@sveltejs/kit';
import { loginUser } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { emailOrUsername, password } = await request.json();
    
    if (!emailOrUsername || !password) {
      return new Response(JSON.stringify({ error: 'Email/username and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await loginUser(emailOrUsername, password);
    return json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};