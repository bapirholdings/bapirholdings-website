#!/usr/bin/env python3
"""
optimize.py — Bapir Holdings Website Mobile Optimizer
======================================================
Scans all HTML files in the current directory and applies
mobile-readiness checks and optimizations:

  1. Ensures the correct <meta name="viewport"> tag is present
  2. Verifies <meta charset="UTF-8"> is present
  3. Checks that a CSS link is included
  4. Reports any missing mobile-friendly patterns (media queries)
  5. Minifies inline <style> blocks (removes excess whitespace)
  6. Generates a summary report

Usage:
    python3 optimize.py               # scan + fix current directory
    python3 optimize.py --dry-run     # report only, no files changed
    python3 optimize.py --dir ./path  # specify a directory
"""

import os
import re
import sys
import argparse
from pathlib import Path
from datetime import datetime

# ── Config ──────────────────────────────────────────────────────────────────
VIEWPORT_TAG   = '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
CHARSET_TAG    = '<meta charset="UTF-8" />'
MEDIA_QUERY_RE = re.compile(r'@media\s*\(', re.IGNORECASE)
STYLE_BLOCK_RE = re.compile(r'(<style[^>]*>)(.*?)(</style>)', re.DOTALL | re.IGNORECASE)
VIEWPORT_RE    = re.compile(r'<meta\s+name=["\']viewport["\']', re.IGNORECASE)
CHARSET_RE     = re.compile(r'<meta\s+charset=', re.IGNORECASE)
CSS_LINK_RE    = re.compile(r'<link[^>]+rel=["\']stylesheet["\']', re.IGNORECASE)
HEAD_CLOSE_RE  = re.compile(r'</head>', re.IGNORECASE)


# ── Helpers ──────────────────────────────────────────────────────────────────

def minify_css(css: str) -> str:
    """Light CSS minification: collapse whitespace, remove comments."""
    # Remove /* ... */ comments
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
    # Collapse whitespace
    css = re.sub(r'\s+', ' ', css)
    # Remove spaces around punctuation
    css = re.sub(r'\s*([{}:;,>+~])\s*', r'\1', css)
    # Remove trailing semicolon before closing brace
    css = re.sub(r';\s*}', '}', css)
    return css.strip()


def inject_before_head_close(html: str, tag: str) -> str:
    """Insert a tag just before </head>."""
    return HEAD_CLOSE_RE.sub(f'  {tag}\n</head>', html, count=1)


def fix_viewport(html: str) -> tuple[str, bool]:
    """Ensure viewport meta tag is present. Returns (html, was_added)."""
    if VIEWPORT_RE.search(html):
        return html, False
    html = inject_before_head_close(html, VIEWPORT_TAG)
    return html, True


def fix_charset(html: str) -> tuple[str, bool]:
    """Ensure charset meta tag is present. Returns (html, was_added)."""
    if CHARSET_RE.search(html):
        return html, False
    # Insert right after <head>
    html = re.sub(r'(<head[^>]*>)', r'\1\n  ' + CHARSET_TAG, html, count=1, flags=re.IGNORECASE)
    return html, True


def minify_styles(html: str) -> tuple[str, int]:
    """Minify all inline <style> blocks. Returns (html, count_minified)."""
    count = 0

    def replacer(m):
        nonlocal count
        open_tag, css, close_tag = m.group(1), m.group(2), m.group(3)
        minified = minify_css(css)
        if minified != css.strip():
            count += 1
        return open_tag + minified + close_tag

    html = STYLE_BLOCK_RE.sub(replacer, html)
    return html, count


def check_media_queries(html: str) -> bool:
    """Return True if the file contains media queries (responsive CSS)."""
    return bool(MEDIA_QUERY_RE.search(html))


def check_css_link(html: str) -> bool:
    """Return True if the file links to an external stylesheet."""
    return bool(CSS_LINK_RE.search(html))


# ── Main processor ───────────────────────────────────────────────────────────

