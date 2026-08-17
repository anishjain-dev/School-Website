// WA-22: careers applications land as Nucleus-shaped Candidacies with a
// quarantined CV (WA-39).
import type { APIRoute } from 'astro';
import { handleApplication } from '../../lib/forms';

export const prerender = false;

export const POST: APIRoute = (ctx) => handleApplication(ctx, 'careers');
