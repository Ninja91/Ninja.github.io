export const CONFIG = {
    directBaseUrl: "https://api.tensorlake.ai/v1/namespaces/default",
    proxyBaseUrl: "https://expense-explorer-proxy-bun.onrender.com/api/proxy",
    localProxyUrl: "http://localhost:8888/api/proxy"
};

export function getBaseUrl() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) return CONFIG.localProxyUrl;
    return CONFIG.proxyBaseUrl;
}

export function getHeaders() {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const tensorlakeKey = sessionStorage.getItem('TENSORLAKE_API_KEY');
    const geminiKey = sessionStorage.getItem('GEMINI_API_KEY');
    const databaseUrl = sessionStorage.getItem('DATABASE_URL');

    if (tensorlakeKey) {
        headers['X-TensorLake-API-Key'] = tensorlakeKey;
        headers['Authorization'] = `Bearer ${tensorlakeKey}`;
    }
    if (geminiKey) headers['X-Gemini-API-Key'] = geminiKey;
    if (databaseUrl) headers['X-Database-URL'] = databaseUrl;

    // Debugging (Redacted)
    console.log(`[API] Headers Set: TL=${tensorlakeKey ? '✓' : '✗'}, Gemini=${geminiKey ? '✓' : '✗'}, DB=${databaseUrl ? '✓' : '✗'}`);

    return headers;
}

export async function runRemoteApp(appName: string, payload: any) {
    const headers = getHeaders();
    const url = `${getBaseUrl()}/applications/${appName}`;
    console.log(`[API] Calling ${appName} at ${url}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
    }

    return response.json();
}

export async function pollRequest(requestId: string, appName: string) {
    const startTime = Date.now();
    const timeout = 120000; // 2 minutes
    const url = `${getBaseUrl()}/applications/${appName}/requests/${requestId}`;

    console.log(`[API] Polling ${appName} request ${requestId} at ${url}...`);

    while (Date.now() - startTime < timeout) {
        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Poll Error: ${response.status} at ${url}`);
        }

        const data = await response.json();

        // TensorLake returns function_runs which contain status
        // We look at the first run (the app itself)
        const mainRun = data.function_runs?.[0];
        const status = mainRun?.status || data.status; // Fallback to root status

        if (status === 'completed') {
            return data.output || mainRun?.output;
        } else if (status === 'failed') {
            throw new Error(data.failure_reason || mainRun?.failure_reason || 'Request failed');
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    throw new Error('Request timed out');
}
