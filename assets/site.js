/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PRELOADER
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader').classList.add('hidden');
  }, 1200);
});

/* ═════════════════════════════════════════════════════════════════
   MOBILE DETECTION
═════════════════════════════════════════════════════════════════ */
const isMobile = window.innerWidth < 768 || window.matchMedia('(hover: none)').matches;
const isTablet = window.innerWidth < 1024;

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CUSTOM CURSOR
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');

if (window.matchMedia('(pointer: fine)').matches) {
  document.addEventListener('mousemove', e => {
    cursorDot.style.left = e.clientX - 4 + 'px';
    cursorDot.style.top = e.clientY - 4 + 'px';
    cursorRing.style.left = e.clientX + 'px';
    cursorRing.style.top = e.clientY + 'px';
  });

  document.querySelectorAll('a, button, .b-card, .step, .stack-chip, .result-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
  });
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FLOATING PARTICLES CANVAS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const particlesCanvas = document.getElementById('particles-canvas');
const pCtx = particlesCanvas.getContext('2d');
let pW, pH, particles = [];

function resizeParticles() {
  pW = particlesCanvas.width = window.innerWidth;
  pH = particlesCanvas.height = window.innerHeight;
}
function initParticles(count) {
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * pW,
      y: Math.random() * pH,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      gold: Math.random() < 0.1
    });
  }
}
function drawParticles() {
  pCtx.clearRect(0, 0, pW, pH);
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j];
      const dx = p.x - q.x, dy = p.y - q.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 120) {
        const alpha = (1 - d/120) * 0.06;
        pCtx.strokeStyle = p.gold || q.gold
          ? `rgba(184,144,42,${alpha})`
          : `rgba(139,21,48,${alpha})`;
        pCtx.lineWidth = 0.5;
        pCtx.beginPath();
        pCtx.moveTo(p.x, p.y);
        pCtx.lineTo(q.x, q.y);
        pCtx.stroke();
      }
    }
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    pCtx.fillStyle = p.gold ? 'rgba(184,144,42,0.35)' : 'rgba(139,21,48,0.22)';
    pCtx.fill();
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > pW) p.vx *= -1;
    if (p.y < 0 || p.y > pH) p.vy *= -1;
  }
  requestAnimationFrame(drawParticles);
}
resizeParticles();
const particleCount = isMobile ? 15 : (isTablet ? 25 : 40);
initParticles(particleCount);
drawParticles();
window.addEventListener('resize', () => { resizeParticles(); initParticles(particleCount); });

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   THREE.JS â€” 3D HERO BACKGROUND
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
(function init3D() {
  const container = document.getElementById('hero-3d');
  if (!container) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  /* Particle sphere â€” neural network style */
  const nodeCount = isMobile ? 80 : (isTablet ? 120 : 200);
  const positions = new Float32Array(nodeCount * 3);
  const colors = new Float32Array(nodeCount * 3);
  const cyanColor = new THREE.Color(0x00d4ff);
  const goldColor = new THREE.Color(0xf5c542);
  const purpleColor = new THREE.Color(0xa78bfa);

  for (let i = 0; i < nodeCount; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    const r = 12 + (Math.random() - 0.5) * 4;
    positions[i*3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3 + 2] = r * Math.cos(phi);

    const pick = Math.random();
    let c = pick < 0.6 ? cyanColor : pick < 0.85 ? purpleColor : goldColor;
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
  }

  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const pointsMat = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  const pointsMesh = new THREE.Points(pointsGeo, pointsMat);
  scene.add(pointsMesh);

  /* Connection lines */
  const lineGeo = new THREE.BufferGeometry();
  const linePosArray = [];
  const lineColorArray = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const dx = positions[i*3] - positions[j*3];
      const dy = positions[i*3+1] - positions[j*3+1];
      const dz = positions[i*3+2] - positions[j*3+2];
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (d < 5) {
        linePosArray.push(
          positions[i*3], positions[i*3+1], positions[i*3+2],
          positions[j*3], positions[j*3+1], positions[j*3+2]
        );
        lineColorArray.push(0, 0.83, 1, 0, 0.83, 1);
      }
    }
  }
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePosArray, 3));
  lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColorArray, 3));
  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.12
  });
  const linesMesh = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(linesMesh);

  /* Wireframe icosahedron */
  const icoGeo = new THREE.IcosahedronGeometry(8, 1);
  const icoMat = new THREE.MeshBasicMaterial({
    color: 0x00d4ff,
    wireframe: true,
    transparent: true,
    opacity: 0.06
  });
  const icoMesh = new THREE.Mesh(icoGeo, icoMat);
  scene.add(icoMesh);

  /* Outer ring */
  const ringGeo = new THREE.TorusGeometry(16, 0.04, 16, 100);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xa78bfa,
    transparent: true,
    opacity: 0.15
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 3;
  scene.add(ringMesh);

  /* Second ring */
  const ring2Geo = new THREE.TorusGeometry(14, 0.03, 16, 100);
  const ring2Mat = new THREE.MeshBasicMaterial({
    color: 0xf5c542,
    transparent: true,
    opacity: 0.1
  });
  const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2Mesh.rotation.x = -Math.PI / 4;
  ring2Mesh.rotation.y = Math.PI / 6;
  scene.add(ring2Mesh);

  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function animate() {
    requestAnimationFrame(animate);
    pointsMesh.rotation.y += 0.001;
    pointsMesh.rotation.x += 0.0003;
    linesMesh.rotation.y += 0.001;
    linesMesh.rotation.x += 0.0003;
    icoMesh.rotation.y -= 0.002;
    icoMesh.rotation.x += 0.001;
    ringMesh.rotation.z += 0.003;
    ring2Mesh.rotation.z -= 0.002;

    camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   NAV SCROLL EFFECT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

/* ═════════════════════════════════════════════════════════════════
   MOBILE MENU FUNCTIONALITY
═════════════════════════════════════════════════════════════════ */
(function initMobileMenu() {
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  let mobileMenu = document.querySelector('.nav-menu-mobile');

  // Create mobile menu if it doesn't exist
  if (!mobileMenu) {
    mobileMenu = document.createElement('div');
    mobileMenu.className = 'nav-menu-mobile';
    
    // Copy nav links to mobile menu
    const links = navLinks ? navLinks.querySelectorAll('a') : [];
    links.forEach(link => {
      const clone = link.cloneNode(true);
      mobileMenu.appendChild(clone);
    });

    // Add CTA button to mobile menu
    const ctaBtn = document.querySelector('.btn-nav');
    if (ctaBtn) {
      const cta = ctaBtn.cloneNode(true);
      mobileMenu.appendChild(cta);
    }

    nav.appendChild(mobileMenu);
  }

  // Toggle menu
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });
  }

  // Close menu when link is clicked
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileToggle.classList.remove('active');
      mobileMenu.classList.remove('active');
    });
  });

  // Close menu on resize if moving to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      mobileToggle.classList.remove('active');
      mobileMenu.classList.remove('active');
    }
  });
})();

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   GSAP SCROLL ANIMATIONS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
gsap.registerPlugin(ScrollTrigger);

