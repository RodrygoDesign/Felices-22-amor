const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const intro = document.querySelector("#intro");
const header = document.querySelector("#siteHeader");
const openButton = document.querySelector("#openVideo");
const modal = document.querySelector("#videoModal");
const video = document.querySelector("#birthdayVideo");
const videoShell = document.querySelector("#videoShell");
const placeholder = document.querySelector("#videoPlaceholder");
const musicPlayer = document.querySelector("#musicPlayer");
const music = document.querySelector("#backgroundMusic");
const musicToggle = document.querySelector("#musicToggle");
const musicVolume = document.querySelector("#musicVolume");
const relationshipReel = document.querySelector("#relationshipReel");
const confettiCanvas = document.querySelector("#confetti");
const confettiContext = confettiCanvas.getContext("2d");

let lastFocusedElement = null;
let confettiPieces = [];
let confettiFrame = null;
let introFinished = false;
let resumeMusicAfterVideo = false;
let resumeMusicAfterReel = false;
let musicUnlockArmed = false;
let effectsAudioContext = null;
let effectsMaster = null;
let effectsNoiseBuffer = null;

function ensureEffectsAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!effectsAudioContext) {
    effectsAudioContext = new AudioContextClass();
    effectsMaster = effectsAudioContext.createGain();
    effectsMaster.gain.value = 0.24;
    effectsMaster.connect(effectsAudioContext.destination);
  }

  if (effectsAudioContext.state === "suspended") effectsAudioContext.resume().catch(() => {});
  return effectsAudioContext;
}

function playEffectTone({
  frequency = 440,
  endFrequency = frequency,
  duration = 0.1,
  gain = 0.05,
  type = "sine",
} = {}) {
  const context = ensureEffectsAudio();
  if (!context || modal.classList.contains("is-open")) return;

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(frequency, 1), now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 1), now + duration);
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(gain, now + Math.min(0.012, duration * 0.25));
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(envelope);
  envelope.connect(effectsMaster);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.015);
}

function playInterfaceClick() {
  playEffectTone({ frequency: 460, endFrequency: 690, duration: 0.075, gain: 0.055, type: "sine" });
  window.setTimeout(() => {
    playEffectTone({ frequency: 760, endFrequency: 980, duration: 0.065, gain: 0.028, type: "triangle" });
  }, 28);
}

function getEffectsNoiseBuffer() {
  const context = ensureEffectsAudio();
  if (!context) return null;
  if (effectsNoiseBuffer) return effectsNoiseBuffer;

  effectsNoiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.8), context.sampleRate);
  const samples = effectsNoiseBuffer.getChannelData(0);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Math.random() * 2 - 1;
  }
  return effectsNoiseBuffer;
}

function playPaperRustle(intensity = 0.5) {
  const context = ensureEffectsAudio();
  const buffer = getEffectsNoiseBuffer();
  if (!context || !buffer || modal.classList.contains("is-open")) return;

  const now = context.currentTime;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  const duration = 0.075;
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = 1450;
  filter.Q.value = 0.75;
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(0.045 * intensity, now + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(effectsMaster);
  source.start(now, Math.random() * 0.55, duration);
}

function playSoftSwoosh(intensity = 1) {
  const context = ensureEffectsAudio();
  const buffer = getEffectsNoiseBuffer();
  if (!context || !buffer || modal.classList.contains("is-open")) return;

  const now = context.currentTime;
  const duration = 0.38;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(380, now);
  filter.frequency.exponentialRampToValueAtTime(1800, now + duration * 0.56);
  filter.frequency.exponentialRampToValueAtTime(620, now + duration);
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(0.052 * intensity, now + duration * 0.45);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(effectsMaster);
  source.start(now, Math.random() * 0.18, duration);
}

function playScrollPulse(direction) {
  const rising = direction > 0;
  playEffectTone({
    frequency: rising ? 175 : 220,
    endFrequency: rising ? 225 : 165,
    duration: 0.08,
    gain: 0.022,
    type: "triangle",
  });
}

function prepareTextReveals() {
  document.querySelectorAll("[data-text-reveal]").forEach((element) => {
    let revealIndex = 0;
    const textNodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((textNode) => {
      const fragment = document.createDocumentFragment();
      const parts = textNode.textContent.split(/(\s+)/);

      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
          return;
        }

        const word = document.createElement("span");
        word.className = "reveal-word";

        if (element.dataset.textReveal === "letters") {
          [...part].forEach((character) => {
            const clip = document.createElement("span");
            const inner = document.createElement("span");
            clip.className = "reveal-char";
            inner.className = "reveal-char__inner";
            inner.textContent = character;
            inner.style.setProperty("--reveal-index", revealIndex);
            revealIndex += 1;
            clip.appendChild(inner);
            word.appendChild(clip);
          });
        } else {
          const inner = document.createElement("span");
          inner.className = "reveal-word__inner";
          inner.textContent = part;
          inner.style.setProperty("--reveal-index", revealIndex);
          revealIndex += 1;
          word.appendChild(inner);
        }

        fragment.appendChild(word);
      });

      textNode.replaceWith(fragment);
    });
  });
}

