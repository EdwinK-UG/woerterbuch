// No network sockets in tests.
export async function resolve(s, c, next) {
  return s === "cloudflare:sockets"
    ? {
        url: "data:text/javascript,export function connect(){throw Error('No socket traffic in tests')}",
        shortCircuit: true,
      }
    : next(s, c);
}