/* Standard reveal-up */
gsap.utils.toArray('.gs-reveal').forEach(el => {
  gsap.to(el, {
    scrollTrigger: {
      trigger: el,
      start: 'top 85%',
      toggleActions: 'play none none none'
    },
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power3.out'
  });
});

/* Scale reveals */
gsap.utils.toArray('.gs-reveal-scale').forEach(el => {
  gsap.to(el, {
    scrollTrigger: {
      trigger: el,
      start: 'top 85%',
      toggleActions: 'play none none none'
    },
    opacity: 1,
    scale: 1,
    duration: 1,
    ease: 'power3.out'
  });
});

/* Stagger service cards */
gsap.utils.toArray('.bento .b-card').forEach((card, i) => {
  gsap.to(card, {
    scrollTrigger: {
      trigger: card,
      start: 'top 90%',
      toggleActions: 'play none none none'
    },
    opacity: 1,
    y: 0,
    duration: 0.6,
    delay: i * 0.08,
    ease: 'power2.out'
  });
});

/* Stagger steps */
gsap.utils.toArray('.step').forEach((step, i) => {
  gsap.to(step, {
    scrollTrigger: {
      trigger: step,
      start: 'top 90%',
      toggleActions: 'play none none none'
    },
    opacity: 1,
    y: 0,
    duration: 0.6,
    delay: i * 0.12,
    ease: 'power2.out'
  });
});

/* Stagger result cards */
gsap.utils.toArray('.result-card').forEach((card, i) => {
  gsap.to(card, {
    scrollTrigger: {
      trigger: card,
      start: 'top 90%',
      toggleActions: 'play none none none'
    },
    opacity: 1,
    y: 0,
    duration: 0.6,
    delay: i * 0.1,
    ease: 'power2.out'
  });
});

/* Hero content entrance */
gsap.fromTo('.hero-content', { opacity: 0, y: 50 }, {
  opacity: 1, y: 0, duration: 1.2, delay: 1.4, ease: 'power3.out'
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   COUNTER ANIMATION
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const counters = document.querySelectorAll('.counter');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = +el.dataset.target;
      let current = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          el.textContent = target;
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(current);
        }
      }, 25);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => counterObserver.observe(c));

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CARD MOUSE GLOW EFFECT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
document.querySelectorAll('.b-card, .step, .result-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
    card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
  });
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   AI AGENT CHATBOT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const agentToggle = document.getElementById('agent-toggle');
const chatPanel = document.getElementById('ai-chat-panel');
const chatClose = document.getElementById('chat-close');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');