prepareTextReveals();

document.addEventListener(
  "pointerdown",
  (event) => {
    ensureEffectsAudio();
    if (!(event.target instanceof Element)) return;
    if (event.target.closest("button, a, input[type='range'], video")) playInterfaceClick();
  },
  true,
);

document.addEventListener("keydown", (event) => {
  if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
  if (!(event.target instanceof Element)) return;
  if (!event.target.closest("button, a")) return;
  ensureEffectsAudio();
  playInterfaceClick();
});

function finishIntro() {
  if (introFinished) return;
  introFinished = true;
  intro.classList.add("is-hidden");
  document.querySelector(".hero")?.classList.add("is-visible");
  document.querySelector(".hero__content")?.classList.add("is-visible");

  if (window.location.hash) {
    window.requestAnimationFrame(() => {
      document.querySelector(window.location.hash)?.scrollIntoView();
    });
  }
}

window.addEventListener("load", () => {
  window.setTimeout(finishIntro, prefersReducedMotion ? 80 : 1300);
});

window.setTimeout(finishIntro, 2600);

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 35);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -50px" },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const noteCards = [...document.querySelectorAll(".note-card")];
const notesSection = document.querySelector(".notes");
const notesHeading = document.querySelector(".notes__heading");
const letterSection = document.querySelector(".letter");
const letterDecoration = document.querySelector(".letter__decoration");
const heroSection = document.querySelector(".hero");
const heroContent = document.querySelector(".hero__content");
let highestNoteLayer = 5;
let noteLayoutMode = null;

function applyNotePosition(card) {
  card.style.setProperty("--note-x", `${card.noteState.x}px`);
  card.style.setProperty("--note-y", `${card.noteState.y}px`);
  card.style.setProperty("--note-rotation", `${card.noteState.rotation}deg`);
}

function arrangeNotes(force = false) {
  const mode = window.innerWidth <= 820 ? "mobile" : "desktop";
  if (!force && mode === noteLayoutMode) return;
  noteLayoutMode = mode;

  noteCards.forEach((card, index) => {
    card.noteState = {
      x: Number(mode === "mobile" ? card.dataset.mobileX : card.dataset.x),
      y: Number(mode === "mobile" ? card.dataset.mobileY : card.dataset.y),
      rotation: Number(card.dataset.rotate),
    };
    card.style.zIndex = String(index + 2);
    applyNotePosition(card);
  });
}

