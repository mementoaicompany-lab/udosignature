"""Small static header widget. Only the separate visitor module may write brand counters."""
from html import escape
def widget(site,prefix="/",disabled=False):
 return f'<a class="visitor-count" href="{prefix}privacy/" data-visitor-site="{escape(site)}" data-visitor-count="{"off" if disabled else "on"}" data-state="loading" title="한국시간 기준, 같은 브라우저 하루 1회 · 집계 안내"><span class="visitor-today">오늘 <strong data-visitor-today>—</strong></span><span class="visitor-separator" aria-hidden="true">·</span><span>누적 <strong data-visitor-total>—</strong> 방문</span></a>'