agentToggle.addEventListener('click', () => {
  chatPanel.classList.toggle('open');
  if (chatPanel.classList.contains('open')) chatInput.focus();
});
chatClose.addEventListener('click', () => chatPanel.classList.remove('open'));

function addMessage(text, type) {
  const msg = document.createElement('div');
  msg.className = 'chat-msg ' + type;
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  const typing = document.createElement('div');
  typing.className = 'chat-typing';
  typing.id = 'typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
  const t = document.getElementById('typing-indicator');
  if (t) t.remove();
}

function getAIResponse(input) {
  const lower = input.toLowerCase();

  if (lower.match(/pric|cost|how much|afford|budget|rate/)) {
    return "Our AI systems are custom-built, so pricing varies by scope. A basic AI voice agent starts around $1,500, while full automation suites can range from $5K-$15K+. The best way to get an accurate quote is to book an AI audit \u2014 we'll scope your exact needs. Email tony@theaiguru.biz or call (856) 577-0236!";
  }
  if (lower.match(/voice|phone|call|recept|assistant|vapi/)) {
    return "Our AI Voice Agents are our flagship product! We build 24/7 AI receptionists powered by VAPI that answer calls, book appointments via Google Calendar, send SMS confirmations, and handle FAQs \u2014 all in your brand's voice. They're currently live in production for real businesses. Want to hear a demo?";
  }
  if (lower.match(/service|offer|do|build|what can/)) {
    return "We build: \u2022 AI Voice Assistants & Phone Agents (24/7) \u2022 AI Image & Portrait Pipelines \u2022 Custom Web Applications (React/TypeScript) \u2022 Business Process Automation \u2022 AI CRM & Desktop Tools \u2022 AI Marketing & Content Systems \u2022 Full AI Consulting & Roadmapping. Everything is custom-built from scratch!";
  }
  if (lower.match(/process|how.*work|step|start|begin/)) {
    return "Our process is simple: 1\uFE0F\u20E3 AI Audit \u2014 we analyze your business 2\uFE0F\u20E3 System Design \u2014 we architect the solution 3\uFE0F\u20E3 Build & Test \u2014 production-grade code, fast 4\uFE0F\u20E3 Deploy & Support \u2014 we go live with ongoing support. Most projects show progress in days, not months!";
  }
  if (lower.match(/tech|stack|tool|language|frame|python|react/)) {
    return "We work with 20+ technologies including: Gemini API, Grok API, VAPI Voice, ComfyUI, React/TypeScript, Python/Flask, Google Calendar API, FLUX/Stable Diffusion, PowerShell, Electron, Supabase, Stripe, InsightFace AI, RunPod GPU, Ollama/Gemma, and more. We pick the best tool for each job.";
  }
  if (lower.match(/contact|reach|email|phone|call.*you|touch/)) {
    return "You can reach us at: \ud83d\udce7 tony@theaiguru.biz \ud83d\udcde (856) 577-0236 \ud83c\udf10 theaiguru.biz \ud83d\udccd Mt. Holly, NJ. Book an AI audit and we'll show you exactly what AI can do for your business!";
  }
  if (lower.match(/who|about|tony|guru|team|company/)) {
    return "TheAIGuru.biz is the AI Division of Photo Illusions, based in Mt. Holly, NJ. Founded by Tony George \u2014 an AI Software App Programmer & AI Plumber Specialist who has built 55+ custom AI systems. We're not resellers \u2014 we build everything from scratch with real code.";
  }
  if (lower.match(/image|photo|portrait|face|comfy|flux/)) {
    return "Our AI Image Pipelines handle everything from batch portrait generation to face-swap systems and AI enhancement. We use ComfyUI, FLUX, Stable Diffusion, InsightFace ONNX, and Gemini's Image Model 3 Pro. Perfect for events, studios, e-commerce, and creative agencies.";
  }
  if (lower.match(/hello|hi|hey|sup|yo|greet/)) {
    return "Hey! \ud83d\udc4b Welcome to TheAIGuru.biz! I'm here to help you learn about our AI services. You can ask me about our services, pricing, tech stack, process, or anything else. What would you like to know?";
  }
  if (lower.match(/thank|thanks|thx|appreciate/)) {
    return "You're welcome! \ud83d\ude4f If you're ready to explore what AI can do for your business, book an audit at tony@theaiguru.biz or call (856) 577-0236. We'd love to chat!";
  }
  if (lower.match(/automat|workflow|pipeline|batch|script|powersh/)) {
    return "We build automation pipelines using Python, PowerShell, and custom API integrations. Whether it's batch processing, data flows, reporting, or eliminating manual tasks \u2014 we automate it. Our systems handle everything from file processing to complex multi-step business workflows.";
  }
  if (lower.match(/crm|desktop|app|electron|tkinter/)) {
    return "We build custom desktop applications including AI-powered CRMs with Gemini integration, Google Calendar sync, SQLite databases, and unified client management. Built with CustomTkinter (Python) or Electron \u2014 whatever fits your workflow best.";
  }

  return "Great question! I'd love to give you a detailed answer. For the most accurate info tailored to your business, I'd recommend booking an AI audit with Tony. Email tony@theaiguru.biz or call (856) 577-0236 \u2014 no pressure, just real insights into what AI can do for you.";
}

