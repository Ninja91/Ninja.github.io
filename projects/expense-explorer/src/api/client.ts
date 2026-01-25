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

    return headers;
}

export async function runRemoteApp(appName: string, payload: any) {
    const headers = getHeaders();
    const response = await fetch(`${getBaseUrl()}/applications/${appName}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

export async function pollRequest(requestId: string) {
    const startTime = Date.now();
    const timeout = 120000; // 2 minutes

    while (Date.now() - startTime < timeout) {
        const response = await fetch(`${getBaseUrl()}/requests/${requestId}`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Poll Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === 'completed') {
            return data.output;
        } else if (data.status === 'failed') {
            throw new Error(data.error || 'Request failed');
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Request timed out');
}
