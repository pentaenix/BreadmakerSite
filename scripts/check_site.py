#!/usr/bin/env python3
"""Small dependency-free validator for Breadmaker's static GitHub Pages site."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import sys

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {'.git', '.github', '_site'}
ATTRS = {'href', 'src', 'poster'}

class RefParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs: list[tuple[str, str]] = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if value and (name in ATTRS or (tag == 'source' and name == 'src')):
                self.refs.append((name, value))

def html_files():
    for p in ROOT.rglob('*.html'):
        if not any(part in SKIP_DIRS for part in p.relative_to(ROOT).parts):
            yield p

def resolve_local(base: Path, raw: str) -> Path | None:
    raw = raw.strip()
    if not raw or raw.startswith(('#', 'mailto:', 'tel:', 'data:', 'javascript:')):
        return None
    parts = urlsplit(raw)
    if parts.scheme or parts.netloc:
        return None
    path = unquote(parts.path)
    if not path:
        return None
    # All production site links are intentionally relative so project Pages repos work.
    target = (base.parent / path).resolve()
    try:
        target.relative_to(ROOT.resolve())
    except ValueError:
        return Path('__OUTSIDE_SITE__')
    if target.is_dir():
        target = target / 'index.html'
    return target

def main() -> int:
    errors: list[str] = []
    for html in html_files():
        parser = RefParser()
        parser.feed(html.read_text(encoding='utf-8'))
        for _, raw in parser.refs:
            target = resolve_local(html, raw)
            if target is None:
                continue
            if target.name == '__OUTSIDE_SITE__':
                errors.append(f'{html.relative_to(ROOT)} -> {raw}: escapes repository root')
            elif not target.exists():
                errors.append(f'{html.relative_to(ROOT)} -> {raw}: missing {target.relative_to(ROOT)}')

    # Preview repository must never accidentally publish a Breadmaker application archive.
    archives = [p for p in ROOT.rglob('*.zip') if not any(part in SKIP_DIRS for part in p.relative_to(ROOT).parts)]
    if archives:
        errors.extend(f'Application/archive must not ship in preview: {p.relative_to(ROOT)}' for p in archives)

    if errors:
        print('Static site validation failed:')
        for error in errors:
            print(f'  - {error}')
        return 1

    count = sum(1 for _ in html_files())
    print(f'OK: validated {count} HTML files; no broken local assets and no published ZIP downloads.')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
