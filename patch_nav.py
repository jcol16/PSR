#!/usr/bin/env python3
"""
Replaces all old per-page inline nav CSS and nav JS blocks in inner-page
HTML files with links to the shared nav.css and nav.js files.

Leaves index.html untouched (it keeps its inline styles as the source of
truth for the homepage; nav.css was extracted from it).
"""

import re, sys
from pathlib import Path

ROOT = Path(__file__).parent

# All HTML files except index.html
pages = [p for p in ROOT.glob("*.html") if p.name != "index.html"]

# ── Patterns to strip ────────────────────────────────────────────────────────

# Old nav block: from "/* ─── NAV ─── */" up to the first blank line after
# the last rule before the next comment section or end of nav styles.
# We'll match the whole nav CSS block (inline) by looking for the comment header
# and consuming up to (but not including) the next /* ─── section.
NAV_CSS_BLOCK = re.compile(
    r'/\* ─+\s*NAV\s*─+\s*\*/.*?(?=/\* ─|</style>)',
    re.DOTALL
)

# Hamburger/mobile-nav CSS block
HAMBURGER_CSS_BLOCK = re.compile(
    r'/\* ─+\s*HAMBURGER.*?(?=/\* ─|</style>)',
    re.DOTALL
)

# The two <script> blocks that handle nav scroll + hamburger on inner pages
# Pattern 1: simple scroll listener script tag
SCROLL_SCRIPT = re.compile(
    r'<script>\s*const nav\s*=\s*document\.getElementById\([\'"]main-nav[\'"]\);.*?</script>',
    re.DOTALL
)

# Pattern 2: hamburger script tag
HAMBURGER_SCRIPT = re.compile(
    r'<script>\s*//\s*Mobile hamburger.*?</script>',
    re.DOTALL
)

# Link + script tags to inject
LINK_TAG   = '  <link rel="stylesheet" href="nav.css" />'
SCRIPT_TAG = '  <script src="nav.js"></script>'

patched = []
skipped = []

for page in sorted(pages):
    original = page.read_text(encoding='utf-8')
    html = original

    # 1. Remove old nav CSS comment blocks
    html = NAV_CSS_BLOCK.sub('', html)
    html = HAMBURGER_CSS_BLOCK.sub('', html)

    # 2. Remove old nav/hamburger script tags
    html = SCROLL_SCRIPT.sub('', html)
    html = HAMBURGER_SCRIPT.sub('', html)

    # 3. Inject nav.css link before </head>
    if LINK_TAG not in html:
        html = html.replace('</head>', f'{LINK_TAG}\n</head>', 1)

    # 4. Inject nav.js script before </body>
    if SCRIPT_TAG not in html:
        html = html.replace('</body>', f'{SCRIPT_TAG}\n</body>', 1)

    if html != original:
        page.write_text(html, encoding='utf-8')
        patched.append(page.name)
    else:
        skipped.append(page.name)

print(f"Patched  ({len(patched)}): {', '.join(patched)}")
print(f"Skipped  ({len(skipped)}): {', '.join(skipped)}")
