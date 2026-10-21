(() => {
  'use strict';

  const MAX_BUTTERFLIES = 10;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => reducedQuery.matches;

  function scrollToEl(el) {
    el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  }

  const els = {
    envelope: $('#envelope'),
    openBtn: $('#openBtn'),
    revealStage: $('#revealStage'),
    letterScene: $('#letterScene'),
    letterBtns: $('#letterBtns'),
    letterHeading: $('#letterHeading'),
    letterCard: $('#letterCard'),
    letterBody: $('#letterBody'),
    skipBtn: $('#skipBtn'),
    replayBtn: $('#replayBtn'),
    closeEnvBtn: $('#closeEnvBtn'),
    envelopeSection: $('#envelopeSection'),
    scene: $('#letterScene'),
    photosLeft: $('#photosLeft'),
    photosRight: $('#photosRight')
  };

  const CONFIG = {
    recipient: 'Hanna',

    intro: 'Open the envelope below — there is something inside just for you.',

    letter: `happy birthday!! 🥳💗

i hope you know how much you deserve to be happy and how many good things i genuinely wish for you. i'm really glad i got to know someone like you, and honestly, you're one of those people i'll always admire in my own little way. there's something about you that made you stand out to me, and i think that's something i'll always appreciate.

i hope this new chapter of your life brings you more reasons to smile, more opportunities to grow, and the kind of happiness that stays. keep being the person you are, and never forget that you have so many good things ahead of you.

enjoy your day, okay? you deserve all the love and happiness today has to offer. take care always, and once again, happy birthday!! 🤍🎂`,

    photos: [
      'assets/photos/Photo-1.webp',
      'assets/photos/Photo-2.webp',
      'assets/photos/Photo-3.webp',
      'assets/photos/Photo-4.webp',
      'assets/photos/Photo-5.webp',
      'assets/photos/Photo-6.webp'
    ],

    music: 'assets/music/birthday-music.mp3'
  };

  const state = CONFIG;

  function letterText() {
    return String(state.letter || '').replace(/\{name\}/g, state.recipient || '');
  }

  function renderBoundText() {
    $$('[data-bind]').forEach((el) => {
      el.textContent = state[el.dataset.bind] || '';
    });
  }

  function showFullLetter() {
    stopTyping();
    els.letterBody.textContent = letterText();
  }

  let typingToken = 0;
  let typingTimer = null;

  function setTyping(on) {
    els.skipBtn.disabled = !on;
    if (on) els.letterCard.setAttribute('aria-busy', 'true');
    else els.letterCard.removeAttribute('aria-busy');
  }

  function stopTyping() {
    typingToken += 1;
    clearTimeout(typingTimer);
    typingTimer = null;
    els.letterBody.classList.remove('typing-caret');
    setTyping(false);
  }

  function startTyping() {
    stopTyping();
    if (reduced()) { showFullLetter(); return; }

    const token = ++typingToken;
    const chars = Array.from(letterText());
    let i = 0;
    els.letterBody.textContent = '';
    setTyping(true);

    const tick = () => {
      if (token !== typingToken) return;
      if (i >= chars.length) { setTyping(false); return; }

      els.letterBody.classList.add('typing-caret');
      const ch = chars[i++];
      els.letterBody.textContent += ch;

      let delay = 26;
      if ('.!?'.includes(ch)) delay = 240;
      else if (',;:'.includes(ch)) delay = 110;
      else if (ch === '\n') delay = 160;
      typingTimer = setTimeout(tick, delay);
    };
    tick();
  }

  els.skipBtn.addEventListener('click', showFullLetter);
  els.replayBtn.addEventListener('click', startTyping);

  let revealTimer = null;
  let typingDelayTimer = null;
  let giveTimer = null;
  let revealAnims = [];

  function isEnvelopeOpen() {
    return els.envelope.classList.contains('open');
  }

  function syncEnvelopeLabels() {
    const open = isEnvelopeOpen();
    els.envelope.setAttribute('aria-expanded', String(open));
    els.envelope.setAttribute('aria-label',
      open ? 'Envelope, open. Activate to close it.' : 'Envelope. Activate to open your letter.');
    els.openBtn.textContent = open ? 'Close Envelope' : 'Open Your Letter';
  }

  function cancelRevealAnims() {
    revealAnims.forEach((a) => { try { a.cancel(); } catch (err) {  } });
    revealAnims = [];
  }

  function animateReveal() {
    cancelRevealAnims();
    if (reduced() || typeof els.letterCard.animate !== 'function') return;

    const envRect = els.envelope.getBoundingClientRect();
    const origin = { x: envRect.left + envRect.width / 2, y: envRect.top + envRect.height / 2 };

    const cr = els.letterCard.getBoundingClientRect();
    const cdx = origin.x - (cr.left + cr.width / 2);
    const cdy = origin.y - (cr.top + cr.height / 2);
    revealAnims.push(els.letterCard.animate([
      { transform: `translate(${cdx}px, ${cdy}px) scale(0.22)`, opacity: 0 },
      { transform: `translate(${cdx * 0.28}px, ${cdy * 0.28}px) scale(1.02)`, opacity: 1, offset: 0.68 },
      { transform: 'none', opacity: 1 }
    ], { duration: 900, easing: 'cubic-bezier(0.22, 0.9, 0.3, 1.05)', fill: 'both' }));

    $$('.polaroid', els.letterScene).forEach((fig, i) => {
      const r = fig.getBoundingClientRect();
      const dx = origin.x - (r.left + r.width / 2);
      const dy = origin.y - (r.top + r.height / 2);
      const rot = fig.style.getPropertyValue('--rot') || '0deg';
      revealAnims.push(fig.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(0.08) rotate(0deg)`, opacity: 0 },
        { transform: `translate(${dx * 0.32}px, ${dy * 0.32}px) scale(1.08) rotate(${rot})`, opacity: 1, offset: 0.55 },
        { transform: `rotate(${rot})`, opacity: 1 }
      ], { duration: 800, delay: 170 + i * 110, easing: 'cubic-bezier(0.22, 0.9, 0.3, 1.15)', fill: 'both' }));
    });
  }

  function openEnvelope() {
    if (isEnvelopeOpen()) return;
    els.envelope.classList.add('open');
    syncEnvelopeLabels();
    clearTimeout(revealTimer);
    revealTimer = setTimeout(() => {
      els.letterScene.hidden = false;
      els.letterBtns.hidden = false;
      clearTimeout(giveTimer);
      els.envelope.classList.add('give');
      giveTimer = setTimeout(() => els.envelope.classList.remove('give'), 800);
      els.revealStage.scrollIntoView({ behavior: 'auto', block: 'start' });
      animateReveal();
      els.letterHeading.focus({ preventScroll: true });
      clearTimeout(typingDelayTimer);
      typingDelayTimer = setTimeout(startTyping, reduced() ? 0 : 650);
    }, reduced() ? 0 : 950);
  }

  function closeEnvelope() {
    clearTimeout(revealTimer);
    clearTimeout(typingDelayTimer);
    clearTimeout(giveTimer);
    els.envelope.classList.remove('give');
    stopTyping();
    cancelRevealAnims();
    els.letterScene.hidden = true;
    els.letterBtns.hidden = true;
    els.envelope.classList.remove('open');
    syncEnvelopeLabels();
    scrollToEl(els.envelopeSection);
  }

  function toggleEnvelope() {
    if (isEnvelopeOpen()) closeEnvelope(); else openEnvelope();
  }

  els.envelope.addEventListener('click', toggleEnvelope);
  els.openBtn.addEventListener('click', toggleEnvelope);
  els.closeEnvBtn.addEventListener('click', closeEnvelope);

  const floaterLayer = $('#floaters');
  let floaterInterval = null;

  function maxFloaters() { return window.innerWidth < 600 ? 7 : 12; }

  function spawnFloater() {
    if (reduced() || document.hidden) return;
    if (floaterLayer.children.length >= maxFloaters()) return;

    const el = document.createElement('span');
    el.className = 'floater';
    const isHeart = Math.random() < 0.55;
    if (isHeart) {
      el.textContent = '♥';
      el.style.setProperty('--size', rand(14, 28).toFixed(0) + 'px');
    } else {
      el.classList.add('petal');
      el.style.setProperty('--size', rand(10, 18).toFixed(0) + 'px');
    }
    el.style.setProperty('--left', rand(2, 96).toFixed(1) + '%');
    el.style.setProperty('--dur', rand(11, 20).toFixed(1) + 's');
    el.style.setProperty('--drift', rand(-90, 90).toFixed(0) + 'px');
    el.style.setProperty('--spin', rand(-160, 160).toFixed(0) + 'deg');
    el.addEventListener('animationend', () => el.remove());
    floaterLayer.appendChild(el);
  }

  function startFloaters() {
    if (floaterInterval || reduced()) return;
    for (let i = 0; i < 4; i++) setTimeout(spawnFloater, i * 400);
    floaterInterval = setInterval(spawnFloater, 1800);
  }

  function stopFloaters() {
    clearInterval(floaterInterval);
    floaterInterval = null;
    floaterLayer.textContent = '';
  }

  function onReducedMotionChange() {
    if (reduced()) stopFloaters(); else startFloaters();
  }
  if (reducedQuery.addEventListener) reducedQuery.addEventListener('change', onReducedMotionChange);
  else if (reducedQuery.addListener) reducedQuery.addListener(onReducedMotionChange);

  const gardens = [$('#gardenLeft'), $('#gardenRight')];
  const butterflyLayer = $('#butterflyLayer');

  const FLOWERS = [
    { name: 'Lavender',   petal: '#d9c2fa', edge: '#a98ae6', center: '#ffe9a8', w: 92,  delay: '0s' },
    { name: 'Pink',       petal: '#fbc3dc', edge: '#e8739f', center: '#fff2c9', w: 78,  delay: '-1.2s' },
    { name: 'White',      petal: '#ffffff', edge: '#cdb4f6', center: '#ffd98a', w: 104, delay: '-2.1s' },
    { name: 'Purple',     petal: '#b794f0', edge: '#7248c4', center: '#fff0b8', w: 84,  delay: '-0.6s' },
    { name: 'Light pink', petal: '#fde0ee', edge: '#f09bc0', center: '#ffe08a', w: 98,  delay: '-3s' },
    { name: 'Lilac',      petal: '#e6d6fc', edge: '#9a74dd', center: '#ffeaa0', w: 76,  delay: '-1.7s' },
    { name: 'Blush',      petal: '#f9b5d3', edge: '#d9608f', center: '#fff4d1', w: 88,  delay: '-2.6s' }
  ];

  function flowerSVG(f) {
    const petals = Array.from({ length: 6 }, (_, i) =>
      `<ellipse cx="50" cy="33" rx="12" ry="21" transform="rotate(${i * 60} 50 55)" fill="${f.petal}" stroke="${f.edge}" stroke-width="1.4"/>`
    ).join('');
    return `<svg viewBox="0 0 100 170" aria-hidden="true" focusable="false">
      <path d="M50 66 C46 100 54 130 50 170" stroke="#8fc9a8" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="34" cy="125" rx="16" ry="7" transform="rotate(-30 34 125)" fill="#a9dcbf"/>
      <ellipse cx="67" cy="108" rx="16" ry="7" transform="rotate(30 67 108)" fill="#a9dcbf"/>
      <g class="flower-head">${petals}<circle cx="50" cy="55" r="10" fill="${f.center}"/></g>
    </svg>`;
  }

  function buildGarden() {
    FLOWERS.forEach((f, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'flower';
      btn.style.setProperty('--w', f.w + 'px');
      btn.style.setProperty('--delay', f.delay);
      btn.setAttribute('aria-label', `${f.name} flower. Activate to release a butterfly.`);
      btn.innerHTML = flowerSVG(f);
      gardens[i % 2].appendChild(btn);
    });
  }

  gardens.forEach((bed) => {
    bed.addEventListener('click', (event) => {
      const flower = event.target.closest('.flower');
      if (flower) releaseButterflies(flower);
    });
    bed.addEventListener('animationend', (event) => {
      if (event.animationName === 'bloom') {
        const flower = event.target.closest('.flower');
        if (flower) flower.classList.remove('bloom');
      }
    });
  });

  const BUTTERFLY_COLORS = [
    ['#d9c2fa', '#7248c4'],
    ['#fbc3dc', '#c9457f'],
    ['#e6d6fc', '#8b5fd6'],
    ['#f6b8e6', '#9b4fb8'],
    ['#c9b6ff', '#5b36a6']
  ];

  const BUTTERFLY_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <g class="wing">
      <path d="M20 20 C10 4 0 8 3 18 C5 26 14 26 20 22Z"/>
      <path class="wing-lower" d="M20 22 C12 24 6 34 12 36 C17 38 20 30 20 24Z"/>
    </g>
    <g class="wing">
      <path d="M20 20 C30 4 40 8 37 18 C35 26 26 26 20 22Z"/>
      <path class="wing-lower" d="M20 22 C28 24 34 34 28 36 C23 38 20 30 20 24Z"/>
    </g>
    <ellipse cx="20" cy="22" rx="1.7" ry="8" fill="#3b2467"/>
    <path d="M20 14 Q18 8 15 7 M20 14 Q22 8 25 7" stroke="#3b2467" stroke-width="1" fill="none" stroke-linecap="round"/>
  </svg>`;

  const bezier = (a, b, c, d, t) => {
    const u = 1 - t;
    return {
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y
    };
  };
  const bezierDir = (a, b, c, d, t) => {
    const u = 1 - t;
    return {
      x: 3 * u * u * (b.x - a.x) + 6 * u * t * (c.x - b.x) + 3 * t * t * (d.x - c.x),
      y: 3 * u * u * (b.y - a.y) + 6 * u * t * (c.y - b.y) + 3 * t * t * (d.y - c.y)
    };
  };

  function releaseButterflies(flowerBtn) {
    flowerBtn.classList.remove('bloom');
    void flowerBtn.offsetWidth;
    flowerBtn.classList.add('bloom');

    const rect = flowerBtn.getBoundingClientRect();
    const start = { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.32 };

    const room = MAX_BUTTERFLIES - butterflyLayer.querySelectorAll('.butterfly').length;
    if (room <= 0) return;
    const count = Math.min(room, Math.random() < 0.5 ? 1 : 2);
    for (let i = 0; i < count; i++) spawnButterfly(start, i * 220);
    if (!reduced()) spawnPetals(start);
  }

  function spawnButterfly(start, delay) {
    const el = document.createElement('div');
    el.className = 'butterfly';
    const [wing, edge] = pick(BUTTERFLY_COLORS);
    el.style.setProperty('--wing', wing);
    el.style.setProperty('--wing2', edge);
    el.style.setProperty('--flap', rand(0.16, 0.26).toFixed(2) + 's');
    el.innerHTML = BUTTERFLY_SVG;
    butterflyLayer.appendChild(el);

    const half = 19;
    const remove = () => el.remove();

    if (typeof el.animate !== 'function') {
      el.style.opacity = '1';
      el.style.transform = `translate(${start.x - half}px, ${start.y - half}px)`;
      setTimeout(remove, 1500);
      return;
    }

    if (reduced()) {
      el.classList.add('calm');
      el.style.transform = `translate(${start.x - half}px, ${start.y - half - 20}px)`;
      const fade = el.animate(
        [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }],
        { duration: 1600, delay, fill: 'both' }
      );
      fade.onfinish = remove;
      fade.oncancel = remove;
      return;
    }

    const width = window.innerWidth;
    const span = Math.min(width * 0.45, 380);
    const end = { x: clamp(start.x + rand(-span, span), 20, width - 20), y: start.y - rand(260, 520) };
    const c1 = { x: start.x + rand(-160, 160), y: start.y - rand(60, 160) };
    const c2 = { x: end.x + rand(-200, 200), y: end.y + rand(80, 200) };

    const steps = 28;
    const frames = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const p = bezier(start, c1, c2, end, t);
      const d = bezierDir(start, c1, c2, end, t);
      const angle = (Math.atan2(d.x, -d.y) * 180) / Math.PI;
      frames.push({
        transform: `translate(${p.x - half}px, ${p.y - half}px) rotate(${angle.toFixed(1)}deg) scale(${(0.7 + 0.5 * t).toFixed(2)})`,
        opacity: t < 0.08 ? t / 0.08 : t > 0.75 ? (1 - t) / 0.25 : 1,
        offset: t
      });
    }
    const duration = rand(4200, 6200);
    const flight = el.animate(frames, { duration, delay, easing: 'linear', fill: 'both' });
    flight.onfinish = remove;
    flight.oncancel = remove;
    setTimeout(remove, duration + delay + 800);
  }

  function spawnPetals(start) {
    if (typeof document.body.animate !== 'function') return;
    for (let i = 0; i < 4; i++) {
      const petal = document.createElement('span');
      petal.className = 'drop-petal';
      butterflyLayer.appendChild(petal);
      const dx = rand(-50, 50);
      const dy = rand(60, 120);
      const a = petal.animate([
        { transform: `translate(${start.x}px, ${start.y}px) rotate(0deg)`, opacity: 0 },
        { transform: `translate(${start.x + dx * 0.4}px, ${start.y + dy * 0.3}px) rotate(120deg)`, opacity: 0.9, offset: 0.2 },
        { transform: `translate(${start.x + dx}px, ${start.y + dy}px) rotate(320deg)`, opacity: 0 }
      ], { duration: rand(1100, 1700), delay: i * 80, easing: 'ease-out', fill: 'both' });
      a.onfinish = () => petal.remove();
      a.oncancel = () => petal.remove();
    }
  }

  const POLAROID_ROTATIONS = ['-5deg', '4deg', '-3deg', '5deg', '-4deg', '3deg'];

  function buildPolaroids() {
    const list = Array.isArray(state.photos) ? state.photos.slice(0, 6) : [];
    if (!list.length) return;
    els.scene.classList.add('has-photos');

    const leftCount = Math.ceil(list.length / 2);
    list.forEach((photo, i) => {
      const src = typeof photo === 'string' ? photo : (photo && photo.src) || '';
      const alt = typeof photo === 'string' ? 'A favorite memory' : (photo && photo.alt) || 'A favorite memory';
      if (!src) return;

      const fig = document.createElement('figure');
      fig.className = 'polaroid';
      fig.style.setProperty('--rot', POLAROID_ROTATIONS[i % POLAROID_ROTATIONS.length]);
      fig.style.setProperty('--delay', (0.12 + i * 0.13).toFixed(2) + 's');

      const holder = document.createElement('span');
      holder.className = 'polaroid-photo';
      const img = document.createElement('img');
      img.alt = alt;
      img.addEventListener('error', () => {
        fig.classList.add('missing');
        img.remove();
      });
      img.src = src;
      holder.appendChild(img);
      fig.appendChild(holder);

      (i < leftCount ? els.photosLeft : els.photosRight).appendChild(fig);
    });
  }

  const audio = $('#bgMusic');
  const musicEls = {
    toggle: $('#musicToggle'),
    icon: $('#musicIcon'),
    mute: $('#muteToggle'),
    muteIcon: $('#muteIcon'),
    volume: $('#volume'),
    status: $('#musicStatus')
  };
  let musicFailed = false;

  const MUSIC_MISSING_MESSAGE = state.music
    ? `No music found at ${state.music}. Check the file name in CONFIG.music.`
    : 'No music is set. Add a file path in CONFIG.music.';

  function setMusicStatus(text) { musicEls.status.textContent = text; }

  function syncPlayButton() {
    const playing = !audio.paused && !audio.ended;
    musicEls.icon.textContent = playing ? '⏸' : '▶';
    musicEls.toggle.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
  }

  function syncMuteButton() {
    const muted = audio.muted || audio.volume === 0;
    musicEls.muteIcon.textContent = muted ? '🔇' : '🔊';
    musicEls.mute.setAttribute('aria-pressed', String(muted));
    musicEls.mute.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
  }

  async function toggleMusic() {
    if (!audio.paused) { audio.pause(); return; }
    try {
      if (musicFailed) { audio.load(); musicFailed = false; }
      setMusicStatus('Loading music…');
      await audio.play();
    } catch (err) {
      syncPlayButton();
      if (err && err.name === 'NotAllowedError') {
        setMusicStatus('Your browser blocked playback. Press play again.');
      } else if (err && err.name === 'AbortError') {
        setMusicStatus('Music was interrupted. Press play to try again.');
      } else {
        musicFailed = true;
        setMusicStatus(MUSIC_MISSING_MESSAGE);
      }
    }
  }

  audio.addEventListener('playing', () => { syncPlayButton(); setMusicStatus('Playing'); });
  audio.addEventListener('pause', () => { syncPlayButton(); if (!musicFailed) setMusicStatus('Paused'); });
  audio.addEventListener('waiting', () => setMusicStatus('Loading music…'));
  audio.addEventListener('error', () => {
    musicFailed = true;
    syncPlayButton();
    setMusicStatus(MUSIC_MISSING_MESSAGE);
  });
  audio.addEventListener('volumechange', () => {
    syncMuteButton();
    musicEls.volume.value = String(audio.volume);
  });

  musicEls.toggle.addEventListener('click', toggleMusic);
  musicEls.mute.addEventListener('click', () => {
    if (audio.volume === 0) audio.volume = 0.6;
    audio.muted = !audio.muted;
  });
  musicEls.volume.addEventListener('input', () => {
    audio.volume = Number(musicEls.volume.value);
    if (audio.volume > 0) audio.muted = false;
  });

  function init() {
    buildGarden();
    buildPolaroids();
    renderBoundText();
    showFullLetter();
    syncEnvelopeLabels();
    if (state.music) audio.src = state.music;
    syncPlayButton();
    syncMuteButton();
    audio.volume = Number(musicEls.volume.value);
    startFloaters();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { clearInterval(floaterInterval); floaterInterval = null; }
      else startFloaters();
    });
  }

  init();
})();
