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
# ---- 手机版（PWA）：docs/ 目录，可用 GitHub Pages 等托管，手机上“添加到主屏幕”后像 App 一样使用 ----
import hashlib, shutil
ver = hashlib.md5(full.encode('utf8')).hexdigest()[:10]
head_pwa = ('<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#14A3B8">\n'
            '<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
            '<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="易道能力岛">\n'
            '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n')
reg = "<script>if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js');</script>\n"
site = full.replace('<title>', head_pwa + '<title>', 1).replace('</body></html>', reg + '</body></html>')
D = os.path.join(R, 'docs'); os.makedirs(D, exist_ok=True)
open(os.path.join(D, 'index.html'), 'w', encoding='utf8').write(site)
open(os.path.join(D, 'sw.js'), 'w', encoding='utf8').write(rd('pwa/sw.js').replace('__VERSION__', 'yd-' + ver))
shutil.copy(os.path.join(R, 'pwa', 'manifest.webmanifest'), D)
for f in os.listdir(os.path.join(R, 'assets')): shutil.copy(os.path.join(R, 'assets', f), D)
open(os.path.join(D, '.nojekyll'), 'w').close()
if len(sys.argv) > 1:  # 额外输出一个不含 <html> 外壳的片段（用于在线发布）
    open(sys.argv[1], 'w', encoding='utf8').write(body)
print('ok', len(full))
