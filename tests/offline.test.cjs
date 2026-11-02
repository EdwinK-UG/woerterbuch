const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
test("offline shell survives while legacy lesson caches and public chapter URLs are retired", async () => {
  const scope = "https://fixture.invalid/site/",
    stores = new Map(),
    events = {},
    requests = [];
  let offline = false,
    context;
  const network = async (request) => {
    const url = typeof request === "string" ? request : request.url;
    requests.push(url);
    if (offline) throw Error("offline");
    return new Response("fixture " + url, { status: 200 });
  };
  const key = (value) => (typeof value === "string" ? value : value.url);
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    open: async (name) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const data = stores.get(name);
      return {
        match: async (request) => data.get(key(request))?.clone(),
        put: async (request, response) =>
          data.set(key(request), response.clone()),
        addAll: async (urls) => {
          for (const url of urls) data.set(url, await network(url));
        },
        keys: async () => [...data.keys()].map((url) => ({ url })),
        delete: async (request) => data.delete(key(request)),
      };
    },
  };
  context = vm.createContext({
    URL,
    Response,
    fetch: network,
    caches,
    setTimeout: () => 1,
    importScripts: (file) =>
      vm.runInContext(fs.readFileSync(file, "utf8"), context),
    self: {
      location: new URL(scope + "sw.js"),
      registration: { scope },
      skipWaiting: async () => {},
      clients: { claim: async () => {} },
      addEventListener: (name, callback) => (events[name] = callback),
    },
  });
  vm.runInContext(fs.readFileSync("sw.js", "utf8"), context);
  let installed;
  events.install({ waitUntil: (p) => (installed = p) });
  await installed;
  stores.set("wb-lessons-/site/", new Map([[scope + "grammatik/k201.js?v=old", new Response("PRIVATE")]]));
  let activated;
  events.activate({ waitUntil: p => activated = p });
  await activated;
  assert.equal(stores.has("wb-lessons-/site/"), false);
  assert.ok(
    requests.every(
      (url) => !url.includes(".bin") && !url.includes("/grammatik/"),
    ),
  );
  const get = async (file, mode = "cors") => {
    let result;
    const work = [];
    events.fetch({
      request: { url: scope + file, method: "GET", mode },
      respondWith: (p) => (result = p),
      waitUntil: (p) => work.push(p),
    });
    const response = await result;
    await Promise.all(work);
    return response;
  };
  await get("grammatik/grammatik.js?v=test");
  await get("grammatik/catalog.js?v=test");
  assert.equal((await get("grammatik/k201.js?v=test")).status, 410);
  offline = true;
  assert.ok((await (await get("", "navigate")).text()).includes(scope));
  assert.equal((await get("grammatik/k201.js?v=test")).status, 410);
  assert.ok(
    (await (await get("grammatik/grammatik.js?v=test")).text()).includes(
      "grammatik.js",
    ),
  );
});