noteCards.forEach((card) => {
  let dragStart = null;
  let lastRustleAt = 0;

  function bringToFront() {
    highestNoteLayer += 1;
    card.style.zIndex = String(highestNoteLayer);
  }

  card.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    bringToFront();
    card.setPointerCapture(event.pointerId);
    dragStart = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      cardX: card.noteState.x,
      cardY: card.noteState.y,
      hasMoved: false,
    };
    card.classList.add("is-dragging");
    playPaperRustle(0.55);
  });

  card.addEventListener("pointermove", (event) => {
    if (!dragStart || !card.hasPointerCapture(event.pointerId)) return;
    card.noteState.x = dragStart.cardX + event.clientX - dragStart.pointerX;
    card.noteState.y = dragStart.cardY + event.clientY - dragStart.pointerY;
    applyNotePosition(card);

    const distance = Math.hypot(event.clientX - dragStart.pointerX, event.clientY - dragStart.pointerY);
    if (distance > 5) dragStart.hasMoved = true;
    if (dragStart.hasMoved && performance.now() - lastRustleAt > 115) {
      lastRustleAt = performance.now();
      playPaperRustle(0.34);
    }
  });

  function stopDragging(event) {
    if (!dragStart) return;
    const didMove = dragStart.hasMoved;
    if (card.hasPointerCapture(event.pointerId)) card.releasePointerCapture(event.pointerId);
    dragStart = null;
    card.classList.remove("is-dragging");
    if (didMove) {
      playPaperRustle(0.7);
      playEffectTone({ frequency: 145, endFrequency: 105, duration: 0.1, gain: 0.035, type: "sine" });
    }
  }

  card.addEventListener("pointerup", stopDragging);
  card.addEventListener("pointercancel", stopDragging);
  card.addEventListener("focus", bringToFront);
  card.addEventListener("dblclick", () => arrangeNotes(true));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      bringToFront();
    }
  });
});

arrangeNotes(true);

const notesEntranceObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      notesSection.classList.add("has-entered");
      window.setTimeout(() => notesSection.classList.add("is-settled"), 1300);
      notesEntranceObserver.disconnect();
    });
  },
  { threshold: 0.12 },
);

notesEntranceObserver.observe(notesSection);

const soundSectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.dataset.soundPlayed === "true") return;
      if (!effectsAudioContext || effectsAudioContext.state !== "running") return;
      entry.target.dataset.soundPlayed = "true";
      playSoftSwoosh(0.72);
    });
  },
  { threshold: 0.2 },
);

soundSectionObserver.observe(notesSection);
soundSectionObserver.observe(letterSection);

function showVideoReady() {
  videoShell.classList.remove("has-error");
  videoShell.classList.add("is-ready");
  placeholder.hidden = true;
}

function showVideoError() {
  videoShell.classList.remove("is-ready");
  videoShell.classList.add("has-error");
  placeholder.hidden = false;
}

video.addEventListener("loadeddata", showVideoReady);
video.addEventListener("canplay", showVideoReady);
video.addEventListener("error", showVideoError);

music.volume = Number(musicVolume.value);

function removeMusicUnlockListeners() {
  if (!musicUnlockArmed) return;
  musicUnlockArmed = false;
  document.removeEventListener("pointerdown", unlockMusic, true);
  document.removeEventListener("keydown", unlockMusic, true);
}

function unlockMusic() {
  removeMusicUnlockListeners();
  if (modal.classList.contains("is-open")) return;
  music.play().catch(showMusicError);
}

function armMusicOnFirstInteraction() {
  if (musicUnlockArmed) return;
  musicUnlockArmed = true;
  document.addEventListener("pointerdown", unlockMusic, { capture: true, once: true });
  document.addEventListener("keydown", unlockMusic, { capture: true, once: true });
}

function attemptMusicAutoplay() {
  music.volume = Number(musicVolume.value);
  const playPromise = music.play();
  if (playPromise) playPromise.catch(armMusicOnFirstInteraction);
}

window.addEventListener("load", () => {
  window.setTimeout(attemptMusicAutoplay, 120);
});

function updateMusicState() {
  const isPlaying = !music.paused;
  musicPlayer.classList.toggle("is-playing", isPlaying);
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.setAttribute("aria-label", isPlaying ? "Pausar Todo de Ti" : "Reproducir Todo de Ti");
}

function showMusicError() {
  musicPlayer.classList.add("has-error");
  const title = musicPlayer.querySelector(".music-player__info strong");
  const artist = musicPlayer.querySelector(".music-player__info span");
  title.textContent = "Añade cancion.mp3";
  artist.textContent = "Audio no encontrado";
  updateMusicState();
}

