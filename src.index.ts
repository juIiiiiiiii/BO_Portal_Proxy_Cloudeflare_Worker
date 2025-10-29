// === CONFIG ===
const ORIGIN_HOST = "new-chat-u97r.bolt.host";   // Bolt host
const CANONICAL_HOST = "portal.betteropsai.com"; // Public hostname

function escapeRegExp(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
function getSetCookies(resp){
  if (typeof resp.headers.getAll==="function") return resp.headers.getAll("set-cookie");
  const out=[]; for (const [k,v] of resp.headers) if (k.toLowerCase()==="set-cookie") out.push(v); return out;
}

export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);
    let path = incomingUrl.pathname; // subdomain only
    const upstreamUrl = new URL(path + incomingUrl.search, "https://" + ORIGIN_HOST);

    const headers = new Headers(request.headers);
    headers.set("X-Forwarded-Host", incomingUrl.host);

    const upstreamReq = new Request(upstreamUrl.toString(), {
      method: request.method,
      headers,
      body: request.method==="GET"||request.method==="HEAD" ? undefined : request.body,
      redirect: "manual",
    });

    const upstreamResp = await fetch(upstreamReq);
    const newHeaders = new Headers(upstreamResp.headers);

    const loc = newHeaders.get("location");
    if (loc) {
      try {
        const u = new URL(loc, "https://" + ORIGIN_HOST);
        if (u.hostname === ORIGIN_HOST) { u.hostname = CANONICAL_HOST; u.protocol = "https:"; newHeaders.set("location", u.toString()); }
      } catch {}
    }

    const cookies = getSetCookies(upstreamResp);
    if (cookies.length) {
      const domainRe = new RegExp(`\\bdomain=${escapeRegExp(ORIGIN_HOST)}\\b`, "i");
      newHeaders.delete("set-cookie");
      for (const c of cookies) newHeaders.append("set-cookie", c.replace(domainRe, `Domain=${CANONICAL_HOST}`));
    }

    newHeaders.delete("content-length");
    return new Response(upstreamResp.body, { status: upstreamResp.status, statusText: upstreamResp.statusText, headers: newHeaders });
  },
};
