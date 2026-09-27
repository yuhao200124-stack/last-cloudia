"""Local-only static server and append-only backup files. Standard library only."""
import argparse
import functools
import hashlib
import http.server
import io
import json
import os
from pathlib import Path
import secrets
import threading
import urllib.parse
import urllib.request
import uuid
import webbrowser
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent
WEB = ROOT / 'project' / 'dist'
BACKUPS = ROOT / 'backups'
APP = 'lastcloudia-local-v160'
INSTANCE = hashlib.sha256(str(ROOT).encode()).hexdigest()[:24]
MAX_BACKUP = 256 * 1024 * 1024


def verify_package():
    manifest = json.loads((ROOT / 'PACKAGE_SHA256.json').read_text(encoding='utf-8'))
    failures = []
    for name, expected in manifest['files'].items():
        p = ROOT / name
        if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest() != expected:
            failures.append(name)
    print(f"文件校验：{len(manifest['files']) - len(failures)}/{len(manifest['files'])} 一致。")
    for name in failures:
        print('缺失或已修改：', name)
    return not failures


class LocalServer(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = os.name != 'nt'


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.mjs': 'text/javascript', '.js': 'text/javascript',
                      '.json': 'application/json', '.svg': 'image/svg+xml'}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    def allowed_host(self):
        return self.headers.get('Host', '') in (f'localhost:{self.server.server_port}',
                                               f'127.0.0.1:{self.server.server_port}')

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def json_response(self, value, status=200):
        data = json.dumps(value, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(data)

    def list_directory(self, path):
        self.send_error(404)
        return None

    def send_head(self):
        # Preserve all 72 original published files byte-for-byte. Only the HTTP
        # response for the character list redirects the four existing images
        # to bundled assets; no formula, data or historical audit is rewritten.
        if urllib.parse.urlsplit(self.path).path == '/characters.html':
            data = (WEB / 'characters.html').read_bytes()
            for character in (182, 245, 259, 260):
                data = data.replace(
                    f'https://img.altema.jp/lastcloudia/chara/banner/{character}.jpg'.encode(),
                    f'./assets/characters/{character}.jpg'.encode())
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            return io.BytesIO(data)
        return super().send_head()

    def do_GET(self):
        if not self.allowed_host():
            self.send_error(403)
            return
        path = urllib.parse.urlsplit(self.path).path
        if path == '/__local__/health':
            self.json_response({'app': APP, 'instance': INSTANCE, 'version': 160,
                                'token': self.server.backup_token})
            return
        if path == '/__local__/backups':
            self.json_response({'files': sorted(p.name for p in BACKUPS.glob('*.json'))})
            return
        if path.startswith('/__local__/backup/'):
            name = urllib.parse.unquote(path.rsplit('/', 1)[-1])
            if Path(name).name != name or not name.endswith('.json'):
                self.send_error(400)
                return
            p = BACKUPS / name
            if not p.is_file():
                self.send_error(404)
                return
            data = p.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Disposition', f'attachment; filename="{name}"')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        if self.headers['Host'].startswith('127.0.0.1:'):
            self.send_response(302)
            self.send_header('Location', f'http://localhost:{self.server.server_port}{self.path}')
            self.end_headers()
            return
        resolved = Path(self.translate_path(self.path)).resolve()
        if not resolved.is_relative_to(WEB.resolve()) or any(x.startswith('.') for x in resolved.relative_to(WEB.resolve()).parts):
            self.send_error(403)
            return
        super().do_GET()

    def do_HEAD(self):
        if not self.allowed_host():
            self.send_error(403)
            return
        resolved = Path(self.translate_path(self.path)).resolve()
        if not resolved.is_relative_to(WEB.resolve()) or any(x.startswith('.') for x in resolved.relative_to(WEB.resolve()).parts):
            self.send_error(403)
            return
        super().do_HEAD()

    def do_POST(self):
        if (not self.allowed_host() or self.path != '/__local__/backup'
                or self.headers.get('Origin') != f'http://localhost:{self.server.server_port}'
                or not secrets.compare_digest(self.headers.get('X-LC-Backup-Token', ''), self.server.backup_token)):
            self.send_error(403)
            return
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= MAX_BACKUP:
                self.send_error(413)
                return
            self.connection.settimeout(30)
            data = self.rfile.read(size)
            if len(data) != size:
                raise ValueError('备份内容未接收完整')
            payload = json.loads(data)
            if payload.get('format') != 'lastcloudia-local-backup' or payload.get('version') != 1:
                raise ValueError('不是本站的完整备份文件')
            BACKUPS.mkdir(exist_ok=True)
            name = f"backup-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:10]}.json"
            dest = BACKUPS / name
            try:
                with dest.open('xb') as f:
                    f.write(data)
                    f.flush()
                    os.fsync(f.fileno())
            except Exception:
                dest.unlink(missing_ok=True)
                raise
            digest = hashlib.sha256(data).hexdigest()
            if hashlib.sha256(dest.read_bytes()).hexdigest() != digest:
                raise OSError('写入后的备份校验失败')
            self.json_response({'saved': name, 'bytes': len(data), 'sha256': digest}, 201)
        except (ValueError, OSError) as exc:
            self.json_response({'error': str(exc)}, 400)

    def log_message(self, format, *args):
        if args and str(args[1] if len(args) > 1 else '').startswith(('4', '5')):
            super().log_message(format, *args)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--verify', action='store_true')
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    if args.verify:
        return 0 if verify_package() else 1
    url = f'http://localhost:{args.port}/local-data.html'
    if not (WEB / 'index.html').is_file():
        raise SystemExit('请先解压整个压缩包，再运行启动文件。')
    try:
        server = LocalServer(('127.0.0.1', args.port), Handler)
    except OSError:
        try:
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            with opener.open(f'http://127.0.0.1:{args.port}/__local__/health', timeout=2) as r:
                info = json.load(r)
            if info.get('app') == APP and info.get('instance') == INSTANCE:
                if not args.no_browser:
                    webbrowser.open(url)
                print('本站已经启动，已打开现有服务。')
                return 0
        except Exception:
            pass
        raise SystemExit(f'端口 {args.port} 正被其他程序或另一份网站占用。请关闭它后重试；未自动更换地址。')
    server.backup_token = secrets.token_urlsafe(32)
    print('最后的克劳迪娅 · 本地第 160 版')
    print(f'网站：http://localhost:{args.port}/')
    print(f'迁移与备份：{url}')
    print('保留此窗口；按 Ctrl+C 或关闭窗口可停止服务。备份只新增，不覆盖旧文件。')
    if not args.no_browser:
        threading.Timer(0.3, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n本地服务已停止，浏览器存档和备份文件保留。')
    finally:
        server.server_close()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
