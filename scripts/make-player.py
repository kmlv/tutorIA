#!/usr/bin/env python3
"""Genera un reproductor autocontenido a partir de la salida de audioexplain.

El player que trae AudioExplainer hace fetch() del audio y lo pasa a blob, lo cual
falla bajo CSP restrictivo (connect-src) aunque el audio venga como data: URI.
Este asigna el src directamente al <audio>, sin fetch, sin blob y sin red.

Uso:  make-player.py <base-sin-extension> <salida.html>
      donde <base>.mp3 y <base>.audio.json existen.
"""
import base64
import html
import json
import pathlib
import sys

base = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2])

mp3 = base.with_suffix(".mp3")
side = pathlib.Path(str(base) + ".audio.json")

meta = json.loads(side.read_text(encoding="utf-8"))
segments = meta.get("sync", {}).get("segments", [])
title = meta.get("title") or base.name
duration = float(meta.get("duration_s") or 0)
granularity = meta.get("sync", {}).get("granularity", "?")

data_uri = "data:audio/mpeg;base64," + base64.b64encode(mp3.read_bytes()).decode("ascii")

rows = "\n".join(
    '<li class="seg" data-start="{s:.3f}" data-end="{e:.3f}" tabindex="0" role="button">'
    '<span class="t">{ts}</span><span class="x">{txt}</span></li>'.format(
        s=float(seg.get("start_s", 0)),
        e=float(seg.get("end_s", 0)),
        ts="{:d}:{:02d}".format(int(seg.get("start_s", 0)) // 60, int(seg.get("start_s", 0)) % 60),
        txt=html.escape(seg.get("text", "")),
    )
    for seg in segments
)

mins, secs = divmod(int(duration), 60)

out.write_text(f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title>
<style>
  :root {{
    --bg:#fbfbfa; --fg:#1c1c1a; --muted:#6b6b66; --line:#e3e3df;
    --accent:#0b5cff; --hl:#fff3c4; --card:#fff;
  }}
  @media (prefers-color-scheme: dark) {{
    :root {{ --bg:#17171a; --fg:#e8e8e6; --muted:#9a9a95; --line:#2e2e33;
             --accent:#7aa2ff; --hl:#3a3520; --card:#1e1e22; }}
  }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; padding:1.25rem; background:var(--bg); color:var(--fg);
    font:16px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }}
  .wrap {{ max-width:820px; margin:0 auto; }}
  h1 {{ font-size:1.15rem; margin:0 0 .15rem; line-height:1.35; }}
  .sub {{ color:var(--muted); font-size:.82rem; margin-bottom:1rem; }}
  .card {{ background:var(--card); border:1px solid var(--line); border-radius:12px;
    padding:1rem; margin-bottom:1rem; position:sticky; top:.5rem; z-index:2; }}
  audio {{ width:100%; display:block; }}
  .row {{ display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; margin-top:.75rem; }}
  button {{ font:inherit; font-size:.85rem; padding:.3rem .7rem; border-radius:999px;
    border:1px solid var(--line); background:transparent; color:var(--fg); cursor:pointer; }}
  button:hover {{ border-color:var(--accent); color:var(--accent); }}
  button[aria-pressed="true"] {{ background:var(--accent); border-color:var(--accent); color:#fff; }}
  ol {{ list-style:none; margin:0; padding:0; }}
  .seg {{ display:flex; gap:.75rem; padding:.4rem .55rem; border-radius:8px; cursor:pointer; }}
  .seg:hover {{ background:color-mix(in srgb, var(--accent) 8%, transparent); }}
  .seg:focus-visible {{ outline:2px solid var(--accent); outline-offset:1px; }}
  .seg.on {{ background:var(--hl); }}
  .t {{ color:var(--muted); font-variant-numeric:tabular-nums; font-size:.78rem;
    padding-top:.15rem; min-width:3ch; }}
  .note {{ color:var(--muted); font-size:.78rem; margin-top:1.25rem;
    border-top:1px solid var(--line); padding-top:.75rem; }}
</style></head><body><div class="wrap">
<h1>{html.escape(title)}</h1>
<div class="sub">{mins}:{secs:02d} &middot; {len(segments)} segmentos &middot; sincronizado por {html.escape(granularity)}</div>

<div class="card">
  <audio id="a" controls preload="metadata" src="{data_uri}"></audio>
  <div class="row">
    <span style="color:var(--muted);font-size:.8rem">Velocidad</span>
    <button data-r="0.85">0.85&times;</button>
    <button data-r="1" aria-pressed="true">1&times;</button>
    <button data-r="1.25">1.25&times;</button>
    <button data-r="1.5">1.5&times;</button>
    <button data-r="1.75">1.75&times;</button>
    <button id="follow" aria-pressed="true" style="margin-left:auto">Seguir transcript</button>
  </div>
</div>

<ol id="segs">{rows}</ol>

<p class="note">Reproductor autocontenido: el audio va embebido como data URI y el
<code>src</code> se asigna directo, sin <code>fetch</code> &mdash; por eso funciona bajo
CSP restrictivo. Sin JavaScript, los controles de audio siguen funcionando; solo se
pierde el resaltado del transcript.</p>

<script>
(function () {{
  var a = document.getElementById("a");
  var segs = Array.prototype.slice.call(document.querySelectorAll(".seg"));
  var follow = document.getElementById("follow");
  var cur = -1;

  segs.forEach(function (el, i) {{
    function go() {{ a.currentTime = parseFloat(el.dataset.start) + 0.01; a.play(); }}
    el.addEventListener("click", go);
    el.addEventListener("keydown", function (e) {{
      if (e.key === "Enter" || e.key === " ") {{ e.preventDefault(); go(); }}
    }});
  }});

  a.addEventListener("timeupdate", function () {{
    var t = a.currentTime, i = -1;
    for (var k = 0; k < segs.length; k++) {{
      if (t >= parseFloat(segs[k].dataset.start)) i = k; else break;
    }}
    if (i === cur) return;
    if (segs[cur]) segs[cur].classList.remove("on");
    cur = i;
    if (segs[cur]) {{
      segs[cur].classList.add("on");
      if (follow.getAttribute("aria-pressed") === "true") {{
        segs[cur].scrollIntoView({{ block: "center", behavior: "smooth" }});
      }}
    }}
  }});

  document.querySelectorAll("[data-r]").forEach(function (b) {{
    b.addEventListener("click", function () {{
      a.playbackRate = parseFloat(b.dataset.r);
      document.querySelectorAll("[data-r]").forEach(function (o) {{
        o.setAttribute("aria-pressed", o === b ? "true" : "false");
      }});
    }});
  }});

  follow.addEventListener("click", function () {{
    follow.setAttribute("aria-pressed",
      follow.getAttribute("aria-pressed") === "true" ? "false" : "true");
  }});
}})();
</script>
</div></body></html>
""", encoding="utf-8")

print(f"{out}  ({out.stat().st_size / 1e6:.2f} MB, {len(segments)} segmentos)")
