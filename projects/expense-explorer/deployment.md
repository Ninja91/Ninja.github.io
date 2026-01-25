# Deployment Guide: Hosting your Expense Explorer Proxy on Render

To make your Expense Explorer "live" on GitHub Pages, you need to host the `dev_proxy.py` on a platform that supports Python. **Render** is a great free-tier option.

## Step 1: Create a GitHub Repository (if you haven't)
Ensure your `Ninja.github.io` code is pushed to your GitHub repository.

## Step 2: Deploy to Render
1.  Sign in to [Render.com](https://render.com).
2.  Click **"New +"** and select **"Web Service"**.
3.  Connect your `Ninja.github.io` repository.
4.  Configure the service:
    - **Name**: `expense-explorer-proxy`
    - **Runtime**: `Python 3`
    - **Build Command**: `pip install -r requirements_proxy.txt` (See Step 3 below)
    - **Start Command**: `python dev_proxy.py`
5.  Render will give you a URL like `https://expense-explorer-proxy.onrender.com`.

## Step 3: Create `requirements_proxy.txt`
In your `Ninja.github.io` root, create a file named `requirements_proxy.txt` (currently the proxy only uses standard libraries, but Render requires this file).

## Step 4: Update the Frontend
Once your proxy is live, update the `remoteProxyUrl` in your `app.js`:

```javascript
const CONFIG = {
    directBaseUrl: "https://api.tensorlake.ai/v1/namespaces/default",
    proxyBaseUrl: "https://expense-explorer-proxy.onrender.com/api/proxy" // <-- Your new URL
};
```

## Step 5: Secure your API
The `dev_proxy.py` is configured to only allow requests from `https://ninja91.github.io`. If you change your domain, update `ALLOWED_ORIGIN` in `dev_proxy.py`.