function handleSend() {
  const text = chatInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  chatInput.value = '';
  showTyping();
  const delay = 800 + Math.random() * 1200;
  setTimeout(() => {
    hideTyping();
    addMessage(getAIResponse(text), 'bot');
  }, delay);
}

chatSend.addEventListener('click', handleSend);
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSend();
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SMOOTH SCROLL FOR NAV LINKS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TECH STACK ANIMATION
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
gsap.to('.stack-logos', {
  scrollTrigger: {
    trigger: '.stack',
    start: 'top 80%',
    toggleActions: 'play none none none'
  },
  opacity: 1,
  y: 0,
  duration: 1,
  ease: 'power2.out'
});

/* ═══════════════════════════════════
   LIGHT STREAKS CANVAS (SHOOTING STARS)
═══════════════════════════════════ */
(function initStreaks() {
  const sc = document.getElementById('streaks-canvas');
  const sCtx = sc.getContext('2d');
  let sW, sH;
  const streaks = [];

  function resizeStreaks() {
    sW = sc.width = window.innerWidth;
    sH = sc.height = window.innerHeight;
  }
  resizeStreaks();
  window.addEventListener('resize', resizeStreaks);

  function spawnStreak() {
    const isGold = Math.random() < 0.15;
    const isPurple = !isGold && Math.random() < 0.2;
    streaks.push({
      x: Math.random() * sW * 1.5 - sW * 0.25,
      y: -10,
      speed: 4 + Math.random() * 8,
      length: 60 + Math.random() * 120,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
      alpha: 0.3 + Math.random() * 0.4,
      color: isGold ? '240,180,41' : isPurple ? '139,92,246' : '0,212,255',
      width: 0.5 + Math.random() * 1.5,
      life: 1
    });
  }

  function drawStreaks() {
    sCtx.clearRect(0, 0, sW, sH);
    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i];
      const dx = Math.cos(s.angle) * s.length;
      const dy = Math.sin(s.angle) * s.length;
      const grad = sCtx.createLinearGradient(s.x, s.y, s.x - dx, s.y - dy);
      grad.addColorStop(0, `rgba(${s.color},${s.alpha * s.life})`);
      grad.addColorStop(1, `rgba(${s.color},0)`);
      sCtx.strokeStyle = grad;
      sCtx.lineWidth = s.width;
      sCtx.beginPath();
      sCtx.moveTo(s.x, s.y);
      sCtx.lineTo(s.x - dx, s.y - dy);
      sCtx.stroke();

      // bright head
      sCtx.beginPath();
      sCtx.arc(s.x, s.y, s.width, 0, Math.PI * 2);
      sCtx.fillStyle = `rgba(255,255,255,${0.6 * s.life})`;
      sCtx.fill();

      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.life -= 0.003;
      if (s.y > sH + 50 || s.x > sW + 50 || s.life <= 0) streaks.splice(i, 1);
    }
    if (Math.random() < 0.03) spawnStreak();
    requestAnimationFrame(drawStreaks);
  }
  drawStreaks();
})();

/* ═══════════════════════════════════
   DATA RAIN CANVAS (MATRIX-STYLE)
═══════════════════════════════════ */
(function initDataRain() {
  const dc = document.getElementById('datarain-canvas');
  const dCtx = dc.getContext('2d');
  let dW, dH, columns, drops;
  const chars = '01アイウエオカキクケコ∑∏∫√∞≈';

  function resizeRain() {
    dW = dc.width = window.innerWidth;
    dH = dc.height = window.innerHeight;
    columns = Math.floor(dW / 18);
    drops = new Array(columns).fill(0).map(() => Math.random() * -100);
  }
  resizeRain();
  window.addEventListener('resize', resizeRain);

  function drawRain() {
    dCtx.fillStyle = 'rgba(12,18,32,0.15)';
    dCtx.fillRect(0, 0, dW, dH);
    dCtx.font = '12px JetBrains Mono, monospace';
    for (let i = 0; i < columns; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      const x = i * 18;
      const y = drops[i] * 18;
      const brightness = Math.random();
      if (brightness > 0.95) {
        dCtx.fillStyle = 'rgba(245,197,66,0.5)';
      } else if (brightness > 0.85) {
        dCtx.fillStyle = 'rgba(123,30,46,0.4)';
      } else {
        dCtx.fillStyle = `rgba(192,28,74,${0.15 + Math.random() * 0.2})`;
      }
      dCtx.fillText(ch, x, y);
      if (y > dH && Math.random() > 0.98) drops[i] = 0;
      drops[i] += 0.4 + Math.random() * 0.3;
    }
  }
  setInterval(drawRain, 80);
})();

