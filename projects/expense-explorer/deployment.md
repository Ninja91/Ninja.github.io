# Deployment Guide: Hosting your Expense Explorer Proxy (Bun)

To make your Expense Explorer "live" on GitHub Pages, we recommend hosting the `proxy.ts` on **Render** using the **Bun** runtime for maximum performance.

## Step 1: Ensure proxy.ts is in your repo
The `proxy.ts` file should be in the root of your `Ninja.github.io` repository.

## Step 2: Deploy to Render
1.  Sign in to [Render.com](https://render.com).
2.  Click **"New +"** and select **"Web Service"**.
3.  Connect your `Ninja.github.io` repository.
4.  Configure the service:
    - **Name**: `expense-explorer-proxy`
    - **Runtime**: `Bun` (Select Bun from the runtime dropdown)
    - **Build Command**: `bun install` (even if you have no dependencies)
    - **Start Command**: `bun run proxy.ts`
5.  Render will give you a URL like `https://expense-explorer-proxy.onrender.com`.

## Step 3: Update the Frontend
Update the `proxyBaseUrl` in your `app.js` with your Render URL (this should already be done if you provided the URL earlier):

```javascript
const CONFIG = {
    proxyBaseUrl: "https://expense-explorer-proxy.onrender.com/api/proxy"
};
```

## Step 4: Security
The proxy only allows requests from `https://ninja91.github.io` and local development.
