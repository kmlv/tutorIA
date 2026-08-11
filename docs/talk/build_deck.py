#!/usr/bin/env python3
"""Build a self-contained slides+audio deck from talk.<lang>.md.

Two steps, because audio generation sits in the middle:

    build_deck.py narration  talk.en.md  narration.en.md
    audioexplain --input narration.en.md --lang en --style mono ... --out-dir .audio
    build_deck.py deck  talk.en.md  .audio/<base>  deck.en.html

Alignment: `audioexplain` emits a sidecar with sentence-level timings
(`sync.segments[] = {text, start_s, end_s}`). Each slide starts when the first
sentence of its narration starts. We match by normalised text, scanning forward,
so punctuation and whitespace differences do not break it. Sentence granularity
is all we need — a slide change does not have to land on a word.

No third-party dependencies on purpose: this has to still build in a year.
"""
import base64
import html
import json
import pathlib
import re
import sys

SLIDE_RE = re.compile(r"^## SLIDE\s+(\S+)\s*—\s*(.*)$", re.M)
VISUAL_RE = re.compile(r"<!--visual\s*(.*?)\s*-->", re.S)
# Sentence split good enough for narration: ends on . ! ? followed by space/newline.
SENT_RE = re.compile(r"(?<=[.!?])\s+")


def norm(s: str) -> str:
    """Lowercase alphanumerics only — tolerates punctuation and spacing drift."""
    return re.sub(r"[^0-9a-z]", "", s.lower())


def parse(src: pathlib.Path):
    """-> [{id, title, visual, paragraphs}] in document order."""
    text = src.read_text(encoding="utf-8")
    marks = list(SLIDE_RE.finditer(text))
    if not marks:
        sys.exit(f"{src}: no '## SLIDE n — title' headings found")
    slides = []
    for i, m in enumerate(marks):
        body = text[m.end(): marks[i + 1].start() if i + 1 < len(marks) else len(text)]
        vis = VISUAL_RE.search(body)
        visual = vis.group(1) if vis else ""
        narration = VISUAL_RE.sub("", body)
        paras = [" ".join(p.split()) for p in narration.split("\n\n")]
        paras = [p for p in paras if p and not p.startswith("<!--")]
        # A slide with no narration is an appendix slide: references, backup
        # material, the thing you jump to when someone asks. It is reachable by
        # arrow keys and the dots, but playback never lands on it (see cmd_deck).
        slides.append({
            "id": m.group(1),
            "title": m.group(2).strip(),
            "visual": visual,
            "paragraphs": paras,
            "appendix": not paras,
        })
    if all(s["appendix"] for s in slides):
        sys.exit(f"{src}: every slide is an appendix — nothing would be narrated")
    return slides


def cmd_narration(src: pathlib.Path, out: pathlib.Path):
    """Narration only, in order — this is what gets synthesised.

    No headings: a heading would be read aloud, and slide titles are seen, not said.
    """
    slides = parse(src)
    body = "\n\n".join(p for s in slides for p in s["paragraphs"])
    out.write_text(body + "\n", encoding="utf-8")
    words = len(body.split())
    print(f"{out}  ·  {len(slides)} slides  ·  {words} words  "
          f"·  ~{words / 150:.1f} min at 150 wpm")


