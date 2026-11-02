// Uses the caller's JWT and database policies. No service-role credential is needed.
export function lessonHandler({ url, key, lessons, fetcher = fetch }) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const error = (status, message) => new Response(JSON.stringify({ error: message }), {
    status, headers: { ...headers, "Content-Type": "application/json" },
  });
  return async (request) => {
    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method !== "GET") return error(405, "GET only");
    const authorization = request.headers.get("Authorization") || "";
    if (!/^Bearer \S+$/i.test(authorization)) return error(401, "Sign in to open a lesson.");
    try {
      const authHeaders = { apikey: key, Authorization: authorization };
      const userResponse = await fetcher(url + "/auth/v1/user", { headers: authHeaders });
      if (userResponse.status === 401 || userResponse.status === 403) return error(401, "Sign in again.");
      if (!userResponse.ok) return error(503, "Account service unavailable.");
      const user = await userResponse.json();
      if (!user?.id) return error(401, "Sign in again.");
      const response = await fetcher(url + "/rest/v1/profiles?select=role,unlocked&user_id=eq." + encodeURIComponent(user.id), {
        headers: authHeaders,
      });
      if (!response.ok) return error(503, "Enrolment service unavailable.");
      const profile = (await response.json())[0];
      if (!profile) return error(403, "An enrolled account is required.");
      const number = new URL(request.url).searchParams.get("chapter");
      const lesson = /^\d+$/.test(number || "") && Object.hasOwn(lessons, number) ? lessons[number] : null;
      if (!lesson) return error(404, "Lesson unavailable.");
      const levels = Array.isArray(profile.unlocked) ? profile.unlocked.filter(l => ["A1", "A2", "B1", "B2", "C1"].includes(l)) : [];
      const staff = ["teacher", "school", "founder"].includes(profile.role);
      if (!staff && !(lesson.level === "Liste" ? levels.length : levels.includes(lesson.level)))
        return error(403, "Enrol in this level to open the lesson.");
      return new Response(lesson.source, { headers: { ...headers, "Content-Type": "text/javascript; charset=utf-8" } });
    } catch {
      return error(503, "Lesson service temporarily unavailable.");
    }
  };
}