/* ═══════════════════════════════════
   3D CARD TILT ON HOVER
═══════════════════════════════════ */
document.querySelectorAll('.b-card, .step, .result-card').forEach(card => {
  card.classList.add('tilt-active');
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
    card.style.transition = 'transform 0.5s ease-out';
    setTimeout(() => card.style.transition = 'transform 0.1s ease-out', 500);
  });
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform 0.1s ease-out';
  });
});

/* ═══════════════════════════════════
   MOUSE TRAIL (NEON COMET TAIL)
═══════════════════════════════════ */
(function initMouseTrail() {
  const trailCount = 5;
  const trails = [];
  for (let i = 0; i < trailCount; i++) {
    trails.push(document.getElementById('mouse-trail-' + i));
  }
  const positions = new Array(trailCount).fill(null).map(() => ({x: 0, y: 0}));
  let mouseX = 0, mouseY = 0;
  let isMoving = false;
  let moveTimeout;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    isMoving = true;
    trails.forEach(t => t.style.opacity = '0.6');
    clearTimeout(moveTimeout);
    moveTimeout = setTimeout(() => {
      isMoving = false;
      trails.forEach(t => t.style.opacity = '0');
    }, 150);
  });

  function animateTrail() {
    positions[0].x += (mouseX - positions[0].x) * 0.3;
    positions[0].y += (mouseY - positions[0].y) * 0.3;
    for (let i = 1; i < trailCount; i++) {
      positions[i].x += (positions[i-1].x - positions[i].x) * 0.25;
      positions[i].y += (positions[i-1].y - positions[i].y) * 0.25;
    }
    for (let i = 0; i < trailCount; i++) {
      const t = trails[i];
      if (t) {
        t.style.left = positions[i].x - 3 + 'px';
        t.style.top = positions[i].y - 3 + 'px';
        t.style.opacity = isMoving ? (0.5 - i * 0.1) : '0';
        const scale = 1 - i * 0.15;
        t.style.transform = `scale(${scale})`;
        const hue = (i * 30);
        t.style.background = i === 0 ? '#c01c4a' : i < 3 ? '#7b1e2e' : '#f5c542';
      }
    }
    requestAnimationFrame(animateTrail);
  }
  if (window.matchMedia('(pointer: fine)').matches) animateTrail();
})();

/* ═══════════════════════════════════
   SPEED LINES ON FAST SCROLL
═══════════════════════════════════ */
(function initSpeedLines() {
  const container = document.getElementById('speed-lines');
  let lastScroll = window.scrollY;
  let scrollSpeed = 0;

  window.addEventListener('scroll', () => {
    scrollSpeed = Math.abs(window.scrollY - lastScroll);
    lastScroll = window.scrollY;
    if (scrollSpeed > 30) {
      container.classList.add('active');
      for (let i = 0; i < Math.min(scrollSpeed / 10, 8); i++) {
        const line = document.createElement('div');
        line.className = 'speed-line';
        line.style.left = Math.random() * 100 + '%';
        line.style.height = 40 + Math.random() * 100 + 'px';
        line.style.animationDuration = 0.3 + Math.random() * 0.3 + 's';
        const r = Math.random();
        if (r < 0.1) line.style.background = 'linear-gradient(to bottom, transparent, rgba(245,197,66,0.3), transparent)';
        else if (r < 0.25) line.style.background = 'linear-gradient(to bottom, transparent, rgba(123,30,46,0.3), transparent)';
        container.appendChild(line);
        setTimeout(() => line.remove(), 600);
      }
      setTimeout(() => container.classList.remove('active'), 300);
    }
  });
})();

/* ═══════════════════════════════════
   PARALLAX DEPTH ON SCROLL
═══════════════════════════════════ */
(function initParallax() {
  const parallaxElements = [
    { selector: '.hero-content', speed: 0.3 },
    { selector: '.section-header', speed: 0.15 },
    { selector: '.section-header-center', speed: 0.15 },
    { selector: '.floating-orb', speed: -0.2 },
  ];

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    parallaxElements.forEach(({ selector, speed }) => {
      document.querySelectorAll(selector).forEach(el => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (inView) {
          const offset = (rect.top - window.innerHeight / 2) * speed;
          el.style.transform = `translateY(${offset}px)`;
        }
      });
    });
  });
})();

