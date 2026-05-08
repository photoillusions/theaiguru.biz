# Refactor theaiguru.html (single page) into a multi-page site with shared
# assets/site.css + assets/site.js + assets/router.js, one HTML file per page.
# Idempotent: just re-run after edits to the source.

import io, os, re, pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "theaiguru.html"
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)

src = SRC.read_text(encoding="utf-8")

# ---------------------------------------------------------------- 1) Extract CSS
css = re.search(r"<style>\s*(.*?)\s*</style>", src, re.DOTALL).group(1)
(ASSETS / "site.css").write_text(css, encoding="utf-8", newline="\n")

# ----------------------------------------------------------- 2) Extract main JS
# (the only inline <script>...</script> in the file is the big one at the end)
m = re.search(r"<script>\s*(.*?)\s*</script>", src, re.DOTALL)
inline_js = m.group(1) if m else ""

# Guard hero 3D init so script doesn't die on pages without #hero-3d
inline_js = inline_js.replace(
    "(function init3D() {\n  const container = document.getElementById('hero-3d');\n  const scene = new THREE.Scene();",
    "(function init3D() {\n  const container = document.getElementById('hero-3d');\n  if (!container) return;\n  const scene = new THREE.Scene();"
)

# Epilogue: expose a reinit hook so the router can re-trigger animations
# after swapping <main> on a page transition. Idempotent.
REINIT_EPILOGUE = r"""

/* ============================================================
   __siteReinit  --  called by router.js after a page swap
   Re-fires GSAP reveal animations & counter observers on new DOM.
   ============================================================ */
window.__siteReinit = function () {
  try { if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(function (t) { t.kill(); }); } catch (e) {}

  if (window.gsap) {
    gsap.utils.toArray('main.page .gs-reveal').forEach(function (el) {
      gsap.fromTo(el, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
      });
    });
    gsap.utils.toArray('main.page .gs-reveal-scale').forEach(function (el) {
      gsap.fromTo(el, { scale: 0.92, opacity: 0 }, {
        scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
      });
    });
  }

  // counters
  document.querySelectorAll('main.page .counter').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var start = 0, dur = 1600, t0 = performance.now();
        function tick(now) {
          var p = Math.min(1, (now - t0) / dur);
          var v = Math.floor(start + (target - start) * (1 - Math.pow(1 - p, 3)));
          el.textContent = v;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    io.observe(el);
  });

  // Vimeo player auto-init on demo page (player.js attaches to data-vimeo-* iframes)
  if (window.Vimeo && window.Vimeo.Player) {
    document.querySelectorAll('main.page iframe[src*="player.vimeo.com"]').forEach(function (f) {
      try { new window.Vimeo.Player(f); } catch (e) {}
    });
  }
};
"""
CHAT_UPGRADE = r"""

/* ============================================================
   GURU AI AGENT  --  knowledge + voice upgrade
   - Replaces legacy getAIResponse with project-aware brain
   - Adds Web Speech API: mic input + spoken replies (toggle)
   - $500 / 90-min consultation, $1,500 / 2-day onsite audit
   ============================================================ */
(function chatUpgrade() {
  var input    = document.getElementById('chat-input');
  var sendBtn  = document.getElementById('chat-send');
  var micBtn   = document.getElementById('chat-mic');
  var voxBtn   = document.getElementById('chat-voice-toggle');
  var msgs     = document.getElementById('chat-messages');
  if (!input || !sendBtn || !msgs) return;

  /* ---------- knowledge base ---------- */
  var KB = {
    pricing: "Two ways to start with us:\n• $500 — 90-minute AI Consultation. We map your bottlenecks and a build roadmap.\n• $1,500 — 2-Day Onsite Infrastructure Audit. We come to you, audit your systems end-to-end, and deliver a written automation blueprint.\nFull builds are scoped after the audit. Email tony@theaiguru.biz or call (856) 577-0236 to book.",
    consult: "Our 90-minute AI Consultation is $500. You get Tony one-on-one to scope your project, identify automation wins, and walk away with a clear next step. Book at tony@theaiguru.biz.",
    onsite:  "The 2-Day Onsite Infrastructure Audit is $1,500. Tony comes to your location, shadows your team, audits your tech stack, and delivers a written blueprint for AI automation across your business.",
    voice:   "Our flagship build is the 24/7 AI Voice Receptionist on VAPI. It answers calls in your brand voice, books to Google Calendar, sends SMS confirmations, and handles FAQs. Live in production for real businesses today.",
    image:   "Our AI Image Pipelines run on ComfyUI, FLUX, Stable Diffusion, InsightFace ONNX, and Gemini Image 3 Pro. We've shipped batch portrait generators, face-swap pipelines, AI enhancement tools, and a full Photoshop PowerHouse plug-in suite.",
    crm:     "Photo Illusions CLIENT MANAGEMENT is our in-house AI-powered CRM — Gemini-driven contact intelligence, Google Calendar sync, SQLite database, unified client timelines. We can build the same for your business.",
    invoicer:"The Photo Illusions INVOICER is a Stripe-integrated invoicing & quoting tool with PDF generation, recurring billing, and automated client reminders.",
    email:   "Our Customer Email Acquisition System and EMAIL SMART IMPORT pipelines auto-classify, deduplicate, and route inbound mail by time, sender, and intent — built in Python with Gmail API.",
    school:  "We built a full digital portal for Chester Community Charter School — registration, family records, photo packages, and order routing.",
    realestate: "Real Estate Tycoon is our AI-powered listing automation engine — pulls listings, generates marketing copy with Gemini, and produces social-ready flyers.",
    legal:   "Legal Eagle is our AI legal-research assistant — document parsing, citation lookup, and case-summary generation using Grok + Gemini.",
    music:   "Music Producer and AJ the DJ are AI audio tools — beat generation, mix automation, and AI DJ set sequencing.",
    backup:  "BackUp Portal and AutoCopyFiles are our enterprise file-sync and disaster-recovery tools — runs in the background, versioned, encrypted.",
    calendar:"Our CALENDAR PORTAL with Google Calendar API powers booking for the voice agent, the CRM, and the consultation flow.",
    masterctl:"MasterControl_Electron is our unified AI command center — one Electron desktop app that launches every tool, monitors GPU jobs, and routes work between Gemini, Grok, FLUX, and ComfyUI.",
    prompt:  "Our PROMPT Creator/Editor/Manager and Prompt Folder Directory Tree Auditor handle large-scale prompt libraries — versioning, tagging, batch testing across models.",
    workflow:"The 2026 Gemini Workflow is our reference pipeline — Gemini 2.5 Pro orchestration with tool-calling into our internal APIs, used to power most new builds.",
    photoshop:"The 2026 PhotoShop PowerHouse is a full Photoshop automation suite — Auto Crop, Auto Exposure, Photo Display Pre Prep, and Slide Maker — all driven by AI vision models.",
    services:"We build:\n• 24/7 AI Voice Agents (VAPI)\n• AI Image & Portrait Pipelines (ComfyUI/FLUX/Gemini)\n• Custom Web Apps (React/TypeScript/Flask)\n• AI CRMs & Desktop Tools (Electron/CustomTkinter)\n• Email & Workflow Automation\n• AI Marketing & Content Systems\n• Full AI Consulting & Roadmapping",
    process: "Our process: 1) AI Consultation or Onsite Audit — we scope the work. 2) System Design — we architect the build. 3) Build & Test — production code, fast. 4) Deploy & Support — go live with ongoing support.",
    stack:   "20+ technologies in active use: Gemini API, Grok API, VAPI, ComfyUI, FLUX, Stable Diffusion, InsightFace ONNX, React, TypeScript, Python, Flask, Electron, CustomTkinter, PowerShell, Supabase, SQLite, Stripe, Gmail API, Google Calendar API, RunPod GPU, Ollama/Gemma.",
    contact: "Reach Tony directly:\n📧 tony@theaiguru.biz\n📞 (856) 577-0236\n📍 Mt. Holly, NJ\nBook a $500 consultation or the $1,500 onsite audit to get started.",
    about:   "Tony George founded both sides: TheAIGuru.biz (Software & Business AI Development) and Photo Illusions (Photography & Entertainment). Mt. Holly, NJ. 55+ shipped AI systems plus years of event/portrait/school photography. Same team, two specialties.",
    projects:"A few we've shipped:\n• 24/7 AI Voice Receptionist (VAPI)\n• Photo Illusions CLIENT MANAGEMENT CRM\n• Chester Community Charter School portal\n• Photo Illusions INVOICER (Stripe)\n• Real Estate Tycoon listing engine\n• Legal Eagle AI research tool\n• 2026 PhotoShop PowerHouse suite\n• MasterControl Electron command center\n• Customer Email Acquisition System\nAsk about any of them!",
    brands:  "We run two sides under one roof:\n• TheAIGuru.biz — Software & Business AI Development (voice agents, automation, custom apps).\n• Photo Illusions — Photography & Entertainment (events, portraits, schools, DJ/music).\nWhich side can I point you to?",
    photography: "Photo Illusions is our Photography & Entertainment side — event coverage, school portraits, sports, weddings, family sessions, prom flyers, and AJ the DJ entertainment services. Based in Mt. Holly, NJ. Want me to take your name + event date so Tony can follow up?",
    events:  "Photo Illusions covers events end-to-end — photography, on-site printing, DJ services (AJ the DJ), prom flyers, slide shows, and digital delivery portals. We've shot schools, sports leagues, weddings, and corporate events across South Jersey & Philly.",
    schools_photo: "School photography is one of our core specialties at Photo Illusions — picture day, sports teams, yearbook, plus a custom parent-portal where families view, download, and order packages online. Chester Community Charter School is a current client."
  };

  var DEFAULT = "Great question. The fastest path to a real answer is the $500 / 90-minute consultation — Tony will scope it directly. Email tony@theaiguru.biz or call (856) 577-0236.";

  function brain(text) {
    var t = text.toLowerCase();
    // Brand routing first
    if (/\b(photo ?illusions|photography|photographer|portrait shoot|wedding|event coverage|prom|dj |aj the dj|family photo|head ?shot|engagement|senior photo|sports photo|picture day|yearbook)\b/.test(t)) {
      if (/\b(school|picture day|yearbook|class photo)\b/.test(t)) return KB.schools_photo;
      if (/\b(event|wedding|prom|party|corporate|dj|music)\b/.test(t)) return KB.events;
      return KB.photography;
    }
    if (/\b(which side|two side|both compan|difference between|aiguru vs|photo illusions vs|what kind of business)\b/.test(t)) return KB.brands;
    if (/\b(price|cost|pricing|how much|fee|rate|charge|quote)\b/.test(t)) return KB.pricing;
    if (/\b(consult|consultation|90.?min|ninety|discovery)\b/.test(t)) return KB.consult;
    if (/\b(onsite|on.?site|audit|2.?day|two.?day|infrastructure|infrastruct)\b/.test(t)) return KB.onsite;
    if (/\b(vapi|voice|phone|call|recept|receptionist|answering)\b/.test(t)) return KB.voice;
    if (/\b(image|photo|portrait|face.?swap|comfy|flux|stable.?diff|enhance)\b/.test(t)) return KB.image;
    if (/\b(crm|client management|contact)\b/.test(t)) return KB.crm;
    if (/\b(invoice|billing|stripe|quoting)\b/.test(t)) return KB.invoicer;
    if (/\b(email|inbox|gmail|mail)\b/.test(t)) return KB.email;
    if (/\b(school|chester|charter|education)\b/.test(t)) return KB.school;
    if (/\b(real ?estate|listing|tycoon|realtor|property)\b/.test(t)) return KB.realestate;
    if (/\b(legal|law|case|attorney|legal.?eagle)\b/.test(t)) return KB.legal;
    if (/\b(music|dj|audio|beat|sound)\b/.test(t)) return KB.music;
    if (/\b(backup|sync|disaster|recovery|file.?copy)\b/.test(t)) return KB.backup;
    if (/\b(calendar|booking|appointment|schedule)\b/.test(t)) return KB.calendar;
    if (/\b(master.?control|command center|launcher|electron)\b/.test(t)) return KB.masterctl;
    if (/\b(prompt|prompt.?folder)\b/.test(t)) return KB.prompt;
    if (/\b(gemini|workflow|orchestrat|pipeline.*ai)\b/.test(t)) return KB.workflow;
    if (/\b(photoshop|crop|exposure|slide.?maker|powerhouse)\b/.test(t)) return KB.photoshop;
    if (/\b(service|offer|what do you|what can|build|do)\b/.test(t)) return KB.services;
    if (/\b(process|how.*work|step|begin|start)\b/.test(t)) return KB.process;
    if (/\b(tech|stack|tool|language|framework|python|react)\b/.test(t)) return KB.stack;
    if (/\b(contact|reach|email|phone|touch|talk)\b/.test(t)) return KB.contact;
    if (/\b(who|about|tony|guru|team|company|founder)\b/.test(t)) return KB.about;
    if (/\b(project|portfolio|examples|case stud|shipped|built)\b/.test(t)) return KB.projects;
    if (/\b(hello|hi|hey|sup|yo|greet)\b/.test(t)) return "Hey! I'm the Guru AI Agent. We run two sides: TheAIGuru.biz (software & AI builds) and Photo Illusions (photography & entertainment). What brought you in today?";
    if (/\b(thank|thanks|thx|appreciate)\b/.test(t)) return "You got it. Ready to scope your build? $500 gets you 90 minutes with Tony — tony@theaiguru.biz.";
    return DEFAULT;
  }

  /* ---------- override legacy getAIResponse so old send handler uses brain ---------- */
  try { window.getAIResponse = brain; } catch (e) {}
  // Original handler closes over local getAIResponse, so also re-bind send button:
  function addLine(text, who) {
    var d = document.createElement('div');
    d.className = 'chat-msg ' + who;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function showTyping() {
    var t = document.createElement('div');
    t.className = 'chat-typing'; t.id = 'typing-indicator';
    t.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(t); msgs.scrollTop = msgs.scrollHeight;
  }
  function hideTyping() { var t = document.getElementById('typing-indicator'); if (t) t.remove(); }

  function send() {
    var text = (input.value || '').trim();
    if (!text) return;
    addLine(text, 'user');
    input.value = '';
    showTyping();
    setTimeout(function () {
      hideTyping();
      var reply = brain(text);
      addLine(reply, 'bot');
      if (voiceOn) speak(reply);
    }, 500 + Math.random() * 700);
  }

  // Replace existing listeners by cloning the buttons (drops prior handlers)
  var newSend = sendBtn.cloneNode(true); sendBtn.parentNode.replaceChild(newSend, sendBtn);
  var newInput = input.cloneNode(true);  input.parentNode.replaceChild(newInput, input);
  sendBtn = newSend; input = newInput;
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });

  /* ---------- Web Speech API: TTS ---------- */
  var voiceOn = false;
  var synth = window.speechSynthesis || null;
  function pickVoice() {
    if (!synth) return null;
    var vs = synth.getVoices();
    return vs.find(function (v) { return /en[-_]US/i.test(v.lang) && /male|guy|david|mark|brian/i.test(v.name); })
        || vs.find(function (v) { return /en[-_]US/i.test(v.lang); })
        || vs[0] || null;
  }
  function speak(text) {
    if (!synth) return;
    try { synth.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(text.replace(/[•📧📞📍]/g, ''));
    var v = pickVoice(); if (v) u.voice = v;
    u.rate = 1.02; u.pitch = 0.95;
    synth.speak(u);
  }
  if (voxBtn) {
    voxBtn.addEventListener('click', function () {
      voiceOn = !voiceOn;
      voxBtn.classList.toggle('active', voiceOn);
      if (voiceOn) speak("Voice replies on. Ask me anything about The AI Guru.");
      else if (synth) synth.cancel();
    });
  }

  /* ---------- Web Speech API: STT (mic) ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (micBtn && SR) {
    var rec = new SR();
    rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
    var listening = false;
    micBtn.addEventListener('click', function () {
      if (listening) { try { rec.stop(); } catch (e) {} return; }
      try { rec.start(); listening = true; micBtn.classList.add('listening'); } catch (e) {}
    });
    rec.onresult = function (e) {
      var t = e.results[0][0].transcript;
      input.value = t; send();
    };
    rec.onend = function () { listening = false; micBtn.classList.remove('listening'); };
    rec.onerror = function () { listening = false; micBtn.classList.remove('listening'); };
  } else if (micBtn) {
    micBtn.addEventListener('click', function () {
      addLine("Voice input needs Chrome or Edge — your browser doesn't support it. You can still type!", 'bot');
    });
  }
})();
"""