def align(slides, segments):
    """Start time per slide = start of its first narration sentence.

    Scans segments forward and never rewinds: narration and audio share an order,
    so a forward scan cannot mis-assign a repeated sentence to an earlier slide.
    """
    starts, cursor, missed = [], 0, []
    for s in slides:
        if s["appendix"]:
            starts.append(None)
            continue
        first = SENT_RE.split(s["paragraphs"][0])[0]
        want = norm(first)
        hit = None
        for j in range(cursor, len(segments)):
            seg = norm(segments[j].get("text", ""))
            if not seg:
                continue
            # Either direction of containment: the synthesiser may merge or split.
            if seg.startswith(want[:60]) or want.startswith(seg[:60]):
                hit = j
                break
        if hit is None:
            missed.append(s["id"])
            starts.append(None)
        else:
            starts.append(float(segments[hit].get("start_s", 0.0)))
            cursor = hit + 1
    if starts and starts[0] is None and not slides[0]["appendix"]:
        starts[0] = 0.0
    # A narrated slide we could not place inherits the previous start: it advances
    # with the one before it rather than silently landing at zero. Appendix slides
    # keep None; cmd_deck parks them past the end of the audio.
    for i in range(1, len(starts)):
        if starts[i] is None and not slides[i]["appendix"]:
            starts[i] = starts[i - 1]
    return starts, missed


def cmd_deck(src: pathlib.Path, base: pathlib.Path, out: pathlib.Path):
    slides = parse(src)
    side = json.loads(pathlib.Path(str(base) + ".audio.json").read_text(encoding="utf-8"))
    segments = side.get("sync", {}).get("segments", [])
    if not segments:
        sys.exit(f"{base}.audio.json: no sync.segments — cannot align slides")
    starts, missed = align(slides, segments)
    duration = float(side.get("duration_s") or 0)

    # Park appendix slides beyond the audio so `indexAt` never selects one during
    # playback, while arrow keys and the dots still reach them.
    park = duration + 1.0
    for i, s in enumerate(slides):
        if s["appendix"]:
            park += 1.0
            starts[i] = park

    mp3 = base.with_suffix(".mp3")
    audio_b64 = base64.b64encode(mp3.read_bytes()).decode("ascii")

    title = slides[0]["title"] if slides else "Talk"
    m = re.search(r"^#\s+(.+)$", src.read_text(encoding="utf-8"), re.M)
    if m:
        title = m.group(1).strip()

    parts = []
    for i, (s, t) in enumerate(zip(slides, starts)):
        parts.append(
            f'<section class="slide" data-start="{t:.3f}" data-i="{i}">'
            f'{s["visual"]}</section>'
        )
    slides_html = "\n".join(parts)

    nav = "\n".join(
        f'<button class="dot" data-i="{i}" title="{html.escape(s["title"])}"></button>'
        for i, s in enumerate(slides)
    )

    # Captions come from the same sentence timings that drive the slides, so a
    # caption can never disagree with what is being said.
    cues = [
        {"t": round(float(s.get("start_s", 0)), 2),
         "e": round(float(s.get("end_s", 0)), 2),
         "x": " ".join(str(s.get("text", "")).split())}
        for s in segments if str(s.get("text", "")).strip()
    ]

    out.write_text(
        TEMPLATE
        .replace("__TITLE__", html.escape(title))
        .replace("__SLIDES__", slides_html)
        .replace("__NAV__", nav)
        .replace("__CAPTIONS__", json.dumps(cues, ensure_ascii=False))
        .replace("__AUDIO__", audio_b64)
        .replace("__DURATION__", f"{duration:.1f}"),
        encoding="utf-8",
    )
    size = out.stat().st_size / 1e6
    print(f"{out}  ·  {len(slides)} slides  ·  {duration/60:.1f} min  ·  {size:.1f} MB")
    if missed:
        print(f"  WARNING unaligned slides (inherited previous start): {', '.join(missed)}")
    for i, (s, t) in enumerate(zip(slides, starts)):
        when = "  appx" if s["appendix"] else f"{t/60:6.2f}"
        print(f"  {i+1:2d}. {when}  {s['title']}")


