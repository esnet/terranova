"""
Acceptance gate for the CSS variable theming architecture.

Verifies that Tailwind utility classes in the built CSS reference colors via
var(--pkts-color-core-*) rather than hardcoded hex values. This is what makes
runtime operator theming possible — a mounted custom-theme.css can reassign
--pkts-color-core-* and every utility that references it updates automatically.

The test parses the built dist/assets/*.css file and fails if any property
declaration resolves to a bare hex color outside of:
  - CSS variable definitions (--var: #hex) — these are the palette source of truth
  - Allowed structural hex values (transparent variants, pure black/white, shadows)
"""

import glob
import os
import re
import pytest


DIST_DIR = os.path.join(
    os.path.dirname(__file__), "..", "terranova", "frontend", "dist", "assets"
)

# Hex that is always acceptable regardless of context
HEX_ALLOWLIST = {
    # Transparent / invisible
    "#0000", "#0000000d", "#0000001a", "#0000001f", "#00000040", "#00000080",
    "#0003", "#0009",
    # Pure white/black (structural, not brand colors)
    "#fff", "#ffffff", "#000", "#000000",
    # Alpha white/black variants used for overlay surfaces
    "#ffffff80", "#ffffffbf", "#fff6", "#fffffff2",
    # Packets-internal: disabled button states use alpha hex that packets-ui-css
    # generates internally — not Terranova source, cannot be changed here.
    "#0088b599",  # blue-600 @ 60% — primary disabled background
    "#0a48544d",  # teal-900 @ 30% — secondary disabled border
    "#3f424d33",  # slate-900 @ 20% — button disabled border
    # Packets-internal: skeleton loading animation gradient
    "#f5f5f5", "#f5f5f500",
    # esnetmist palette: no --pkts-color-core-* equivalent; kept as hex by design.
    # These are legacy network-map colors used for map layer rendering.
    "#d0eaf2", "#b2d0d9", "#9ab6be", "#82a6b3",
    "#6e939e", "#60808a", "#506d75", "#3f5a61",
    "#32474d", "#212f33",
}


def _load_built_css() -> str:
    css_files = glob.glob(os.path.join(DIST_DIR, "index-*.css"))
    if not css_files:
        pytest.skip(f"No built CSS found in {DIST_DIR} — run npm run build first")
    # Use the most recently modified one
    return open(sorted(css_files, key=os.path.getmtime)[-1]).read()


def _strip_var_fallbacks(css: str) -> str:
    """Remove var() fallback values so e.g. var(--x, #fff) doesn't flag #fff."""
    # Iteratively strip inner var() calls to handle nesting
    for _ in range(5):
        css = re.sub(r"var\([^()]*\)", "var(...)", css)
    return css


def _is_variable_definition(css: str, match_start: int) -> bool:
    """Return True if the hex at match_start is the value of a CSS custom property."""
    # Look backward from the hex for --property-name: with no semicolon in between
    lookback = css[max(0, match_start - 100):match_start]
    return bool(re.search(r"--[\w-]+\s*:\s*$", lookback))


def _find_naked_hex_violations(css: str) -> list[tuple[str, str]]:
    """
    Return (hex_value, surrounding_context) for each bare hex that appears
    outside of a CSS variable definition and outside the allowlist.
    """
    css = _strip_var_fallbacks(css)
    violations = []

    for m in re.finditer(r"#[0-9a-fA-F]{3,8}", css):
        hex_val = m.group(0).lower()
        if hex_val in HEX_ALLOWLIST:
            continue

        # Grab the surrounding declaration for context
        start = max(0, m.start() - 120)
        end = min(len(css), m.end() + 20)
        context = css[start:end]

        if _is_variable_definition(css, m.start()):
            continue  # palette source-of-truth definitions are fine

        violations.append((hex_val, context.strip()))

    return violations


def test_no_naked_hex_colors():
    """
    All colors in Tailwind-generated utility classes must come from
    var(--pkts-color-core-*) references, not hardcoded hex values.
    """
    css = _load_built_css()
    violations = _find_naked_hex_violations(css)

    if violations:
        lines = [f"  {hex_val!r}  in: ...{ctx[-80:]}..." for hex_val, ctx in violations[:30]]
        summary = "\n".join(lines)
        count = len(violations)
        pytest.fail(
            f"{count} naked hex color(s) found in built CSS.\n"
            f"These should be var(--pkts-color-core-*) references.\n\n"
            f"First violations:\n{summary}"
        )
