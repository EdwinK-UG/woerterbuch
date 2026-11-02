import { lessonHandler } from "./handler.mjs";
import bundle from "./lessons.json" with { type: "json" };

const bytes = Uint8Array.from(atob(bundle.gzip), c => c.charCodeAt(0));
const lessons = JSON.parse(await new Response(
  new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
).text());

Deno.serve(lessonHandler({
  url: Deno.env.get("SUPABASE_URL")!,
  key: Deno.env.get("SUPABASE_ANON_KEY")!,
  lessons,
}));