INTAKE_MODAL_JS = r"""

/* ============================================================
   AI INFRASTRUCTURE AUDIT  --  intake modal controller
   Triggered by any [data-open="ai-audit"] element.
   ============================================================ */
(function intakeModal() {
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.from((r || document).querySelectorAll(s)); }

  function open() {
    var ov = $('#intake-overlay'); if (!ov) return;
    ov.classList.remove('closing'); ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');
    document.body.classList.add('intake-open');
    var first = $('input[name="name"]', ov); if (first) setTimeout(function () { first.focus(); }, 450);
    updateProgress();
  }
  function close() {
    var ov = $('#intake-overlay'); if (!ov) return;
    ov.classList.add('closing');
    setTimeout(function () {
      ov.classList.remove('open', 'closing');
      ov.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('intake-open');
    }, 280);
  }

  // Open triggers (delegated so router-swapped DOM keeps working)
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-open="ai-audit"]');
    if (t) { e.preventDefault(); open(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var ov = $('#intake-overlay');
      if (ov && ov.classList.contains('open')) close();
    }
  });

  // Bind close + cancel + overlay-click (one-time)
  var bound = false;
  function bind() {
    if (bound) return; bound = true;
    var ov = $('#intake-overlay'); if (!ov) return;
    var x = $('#intake-close'); if (x) x.addEventListener('click', close);
    var c = $('#intake-cancel'); if (c) c.addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    var done = $('#intake-done'); if (done) done.addEventListener('click', close);
    var doneOnly = $('#intake-done-only'); if (doneOnly) doneOnly.addEventListener('click', close);

    var form = $('#intake-form'); if (!form) return;
    form.addEventListener('input', updateProgress);
    form.addEventListener('change', updateProgress);
    form.addEventListener('submit', submit);
  }

  function updateProgress() {
    var form = $('#intake-form'); if (!form) return;
    var required = $$('[required]', form);
    var filled = required.filter(function (el) { return (el.value || '').trim().length > 0; }).length;
    var pct = required.length ? Math.round((filled / required.length) * 100) : 0;
    var bar = $('#intake-progress-bar'); if (bar) bar.style.width = pct + '%';
  }

  async function submit(e) {
    e.preventDefault();
    var form = $('#intake-form');
    var btn  = $('.intake-btn-primary', form);
    var bad  = false;
    $$('[required]', form).forEach(function (el) {
      var v = (el.value || '').trim();
      if (!v) { el.classList.add('error'); bad = true; }
      else el.classList.remove('error');
    });
    if (bad) {
      var first = $('.error', form); if (first) first.focus();
      return;
    }

    // collect
    var data = {};
    new FormData(form).forEach(function (v, k) {
      if (data[k] === undefined) data[k] = v;
      else if (Array.isArray(data[k])) data[k].push(v);
      else data[k] = [data[k], v];
    });
    data.source = 'ai-audit-intake';
    data.submitted_at = new Date().toISOString();
    data.page = location.pathname;

    btn.disabled = true;
    var label = $('.intake-btn-label', btn); if (label) label.textContent = 'Submitting...';

    try {
      // Try Netlify function first; fall back to mailto so it works on file:// preview
      var ok = false;
      try {
        var r = await fetch('/.netlify/functions/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        ok = r.ok;
      } catch (err) { ok = false; }

      if (!ok) {
        // graceful fallback: open mailto with prefilled body
        var body = Object.keys(data).map(function (k) { return k + ': ' + (Array.isArray(data[k]) ? data[k].join(', ') : data[k]); }).join('\n');
        var mailto = 'mailto:tony@theaiguru.biz?subject=' + encodeURIComponent('AI Audit Intake -- ' + (data.company || data.name || 'New Lead'))
                    + '&body=' + encodeURIComponent(body);
        window.location.href = mailto;
      }

      form.hidden = true;
      var ok2 = $('#intake-success'); if (ok2) ok2.hidden = false;

      // Show payment block if they picked a paid engagement
      var eng = data.engagement;
      var payBlock = $('#intake-pay-block');
      var doneOnly = $('#intake-done-only');
      if (payBlock && (eng === 'consult_500' || eng === 'audit_1500')) {
        var product = (eng === 'audit_1500') ? 'audit_1500' : 'consult_500';
        var label   = (eng === 'audit_1500') ? '2-Day Onsite AI Infrastructure Audit' : '90-min AI Consultation';
        var amt     = (eng === 'audit_1500') ? '$1,500' : '$500';
        $('#intake-pay-name').textContent = label;
        $('#intake-pay-amt').textContent  = amt;
        payBlock.hidden = false;
        var payBtn = $('#intake-pay-now');
        payBtn.onclick = async function () {
          payBtn.disabled = true;
          $('.intake-btn-label', payBtn).textContent = 'Opening checkout...';
          try {
            var r = await fetch('/.netlify/functions/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product: product,
                customer_email: data.email,
                customer_name:  data.name,
                company:        data.company,
              }),
            });
            var j = await r.json();
            if (j && j.url) { window.location.href = j.url; return; }
            throw new Error(j && j.error || 'No checkout URL');
          } catch (err) {
            payBtn.disabled = false;
            $('.intake-btn-label', payBtn).textContent = 'Pay Securely with Stripe';
            alert('Checkout temporarily unavailable. Tony will email you a payment link shortly.');
          }
        };
      } else if (doneOnly) {
        doneOnly.hidden = false;
      }
    } catch (err) {
      btn.disabled = false;
      if (label) label.textContent = 'Submit Intake';
      alert('Something went wrong submitting the form. Please email tony@theaiguru.biz directly.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
"""

