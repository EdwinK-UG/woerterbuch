/* Merge changes since the last acknowledged snapshot. Only word lists have set
   semantics. A divergent edit to the same quiz, card field or deleted item needs
   a choice. Missing keys mean deletion. JSON from Postgres may reorder keys. */
function mergeStudyData(base, local, server, choice) {
  const conflicts = [];
  const object = (x) =>
    x !== null && typeof x === "object" && !Array.isArray(x);
  function equal(a, b) {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b))
      return a.length === b.length && a.every((v, i) => equal(v, b[i]));
    return (
      object(a) &&
      object(b) &&
      Object.keys(a).length === Object.keys(b).length &&
      Object.keys(a).every((k) => Object.hasOwn(b, k) && equal(a[k], b[k]))
    );
  }
  function merge(old, here, there, path) {
    if (equal(here, old)) return there;
    if (equal(there, old) || equal(here, there)) return here;
    if ((object(old) || old === undefined) && object(here) && object(there)) {
      const entries = [];
      for (const key of new Set([
        ...Object.keys(here),
        ...Object.keys(there),
      ])) {
        const own = (obj) =>
          obj != null && Object.hasOwn(obj, key) ? obj[key] : undefined;
        const value = merge(own(old), own(here), own(there), [...path, key]);
        if (value !== undefined) entries.push([key, value]);
      }
      return Object.fromEntries(entries);
    }
    if (
      path.length === 3 &&
      path[0] === "lists" &&
      path[2] === "words" &&
      [old, here, there].every(Array.isArray)
    ) {
      const previous = new Set(old),
        left = new Set(here),
        right = new Set(there);
      return [...new Set([...there, ...here])].filter(
        (w) => !previous.has(w) || (left.has(w) && right.has(w)),
      );
    }
    conflicts.push(path.join(" / "));
    return choice === "server" ? there : here;
  }
  return { value: merge(base, local, server, []), conflicts };
}
