const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');
const splash = document.querySelector('[data-splash]');
const splashClose = document.querySelector('[data-splash-close]');
const mobileViewport = window.matchMedia('(max-width: 560px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const signupForm = document.querySelector('[data-signup-form]');
const signupApiUrl = 'https://script.google.com/macros/s/AKfycbwnFRXTZT0s2_-K8MAMRmmTK3TI97cCCwT7JuiriwdHtTL6f4Y2t_OO87w5QsILh2Ud/exec';

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
  '.signup-copy > *',
  '.signup-form',
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

const signupFields = signupForm ? Array.from(signupForm.querySelectorAll('input:not([name="website"])')) : [];
const signupStatus = signupForm?.querySelector('[data-form-status]');
const signupButton = signupForm?.querySelector('[data-submit-button]');
const signupButtonLabel = signupForm?.querySelector('[data-submit-label]');

const signupMessages = {
  name: 'Ingresá tu nombre y apellido.',
  email: 'Ingresá un email válido.',
  phone: 'Ingresá un teléfono válido.',
  age: 'La propuesta es para jóvenes de 16 a 24 años.',
};

const setFieldError = (field, message = '') => {
  const error = signupForm?.querySelector(`[data-error-for="${field.name}"]`);
  field.setAttribute('aria-invalid', String(Boolean(message)));
  if (error) error.textContent = message;
};

const validateSignupField = (field) => {
  const value = field.value.trim();
  let message = '';

  if (!value) message = signupMessages[field.name];
  else if (field.name === 'name' && value.length < 2) message = signupMessages.name;
  else if (field.name === 'email' && field.validity.typeMismatch) message = signupMessages.email;
  else if (field.name === 'phone' && (!/^[+()\d\s.-]+$/.test(value) || value.replace(/\D/g, '').length < 6)) message = signupMessages.phone;
  else if (field.name === 'age') {
    const age = Number(value);
    if (!Number.isInteger(age) || age < 16 || age > 24) message = signupMessages.age;
  }

  setFieldError(field, message);
  return !message;
};

signupFields.forEach((field) => {
  field.addEventListener('blur', () => validateSignupField(field));
  field.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') === 'true') validateSignupField(field);
  });
});

signupForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  signupStatus?.classList.remove('is-error', 'is-success');
  if (signupStatus) signupStatus.textContent = '';

  const validFields = signupFields.map(validateSignupField);
  if (validFields.includes(false)) {
    signupFields.find((field) => field.getAttribute('aria-invalid') === 'true')?.focus();
    trackEvent('signup_validation_error');
    return;
  }

  const formData = new FormData(signupForm);
  if (formData.get('website')) return;

  const payload = {
    name: String(formData.get('name') || '').trim(),
    email: String(formData.get('email') || '').trim().toLowerCase(),
    phone: String(formData.get('phone') || '').trim(),
    age: Number(formData.get('age')),
  };

  if (signupButton) {
    signupButton.disabled = true;
    signupButton.classList.add('is-loading');
  }
  if (signupButtonLabel) signupButtonLabel.textContent = 'Enviando';

  try {
    const body = new URLSearchParams({
      nombre: payload.name,
      email: payload.email,
      telefono: payload.phone,
      edad: String(payload.age),
      website: '',
    });

    await fetch(signupApiUrl, {
      method: 'POST',
      mode: 'no-cors',
      referrerPolicy: 'no-referrer',
      body,
    });

    signupForm.reset();
    signupForm.classList.add('is-success');
    signupFields.forEach((field) => setFieldError(field));
    if (signupStatus) {
      signupStatus.textContent = '¡Listo! Enviamos tu inscripción. El equipo del PEJ se va a comunicar con vos para contarte el próximo paso.';
      signupStatus.classList.add('is-success');
    }
    trackEvent('signup_submit_success', { age: payload.age });
  } catch (error) {
    if (signupStatus) {
      signupStatus.textContent = error instanceof Error && error.message
        ? error.message
        : 'No pudimos enviar tu inscripción. Revisá tu conexión e intentá nuevamente.';
      signupStatus.classList.add('is-error');
    }
    trackEvent('signup_submit_error');
  } finally {
    if (signupButton) {
      signupButton.disabled = false;
      signupButton.classList.remove('is-loading');
    }
    if (signupButtonLabel) signupButtonLabel.textContent = 'Enviar inscripción';
  }
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