def process_file(path: Path, dry_run: bool) -> dict:
    """Process a single HTML file. Returns a result dict."""
    result = {
        'file':          path.name,
        'viewport_added':  False,
        'charset_added':   False,
        'styles_minified': 0,
        'has_media_queries': False,
        'has_css_link':    False,
        'warnings':        [],
        'modified':        False,
    }

    original = path.read_text(encoding='utf-8')
    html = original

    # Checks (read-only first)
    result['has_media_queries'] = check_media_queries(html)
    result['has_css_link']      = check_css_link(html)

    if not result['has_css_link'] and not result['has_media_queries']:
        result['warnings'].append('No external stylesheet or media queries found — page may not be responsive.')
    elif not result['has_media_queries'] and not result['has_css_link']:
        result['warnings'].append('No media queries detected in inline styles.')

    # Fixes
    html, result['viewport_added'] = fix_viewport(html)
    html, result['charset_added']  = fix_charset(html)
    html, result['styles_minified'] = minify_styles(html)

    if html != original:
        result['modified'] = True
        if not dry_run:
            # Write backup
            backup = path.with_suffix('.html.bak')
            backup.write_text(original, encoding='utf-8')
            # Write optimized file
            path.write_text(html, encoding='utf-8')

    return result


# ── Report printer ───────────────────────────────────────────────────────────

def print_report(results: list[dict], dry_run: bool) -> None:
    """Print a formatted summary report to stdout."""
    width = 64
    sep   = '─' * width

    print()
    print('╔' + '═' * (width - 2) + '╗')
    title = ' Bapir Holdings — Mobile Optimization Report '
    pad   = (width - 2 - len(title)) // 2
    print('║' + ' ' * pad + title + ' ' * (width - 2 - pad - len(title)) + '║')
    ts    = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    mode  = '(DRY RUN — no files changed)' if dry_run else '(files updated)'
    sub   = f' {ts} {mode} '
    pad2  = (width - 2 - len(sub)) // 2
    print('║' + ' ' * pad2 + sub + ' ' * (width - 2 - pad2 - len(sub)) + '║')
    print('╚' + '═' * (width - 2) + '╝')
    print()

    total_files    = len(results)
    total_modified = sum(1 for r in results if r['modified'])
    total_warnings = sum(len(r['warnings']) for r in results)

    for r in results:
        status = '✔ MODIFIED' if r['modified'] else '· No changes'
        print(f"  {r['file']:<32}  {status}")
        if r['viewport_added']:
            print(f"    {'':2}+ Viewport meta tag injected")
        if r['charset_added']:
            print(f"    {'':2}+ Charset meta tag injected")
        if r['styles_minified']:
            print(f"    {'':2}+ {r['styles_minified']} inline <style> block(s) minified")
        if r['has_css_link']:
            print(f"    {'':2}✓ External stylesheet linked")
        if r['has_media_queries']:
            print(f"    {'':2}✓ Media queries detected (responsive CSS present)")
        for w in r['warnings']:
            print(f"    {'':2}⚠ {w}")
        print()

    print(sep)
    print(f"  Files scanned : {total_files}")
    print(f"  Files modified: {total_modified}")
    print(f"  Warnings      : {total_warnings}")
    if dry_run:
        print()
        print("  ⚠  DRY RUN — no files were changed on disk.")
        print("     Re-run without --dry-run to apply optimizations.")
    print(sep)
    print()


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description='Optimize Bapir Holdings HTML files for mobile devices.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        '--dry-run', action='store_true',
        help='Report issues without modifying any files.'
    )
    parser.add_argument(
        '--dir', default='.', metavar='DIRECTORY',
        help='Directory to scan (default: current directory).'
    )
    args = parser.parse_args()

    target = Path(args.dir).resolve()
    if not target.is_dir():
        print(f"Error: '{target}' is not a directory.", file=sys.stderr)
        sys.exit(1)

    html_files = sorted(target.glob('*.html'))
    if not html_files:
        print(f"No HTML files found in '{target}'.")
        sys.exit(0)

    results = []
    for filepath in html_files:
        try:
            result = process_file(filepath, dry_run=args.dry_run)
            results.append(result)
        except Exception as exc:
            print(f"Error processing {filepath.name}: {exc}", file=sys.stderr)

    print_report(results, dry_run=args.dry_run)

    if not args.dry_run and any(r['modified'] for r in results):
        print("  Backup files (.html.bak) created for each modified file.")
        print()


if __name__ == '__main__':
    main()