inline_js = inline_js + REINIT_EPILOGUE + CHAT_UPGRADE + INTAKE_MODAL_JS
(ASSETS / "site.js").write_text(inline_js, encoding="utf-8", newline="\n")

# --------------------------------------------------------------- 3) Section text
# Slice by line numbers (1-based, inclusive). Line ranges from grep_search.
LINES = src.splitlines()
def slice_lines(start, end):
    return "\n".join(LINES[start - 1:end])

hero_html     = slice_lines(1974, 2033)
# Remove the blue AI hero image entirely (palette mismatch)
hero_html = re.sub(
    r'\s*<div class="hero-image[^"]*">\s*<img[^>]*>\s*</div>',
    '',
    hero_html
)
# Fix pre-existing markup bug in source: hero-image is OUTSIDE .hero-split,
# leaving the image flush-left and uncentered. Rebalance with regex.
hero_html = re.sub(
    r'</div>\s*</div>\s*<div class="hero-image',
    '</div>\n    <div class="hero-image',
    hero_html, count=1
)
hero_html = re.sub(
    r'(<img src="images/hero/hero-ai-tech\.webp"[^>]*>\s*</div>)',
    r'\1\n  </div>',
    hero_html, count=1
)
stats_html    = slice_lines(2038, 2060)
services_html = slice_lines(2068, 2224)
demo_html     = slice_lines(2232, 2248)
process_html  = slice_lines(2257, 2293)
results_html  = slice_lines(2328, 2356)
contact_html  = slice_lines(2364, 2386)

