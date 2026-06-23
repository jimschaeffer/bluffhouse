import { getStore } from "@netlify/blobs";

const KEY = "state";
const EMPTY = { games: [], players: [] };

// Shared room state, gated by a single passcode (ROOM_PASSCODE env var).
// GET  /api/state        -> { data, rev, updatedAt }
// POST /api/state {data} -> { rev, updatedAt }   (increments rev)
export default async (req) => {
  const expected = process.env.ROOM_PASSCODE;
  const pass = req.headers.get("x-room-pass") || "";
  if (!expected || pass !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const store = getStore("bluffhouse");

  if (req.method === "GET") {
    const rec = await store.get(KEY, { type: "json", consistency: "strong" });
    return Response.json(rec || { data: EMPTY, rev: 0, updatedAt: 0 });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "bad json" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const cur = (await store.get(KEY, { type: "json", consistency: "strong" })) || { rev: 0 };
    const next = {
      data: body.data ?? EMPTY,
      rev: (cur.rev || 0) + 1,
      updatedAt: Date.now(),
    };
    await store.setJSON(KEY, next);
    return Response.json({ rev: next.rev, updatedAt: next.updatedAt });
  }

  return new Response(JSON.stringify({ error: "method not allowed" }), {
    status: 405,
    headers: { "content-type": "application/json" },
  });
};

export const config = { path: "/api/state" };
