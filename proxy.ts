const PORT = Number(process.env.PORT) || 8888;
const API_BASE = "https://api.tensorlake.ai/v1/namespaces/default";
const ALLOWED_ORIGINS = ["https://ninja91.github.io", "https://nitinjain.me"];
const CORS_METHODS = "GET, POST, OPTIONS";
const CORS_HEADERS = "Content-Type, X-TensorLake-API-Key, X-Gemini-API-Key, X-Database-URL, Authorization";
const ENABLE_PROXY_DEBUG = process.env.NODE_ENV !== "production";

const isAllowed = (origin: string | null) => {
    if (!origin) return true;
    if (ALLOWED_ORIGINS.includes(origin)) return true;

    try {
        const parsed = new URL(origin);
        return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    } catch {
        return false;
    }
};

const getCorsOrigin = (origin: string | null) => (isAllowed(origin) ? (origin || "*") : ALLOWED_ORIGINS[0]);

const buildUpstreamHeaders = (sourceHeaders: Headers) => {
    const upstreamHeaders = new Headers();
    const forwardedHeaders = [
        "Content-Type",
        "Accept",
        "X-TensorLake-API-Key",
        "X-Gemini-API-Key",
        "X-Database-URL",
        "Authorization",
    ];

    for (const headerName of forwardedHeaders) {
        const headerValue = sourceHeaders.get(headerName);
        if (headerValue) {
            upstreamHeaders.set(headerName, headerValue);
        }
    }

    const tensorlakeKey = sourceHeaders.get("X-TensorLake-API-Key");
    if (tensorlakeKey) {
        upstreamHeaders.set("Authorization", `Bearer ${tensorlakeKey}`);
    }

    return upstreamHeaders;
};

console.log(`Starting Bun Proxy Server at http://localhost:${PORT}`);
console.log(`Proxying /api/proxy/* to ${API_BASE}/*`);

Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);

        // Handle CORS preflight
        if (req.method === "OPTIONS") {
            const origin = req.headers.get("Origin");
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": getCorsOrigin(origin),
                    "Access-Control-Allow-Methods": CORS_METHODS,
                    "Access-Control-Allow-Headers": CORS_HEADERS,
                    "Access-Control-Max-Age": "86400",
                },
            });
        }

        // Health check / Root
        if (url.pathname === "/") {
            return new Response("Expense Explorer Proxy (Bun) is Running", { status: 200 });
        }

        if (url.pathname.startsWith("/api/proxy")) {
            const targetPath = url.pathname.replace("/api/proxy", "");
            const targetUrl = `${API_BASE}${targetPath}${url.search}`;
            const headers = buildUpstreamHeaders(req.headers);

            if (ENABLE_PROXY_DEBUG) {
                const tlKey = headers.get("X-TensorLake-API-Key") ? "PRESENT" : "MISSING";
                const gemKey = headers.get("X-Gemini-API-Key") ? "PRESENT" : "MISSING";
                const dbKey = headers.get("X-Database-URL") ? "PRESENT" : "MISSING";
                console.log(`[PROXY] ${req.method} ${targetUrl} | Keys: TL=${tlKey}, Gemini=${gemKey}, DB=${dbKey}`);
            }

            try {
                const hasBody = req.method !== "GET" && req.method !== "HEAD";
                const response = await fetch(targetUrl, {
                    method: req.method,
                    headers,
                    body: hasBody ? req.body : undefined,
                    redirect: "manual", // Prevent automatic redirect following
                });

                const resHeaders = new Headers(response.headers);

                // Setup CORS for the client
                const origin = req.headers.get("Origin");
                resHeaders.set("Access-Control-Allow-Origin", getCorsOrigin(origin));
                resHeaders.set("Access-Control-Allow-Methods", CORS_METHODS);
                resHeaders.set("Access-Control-Allow-Headers", CORS_HEADERS);

                // Remove hop-by-hop headers
                resHeaders.delete("transfer-encoding");
                resHeaders.delete("connection");

                return new Response(response.body, {
                    status: response.status,
                    headers: resHeaders,
                });
            } catch (error) {
                console.error("Proxy Error:", error);
                const message = error instanceof Error ? error.message : "Unknown proxy error";
                return new Response(JSON.stringify({ message: error.message }), {
                    status: 500,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }
        }

        return new Response("Not Found", {
            status: 404,
            headers: { "Access-Control-Allow-Origin": getCorsOrigin(req.headers.get("Origin")) },
        });
    },
});
