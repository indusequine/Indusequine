#!/usr/bin/env python3
"""Convert a markdown file to a brand-styled HTML for Chrome headless → PDF."""
import sys
from pathlib import Path

import markdown

CSS = """
@page { size: A4; margin: 22mm 18mm 22mm 18mm; }
:root {
  --forest: #1f3a2f;
  --forest-deep: #15281f;
  --oxblood: #6a2330;
  --brass: #b08a3e;
  --cream: #faf6ee;
  --ink: #1b1b1b;
  --muted: #5b5b5b;
  --rule: #d9d3c4;
}
* { box-sizing: border-box; }
html, body { background: #fff; color: var(--ink); }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.55;
  margin: 0;
  padding: 0;
}
.cover {
  page-break-after: always;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 0 30mm 0;
  background: linear-gradient(180deg, #fff 0%, #fff 60%, var(--cream) 100%);
}
.cover .eyebrow {
  font-family: "Inter", sans-serif;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  font-size: 9pt;
  color: var(--brass);
  margin-bottom: 16px;
}
.cover h1 {
  font-family: "Cormorant Garamond", "Cormorant", "Times New Roman", Georgia, serif;
  font-weight: 500;
  font-size: 44pt;
  line-height: 1.08;
  color: var(--forest-deep);
  margin: 0 0 18px 0;
  letter-spacing: -0.01em;
}
.cover .sub {
  font-family: "Cormorant Garamond", "Cormorant", "Times New Roman", Georgia, serif;
  font-style: italic;
  font-size: 14pt;
  color: var(--muted);
  margin-bottom: 28px;
  max-width: 60ch;
}
.cover .meta {
  border-top: 1px solid var(--rule);
  padding-top: 14px;
  font-size: 9pt;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}
.cover .meta strong { color: var(--forest); font-weight: 600; }
main { padding: 0; }
h1 {
  font-family: "Cormorant Garamond", "Cormorant", "Times New Roman", Georgia, serif;
  font-size: 26pt;
  color: var(--forest-deep);
  margin: 0 0 6pt 0;
  font-weight: 500;
  line-height: 1.15;
  page-break-before: always;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 8pt;
}
main > h1:first-child { page-break-before: auto; }
h2 {
  font-family: "Cormorant Garamond", "Cormorant", "Times New Roman", Georgia, serif;
  font-size: 18pt;
  color: var(--forest);
  margin: 22pt 0 6pt 0;
  font-weight: 500;
  page-break-after: avoid;
}
h3 {
  font-family: "Inter", sans-serif;
  font-size: 11.5pt;
  color: var(--oxblood);
  margin: 16pt 0 4pt 0;
  font-weight: 600;
  letter-spacing: 0.01em;
  page-break-after: avoid;
}
h4 {
  font-family: "Inter", sans-serif;
  font-size: 10.5pt;
  color: var(--forest);
  margin: 12pt 0 3pt 0;
  font-weight: 600;
  page-break-after: avoid;
}
p { margin: 6pt 0; }
strong { color: var(--forest-deep); }
em { color: var(--ink); }
ul, ol { margin: 6pt 0 6pt 0; padding-left: 18pt; }
li { margin: 2pt 0; }
li::marker { color: var(--brass); }
a { color: var(--forest); text-decoration: underline; text-underline-offset: 2px; }
blockquote {
  border-left: 2px solid var(--brass);
  margin: 10pt 0;
  padding: 4pt 0 4pt 12pt;
  color: var(--muted);
  font-style: italic;
}
code {
  font-family: "SF Mono", "Menlo", monospace;
  font-size: 9pt;
  background: var(--cream);
  padding: 1pt 4pt;
  border-radius: 3px;
  color: var(--oxblood);
}
pre {
  background: var(--cream);
  border: 1px solid var(--rule);
  border-radius: 4px;
  padding: 8pt;
  overflow-x: auto;
  font-size: 9pt;
  page-break-inside: avoid;
}
pre code { background: transparent; padding: 0; color: var(--ink); }
table {
  border-collapse: collapse;
  width: 100%;
  margin: 10pt 0;
  font-size: 9.5pt;
  page-break-inside: avoid;
}
th, td {
  border-bottom: 1px solid var(--rule);
  padding: 6pt 8pt;
  text-align: left;
  vertical-align: top;
}
th {
  background: var(--cream);
  font-family: "Inter", sans-serif;
  font-weight: 600;
  color: var(--forest-deep);
  border-bottom: 2px solid var(--forest);
}
hr { border: none; border-top: 1px solid var(--rule); margin: 16pt 0; }
.footer {
  position: running(footer);
  font-size: 8pt;
  color: var(--muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
"""

HTML_TMPL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>{title}</title>
<style>{css}</style>
</head>
<body>
<section class="cover">
  <div class="eyebrow">Indusequine · Research</div>
  <h1>{title}</h1>
  <p class="sub">{subtitle}</p>
  <div class="meta"><strong>Prepared</strong> · {date} &nbsp;·&nbsp; <strong>For</strong> · Indusequine Founder</div>
</section>
<main>
{body}
</main>
</body>
</html>
"""

TITLES = {
    "competitor-landscape.md": (
        "Global Equestrian Competitive Landscape",
        "30+ platforms across nine categories, with patterns and features worth adapting for India.",
    ),
    "market-by-country.md": (
        "Equestrian Market by Country",
        "Where the riders, the money and the growth are — and how India compares.",
    ),
}


def build(md_path: Path, html_path: Path, date_str: str) -> None:
    raw = md_path.read_text(encoding="utf-8")
    # Drop the first H1 if present so the cover handles the title cleanly.
    lines = raw.splitlines()
    if lines and lines[0].startswith("# "):
        lines = lines[1:]
        # also drop a leading blank
        while lines and not lines[0].strip():
            lines = lines[1:]
    body_md = "\n".join(lines)

    body_html = markdown.markdown(
        body_md,
        extensions=["extra", "sane_lists", "smarty", "tables"],
    )

    title, subtitle = TITLES.get(md_path.name, (md_path.stem, ""))
    html = HTML_TMPL.format(
        title=title,
        subtitle=subtitle,
        date=date_str,
        css=CSS,
        body=body_html,
    )
    html_path.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    md_path = Path(sys.argv[1])
    html_path = Path(sys.argv[2])
    date_str = sys.argv[3] if len(sys.argv) > 3 else ""
    build(md_path, html_path, date_str)