/* ═══════════════════════════════════
   ENHANCED PARTICLE MOUSE INTERACTION
═══════════════════════════════════ */
(function upgradeParticles() {
  let particleMouseX = -9999, particleMouseY = -9999;
  document.addEventListener('mousemove', e => {
    particleMouseX = e.clientX;
    particleMouseY = e.clientY;
  });

  const origDraw = drawParticles;
  function enhancedDraw() {
    pCtx.clearRect(0, 0, pW, pH);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // Mouse attraction
      const dx = particleMouseX - p.x;
      const dy = particleMouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200 && dist > 5) {
        const force = (200 - dist) / 200 * 0.08;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
      // Damping
      p.vx *= 0.98;
      p.vy *= 0.98;
      // Speed limit
      const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (spd > 2) { p.vx *= 2/spd; p.vy *= 2/spd; }

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const cdx = p.x - q.x, cdy = p.y - q.y;
        const d = Math.sqrt(cdx*cdx + cdy*cdy);
        if (d < 150) {
          const alpha = (1 - d/150) * 0.15;
          pCtx.strokeStyle = p.gold || q.gold
            ? `rgba(245,197,66,${alpha})`
            : `rgba(192,28,74,${alpha})`;
          pCtx.lineWidth = 0.5;
          pCtx.beginPath();
          pCtx.moveTo(p.x, p.y);
          pCtx.lineTo(q.x, q.y);
          pCtx.stroke();
        }
      }

      // Draw particle with glow when near mouse
      const glowSize = dist < 200 ? p.r * (1 + (200 - dist) / 200 * 2) : p.r;
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, glowSize, 0, Math.PI*2);
      if (dist < 200) {
        const glowAlpha = (200 - dist) / 200 * 0.6;
        pCtx.fillStyle = p.gold ? `rgba(245,197,66,${0.5 + glowAlpha})` : `rgba(192,28,74,${0.35 + glowAlpha})`;
        pCtx.shadowBlur = 15;
        pCtx.shadowColor = p.gold ? '#f5c542' : '#c01c4a';
      } else {
        pCtx.fillStyle = p.gold ? 'rgba(245,197,66,0.5)' : 'rgba(192,28,74,0.35)';
        pCtx.shadowBlur = 0;
      }
      pCtx.fill();
      pCtx.shadowBlur = 0;

      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > pW) p.vx *= -1;
      if (p.y < 0 || p.y > pH) p.vy *= -1;
    }
    requestAnimationFrame(enhancedDraw);
  }
  // Replace the original particle draw with the enhanced version
  // We need to increase particle count too
  initParticles(80);
  enhancedDraw();
})();

/* ═══════════════════════════════════
   HERO 3D ENHANCEMENT - MORE OBJECTS
═══════════════════════════════════ */
(function enhance3DHero() {
  const container = document.getElementById('hero-3d');
  if (!container || !container.children[0]) return;

  // Add floating text geometry labels using CSS overlays
  const floatLabel = document.createElement('div');
  floatLabel.style.cssText = `
    position: absolute; top: 15%; left: 8%;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem; color: rgba(192,28,74,0.15);
    letter-spacing: 0.2em; text-transform: uppercase;
    pointer-events: none; z-index: 1;
    animation: orbFloat 15s ease-in-out infinite;
  `;
  floatLabel.textContent = '// neural_network.init()';
  container.appendChild(floatLabel);

  const floatLabel2 = document.createElement('div');
  floatLabel2.style.cssText = `
    position: absolute; bottom: 20%; right: 10%;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem; color: rgba(123,30,46,0.12);
    letter-spacing: 0.2em; text-transform: uppercase;
    pointer-events: none; z-index: 1;
    animation: orbFloat 18s ease-in-out infinite reverse;
  `;
  floatLabel2.textContent = 'AI_CORE :: ACTIVE';
  container.appendChild(floatLabel2);

  const floatLabel3 = document.createElement('div');
  floatLabel3.style.cssText = `
    position: absolute; top: 30%; right: 15%;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem; color: rgba(245,197,66,0.1);
    letter-spacing: 0.15em;
    pointer-events: none; z-index: 1;
    animation: orbFloat 22s ease-in-out infinite;
  `;
  floatLabel3.textContent = '{ status: "deployed" }';
  container.appendChild(floatLabel3);
})();

