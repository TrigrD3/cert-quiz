import type { Handle } from '@sveltejs/kit';
import importSampleData from '$lib/server/import-sample';

// Import sample questions on server start
importSampleData().catch(console.error);

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event);
};