"""Minimal stdio plugin scaffold for the hush-companion Anna App."""

import json
import sys

MANIFEST = {
    "name": "tool-dev-hush-companion",
    "version": "0.1.0",
    "tools": [
        {
            "name": "ping",
            "description": "Smoke-test method.",
            "parameters": {
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
        }
    ],
}


def invoke(method: str, args: dict) -> dict:
    # Tool methods MUST return the dispatcher contract envelope:
    #   {"success": True,  "data":  <payload-dict>}
    #   {"success": False, "error": "<reason>"}
    # Anything else surfaces to the iframe as `tool_failed`.
    if method == "ping":
        return {"success": True, "data": {"pong": True}}
    return {"success": False, "error": f"unknown method: {method}"}


def main() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        req = json.loads(line)
        try:
            if req.get("method") == "describe":
                result = MANIFEST
            elif req.get("method") == "health":
                result = {"status": "ready"}
            elif req.get("method") == "invoke":
                result = invoke(req["params"]["tool"], req["params"].get("arguments", {}))
            else:
                raise ValueError(f"unknown rpc: {req.get('method')}")
            sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": req.get("id"), "result": result}) + "\n")
        except Exception as e:  # noqa: BLE001
            sys.stdout.write(
                json.dumps(
                    {
                        "jsonrpc": "2.0",
                        "id": req.get("id"),
                        "error": {"code": -32601, "message": str(e)},
                    }
                )
                + "\n"
            )
        sys.stdout.flush()


if __name__ == "__main__":
    main()
