import { lessonHandler } from "./handler.mjs";
import bundle from "./lessons.json" with { type: "json" };

// Temporary: every lesson is open to everyone, signed in or not. Set to false and redeploy to require
// sign-in and enrolment again (see README, "Open access").
const OPEN_ACCESS = true;

const bytes = Uint8Array.from(atob(bundle.gzip), c => c.charCodeAt(0));
const lessons = JSON.parse(await new Response(
  new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
).text());

Deno.serve(lessonHandler({
  url: Deno.env.get("SUPABASE_URL")!,
  key: Deno.env.get("SUPABASE_ANON_KEY")!,
  lessons,
  open: OPEN_ACCESS,
}));
