const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');
const splash = document.querySelector('[data-splash]');
const splashClose = document.querySelector('[data-splash-close]');
const mobileViewport = window.matchMedia('(max-width: 560px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const closeSplash = () => {
  splash?.classList.remove('is-active');
  document.body.classList.remove('splash-open');
};

if (splash && mobileViewport.matches) {
  document.body.classList.add('splash-open');
  splash.classList.add('is-active');
  splashClose?.addEventListener('click', closeSplash);
  window.setTimeout(closeSplash, reducedMotion.matches ? 120 : 2650);
}

const setHeaderState = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 8);
};

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.querySelector('.sr-only').textContent = isOpen ? 'Abrir menú' : 'Cerrar menú';
  menu?.classList.toggle('is-open', !isOpen);
});

menu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.querySelector('.sr-only').replaceChildren('Abrir menú');
    menu?.classList.remove('is-open');
  });
});

const timeline = document.querySelector('[data-timeline]');
const tabs = Array.from(timeline?.querySelectorAll('[role="tab"]') ?? []);
const panels = Array.from(timeline?.querySelectorAll('[role="tabpanel"]') ?? []);
const mobileTimeline = window.matchMedia('(max-width: 560px)');

const selectTab = (selectedTab) => {
  const target = selectedTab.dataset.tab;
  tabs.forEach((tab) => {
    const active = tab === selectedTab;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== target;
  });
  if (mobileTimeline.matches) {
    selectedTab.scrollIntoView({
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }
};

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else nextIndex = (index - 1 + tabs.length) % tabs.length;
    tabs[nextIndex].focus();
    selectTab(tabs[nextIndex]);
  });
});
