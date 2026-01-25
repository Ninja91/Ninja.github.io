const PORT = Number(process.env.PORT) || 8888;
const API_BASE = "https://api.tensorlake.ai/v1/namespaces/default";
const ALLOWED_ORIGINS = ["https://ninja91.github.io", "https://nitinjain.me"];
const isAllowed = (origin: string | null) =>
    !origin || ALLOWED_ORIGINS.includes(origin) || origin.includes("localhost") || origin.includes("127.0.0.1");

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
                    "Access-Control-Allow-Origin": isAllowed(origin) ? (origin || "*") : ALLOWED_ORIGINS[0],
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, X-TensorLake-API-Key, X-Gemini-API-Key, X-Database-URL, Authorization",
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

            console.log(`Proxying ${req.method} to ${targetUrl}`);

            const headers = new Headers(req.headers);

            // Forward the API key if provided in custom header
            const tensorlakeKey = req.headers.get("X-TensorLake-API-Key");
            if (tensorlakeKey) {
                headers.set("Authorization", `Bearer ${tensorlakeKey}`);
            }

            // Cleanup headers for the upstream request
            // We keep Content-Type, Accept, and all X- headers
            headers.delete("host");
            headers.delete("connection");
            headers.delete("origin");
            headers.delete("referer");
            headers.delete("content-length"); // Let fetch recalculate this

            // Log presence of keys for debugging (Redacted)
            const tlKey = headers.get("X-TensorLake-API-Key") ? "PRESENT" : "MISSING";
            const gemKey = headers.get("X-Gemini-API-Key") ? "PRESENT" : "MISSING";
            const dbKey = headers.get("X-Database-URL") ? "PRESENT" : "MISSING";
            console.log(`[PROXY] ${req.method} ${targetUrl} | Keys: TL=${tlKey}, Gemini=${gemKey}, DB=${dbKey}`);

            try {
                const response = await fetch(targetUrl, {
                    method: req.method,
                    headers: headers,
                    body: req.method === "POST" ? await req.arrayBuffer() : undefined,
                    redirect: "manual", // Prevent automatic redirect following
                });

                const resHeaders = new Headers(response.headers);

                // Setup CORS for the client
                const origin = req.headers.get("Origin");
                resHeaders.set("Access-Control-Allow-Origin", isAllowed(origin) ? (origin || "*") : ALLOWED_ORIGINS[0]);
                resHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                resHeaders.set("Access-Control-Allow-Headers", "Content-Type, X-TensorLake-API-Key, X-Gemini-API-Key, X-Database-URL, Authorization");

                // Remove hop-by-hop headers
                resHeaders.delete("content-encoding");
                resHeaders.delete("transfer-encoding");
                resHeaders.delete("connection");

                return new Response(response.body, {
                    status: response.status,
                    headers: resHeaders,
                });
            } catch (error) {
                console.error("Proxy Error:", error);
                return new Response(JSON.stringify({ message: error.message }), {
                    status: 500,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }
        }

        return new Response("Not Found", { status: 404 });
    },
});