# Rewrite "Book AI Audit" CTA (mailto:) on contact slice -> opens intake modal
contact_html = re.sub(
    r'<a\s+href="mailto:tony@theaiguru\.biz"\s+class="btn-cta-primary">\s*Book AI Audit',
    '<a href="#ai-audit" class="btn-cta-primary" data-open="ai-audit">Book AI Audit',
    contact_html, count=1
)

# ------------------------------------------------- 4) Shared FX overlays (top of body)
FX_OVERLAYS = """\
<!-- PRELOADER -->
<div id="preloader">
  <div class="loader-ring"></div>
  <div class="loader-text">Initializing AI Systems</div>
</div>

<!-- CUSTOM CURSOR -->
<div class="cursor-dot"></div>
<div class="cursor-ring"></div>

<!-- FLOATING PARTICLES -->
<canvas id="particles-canvas"></canvas>

<!-- LIGHT STREAKS -->
<canvas id="streaks-canvas"></canvas>

<!-- DATA RAIN -->
<canvas id="datarain-canvas"></canvas>

<!-- SCANLINE OVERLAY -->
<div class="scanline-overlay"></div>
<div class="scanline-beam"></div>

<!-- SPEED LINES ON SCROLL -->
<div class="speed-lines" id="speed-lines"></div>

<!-- MOUSE TRAIL -->
<div class="mouse-trail" id="mouse-trail-0"></div>
<div class="mouse-trail" id="mouse-trail-1"></div>
<div class="mouse-trail" id="mouse-trail-2"></div>
<div class="mouse-trail" id="mouse-trail-3"></div>
<div class="mouse-trail" id="mouse-trail-4"></div>

<!-- PAGE TRANSITION OVERLAYS -->
<div class="page-fx" id="page-fx">
  <div class="page-fx-curtain"></div>
  <canvas class="page-fx-canvas"></canvas>
</div>
"""