musicToggle.addEventListener("click", () => {
  if (!music.paused) {
    music.pause();
    return;
  }

  musicPlayer.classList.remove("has-error");
  const playPromise = music.play();
  if (playPromise) playPromise.catch(showMusicError);
});

musicVolume.addEventListener("input", () => {
  music.volume = Number(musicVolume.value);
});

music.addEventListener("play", updateMusicState);
music.addEventListener("pause", updateMusicState);
music.addEventListener("error", showMusicError);

function syncReelAudio() {
  const reelAudioIsPlaying = !relationshipReel.paused && !relationshipReel.muted && relationshipReel.volume > 0;

  if (reelAudioIsPlaying) {
    if (!music.paused) resumeMusicAfterReel = true;
    music.pause();
    return;
  }

  if (resumeMusicAfterReel && !modal.classList.contains("is-open")) {
    resumeMusicAfterReel = false;
    music.play().catch(showMusicError);
  }
}

relationshipReel.addEventListener("play", syncReelAudio);
relationshipReel.addEventListener("pause", syncReelAudio);
relationshipReel.addEventListener("volumechange", syncReelAudio);

const reelPlaybackObserver = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      relationshipReel.play().catch(() => {});
    } else {
      relationshipReel.pause();
    }
  },
  { threshold: 0.18 },
);

reelPlaybackObserver.observe(relationshipReel);

function openVideo() {
  lastFocusedElement = document.activeElement;
  resumeMusicAfterVideo = !music.paused;
  if (resumeMusicAfterVideo) music.pause();
  playSoftSwoosh(1.05);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  videoShell.classList.remove("has-error", "is-ready");
  placeholder.hidden = true;
  video.load();
  modal.querySelector(".video-modal__close").focus();

  const playPromise = video.play();
  if (playPromise) playPromise.catch(() => {});
}

function closeVideo() {
  if (!modal.classList.contains("is-open")) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  video.pause();
  if (resumeMusicAfterVideo) {
    music.play().catch(showMusicError);
    resumeMusicAfterVideo = false;
  }
  lastFocusedElement?.focus();
}

openButton.addEventListener("click", () => {
  openVideo();
  if (!prefersReducedMotion) launchConfetti(40);
});

