import { json } from '@sveltejs/kit';
import { registerUser } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, username, password } = await request.json();
    
    if (!email || !username || !password) {
      return new Response(JSON.stringify({ error: 'Email, username and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await registerUser(email, username, password);
    return json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};