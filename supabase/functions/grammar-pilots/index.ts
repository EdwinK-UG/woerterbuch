import { lessonHandler } from "../lessons/handler.mjs";
import bundle from "./pilots.json" with { type: "json" };

// Keep in step with the lessons function's temporary open-access switch.
const OPEN_ACCESS = true;
const bytes = Uint8Array.from(atob(bundle.gzip), c => c.charCodeAt(0));
const lessons = JSON.parse(await new Response(
  new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
).text());
const authorize = lessonHandler({
  url: Deno.env.get("SUPABASE_URL")!,
  key: Deno.env.get("SUPABASE_ANON_KEY")!,
  lessons,
  open: OPEN_ACCESS,
});

// The shared handler validates Auth and fresh enrolment when open access ends.
Deno.serve(async request => {
  const response = await authorize(request);
  const headers = new Headers(response.headers);
  if (response.ok) headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(response.body, { status: response.status, headers });
});