# ---------------------------------------------------------------- 5) Shared NAV
NAV = """\
<nav>
  <div class="nav-inner">
    <a href="index.html" class="nav-logo" data-router-skip>
      <div class="logo-mark">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="2.5" fill="white"/>
          <line x1="11" y1="11" x2="4" y2="4" stroke="white" stroke-width="1.5"/>
          <line x1="11" y1="11" x2="18" y2="4" stroke="white" stroke-width="1.5"/>
          <line x1="11" y1="11" x2="18" y2="18" stroke="white" stroke-width="1.5"/>
          <line x1="11" y1="11" x2="4" y2="18" stroke="white" stroke-width="1.5"/>
          <line x1="11" y1="11" x2="11" y2="2" stroke="white" stroke-width="1.5"/>
          <line x1="11" y1="11" x2="11" y2="20" stroke="white" stroke-width="1.5"/>
          <circle cx="4" cy="4" r="1.5" fill="white" opacity="0.7"/>
          <circle cx="18" cy="4" r="1.5" fill="white" opacity="0.7"/>
          <circle cx="18" cy="18" r="1.5" fill="white" opacity="0.7"/>
          <circle cx="4" cy="18" r="1.5" fill="white" opacity="0.7"/>
          <circle cx="11" cy="2" r="1.5" fill="white" opacity="0.7"/>
          <circle cx="11" cy="20" r="1.5" fill="white" opacity="0.7"/>
        </svg>
      </div>
      <span class="logo-text">THEAI<span>GURU</span></span>
    </a>

    <ul class="nav-links">
      <li><a href="services.html" data-page="services">Services</a></li>
      <li><a href="demo.html" data-page="demo">Demo</a></li>
      <li><a href="process.html" data-page="process">Process</a></li>
      <li><a href="results.html" data-page="results">Results</a></li>
      <li><a href="about.html" data-page="about">About</a></li>
      <li><a href="contact.html" data-page="contact">Contact</a></li>
    </ul>

    <div class="nav-cta">
      <a href="book.html" class="btn-nav" data-page="book">
        Book Audit
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
      <button class="mobile-toggle" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>
"""

