"""Run only when deliberately releasing a new complete local package."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
files = {}
for p in sorted(root.rglob('*')):
    if not p.is_file():
        continue
    relative = p.relative_to(root)
    if relative.as_posix() == 'PACKAGE_SHA256.json' or relative.parts[0] == 'backups' or '__pycache__' in relative.parts:
        continue
    files[relative.as_posix()] = hashlib.sha256(p.read_bytes()).hexdigest()
(root / 'PACKAGE_SHA256.json').write_text(json.dumps({'algorithm': 'SHA-256', 'files': files}, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Manifest: {len(files)} files')
