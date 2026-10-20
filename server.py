import http.server
import socketserver
import os
import sys
import threading

PORTS = [8080, 5050]

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def serve_on_port(port):
    try:
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("", port), NoCacheHTTPRequestHandler) as httpd:
            print(f"Serving at http://localhost:{port} (No-Cache)")
            sys.stdout.flush()
            httpd.serve_forever()
    except Exception as e:
        print(f"Port {port} error: {e}")
        sys.stdout.flush()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    threads = []
    for p in PORTS:
        t = threading.Thread(target=serve_on_port, args=(p,), daemon=True)
        t.start()
        threads.append(t)
    print("Multi-port No-Cache server running on:", PORTS)
    sys.stdout.flush()
    for t in threads:
        t.join()
