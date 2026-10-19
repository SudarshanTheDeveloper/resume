import { projects } from './projects.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let manualMotion = null;
let scene = null;
let game = null;
let gameActive = false;
let animationPaused = reducedMotion.matches;
const motionButton = document.querySelector('#motion-toggle');
const status = document.querySelector('#scene-status');

function applyMotionPreference() {
  animationPaused = manualMotion ?? reducedMotion.matches;
  document.documentElement.classList.toggle('motion-paused', animationPaused);
  motionButton.setAttribute('aria-pressed', String(animationPaused));
  motionButton.setAttribute('aria-label', animationPaused ? 'Play animation' : 'Pause animation');
  motionButton.title = animationPaused ? 'Play animation' : 'Pause animation';
  document.querySelector('#motion-icon').textContent = animationPaused ? '▷' : 'Ⅱ';
  scene?.setPaused(animationPaused);
}
motionButton.addEventListener('click', () => {
  manualMotion = !animationPaused;
  applyMotionPreference();
  status.textContent = animationPaused ? 'Automatic rotation paused. You can still rotate the view.' : 'Automatic rotation enabled.';
});
reducedMotion.addEventListener('change', applyMotionPreference);
applyMotionPreference();

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(expanded));
  navigation.classList.toggle('is-open', expanded);
});
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); }
});
window.matchMedia('(min-width: 601px)').addEventListener('change', closeMenu);

const projectCards = [...document.querySelectorAll('.project-card')];
// One media entry updates the card preview and the detail dialog together.
for (const [id, project] of Object.entries(projects)) {
  const media = project.media;
  const preview = media?.type === 'video' ? media.poster : media?.src;
  if (!preview) continue;
  const card = document.querySelector(`[data-project="${id}"]`);
  const image = card?.querySelector('.project-visual > img');
  if (image) { image.src = preview; image.alt = media.alt || project.title; }
  const label = card?.querySelector('.study-label');
  if (label) label.textContent = media.type === 'video' ? 'PROJECT VIDEO' : 'PROJECT IMAGE';
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
  let count = 0;
  projectCards.forEach(card => {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
    if (!card.hidden) count++;
  });
  document.querySelector('#work-count').textContent = `${String(count).padStart(2, '0')} SELECTED ${count === 1 ? 'STUDY' : 'STUDIES'}`;
}));

const dialog = document.querySelector('#project-dialog');
let projectTrigger;
let dialogMedia;
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
function openProject(id, trigger) {
  const project = projects[id];
  if (!project) return;
  projectTrigger = trigger;
  const content = document.querySelector('#dialog-content');
  content.replaceChildren();
  const category = element('p', 'dialog-eyebrow', project.category);
  const title = element('h2', '', project.title); title.id = 'dialog-title';
  content.append(category, title, element('p', 'dialog-intro', project.intro));
  const figure = element('figure', 'dialog-media');
  const media = project.media;
  if (media?.type === 'video') {
    dialogMedia = element('video');
    dialogMedia.src = media.src; dialogMedia.controls = true; dialogMedia.playsInline = true;
    dialogMedia.preload = 'metadata';
    if (media.poster) dialogMedia.poster = media.poster;
    dialogMedia.setAttribute('aria-label', media.alt || project.title);
  } else {
    dialogMedia = element('img'); dialogMedia.src = media?.src || project.illustration;
    dialogMedia.alt = media?.alt || project.illustrationAlt;
    dialogMedia.width = 800; dialogMedia.height = 520;
  }
  figure.append(dialogMedia, element('figcaption', '', media ? (media.caption || project.title) : 'CONCEPTUAL ILLUSTRATION / NOT PROJECT FOOTAGE'));
  const details = element('div', 'dialog-details');
  for (const [heading, text] of [['The context', project.context], ['My contribution', project.contributions], ['Engineering focus', project.focus], ['Topics I can walk you through', project.discussion]]) {
    const section = element('section'); section.append(element('h3', '', heading));
    if (Array.isArray(text)) { const list = element('ul'); text.forEach(item => list.append(element('li', '', item))); section.append(list); }
    else section.append(element('p', '', text));
    details.append(section);
  }
  const tech = element('div', 'dialog-tech'); tech.append(element('p', 'small-label', 'TOOLS & TECHNOLOGIES'));
  const tags = element('div', 'tags'); project.tech.forEach(item => tags.append(element('span', '', item))); tech.append(tags);
  content.append(figure, details, tech);
  document.body.classList.add('dialog-open');
  dialog.showModal(); dialog.scrollTop = 0;
  scene?.setOverlayOpen(true);
  game?.setProjectOpen(true);
}
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => openProject(button.dataset.project, button)));
document.querySelectorAll('.dialog-close').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  if (dialogMedia?.tagName === 'VIDEO') dialogMedia.pause();
  document.body.classList.remove('dialog-open');
  scene?.setOverlayOpen(gameActive);
  game?.setProjectOpen(false);
  if (!gameActive) projectTrigger?.focus({ preventScroll: true });
});