document.querySelectorAll("[data-close-video]").forEach((element) => {
  element.addEventListener("click", closeVideo);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeVideo();

  if (event.key === "Tab" && modal.classList.contains("is-open")) {
    const focusable = [...modal.querySelectorAll("button, video")].filter((item) => !item.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

if (!prefersReducedMotion) {
  const hero = document.querySelector(".hero");

  hero.addEventListener("pointermove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    hero.style.setProperty("--hero-pointer-x", `${x * -12}px`);
    hero.style.setProperty("--hero-pointer-y", `${y * -9}px`);
  });

  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--hero-pointer-x", "0px");
    hero.style.setProperty("--hero-pointer-y", "0px");
  });
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

let lastScrollSoundY = window.scrollY;
let lastScrollSoundStep = Math.floor(window.scrollY / 420);
let lastScrollSoundAt = 0;

function updateScrollSound() {
  const currentY = window.scrollY;
  const currentStep = Math.floor(currentY / 420);
  const now = performance.now();

  if (
    currentStep !== lastScrollSoundStep &&
    now - lastScrollSoundAt > 150 &&
    effectsAudioContext?.state === "running" &&
    !modal.classList.contains("is-open")
  ) {
    playScrollPulse(currentY >= lastScrollSoundY ? 1 : -1);
    lastScrollSoundAt = now;
  }

  lastScrollSoundY = currentY;
  lastScrollSoundStep = currentStep;
}

window.addEventListener("scroll", updateScrollSound, { passive: true });

let scrollMotionFrame = null;

function updateScrollMotion() {
  scrollMotionFrame = null;
  if (prefersReducedMotion) return;

  const viewportHeight = window.innerHeight;
  const heroProgress = clamp(window.scrollY / Math.max(heroSection.offsetHeight, 1));
  heroSection.style.setProperty("--hero-photo-shift", `${heroProgress * 34}px`);
  heroContent.style.setProperty("--hero-scroll-y", `${heroProgress * -48}px`);
  if (heroContent.classList.contains("is-visible")) {
    heroContent.style.opacity = String(1 - heroProgress * 0.28);
  }

  const notesRect = notesSection.getBoundingClientRect();
  const notesProgress = clamp((viewportHeight - notesRect.top) / (viewportHeight + notesRect.height));
  notesHeading.style.translate = `0 ${notesProgress * -24}px`;

  noteCards.forEach((card, index) => {
    const direction = index - 1;
    const scrollOffset = (notesProgress - 0.5) * direction * 34;
    const photoScale = 1.09 - notesProgress * 0.07;
    card.style.setProperty("--note-scroll-y", `${scrollOffset}px`);
    card.querySelector("img").style.setProperty("--photo-scale", String(photoScale));
  });

  const letterRect = letterSection.getBoundingClientRect();
  const letterProgress = clamp((viewportHeight - letterRect.top) / (viewportHeight + letterRect.height));
  letterDecoration.style.setProperty("--letter-motion-y", `${(letterProgress - 0.5) * -44}px`);
  letterDecoration.style.setProperty("--letter-motion-rotation", `${(letterProgress - 0.5) * 5}deg`);
}

function requestScrollMotion() {
  if (scrollMotionFrame) return;
  scrollMotionFrame = window.requestAnimationFrame(updateScrollMotion);
}

window.addEventListener("scroll", requestScrollMotion, { passive: true });
updateScrollMotion();

function resizeConfettiCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  confettiCanvas.width = window.innerWidth * ratio;
  confettiCanvas.height = window.innerHeight * ratio;
  confettiCanvas.style.width = `${window.innerWidth}px`;
  confettiCanvas.style.height = `${window.innerHeight}px`;
  confettiContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function launchConfetti(amount) {
  resizeConfettiCanvas();
  const colors = ["#dc2048", "#ff9eb3", "#f0c887", "#fffaf8"];

  for (let index = 0; index < amount; index += 1) {
    confettiPieces.push({
      x: window.innerWidth * (0.43 + Math.random() * 0.14),
      y: window.innerHeight * (0.48 + Math.random() * 0.08),
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -9 - 3,
      gravity: 0.18 + Math.random() * 0.08,
      drag: 0.985,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.22,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      heart: Math.random() > 0.72,
    });
  }

  if (!confettiFrame) animateConfetti();
}

function drawHeart(context, size) {
  context.beginPath();
  context.moveTo(0, size * 0.28);
  context.bezierCurveTo(-size * 0.7, -size * 0.18, -size * 0.55, size * 0.82, 0, size);
  context.bezierCurveTo(size * 0.55, size * 0.82, size * 0.7, -size * 0.18, 0, size * 0.28);
  context.fill();
}

function animateConfetti() {
  confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

  confettiPieces.forEach((piece) => {
    piece.vx *= piece.drag;
    piece.vy = piece.vy * piece.drag + piece.gravity;
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.rotation += piece.rotationSpeed;
    if (piece.y > window.innerHeight * 0.76) piece.alpha -= 0.02;

    confettiContext.save();
    confettiContext.globalAlpha = Math.max(piece.alpha, 0);
    confettiContext.translate(piece.x, piece.y);
    confettiContext.rotate(piece.rotation);
    confettiContext.fillStyle = piece.color;

    if (piece.heart) {
      drawHeart(confettiContext, piece.size);
    } else {
      confettiContext.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
    }

    confettiContext.restore();
  });

  confettiPieces = confettiPieces.filter(
    (piece) => piece.alpha > 0 && piece.y < window.innerHeight + 40 && piece.x > -50 && piece.x < window.innerWidth + 50,
  );

  if (confettiPieces.length) {
    confettiFrame = window.requestAnimationFrame(animateConfetti);
  } else {
    confettiFrame = null;
    confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

window.addEventListener("resize", () => {
  if (confettiPieces.length) resizeConfettiCanvas();
  arrangeNotes();
  requestScrollMotion();
});
