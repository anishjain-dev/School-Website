// WA-22: internship applications — same pipeline as careers, 12-month
// retention class.
import type { APIRoute } from 'astro';
import { handleApplication } from '../../lib/forms';

export const prerender = false;

export const POST: APIRoute = (ctx) => handleApplication(ctx, 'internship');