# ---------------------------------------------------------- 6) Footer + chatbot
FOOTER_AND_CHAT = """\
<!-- AI INFRASTRUCTURE AUDIT -- INTAKE FORM MODAL -->
<div class="intake-overlay" id="intake-overlay" aria-hidden="true">
  <div class="intake-grid-bg"></div>
  <div class="intake-scan"></div>
  <div class="intake-modal" role="dialog" aria-modal="true" aria-labelledby="intake-title">
    <button class="intake-close" id="intake-close" aria-label="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
    <div class="intake-header">
      <div class="intake-badge">
        <span class="intake-pulse"></span>
        AI INFRASTRUCTURE AUDIT &middot; INTAKE
      </div>
      <h2 id="intake-title" class="intake-title">Let's Map Your <span>AI Roadmap</span></h2>
      <p class="intake-sub">Tell us about your business. Tony reviews every submission personally and follows up within one business day with your scoped audit plan.</p>
      <div class="intake-progress"><div class="intake-progress-bar" id="intake-progress-bar"></div></div>
    </div>
    <form class="intake-form" id="intake-form" novalidate>
      <div class="intake-section">
        <div class="intake-section-title"><span class="intake-num">01</span> Company</div>
        <div class="intake-row">
          <label class="intake-field"><span>Full Name *</span><input type="text" name="name" required autocomplete="name"></label>
          <label class="intake-field"><span>Title / Role</span><input type="text" name="title" autocomplete="organization-title"></label>
        </div>
        <div class="intake-row">
          <label class="intake-field"><span>Company Name *</span><input type="text" name="company" required autocomplete="organization"></label>
          <label class="intake-field"><span>Industry *</span><select name="industry" required>
            <option value="">Select industry...</option>
            <option>Professional Services</option><option>Real Estate</option><option>Legal</option>
            <option>Healthcare / Medical</option><option>E-commerce / Retail</option>
            <option>Education / Schools</option><option>Photography / Creative</option>
            <option>Construction / Trades</option><option>Hospitality / Events</option>
            <option>Manufacturing</option><option>Finance / Insurance</option><option>Other</option>
          </select></label>
        </div>
        <div class="intake-row">
          <label class="intake-field"><span>Business Email *</span><input type="email" name="email" required autocomplete="email"></label>
          <label class="intake-field"><span>Phone *</span><input type="tel" name="phone" required autocomplete="tel"></label>
        </div>
        <label class="intake-field"><span>Website</span><input type="url" name="website" placeholder="https://" autocomplete="url"></label>
      </div>

      <div class="intake-section">
        <div class="intake-section-title"><span class="intake-num">02</span> Scale</div>
        <div class="intake-row">
          <label class="intake-field"><span>Team Size *</span><select name="team_size" required>
            <option value="">Select...</option><option>Just me</option><option>2-5</option><option>6-15</option><option>16-50</option><option>51-200</option><option>200+</option>
          </select></label>
          <label class="intake-field"><span>Annual Revenue</span><select name="revenue">
            <option value="">Prefer not to say</option><option>Under $250K</option><option>$250K-$1M</option><option>$1M-$5M</option><option>$5M-$25M</option><option>$25M+</option>
          </select></label>
        </div>
      </div>

      <div class="intake-section">
        <div class="intake-section-title"><span class="intake-num">03</span> What you need *</div>
        <p class="intake-hint">Pick all that apply.</p>
        <div class="intake-chips">
          <label><input type="checkbox" name="needs" value="Voice Agent"><span>24/7 AI Voice Agent</span></label>
          <label><input type="checkbox" name="needs" value="Workflow Automation"><span>Workflow Automation</span></label>
          <label><input type="checkbox" name="needs" value="Custom Web App"><span>Custom Web App</span></label>
          <label><input type="checkbox" name="needs" value="AI CRM"><span>AI CRM / Client Mgmt</span></label>
          <label><input type="checkbox" name="needs" value="Image Pipeline"><span>AI Image Pipeline</span></label>
          <label><input type="checkbox" name="needs" value="Email Automation"><span>Email Automation</span></label>
          <label><input type="checkbox" name="needs" value="Document AI"><span>Document / OCR AI</span></label>
          <label><input type="checkbox" name="needs" value="Reporting Dashboard"><span>Reporting Dashboard</span></label>
          <label><input type="checkbox" name="needs" value="Stack Audit"><span>Stack Audit Only</span></label>
          <label><input type="checkbox" name="needs" value="Not sure yet"><span>Not sure yet</span></label>
        </div>
      </div>

      <div class="intake-section">
        <div class="intake-section-title"><span class="intake-num">04</span> Current Stack</div>
        <label class="intake-field"><span>Tools you use today (CRM, accounting, calendar, phone system, etc.)</span>
          <textarea name="current_stack" rows="2" placeholder="e.g. HubSpot, QuickBooks, Google Workspace, Calendly, RingCentral..."></textarea>
        </label>
        <div class="intake-row">
          <label class="intake-field"><span>Biggest bottleneck *</span>
            <input type="text" name="bottleneck" required placeholder="What's eating the most time today?">
          </label>
          <label class="intake-field"><span>Hours/week lost to manual work</span>
            <select name="hours_lost"><option value="">Estimate...</option><option>0-5</option><option>6-15</option><option>16-30</option><option>31-60</option><option>60+</option></select>
          </label>
        </div>
      </div>

      <div class="intake-section">
        <div class="intake-section-title"><span class="intake-num">05</span> Project</div>
        <div class="intake-row">
          <label class="intake-field"><span>Budget range *</span>
            <select name="budget" required>
              <option value="">Select range...</option>
              <option>$500 -- 90-min Consult only</option>
              <option>$1,500 -- 2-Day Onsite Audit only</option>
              <option>$2K-$10K build</option><option>$10K-$25K build</option>
              <option>$25K-$75K build</option><option>$75K+ enterprise</option>
              <option>Need help scoping</option>
            </select>
          </label>
          <label class="intake-field"><span>Timeline *</span>
            <select name="timeline" required>
              <option value="">Select...</option>
              <option>ASAP / This month</option><option>1-3 months</option>
              <option>3-6 months</option><option>6+ months</option><option>Just exploring</option>
            </select>
          </label>
        </div>
        <label class="intake-field"><span>Anything else? Goals, constraints, dreams...</span>
          <textarea name="notes" rows="3" placeholder="Optional but helpful."></textarea>
        </label>
      </div>

      <div class="intake-section">
        <div class="intake-section-title"><span class="intake-num">06</span> Engagement</div>
        <div class="intake-radios">
          <label><input type="radio" name="engagement" value="consult_500" checked><span><strong>$500</strong> &mdash; 90-min Consultation</span></label>
          <label><input type="radio" name="engagement" value="audit_1500"><span><strong>$1,500</strong> &mdash; 2-Day Onsite Audit</span></label>
          <label><input type="radio" name="engagement" value="discuss"><span><strong>Let's talk</strong> first</span></label>
        </div>
      </div>

      <div class="intake-actions">
        <button type="button" class="intake-btn-ghost" id="intake-cancel">Cancel</button>
        <button type="submit" class="intake-btn-primary">
          <span class="intake-btn-label">Submit Intake</span>
          <span class="intake-btn-arrow">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </button>
      </div>
      <div class="intake-footnote">Encrypted in transit &middot; Tony reviews personally &middot; No spam, ever.</div>
    </form>

    <div class="intake-success" id="intake-success" hidden>
      <div class="intake-success-ring"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="23" fill="none"/><path d="M14 27l8 8 16-18" fill="none"/></svg></div>
      <h3>Intake received</h3>
      <p>Tony will reach out within one business day. Watch for a text from <strong>(856) 577-0236</strong>.</p>
      <div class="intake-pay-block" id="intake-pay-block" hidden>
        <div class="intake-pay-divider"><span>SECURE YOUR SLOT NOW</span></div>
        <div class="intake-pay-card" id="intake-pay-card">
          <div class="intake-pay-line">
            <span class="intake-pay-name" id="intake-pay-name">90-min AI Consultation</span>
            <span class="intake-pay-amt"  id="intake-pay-amt">$500</span>
          </div>
          <p class="intake-pay-note">Pay now to lock in a slot &mdash; full refund within 24 hours if you cancel.</p>
          <button type="button" class="intake-btn-primary intake-btn-pay" id="intake-pay-now">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            <span class="intake-btn-label">Pay Securely with Stripe</span>
          </button>
          <div class="intake-pay-trust">
            <span>✓ 256-bit SSL</span><span>✓ PCI-compliant via Stripe</span><span>✓ We never see your card</span>
          </div>
        </div>
        <button type="button" class="intake-btn-ghost intake-pay-skip" id="intake-done">Pay later &mdash; just close</button>
      </div>
      <button type="button" class="intake-btn-primary" id="intake-done-only" hidden>Done</button>
    </div>
  </div>
</div>

<footer>
  <div class="footer-inner">
    <div class="footer-brand">THEAI<span>GURU</span></div>
    <ul class="footer-links">
      <li><a href="services.html" data-page="services">Services</a></li>
      <li><a href="process.html" data-page="process">Process</a></li>
      <li><a href="results.html" data-page="results">Results</a></li>
      <li><a href="contact.html" data-page="contact">Contact</a></li>
    </ul>
    <div class="footer-copy">&copy; 2026 TheAIGuru.biz &middot; Photo Illusions AI Division &middot; Mt. Holly, NJ &middot; All rights reserved</div>
  </div>
</footer>

<!-- AI AGENT CHATBOT -->
<button class="ai-agent-fab" id="agent-toggle" aria-label="Chat with AI Agent">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2a7 7 0 017 7v1a7 7 0 01-14 0V9a7 7 0 017-7z"/>
    <path d="M8 10h.01M16 10h.01"/>
    <path d="M9 14c.8.8 2.2 1.5 3 1.5s2.2-.7 3-1.5"/>
    <path d="M5 9V7M19 9V7"/>
    <path d="M12 18v4M8 22h8"/>
  </svg>
</button>

<div class="ai-chat-panel" id="ai-chat-panel">
  <div class="chat-header">
    <div class="chat-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      </svg>
    </div>
    <div class="chat-header-info">
      <div class="chat-header-name">GURU AI AGENT</div>
      <div class="chat-header-status">Online &middot; Ready to help</div>
    </div>
    <button class="chat-close" id="chat-close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  </div>

  <div class="chat-messages" id="chat-messages">
    <div class="chat-msg bot">Hey! I'm the Guru AI Agent. We're two sides of one shop — <strong>TheAIGuru.biz</strong> for software &amp; AI builds, and <strong>Photo Illusions</strong> for photography &amp; entertainment. What brings you in today?</div>
  </div>

  <div class="chat-input-area">
    <button class="chat-mic" id="chat-mic" title="Hold to speak" aria-label="Voice input">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0"/><path d="M12 18v3M9 21h6"/></svg>
    </button>
    <input type="text" class="chat-input" id="chat-input" placeholder="Ask or tap mic to speak..." autocomplete="off">
    <button class="chat-voice-toggle" id="chat-voice-toggle" title="Toggle spoken replies" aria-label="Toggle voice replies">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7"/><path d="M19 5a9 9 0 010 14"/></svg>
    </button>
    <button class="chat-send" id="chat-send">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
    </button>
  </div>
</div>
"""

# ---------------------------------------------------------------- 7) Shared HEAD
def head(title, desc):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 22 22'%3E%3Crect width='22' height='22' rx='5' fill='%238b1530'/%3E%3Ccircle cx='11' cy='11' r='3' fill='%23b8902a'/%3E%3C/svg%3E">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&amp;family=Inter:wght@300;400;500;600;700&amp;family=JetBrains+Mono:wght@300;400;500;600&amp;display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<link rel="stylesheet" href="assets/site.css">
<link rel="stylesheet" href="assets/site-pages.css">
</head>
<body>
"""

def page(title, desc, body, extra_scripts=""):
    return (head(title, desc)
            + FX_OVERLAYS
            + NAV
            + '<main class="page" data-page-name="' + body["name"] + '">\n'
            + body["html"]
            + '\n</main>\n'
            + FOOTER_AND_CHAT
            + extra_scripts
            + '<script src="assets/site.js"></script>\n'
            + '<script src="assets/router.js"></script>\n'
            + '</body></html>\n')

# ---------------------------------------------------------------- 8) Pages
def section_intro(eyebrow, title_html, sub):
    return f"""
