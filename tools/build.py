"""把 src/ 与 data/ 打包成一个可双击打开的离线 HTML：dist/易道能力岛.html"""
import os, sys
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
rd = lambda p: open(os.path.join(R, p), encoding='utf8').read()
DATA = ['texts.js', 'ddj_notes.js', 'ddj_notes2.js', 'ddj_notes3.js', 'gua_notes.js', 'gua_notes2.js', 'plan.js']
scripts = ''.join(f'<script>\n{rd("data/"+f)}\n</script>\n' for f in DATA) + f'<script>\n{rd("src/app.js")}\n</script>\n'
body = rd('src/app.html') + scripts
os.makedirs(os.path.join(R, 'dist'), exist_ok=True)
full = ('<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n') + body.replace('<header class="top">', '</head><body>\n<header class="top">', 1) + '</body></html>\n'
open(os.path.join(R, 'dist', '易道能力岛.html'), 'w', encoding='utf8').write(full)
if len(sys.argv) > 1:  # 额外输出一个不含 <html> 外壳的片段（用于在线发布）
    open(sys.argv[1], 'w', encoding='utf8').write(body)
print('ok', len(full))
