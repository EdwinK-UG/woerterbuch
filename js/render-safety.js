/* Keep the small set of formatting used in dictionary definitions. Parse into an
   inert template and copy only supported HTML nodes and attributes. */
function safeLink(value) {
  if (typeof value !== "string") return "";
  if (/^#\/w\//.test(value)) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function definitionHTML(source) {
  const input = document.createElement("template");
  input.innerHTML = source;
  const output = document.createElement("div");
  const allowed = new Set(["b", "i", "small", "span", "a"]);
  const classes = new Set([
    "g",
    "core",
    "sn",
    "kb",
    "ib",
    "sq",
    "sb",
    "muted",
    "exsrc",
  ]);
  function copy(node, parent) {
    if (node.nodeType === 3) {
      parent.append(node.textContent);
      return;
    }
    if (
      node.nodeType !== 1 ||
      node.namespaceURI !== "http://www.w3.org/1999/xhtml"
    )
      return;
    if (["script", "style", "template"].includes(node.localName)) return;
    let target = parent;
    if (allowed.has(node.localName)) {
      target = document.createElement(node.localName);
      if (classes.has(node.className)) target.className = node.className;
      if (node.localName === "a") {
        const href = safeLink(node.getAttribute("href"));
        if (href) target.setAttribute("href", href);
        if (href && !href.startsWith("#")) {
          target.target = "_blank";
          target.rel = "noopener noreferrer";
        }
      }
      parent.append(target);
    }
    for (const child of node.childNodes) copy(child, target);
  }
  for (const node of input.content.childNodes) copy(node, output);
  return output.innerHTML;
}