<section class="page-intro">
  <div class="section-inner">
    <div class="section-header-center gs-reveal">
      <span class="section-tag" style="justify-content:center;">{eyebrow}</span>
      <h1 class="section-title">{title_html}</h1>
      <p class="section-sub">{sub}</p>
    </div>
  </div>
</section>
"""

# --- INDEX (home) ---------------------------------------------------------
INDEX_BODY = hero_html + "\n" + stats_html + """
<section class="trusted-by">
  <div class="trusted-inner">
    <div class="trusted-label">Trusted technology partners</div>
    <div class="trusted-marquee">
      <div class="trusted-track">
        <span>Vapi</span><span>OpenAI</span><span>Google Cloud</span><span>Anthropic</span><span>Stripe</span><span>Twilio</span><span>ClickSend</span><span>Netlify</span><span>Render</span><span>ComfyUI</span><span>FLUX</span><span>Grok</span>
        <span>Vapi</span><span>OpenAI</span><span>Google Cloud</span><span>Anthropic</span><span>Stripe</span><span>Twilio</span><span>ClickSend</span><span>Netlify</span><span>Render</span><span>ComfyUI</span><span>FLUX</span><span>Grok</span>
      </div>
    </div>
  </div>
</section>
"""

# --- SERVICES -------------------------------------------------------------
SERVICES_BODY = services_html

# --- DEMO -----------------------------------------------------------------
DEMO_BODY = demo_html + """
<section class="portfolio-section">
  <div class="section-inner">
    <div class="section-header-center gs-reveal">
      <span class="section-tag" style="justify-content:center;">project portfolio</span>
      <h2 class="section-title">More Systems We've Shipped</h2>
      <p class="section-sub">A selection of production AI systems built for real clients across multiple industries.</p>
    </div>
    <div class="portfolio-grid">
      <div class="portfolio-card gs-reveal">
        <div class="portfolio-icon"><svg viewBox="0 0 22 22" fill="none"><rect x="5" y="2" width="12" height="18" rx="2.5" stroke="currentColor" stroke-width="1.5"/><circle cx="11" cy="16" r="1.2" fill="currentColor"/></svg></div>
        <h3>AI Voice Receptionist</h3>
        <p>24/7 phone agent that books appointments, answers questions, and texts confirmations. Live in production.</p>
        <div class="tech-pills"><span class="tech-pill">Vapi</span><span class="tech-pill">Python</span><span class="tech-pill">Google Calendar</span></div>
      </div>
      <div class="portfolio-card gs-reveal">
        <div class="portfolio-icon"><svg viewBox="0 0 22 22" fill="none"><rect x="3" y="5" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 9h16" stroke="currentColor" stroke-width="1.3"/></svg></div>
        <h3>Charter School SMS</h3>
        <p>Unified school management platform &mdash; enrollment, scheduling, communications, AI-assisted operations.</p>
        <div class="tech-pills"><span class="tech-pill">Electron</span><span class="tech-pill">Node.js</span><span class="tech-pill">SQLite</span></div>
      </div>
      <div class="portfolio-card gs-reveal">
        <div class="portfolio-icon"><svg viewBox="0 0 22 22" fill="none"><rect x="2" y="4" width="18" height="14" rx="2.5" stroke="currentColor" stroke-width="1.5"/><circle cx="7.5" cy="10" r="1.8" stroke="currentColor" stroke-width="1.2"/></svg></div>
        <h3>AI Image Pipeline</h3>
        <p>Batch portrait generation & enhancement at scale. Used for events, studios, and e-commerce catalogs.</p>
        <div class="tech-pills"><span class="tech-pill">Grok</span><span class="tech-pill">ComfyUI</span><span class="tech-pill">FLUX</span></div>
      </div>
      <div class="portfolio-card gs-reveal">
        <div class="portfolio-icon"><svg viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M11 2v5M11 15v5M2 11h5M15 11h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>
        <h3>Desktop CRM Suite</h3>
        <p>Custom CRM with Gemini AI, Google Calendar sync, SQLite storage, and unified client management.</p>
        <div class="tech-pills"><span class="tech-pill">CustomTkinter</span><span class="tech-pill">Gemini</span></div>
      </div>
    </div>
  </div>
</section>
"""

# --- PROCESS --------------------------------------------------------------
PROCESS_BODY = process_html

# --- RESULTS --------------------------------------------------------------
RESULTS_BODY = results_html

# --- CONTACT --------------------------------------------------------------
CONTACT_BODY = contact_html + """
<section class="contact-extra">
  <div class="section-inner contact-grid">
    <div class="contact-card gs-reveal">
      <div class="contact-icon-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></div>
      <div class="contact-card-label">Email</div>
      <a class="contact-card-value" href="mailto:tony@theaiguru.biz">tony@theaiguru.biz</a>
    </div>
    <div class="contact-card gs-reveal">
      <div class="contact-icon-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg></div>
      <div class="contact-card-label">Phone</div>
      <a class="contact-card-value" href="tel:+18565770236">(856) 577-0236</a>
    </div>
    <div class="contact-card gs-reveal">
      <div class="contact-icon-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
      <div class="contact-card-label">Studio</div>
      <div class="contact-card-value">Mt. Holly, New Jersey</div>
    </div>
  </div>