TEMPLATE = r"""<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>__TITLE__</title>
<style>
:root{
  --bg:#f7f7f5; --fg:#16181d; --muted:#5d636e; --rule:#d9d9d4;
  --accent:#0f6b63; --up:#0f6b63; --down:#a4342b; --flat:#7a7f89;
  --card:#ffffff; --stage-w:1280px; --stage-h:720px;
}
@media (prefers-color-scheme:dark){
  :root{ --bg:#101216; --fg:#eceef2; --muted:#a0a6b2; --rule:#2b2f38;
         --accent:#4fd0c2; --up:#4fd0c2; --down:#f08a7f; --flat:#8b919c;
         --card:#171a20; }
}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--fg);
  font:16px/1.5 ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  display:flex;flex-direction:column;overflow:hidden}
/* The stage clips and the frame is absolutely positioned: `transform: scale()`
   does not shrink an element's layout box, so a statically-positioned frame
   would keep reserving 1280x720 and push the control bar off-screen. */
#stage{flex:1;position:relative;overflow:hidden;min-height:0}
#frame{width:var(--stage-w);height:var(--stage-h);position:absolute;
  left:50%;top:50%;transform-origin:center center}
.slide{position:absolute;inset:0;padding:64px 72px;background:var(--card);
  border:1px solid var(--rule);border-radius:14px;
  display:flex;flex-direction:column;justify-content:center;gap:18px;
  opacity:0;visibility:hidden;transition:opacity .28s ease}
.slide.on{opacity:1;visibility:visible}
h1{font-size:64px;line-height:1.05;margin:0;letter-spacing:-.02em}
h2{font-size:40px;line-height:1.15;margin:0;letter-spacing:-.015em;font-weight:650}
.slide em{color:var(--accent);font-style:normal}
.sub{font-size:24px;color:var(--muted);margin:0;max-width:34em}
.meta{font-size:16px;color:var(--muted);margin:0}
.kicker{font-size:15px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--accent);margin:0 0 4px;font-weight:700}
.note{font-size:19px;color:var(--muted);margin:4px 0 0;max-width:44em}
.note.big{font-size:23px;color:var(--fg)}
.lede{font-size:22px;margin:0;max-width:44em}
.title-slide{display:flex;flex-direction:column;gap:22px}
.big-idea{display:flex;flex-direction:column;gap:14px}
.arms{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:8px}
.arm{background:var(--bg);border:1px solid var(--rule);border-radius:10px;
  padding:22px;display:flex;flex-direction:column;gap:8px;font-size:20px}
.arm-n{font-size:15px;font-weight:700;color:var(--accent)}
.arm span:last-child{color:var(--muted);font-size:18px}
table.results{border-collapse:collapse;width:100%;font-size:22px;margin-top:6px}
table.results th,table.results td{border-bottom:1px solid var(--rule);
  padding:14px 12px;text-align:left;vertical-align:top}
table.results th{font-size:16px;color:var(--muted);font-weight:600}
table.results th span{font-weight:400}
table.results.wide{font-size:19px}
table.results.wide td:last-child{color:var(--muted)}
.up{color:var(--up);font-weight:700;font-variant-numeric:tabular-nums}
.down{color:var(--down);font-weight:700;font-variant-numeric:tabular-nums}
.flat{color:var(--flat);font-weight:700;font-variant-numeric:tabular-nums}
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:8px 0}
.stat{background:var(--bg);border:1px solid var(--rule);border-radius:10px;padding:24px;
  display:flex;flex-direction:column;gap:4px}
.stat-n{font-size:52px;font-weight:700;letter-spacing:-.02em;color:var(--accent);
  font-variant-numeric:tabular-nums;line-height:1}
.stat-u{font-size:17px;color:var(--muted);font-weight:600}
.stat-l{font-size:17px;color:var(--muted);margin-top:6px}
.stat-inline{display:flex;align-items:baseline;gap:14px;margin:10px 0}
.stat-inline .stat-l{margin:0;font-size:20px}
ul.clean{margin:6px 0;padding-left:1.1em;font-size:23px;display:flex;
  flex-direction:column;gap:10px}
ol.levels{margin:6px 0;padding-left:1.4em;font-size:22px;display:flex;
  flex-direction:column;gap:12px}
ol.levels b{font-weight:650}
.tag{font-size:13px;padding:3px 9px;border-radius:99px;margin-left:10px;
  vertical-align:middle;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.tag.common{background:var(--rule);color:var(--muted)}
.tag.rare{background:var(--accent);color:var(--card)}
ol.checks{margin:10px 0 0;padding-left:1.4em;font-size:21px;display:flex;
  flex-direction:column;gap:9px;color:var(--fg)}
ol.changes{margin:8px 0 0;padding-left:1.4em;font-size:20px;display:flex;
  flex-direction:column;gap:12px}
/* Provenance, per codex's T-006 design. Four collapsed labels, recognised by text
   and shape rather than colour alone. The claim block is the unit — not the slide,
   not the sentence. `.provbar` is the one-line chain strip at the foot of a slide. */
.prov{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:700;
  letter-spacing:.1em;text-transform:uppercase;padding:3px 10px;border-radius:99px;
  white-space:nowrap}
.prov .src{font-weight:500;letter-spacing:.02em;text-transform:none;opacity:.85}
.prov-e{background:var(--rule);color:var(--fg)}
.prov-s{border:1.5px solid var(--accent);color:var(--accent)}
.prov-r{border:1.5px dashed var(--accent);color:var(--accent)}
.prov-p{border:1.5px solid var(--muted);color:var(--muted)}
.provbar{position:absolute;left:72px;right:72px;bottom:26px;font-size:14px;
  color:var(--muted);border-top:1px solid var(--rule);padding-top:10px;
  display:flex;gap:10px;flex-wrap:wrap;align-items:baseline}
.provbar b{font-weight:600;color:var(--fg)}
.provbar .chain{opacity:.85}
.eyebrow-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:2px}
.qgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:12px}
.qgrid>div{background:var(--bg);border:1px solid var(--rule);border-radius:10px;
  padding:18px;display:flex;flex-direction:column;gap:8px;font-size:16px}
.qgrid b{font-size:14px;color:var(--accent);letter-spacing:.05em;text-transform:uppercase}
.qgrid span{color:var(--muted);line-height:1.45}
.qgrid em{color:var(--fg);font-style:normal;font-weight:600}
ol.questions{margin:8px 0 0;padding-left:1.4em;font-size:21px;display:flex;
  flex-direction:column;gap:14px}
ol.questions span{display:block;font-size:17px;color:var(--muted);margin-top:5px;
  line-height:1.45}
.refs{font-size:15px;line-height:1.5;column-count:2;column-gap:36px;margin-top:8px}
.refs p{margin:0 0 11px;break-inside:avoid;color:var(--muted)}
.refs b{color:var(--fg);font-weight:600}
.method{font-size:18px;line-height:1.6;max-width:52em;color:var(--fg)}
.method .role{color:var(--muted)}
.pipeline{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:10px 0}
.step{background:var(--bg);border:1px solid var(--rule);border-radius:10px;padding:18px;
  display:flex;flex-direction:column;gap:7px;font-size:17px}
.step b{font-size:15px;color:var(--accent);letter-spacing:.04em;text-transform:uppercase}
.step span{color:var(--muted);line-height:1.4}
.stack{display:flex;flex-direction:column;gap:7px;margin-top:6px}
.layer{border:1px solid var(--rule);border-radius:8px;padding:13px 18px;
  font-size:19px;background:var(--bg)}
.layer.surface{background:var(--rule);color:var(--muted)}
.layer.base{border-color:var(--accent);color:var(--accent);font-weight:600}
.closing h2{font-size:44px;max-width:20em}
.closing-body{font-size:26px;line-height:1.4;color:var(--fg);max-width:32em;margin:14px 0 0}
/* Captions get their own row rather than overlaying the slide: slide content is
   vertically centred in a fixed 1280x720 box, so an overlay would sometimes sit
   on top of a table. The row collapses when captions are off and the stage
   grows back into the space. */
#cc{flex:0 0 auto;display:none;padding:0 18px 12px;justify-content:center}
#cc.on{display:flex}
#cc p{margin:0;max-width:60em;text-align:center;font-size:21px;line-height:1.45;
  background:var(--card);border:1px solid var(--rule);border-radius:10px;
  padding:12px 20px;min-height:1.45em}
#ccbtn.on{border-color:var(--accent);color:var(--accent);font-weight:700}
#bar{display:flex;align-items:center;gap:14px;padding:10px 18px;flex-wrap:wrap;
  border-top:1px solid var(--rule);background:var(--card);flex:0 0 auto}
button{font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--rule);
  border-radius:8px;padding:7px 12px;cursor:pointer}
button:hover{border-color:var(--accent)}
#play{min-width:52px;font-weight:700}
#seek{flex:1;accent-color:var(--accent);min-width:120px}
#time,#count{font-variant-numeric:tabular-nums;color:var(--muted);font-size:14px;
  white-space:nowrap}
#dots{display:flex;gap:5px;flex-wrap:wrap;max-width:34%}
.dot{width:11px;height:11px;padding:0;border-radius:99px;background:var(--rule);
  border:none;cursor:pointer}
.dot.on{background:var(--accent)}
@media (max-width:900px){
  #dots{display:none}
  #cc p{font-size:17px;padding:10px 14px}
  #bar{gap:10px;padding:8px 12px}
}
</style>

<div id="stage"><div id="frame">__SLIDES__</div></div>

<div id="cc"><p id="cctext"></p></div>

<div id="bar">
  <button id="play">Play</button>
  <button id="ccbtn" title="Captions (c)">CC</button>
  <button data-skip="-5">−5s</button>
  <button data-skip="5">+5s</button>
  <button id="prev">◀</button>
  <button id="next">▶</button>
  <span id="count">1 / 1</span>
  <input id="seek" type="range" min="0" max="__DURATION__" step="0.1" value="0">
  <span id="time">0:00 / 0:00</span>
  <button data-rate="-0.05">−</button>
  <span id="rate">0.90×</span>
  <button data-rate="0.05">+</button>
  <div id="dots">__NAV__</div>
</div>

<audio id="a" preload="auto" src="data:audio/mpeg;base64,__AUDIO__"></audio>

<script>
(function(){
  var a=document.getElementById('a'),
      slides=[].slice.call(document.querySelectorAll('.slide')),
      dots=[].slice.call(document.querySelectorAll('.dot')),
      starts=slides.map(function(s){return parseFloat(s.dataset.start)}),
      frame=document.getElementById('frame'),
      seek=document.getElementById('seek'),
      cur=-1;

  // Scale the fixed 16:9 stage to whatever the window is. Fixed geometry means
  // a slide can never reflow differently than it did while being written.
  function fit(){
    var st=document.getElementById('stage'),
        pad=32,
        k=Math.min((st.clientWidth-pad)/1280,(st.clientHeight-pad)/720);
    frame.style.transform='translate(-50%,-50%) scale('+k+')';
  }
  addEventListener('resize',fit); fit();

  function show(i){
    if(i===cur||i<0||i>=slides.length) return;
    if(cur>=0){ slides[cur].classList.remove('on'); dots[cur].classList.remove('on'); }
    slides[i].classList.add('on'); dots[i].classList.add('on'); cur=i;
    document.getElementById('count').textContent=(i+1)+' / '+slides.length;
  }
  function indexAt(t){
    var i=0;
    for(var j=0;j<starts.length;j++){ if(t+0.02>=starts[j]) i=j; }
    return i;
  }
  function go(i){
    i=Math.max(0,Math.min(slides.length-1,i));
    // Appendix slides are parked past the end of the audio: show them without
    // seeking, so jumping to the references does not fast-forward the talk.
    if(a.duration && starts[i] < a.duration) a.currentTime=starts[i]+0.01;
    show(i);
  }
  function fmt(s){
    s=Math.max(0,s|0); return (s/60|0)+':'+('0'+(s%60)).slice(-2);
  }

  // --- captions ---------------------------------------------------------
  var CUES=__CAPTIONS__,
      ccBox=document.getElementById('cc'),
      ccText=document.getElementById('cctext'),
      ccBtn=document.getElementById('ccbtn'),
      ccOn=false, ccLast=-1;

  function caption(t){
    if(!ccOn) return;
    // Forward-biased scan: cues are ordered, so start from the last hit.
    var i=ccLast>=0&&CUES[ccLast]&&t>=CUES[ccLast].t?ccLast:0;
    if(i>0&&t<CUES[i].t) i=0;
    var hit=-1;
    for(;i<CUES.length;i++){
      if(CUES[i].t<=t&&t<=CUES[i].e){ hit=i; break; }
      if(CUES[i].t>t) break;
    }
    if(hit===ccLast) return;
    ccLast=hit;
    ccText.textContent = hit>=0 ? CUES[hit].x : '';
  }
  function toggleCC(){
    ccOn=!ccOn;
    ccBox.classList.toggle('on',ccOn);
    ccBtn.classList.toggle('on',ccOn);
    ccBtn.setAttribute('aria-pressed',ccOn?'true':'false');
    if(!ccOn) ccText.textContent='';
    else { ccLast=-1; caption(a.currentTime); }
    fit();  // the stage just changed height; rescale the slide
  }
  ccBtn.setAttribute('aria-pressed','false');
  ccBtn.onclick=toggleCC;

  a.addEventListener('timeupdate',function(){
    show(indexAt(a.currentTime));
    caption(a.currentTime);
    seek.value=a.currentTime;
    document.getElementById('time').textContent=
      fmt(a.currentTime)+' / '+fmt(a.duration||0);
  });
  a.addEventListener('play', function(){document.getElementById('play').textContent='Pause'});
  a.addEventListener('pause',function(){document.getElementById('play').textContent='Play'});

  document.getElementById('play').onclick=function(){ a.paused?a.play():a.pause(); };
  document.getElementById('prev').onclick=function(){ go(cur-1) };
  document.getElementById('next').onclick=function(){ go(cur+1) };
  seek.oninput=function(){ a.currentTime=parseFloat(seek.value) };
  dots.forEach(function(d){ d.onclick=function(){ go(parseInt(d.dataset.i,10)) } });

  [].forEach.call(document.querySelectorAll('[data-skip]'),function(b){
    b.onclick=function(){ a.currentTime=Math.max(0,a.currentTime+parseFloat(b.dataset.skip)) };
  });
  [].forEach.call(document.querySelectorAll('[data-rate]'),function(b){
    b.onclick=function(){
      a.playbackRate=Math.min(2,Math.max(0.5,a.playbackRate+parseFloat(b.dataset.rate)));
      document.getElementById('rate').textContent=a.playbackRate.toFixed(2)+'×';
    };
  });

  addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT') return;
    if(e.key===' '){ e.preventDefault(); a.paused?a.play():a.pause(); }
    else if(e.key==='ArrowRight'){ e.preventDefault(); go(cur+1); }
    else if(e.key==='ArrowLeft'){ e.preventDefault(); go(cur-1); }
    else if(e.key==='Home'){ go(0); }
    else if(e.key==='End'){ go(slides.length-1); }
    else if(e.key==='c'||e.key==='C'){ toggleCC(); }
  });

  // The synthesiser reads at ~187 wpm, which is brisk for a lecture. 0.9 lands
  // near a natural speaking pace; the − and + buttons override it.
  a.playbackRate=0.9;

  show(0);
})();
</script>
"""


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    cmd = sys.argv[1]
    if cmd == "narration" and len(sys.argv) == 4:
        cmd_narration(pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3]))
    elif cmd == "deck" and len(sys.argv) == 5:
        cmd_deck(pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3]),
                 pathlib.Path(sys.argv[4]))
    else:
        sys.exit(__doc__)
