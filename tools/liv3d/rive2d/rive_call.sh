#!/bin/bash
# rive_call.sh TOOL JSON_ARGS  -> calls one tool of the Rive editor's local MCP server, prints the JSON-RPC reply
URL=http://127.0.0.1:9791/mcp
SIDF=${TMPDIR:-/tmp}/rive_sid
init() { curl -si "$URL" -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"rive-script","version":"1"}}}' | tr -d '\r' | sed -n 's/^mcp-session-id: //p' > "$SIDF"; }
[ -s "$SIDF" ] || init
printf '{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"%s","arguments":%s}}' "$1" "$2" > ${TMPDIR:-/tmp}/rive_call.json
go() { curl -s "$URL" -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -H "mcp-session-id: $(cat $SIDF)" --data-binary @${TMPDIR:-/tmp}/rive_call.json; }
out=$(go); if echo "$out" | grep -q 'Session not found'; then init; out=$(go); fi
echo "$out"
