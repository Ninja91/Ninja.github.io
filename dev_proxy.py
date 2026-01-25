import http.server
import socketserver
import os
import urllib.request
import urllib.error
import sys

# Configuration
PORT = int(os.environ.get("PORT", 8888))
API_BASE = "https://api.tensorlake.ai/v1/namespaces/default"
ALLOWED_ORIGIN = "https://ninja91.github.io" # Explicit origin for security


class DevProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api/proxy/"):
            self.handle_proxy("GET")
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/proxy/"):
            self.handle_proxy("POST")
        else:
            # For a static server, we usually only allow POST to the proxy
            self.send_error(404, "Not Found")

    def handle_proxy(self, method):
        target_path = self.path[len("/api/proxy"):]
        target_url = f"{API_BASE}{target_path}"
        
        print(f"Proxying {method} to {target_url}")

        data = None
        if method == "POST":
            content_length = int(self.headers.get('Content-Length', 0))
            data = self.rfile.read(content_length)

        req = urllib.request.Request(target_url, data=data, method=method)
        
        # Forward specific headers
        final_key = self.headers.get('X-TensorLake-API-Key')
        
        if not final_key:
            print("Warning: No API Key provided in headers.")
            # We skip adding Authorization if no key is provided, let the API decide
        else:
            req.add_header("Authorization", f"Bearer {final_key}")

        req.add_header("Content-Type", "application/json")
        req.add_header("Accept", "application/json")
        
        # Add Gemini and Database headers if they exist
        for header in ['X-Gemini-API-Key', 'X-Database-URL']:
            if val := self.headers.get(header):
                req.add_header(header, val)

        try:
            with urllib.request.urlopen(req) as response:
                self.send_response(response.status)
                for k, v in response.getheaders():
                    if k.lower() not in ['transfer-encoding', 'connection', 'keep-alive', 'content-encoding']:
                        self.send_header(k, v)
                
                # Allow both local and production origin
                origin = self.headers.get('Origin')
                if origin in [ALLOWED_ORIGIN, "http://localhost:8888", "http://127.0.0.1:8888"]:
                    self.send_header("Access-Control-Allow-Origin", origin)
                else:
                    self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
                
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type, X-TensorLake-API-Key, X-Gemini-API-Key, X-Database-URL, Authorization")
                self.end_headers()
                self.wfile.write(response.read())

        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            print(f"Proxy Error: {e}")
            self.send_error(500, str(e))

    def do_OPTIONS(self):
        # Handle Preflight requests
        self.send_response(200)
        origin = self.headers.get('Origin')
        if origin in [ALLOWED_ORIGIN, "http://localhost:8888", "http://127.0.0.1:8888"]:
            self.send_header("Access-Control-Allow-Origin", origin)
        else:
            self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-TensorLake-API-Key, X-Gemini-API-Key, X-Database-URL, Authorization")
        self.end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), DevProxyHandler) as httpd:
    print(f"Starting Proxy Server at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        sys.exit(0)