</section>
"""

# --- ABOUT (NEW) ----------------------------------------------------------
ABOUT_BODY = section_intro(
    "about the founder",
    "Engineer. Photographer. <span class='accent-cyan'>AI Builder.</span>",
    "Tony is the founder of TheAIGuru.biz &mdash; a one-person, one-machine AI development practice based in Mt. Holly, New Jersey."
) + """
<section class="about-section">
  <div class="section-inner about-grid">
    <div class="about-text gs-reveal">
      <h2>From Camera to Code</h2>
      <p>For over a decade I've been the photographer behind <strong>Photo Illusions</strong> &mdash; capturing portraits, events, and brand work for clients across the East Coast. Somewhere along the way, automation became its own art form.</p>
      <p>What started as scripts to batch-edit thousands of images turned into custom desktop CRMs, AI-powered image pipelines, full booking systems, and 24/7 voice agents that book appointments while I sleep.</p>
      <p>TheAIGuru.biz is the AI division of that work &mdash; a place where small businesses can get the same kind of bespoke automation that used to cost six figures, built and shipped fast by someone who actually codes the systems himself.</p>
      <h2>What That Means For You</h2>
      <ul class="about-list">
        <li><strong>You talk to the builder.</strong> No account managers, no offshore handoffs.</li>
        <li><strong>Real production code.</strong> Not no-code glue that breaks at scale.</li>
        <li><strong>Shipped, not promised.</strong> First working version in days, not months.</li>
        <li><strong>You own it.</strong> No subscriptions, no lock-in, no per-seat pricing.</li>
      </ul>
    </div>
    <div class="about-stack gs-reveal">
      <div class="about-stack-card">
        <div class="about-stack-label">Stack I ship in production</div>
        <div class="tech-pills">
          <span class="tech-pill">Python</span><span class="tech-pill">Node.js</span><span class="tech-pill">React</span><span class="tech-pill">TypeScript</span><span class="tech-pill">Electron</span><span class="tech-pill">CustomTkinter</span><span class="tech-pill">PowerShell</span><span class="tech-pill purple">FastAPI</span><span class="tech-pill purple">Flask</span><span class="tech-pill purple">SQLite</span><span class="tech-pill gold">Vapi</span><span class="tech-pill gold">OpenAI</span><span class="tech-pill gold">Anthropic</span><span class="tech-pill gold">Gemini</span><span class="tech-pill gold">Grok</span><span class="tech-pill green">ComfyUI</span><span class="tech-pill green">FLUX</span><span class="tech-pill green">Stable Diffusion</span>
        </div>
      </div>
    </div>
  </div>
</section>
"""

# --- BOOK / CONSULTATION (NEW) -------------------------------------------
BOOK_BODY = section_intro(
    "book a consultation",
    "Let's Map Your <span class='accent-gold'>AI Roadmap</span>",
    "30-minute call. No pitch deck. We look at your current operations and identify exactly where AI will save the most time or generate the most revenue."
) + """
<section class="book-section">
  <div class="section-inner book-grid">
    <form class="book-form gs-reveal" name="consultation" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="thank-you.html">
      <input type="hidden" name="form-name" value="consultation">
      <p class="hidden"><label>Don't fill this out: <input name="bot-field"></label></p>

      <div class="form-row">
        <label>Your name <input type="text" name="name" required autocomplete="name"></label>
        <label>Email <input type="email" name="email" required autocomplete="email"></label>
      </div>
      <div class="form-row">
        <label>Phone <input type="tel" name="phone" autocomplete="tel" placeholder="(856) 555-1234"></label>
        <label>Business / Industry <input type="text" name="business"></label>
      </div>
      <label>What's the #1 thing you'd want AI to do for your business?
        <textarea name="goal" rows="4" placeholder="e.g. answer phones 24/7, automate client onboarding, generate marketing images..."></textarea>
      </label>
      <div class="form-row">
        <label>Preferred contact method
          <select name="contact_method">
            <option>Phone call</option>
            <option>Email</option>
            <option>Text / SMS</option>
            <option>Video meeting</option>
          </select>
        </label>
        <label>Best time to reach you
          <select name="contact_time">
            <option>Morning (9am - 12pm)</option>
            <option>Afternoon (12pm - 5pm)</option>
            <option>Evening (5pm - 8pm)</option>
            <option>Anytime</option>
          </select>
        </label>
      </div>
      <button type="submit" class="btn-cta-primary">
        Request Consultation
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </form>

    <aside class="book-side gs-reveal">
      <div class="book-side-card">
        <div class="book-side-label">What happens next</div>
        <ol class="book-steps">
          <li><strong>You submit</strong> &mdash; takes 60 seconds.</li>
          <li><strong>I reply within 24h</strong> with 2-3 time slots.</li>
          <li><strong>30-min consultation</strong> &mdash; we audit your ops & identify AI wins.</li>
          <li><strong>You get a roadmap</strong> &mdash; PDF with exact systems, costs, timeline. Yours to keep.</li>
        </ol>
      </div>
      <div class="book-side-card alt">
        <div class="book-side-label">Prefer to talk now?</div>
        <a href="tel:+18565770236" class="book-side-phone">(856) 577-0236</a>
        <a href="mailto:tony@theaiguru.biz" class="book-side-email">tony@theaiguru.biz</a>
      </div>
    </aside>
  </div>
</section>
"""

# Vimeo player only loaded on the demo page
VIMEO = '<script src="https://player.vimeo.com/api/player.js"></script>\n'

PAGES = [
    ("index.html",     "TheAIGuru.biz \u2014 AI Business Automation \u00b7 Mt. Holly, NJ",
        "Custom AI systems, voice agents, and automation built from scratch for small business in Mt. Holly, NJ.",
        {"name": "home",     "html": INDEX_BODY},     ""),
    ("services.html",  "Services \u2014 TheAIGuru.biz",
        "AI voice assistants, custom web apps, automation, image pipelines, CRM tools and AI consulting.",
        {"name": "services", "html": SERVICES_BODY},  ""),
    ("demo.html",      "Live Demo \u2014 TheAIGuru.biz",
        "Watch our Charter School SMS demo and see other production AI systems we've shipped.",
        {"name": "demo",     "html": DEMO_BODY},      VIMEO),
    ("process.html",   "Process \u2014 TheAIGuru.biz",
        "From first call to live system: how we audit, design, build, and deploy custom AI in days, not months.",
        {"name": "process",  "html": PROCESS_BODY},   ""),
    ("results.html",   "Results \u2014 TheAIGuru.biz",
        "Real outcomes from real clients running our custom AI systems in production.",
        {"name": "results",  "html": RESULTS_BODY},   ""),
    ("about.html",     "About \u2014 TheAIGuru.biz",
        "The story behind TheAIGuru.biz \u2014 a one-builder AI shop in Mt. Holly, NJ.",
        {"name": "about",    "html": ABOUT_BODY},     ""),
    ("contact.html",   "Contact \u2014 TheAIGuru.biz",
        "Talk to Tony directly. Phone, email, or book a 30-minute AI consultation.",
        {"name": "contact",  "html": CONTACT_BODY},   ""),
    ("book.html",      "Book a Consultation \u2014 TheAIGuru.biz",
        "Schedule a free 30-minute AI consultation. Get a custom roadmap for your business.",
        {"name": "book",     "html": BOOK_BODY},      ""),
]

for filename, title, desc, body, extra in PAGES:
    out = page(title, desc, body, extra)
    (ROOT / filename).write_text(out, encoding="utf-8", newline="\n")
    print(f"wrote {filename:14} ({len(out):>6} chars)")

print(f"\nassets/site.css  ({(ASSETS/'site.css').stat().st_size:>6} bytes)")
print(f"assets/site.js   ({(ASSETS/'site.js').stat().st_size:>6} bytes)")
print("done.")
