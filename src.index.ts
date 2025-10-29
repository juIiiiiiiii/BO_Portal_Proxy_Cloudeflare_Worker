export default {
  async fetch(request) {
    const u = new URL(request.url);
    const upstream = new URL(u.pathname + u.search, "https://new-chat-u97r.bolt.host");
    const init: RequestInit = { method: request.method, headers: request.headers, redirect: "manual" };
    if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body as any;
    const resp = await fetch(upstream.toString(), init);
    return new Response(resp.body, { status: resp.status, headers: resp.headers });
  },
};
