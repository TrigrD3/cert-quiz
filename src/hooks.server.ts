import type { Handle } from '@sveltejs/kit';
import initializeSampleData from '$lib/server/import-sample';

// Import sample questions and create shuffled versions
initializeSampleData().catch(console.error);

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event);
};