const gameReady = import('./playable-lab.js').then(({ createPlayableLab }) => {
  game = createPlayableLab({
    onProjectOpen: openProject,
    onActiveChange: active => { gameActive = active; scene?.setOverlayOpen(active || dialog.open); }
  });
  if (['#world', '#journey'].includes(location.hash) || (!location.hash && new URLSearchParams(location.search).get('view') !== 'portfolio')) game.open();
  return game;
}).catch(error => {
  document.querySelectorAll('[data-open-world]').forEach(link => { link.href = '#work'; link.textContent = 'Explore my work ↗'; });
  console.error('Unable to initialize the playable lab:', error);
});
document.querySelectorAll('[data-open-world]').forEach(link => link.addEventListener('click', async event => {
  event.preventDefault(); closeMenu();
  const instance = await gameReady;
  if (instance) { history.replaceState(null, '', `${location.pathname}${location.search}#world`); instance.open(); if(link.hasAttribute('data-race-entry'))instance.enterRace(); }
  else document.querySelector('#work').scrollIntoView();
}));
window.addEventListener('hashchange', async () => { if (['#world', '#journey'].includes(location.hash)) (await gameReady)?.open(); });

const copyButton = document.querySelector('#copy-email');
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('sudarshan9084@gmail.com');
    copyButton.textContent = 'Copied ✓';
    document.querySelector('#copy-status').textContent = 'Email address copied to clipboard.';
    window.setTimeout(() => { copyButton.textContent = 'Copy email ⧉'; }, 2500);
  } catch {
    document.querySelector('#copy-status').textContent = 'Please select the email address to copy it.';
    copyButton.textContent = 'Select email to copy';
    const selection = window.getSelection();
    const range = document.createRange(); range.selectNodeContents(document.querySelector('.contact-email'));
    selection.removeAllRanges(); selection.addRange(range);
  }
});
document.querySelector('#year').textContent = new Date().getFullYear();

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  document.documentElement.classList.add('reveal-enabled');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
  }), { threshold: 0.08 });
  document.querySelectorAll('.section-heading, .project-card, .experience-layout, .skill, .about-layout, .contact-section').forEach(node => {
    node.dataset.reveal = ''; observer.observe(node);
  });
}

// The rest of the website works even if WebGL is unavailable or this import fails.
import('./render-lab.js').then(({ createRenderLab }) => {
  scene = createRenderLab({ paused: animationPaused, onStatus: text => { status.textContent = text; } });
  if (!scene) throw new Error('WebGL is unavailable');
  scene.setOverlayOpen(gameActive || dialog.open);
}).catch(() => {
  document.querySelector('#scene-hint').textContent = 'Static preview';
  document.querySelector('#scene-viewport').setAttribute('aria-label', 'Static preview of interlocking metallic frames. Interactive 3D is unavailable in this browser.');
  document.querySelectorAll('[data-scene-mode], #scene-reset, #motion-toggle').forEach(button => { button.disabled = true; });
  status.textContent = 'Showing a static illustration because interactive 3D is unavailable.';
});
