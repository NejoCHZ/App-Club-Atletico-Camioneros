from pathlib import Path
import re

root = Path('src/app/features')
gear = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.08A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.08A1.65 1.65 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15z"></path></svg>'
logout = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>'
network = '<svg *ngSwitchCase="\'categorias\'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="5" r="3"></circle><circle cx="5" cy="19" r="3"></circle><circle cx="19" cy="19" r="3"></circle><line x1="8.5" y1="16.5" x2="10.5" y2="7.5"></line><line x1="15.5" y1="16.5" x2="13.5" y2="7.5"></line></svg>'
ball = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="m8.5 9 3.5-2.5L15.5 9l-1.3 4H9.8z"></path><path d="m12 6.5-.8-3.3M15.5 9l3.2-1.2M14.2 13l2.2 2.8M9.8 13l-2.2 2.8M8.5 9 5.3 7.8"></path></svg>'
swords = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" y1="19" x2="19" y2="13"></line><line x1="16" y1="16" x2="20" y2="20"></line><line x1="19" y1="21" x2="21" y2="19"></line><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"></polyline><line x1="5" y1="14" x2="9" y2="18"></line><line x1="7" y1="17" x2="4" y2="20"></line><line x1="3" y1="19" x2="5" y2="21"></line></svg>'

for p in root.rglob('*.html'):
    s = old = p.read_text(encoding='utf-8')
    s = re.sub(r'<span class="dropdown-icon">⚙️+\ufe0f?</span>', lambda _: f'<span class="dropdown-icon">{gear}</span>', s)
    s = s.replace('<span class="dropdown-icon">↪</span>', f'<span class="dropdown-icon">{logout}</span>')
    s = re.sub(r'<svg \*ngSwitchCase="\'categorias\'"[^>]*>.*?</svg>', network, s)
    s = re.sub(r'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15\.3 15\.3 0 0 1 4 10 15\.3 15\.3 0 0 1-4 10 15\.3 15\.3 0 0 1-4-10 15\.3 15\.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>', ball, s)
    s = re.sub(r'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14\.7 6\.3.*?</svg>', swords, s)
    if p.name == 'admin-lista-jugadores.html':
        s = s.replace('stroke="#007A3D" stroke-width="2.2"><path d="M1 12s4-8', 'stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M1 12s4-8')
        s = s.replace('stroke="#2563EB" stroke-width="2.2"><path d="M12 20', 'stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 20')
    if s != old:
        p.write_text(s, encoding='utf-8', newline='')
        print(p.as_posix())
