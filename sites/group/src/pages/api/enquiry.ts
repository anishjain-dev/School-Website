// WA-22: visit enquiries land as Nucleus-shaped Leads in the interim
// store. Server-rendered route — the one dynamic surface (with its
// siblings) in an otherwise fully static build.
import type { APIRoute } from 'astro';
import { handleEnquiry } from '../../lib/forms';

export const prerender = false;

export const POST: APIRoute = (ctx) => handleEnquiry(ctx);