/* ═══════════════════════════════════
   ELECTRIC RIPPLE ON CLICK
═══════════════════════════════════ */
document.addEventListener('click', e => {
  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: fixed;
    left: ${e.clientX}px; top: ${e.clientY}px;
    width: 4px; height: 4px;
    border: 1px solid rgba(192,28,74,0.6);
    border-radius: 50%;
    pointer-events: none;
    z-index: 10000;
    transform: translate(-50%, -50%);
    animation: clickRipple 0.8s ease-out forwards;
  `;
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 800);
});

// Inject the click ripple keyframe
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes clickRipple {
    0% { width: 4px; height: 4px; opacity: 0.8; border-width: 2px; }
    100% { width: 150px; height: 150px; opacity: 0; border-width: 0.5px; }
  }
`;
document.head.appendChild(rippleStyle);

/* ═══════════════════════════════════
   SECTION HEADER GLOW ON SCROLL-IN
═══════════════════════════════════ */
gsap.utils.toArray('.section-title').forEach(title => {
  gsap.fromTo(title, 
    { textShadow: '0 0 0px transparent' },
    {
      scrollTrigger: {
        trigger: title,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      textShadow: '0 0 30px rgba(192,28,74,0.2), 0 0 60px rgba(192,28,74,0.1)',
      duration: 1.5,
      ease: 'power2.out'
    }
  );
});

/* ═══════════════════════════════════
   TYPEWRITER EFFECT ON HERO EYEBROW
═══════════════════════════════════ */
(function initTypewriter() {
  const eyebrow = document.querySelector('.hero-eyebrow');
  if (!eyebrow) return;
  const texts = [
    'AI Business Automation \u00B7 Mt. Holly, NJ',
    '55+ Custom AI Systems Deployed',
    '24/7 AI Voice Agents \u00B7 Live Now',
    'Built From Scratch \u00B7 Real Code'
  ];
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const dot = eyebrow.querySelector('.eyebrow-dot');

  function type() {
    const current = texts[textIndex];
    if (isDeleting) {
      charIndex--;
      eyebrow.textContent = current.substring(0, charIndex);
    } else {
      charIndex++;
      eyebrow.textContent = current.substring(0, charIndex);
    }
    if (dot) eyebrow.prepend(dot);

    if (!isDeleting && charIndex === current.length) {
      setTimeout(() => { isDeleting = true; type(); }, 3000);
      return;
    }
    if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      setTimeout(type, 500);
      return;
    }
    setTimeout(type, isDeleting ? 30 : 60);
  }
  // Start after preloader
  setTimeout(type, 3000);
})();

/* ═══════════════════════════════════
   AUDIO ENGINE — SOUND FX ONLY
═══════════════════════════════════ */
(function initAudioEngine() {
  let audioCtx = null;
  let masterGain = null;
  let sfxGain = null;
  let userInteracted = false;

  function getCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(audioCtx.destination);
      sfxGain = audioCtx.createGain();
      sfxGain.gain.value = 0.5;
      sfxGain.connect(masterGain);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  /* ──── SFX helpers ──── */
  function playTone(freq, dur, type, vol, detune) {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    g.gain.setValueAtTime(vol || 0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  }

  function playNoise(dur, vol) {
    const ctx = getCtx();
    const bufSize = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 3000;
    g.gain.setValueAtTime(vol || 0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(sfxGain);
    src.start(ctx.currentTime);
  }

  /* ──── Named SFX ──── */
  function sfxHover() {
    playTone(1200, 0.08, 'sine', 0.06);
    playTone(1800, 0.06, 'sine', 0.03);
  }

  function sfxClick() {
    playTone(800, 0.1, 'triangle', 0.1);
    playTone(1600, 0.08, 'sine', 0.06);
    playNoise(0.04, 0.04);
  }

  function sfxWhoosh() {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(2000, ctx.currentTime);
    filt.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
    g.gain.setValueAtTime(0.04, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(filt);
    filt.connect(g);
    g.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  }

  function sfxSectionEnter() {
    const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
    notes.forEach((n, i) => {
      setTimeout(() => playTone(n, 0.4, 'sine', 0.05), i * 60);
    });
  }

  function sfxChime() {
    playTone(1046.5, 0.6, 'sine', 0.05);
    playTone(1318.5, 0.5, 'sine', 0.03);
    playTone(1568, 0.4, 'sine', 0.02);
  }

  /* ──── Attach SFX to DOM ──── */
  function attachSFX() {
    // Hover sounds on interactive cards & buttons
    document.querySelectorAll('.b-card, .step, .result-card, .btn-primary, .btn-outline, .nav-link').forEach(el => {
      el.addEventListener('mouseenter', sfxHover, { passive: true });
    });

    // Click sounds
    document.querySelectorAll('a, button, .btn-primary, .btn-outline').forEach(el => {
      el.addEventListener('click', sfxClick, { passive: true });
    });

    // Section enter chimes via ScrollTrigger
    gsap.utils.toArray('section, .hero, .services, .process, .results, .cta-section').forEach(sec => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 70%',
        onEnter: () => sfxSectionEnter(),
        once: true
      });
    });

    // Scroll whoosh (throttled)
    let lastWhoosh = 0;
    window.addEventListener('scroll', () => {
      const now = Date.now();
      const speed = Math.abs(window.scrollY - (window._lastScrollY || 0));
      window._lastScrollY = window.scrollY;
      if (speed > 60 && now - lastWhoosh > 800) {
        lastWhoosh = now;
        sfxWhoosh();
      }
    }, { passive: true });
  }

  /* ── Audio control UI ── */
  function createAudioControls() {
    const panel = document.createElement('div');
    panel.id = 'audio-controls';
    panel.innerHTML = `
      <button id="audio-toggle" title="Toggle Sound">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
      </button>
      <div id="audio-panel" class="audio-panel-hidden">
        <label>SFX <input type="range" id="sfx-vol" min="0" max="100" value="50"></label>
      </div>
    `;
    document.body.appendChild(panel);

    const style = document.createElement('style');
    style.textContent = `
      #audio-controls {
        position: fixed; bottom: 24px; right: 90px;
        z-index: 9998; display: flex; flex-direction: column;
        align-items: flex-end; gap: 8px;
      }
      #audio-toggle {
        width: 44px; height: 44px; border-radius: 50%;
        border: 1px solid rgba(245,197,66,0.3);
        background: rgba(12,18,32,0.9);
        backdrop-filter: blur(12px);
        color: var(--gold); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.3s; box-shadow: 0 0 20px rgba(245,197,66,0.15);
      }
      #audio-toggle:hover {
        border-color: var(--gold);
        box-shadow: 0 0 30px rgba(245,197,66,0.3);
        transform: scale(1.1);
      }
      #audio-toggle.muted { color: var(--text-muted); border-color: var(--border); box-shadow: none; }
      #audio-toggle.muted svg { opacity: 0.4; }
      .audio-panel-hidden { display: none !important; }
      #audio-panel {
        background: rgba(12,18,32,0.95);
        border: 1px solid rgba(245,197,66,0.2);
        border-radius: 12px; padding: 12px 16px;
        backdrop-filter: blur(12px);
        display: flex; flex-direction: column; gap: 8px;
        min-width: 160px;
      }
      #audio-panel label {
        font-family: var(--font-mono);
        font-size: 0.65rem; color: var(--text-mid);
        display: flex; align-items: center; gap: 8px;
        letter-spacing: 0.05em; text-transform: uppercase;
      }
      #audio-panel input[type=range] {
        flex: 1; height: 3px; -webkit-appearance: none;
        background: rgba(255,255,255,0.1); border-radius: 2px;
        outline: none;
      }
      #audio-panel input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none; width: 12px; height: 12px;
        border-radius: 50%; background: var(--gold);
        cursor: pointer; box-shadow: 0 0 8px rgba(245,197,66,0.4);
      }
    `;
    document.head.appendChild(style);

    let isMuted = false;
    const toggle = document.getElementById('audio-toggle');
    const audioPanel = document.getElementById('audio-panel');

    toggle.addEventListener('click', () => {
      if (!userInteracted) {
        userInteracted = true;
        getCtx();
        attachSFX();
      }
      isMuted = !isMuted;
      toggle.classList.toggle('muted', isMuted);
      if (masterGain) {
        masterGain.gain.linearRampToValueAtTime(isMuted ? 0 : 0.6, audioCtx.currentTime + 0.3);
      }
    });

    toggle.addEventListener('mouseenter', () => {
      audioPanel.classList.remove('audio-panel-hidden');
    });
    panel.addEventListener('mouseleave', () => {
      audioPanel.classList.add('audio-panel-hidden');
    });

    document.getElementById('sfx-vol').addEventListener('input', e => {
      if (sfxGain) sfxGain.gain.linearRampToValueAtTime(e.target.value / 100 * 0.7, audioCtx.currentTime + 0.1);
    });
  }

  /* ── Auto-start on first interaction ── */
  function onFirstInteraction() {
    if (userInteracted) return;
    userInteracted = true;
    getCtx();
    attachSFX();
    document.removeEventListener('click', onFirstInteraction);
    document.removeEventListener('scroll', onFirstInteraction);
    document.removeEventListener('keydown', onFirstInteraction);
    document.removeEventListener('mousemove', onFirstInteraction);
    document.removeEventListener('touchstart', onFirstInteraction);
  }

  // Wait for DOM then set up
  createAudioControls();

  // SFX engine activates on first user interaction (browsers require gesture)
  document.addEventListener('click', onFirstInteraction, { passive: true });
  document.addEventListener('scroll', onFirstInteraction, { passive: true });
  document.addEventListener('keydown', onFirstInteraction, { passive: true });
  document.addEventListener('mousemove', onFirstInteraction, { passive: true });
  document.addEventListener('touchstart', onFirstInteraction, { passive: true });
})();

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
