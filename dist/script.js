const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');
const splash = document.querySelector('[data-splash]');
const splashClose = document.querySelector('[data-splash-close]');
const mobileViewport = window.matchMedia('(max-width: 560px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.body.classList.add('motion-ready');

const trackEvent = (eventName, parameters = {}) => {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, parameters);
};

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
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollRange > 0 ? Math.min(window.scrollY / scrollRange, 1) : 0;
  header?.style.setProperty('--scroll-progress', String(progress));
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
const tabList = timeline?.querySelector('[role="tablist"]');
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
  if (mobileTimeline.matches && tabList) {
    const centeredPosition = selectedTab.offsetLeft - (tabList.clientWidth - selectedTab.offsetWidth) / 2;
    tabList.scrollTo({
      left: Math.max(0, centeredPosition),
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
  }
  trackEvent('timeline_stage_view', { stage: target });
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

const revealGroups = [
  '.facts p',
  '.purpose-grid > *',
  '.section-heading > *',
  '.journey-list li',
  '.participate-layout > *',
  '.principles-intro > *',
  '.principle-list > div',
  '.calendar-layout > *',
  '.future-copy > *',
  '.closing > *',
];

document.querySelectorAll('.section-kicker, .objective-line, .principles-note').forEach((element) => {
  element.dataset.reveal = 'line';
});

revealGroups.forEach((selector) => {
  document.querySelectorAll(selector).forEach((element, index) => {
    element.dataset.reveal = element.dataset.reveal || 'item';
    element.style.setProperty('--reveal-order', String(index));
  });
});

const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));

if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  revealItems.forEach((element) => element.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

  revealItems.forEach((element) => revealObserver.observe(element));
}

const navLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
const observedSections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`);
    });
  }, { rootMargin: '-24% 0px -58% 0px', threshold: [0, 0.2, 0.5] });

  observedSections.forEach((section) => sectionObserver.observe(section));
}

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    trackEvent('navigation_click', {
      destination: link.getAttribute('href'),
      link_text: link.textContent.trim(),
    });
  });
});

document.querySelectorAll('.hero-actions a, .closing .button').forEach((link) => {
  link.addEventListener('click', () => {
    trackEvent('cta_click', {
      destination: link.getAttribute('href'),
      cta_text: link.textContent.trim(),
    });
  });
});

if ('IntersectionObserver' in window) {
  const viewedSections = new Set();
  const analyticsSections = Array.from(document.querySelectorAll('main > section'));
  const analyticsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || viewedSections.has(entry.target)) return;
      const sectionName = entry.target.id || entry.target.getAttribute('aria-labelledby') || entry.target.classList[1] || 'section';
      viewedSections.add(entry.target);
      trackEvent('section_view', { section_name: sectionName });
      analyticsObserver.unobserve(entry.target);
    });
  }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });

  analyticsSections.forEach((section) => analyticsObserver.observe(section));
}

const hero = document.querySelector('.hero');
const heroImage = document.querySelector('.hero-image');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
let heroFrame = 0;

if (hero && heroImage && finePointer.matches && !reducedMotion.matches) {
  hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    window.cancelAnimationFrame(heroFrame);
    heroFrame = window.requestAnimationFrame(() => {
      heroImage.style.setProperty('--hero-shift-x', `${x * -9}px`);
      heroImage.style.setProperty('--hero-shift-y', `${y * -7}px`);
    });
  });

  hero.addEventListener('pointerleave', () => {
    heroImage.style.removeProperty('--hero-shift-x');
    heroImage.style.removeProperty('--hero-shift-y');
  });
}
