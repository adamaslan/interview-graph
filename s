"""Render the maintained lesson Markdown to dependency-free static study pages.
Run: python -m pip install markdown, then python scripts/render-lessons.py.
Generated HTML is checked in, so npm builds need no Python dependency.
"""
from pathlib import Path
import html
import markdown
ROOT = Path(__file__).resolve().parents[1]
CSS = '''
:root{color-scheme:light dark;--bg:#f7f3ea;--paper:#fffdf7;--ink:#1c1917;--soft:#57534e;--line:#d6cfc2;--accent:#2f5d50}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.7 system-ui,sans-serif}header,main,footer{max-width:880px;margin:auto;padding:24px}header{border-bottom:1px solid var(--line);display:flex;gap:16px;flex-wrap:wrap;align-items:center}header strong{margin-right:auto}a{color:var(--accent);text-underline-offset:3px}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid var(--accent);outline-offset:3px}h1{font-size:clamp(32px,6vw,52px);line-height:1.12;letter-spacing:-.035em;margin:30px 0 20px}h2{font-size:27px;line-height:1.3;border-top:1px solid var(--line);padding-top:34px;margin-top:44px;scroll-margin-top:20px}h3{font-size:20px;margin-top:30px}p,li{overflow-wrap:anywhere}blockquote{margin:24px 0;padding:4px 24px;border-left:4px solid var(--accent);background:var(--paper)}table{width:100%;border-collapse:collapse;font-size:15px;display:block;overflow-x:auto}td,th{padding:12px;text-align:left;border:1px solid var(--line);min-width:110px}th{background:var(--paper)}pre{overflow:auto;padding:20px;background:var(--paper);border:1px solid var(--line)}code{font-size:.9em}.toc{background:var(--paper);padding:16px 24px;border:1px solid var(--line);border-radius:8px}.toc ul{padding-left:22px}button,.download{font:inherit;background:var(--paper);color:var(--accent);padding:7px 12px;border:1px solid var(--line);border-radius:6px;cursor:pointer}footer{border-top:1px solid var(--line);font-size:14px;color:var(--soft)}@media(max-width:500px){header,main,footer{padding:18px}body{font-size:16px}h2{font-size:24px}blockquote{padding-left:16px}table{font-size:14px}}@media(prefers-color-scheme:dark){:root{--bg:#191715;--paper:#221f1c;--ink:#ede7dc;--soft:#b8b0a4;--line:#4a433b;--accent:#9bc9b9}}@media print{header button,.download{display:none}body{background:white;color:black;font-size:11pt}header,main,footer{max-width:none;padding:0}h2{break-after:avoid}table,blockquote{break-inside:avoid}a{color:inherit}.toc{display:none}}
'''
for src in sorted((ROOT/'public/lessons').glob('*.md')):
    text = src.read_text()
    title = text.splitlines()[0].removeprefix('# ')
    md = markdown.Markdown(extensions=['fenced_code','tables','toc'], extension_configs={'toc':{'toc_depth':'2-2'}})
    body = md.convert(text)
    page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Public-safe interview practice: discovery, cloud systems, prototypes, documents and evidence."><title>{html.escape(title)} | Interview graph</title><style>{CSS}</style></head><body><header><strong>INTERVIEW GRAPH / STUDY</strong><a href="../">Back to graph</a><a class="download" href="{src.stem}.md" download>Download Markdown</a><button type="button" onclick="window.print()">Print</button></header><main><nav aria-label="On this page"><details><summary>On this page</summary>{md.toc}</details></nav><article>{body}</article></main><footer>Practice material. Examples are hypothetical unless explicitly labelled otherwise. No private recruiting details or project artifacts are included.</footer></body></html>'''
    (ROOT/'public/lessons'/f'{src.stem}.html').write_text(page)
    (ROOT/'public/lessons'/src.name).write_text(text)
    print(src.name, len(text.split()), 'words')
