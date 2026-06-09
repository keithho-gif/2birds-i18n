// shared.jsx, 2birds shared components (NavBar, Footer, common partials)
// Each page sets `window.TB_PAGE = "<slug>"` before loading this script
// so the NavBar can highlight the right item.

function EyebrowLockup({ children, dark }) {
  return (
    <span className={"eyebrow-lockup" + (dark ? " on-dark" : "")}>{children}</span>);

}

function NavBar({ current }) {
  const items = [
  { id: "brand", label: "Brand", href: "brand.html" },
  { id: "curriculum", label: "Curriculum", href: "curriculum.html" },
  { id: "sourcing", label: "ATO Setup", href: "setup.html" },
  { id: "compliance", label: "Audit", href: "compliance.html" },
  { id: "branding", label: "Revenue", href: "marketing.html" }];

  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {document.body.style.overflow = "";};
  }, [open]);

  return (
    <>
    <header className={"tb-nav" + (open ? " is-open" : "")}>
      <a href="index.html" className="tb-nav__wm">
        <img src="assets/2birds-wordmark.png" alt="2birds" />
      </a>
      <nav className="tb-nav__menu">
        {items.map((it) =>
        <a key={it.id}
        href={it.href}
        className={"tb-nav__link" + (current === it.id ? " is-active" : "")}>
            {it.label}
          </a>
        )}
      </nav>
      <div className="tb-nav__right">
        <a className="tb-nav__enq" href="contact.html">
          <span className="tb-nav__enq-text">Make an enquiry</span>
          <span className="tb-nav__enq-arrow" aria-hidden="true">↗</span>
        </a>
        <button
          type="button"
          className="tb-nav__burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}>
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
    {/* Drawer is a SIBLING of the header (not a child): the header's
        backdrop-filter would otherwise trap this position:fixed panel inside
        the nav bar instead of letting it cover the screen. */}
    <div className={"tb-nav__drawer" + (open ? " is-open" : "")} aria-hidden={!open}>
      <nav className="tb-nav__drawerMenu">
        {items.map((it) =>
        <a key={it.id}
        href={it.href}
        className={"tb-nav__drawerLink" + (current === it.id ? " is-active" : "")}
        onClick={() => setOpen(false)}>
          {it.label}
        </a>
        )}
        <a className="tb-nav__drawerLink" href="contact.html" onClick={() => setOpen(false)}>Make an enquiry</a>
      </nav>
    </div>
    </>);

}

function PageHero({ location, eyebrow, title, lede }) {
  return (
    <section className="tb-pagehero">
      <div className="tb-pagehero__glow" aria-hidden="true" />
      <div className="container tb-pagehero__inner">
        <div>
          {location &&
          <div className="tb-pagehero__loc">
              <a href="index.html">2birds</a>
              <span className="tb-pagehero__loc__sep">·</span>
              <span>{location}</span>
            </div>
          }
          <EyebrowLockup>{eyebrow}</EyebrowLockup>
          <h1 className="tb-pagehero__title">{title}</h1>
        </div>
        <p className="tb-pagehero__lede">{lede}</p>
      </div>
    </section>);

}

function SectionHead({ eyebrow, title, sub }) {
  return (
    <header className="tb-sectionhead">
      <EyebrowLockup>{eyebrow}</EyebrowLockup>
      <h2 className="tb-sectionhead__title">{title}</h2>
      {sub && <p className="tb-sectionhead__sub">{sub}</p>}
    </header>);

}

function CTAPanel({ eyebrow, title, sub, primary, secondary }) {
  return (
    <section className="tb-ctawrap">
      <div className="container">
        <aside className="tb-cta on-dark">
          <div className="tb-cta__bar" aria-hidden="true" />
          <div className="tb-cta__atmos" aria-hidden="true" />
          <div className="tb-cta__inner">
            <EyebrowLockup dark>{eyebrow || "Engagement"}</EyebrowLockup>
            <h2 className="tb-cta__title">{title}</h2>
            <p className="tb-cta__sub">{sub}</p>
            <div className="tb-cta__actions">
              <a className="btn btn-on-dark" href={primary && primary.href || "contact.html"}>
                {primary && primary.label || "Write to the practice"}
              </a>
              {secondary &&
              <a className="btn btn-ghost-on-dark" href={secondary.href}>{secondary.label}</a>
              }
            </div>
          </div>
        </aside>
      </div>
    </section>);

}

function Footer() {
  return (
    <footer className="tb-footer on-dark">
      <div className="tb-footer__bar" aria-hidden="true" />
      <div className="container tb-footer__inner">
        <div className="tb-footer__grid">
          <div className="tb-footer__brand">
            <img src="assets/2birds-logo.png" alt="2birds" className="tb-footer__wm" />
            <p className="tb-footer__about">2birds is a growing community of independent practitioners in curriculum development and advisory for Approved Training Organisations (ATOs).</p>
          </div>
          <div className="tb-footer__col">
            <h4 className="tb-footer__heading">Practice</h4>
            <ul className="tb-footer__list">
              <li><a href="brand.html">Brand</a></li>
              <li><a href="curriculum.html">Curriculum</a></li>
              <li><a href="setup.html">ATO Setup</a></li>
              <li><a href="compliance.html">Audit</a></li>
              <li><a href="marketing.html">Revenue</a></li>
            </ul>
          </div>
          <div className="tb-footer__col">
            <h4 className="tb-footer__heading">Address</h4>
            <ul className="tb-footer__list">
              <li>7 Temasek Boulevard</li>
              <li>#12-07 Suntec Tower One</li>
              <li>Singapore 038987</li>
            </ul>
          </div>
          <div className="tb-footer__col">
            <h4 className="tb-footer__heading">Working Hours</h4>
            <ul className="tb-footer__list">
              <li>Monday to Friday</li>
              <li>09:00am to 06:00pm</li>
              <li>Excluding weekends</li>
              <li>and public holidays</li>
            </ul>
          </div>
          <div className="tb-footer__col">
            <h4 className="tb-footer__heading">Correspondence</h4>
            <ul className="tb-footer__list">
              <li><a href="mailto:hello@2birds.asia">hello@2birds.asia</a></li>
              <li><a href="tel:+6585953945">Mobile · +65 8595 3945</a></li>
              <li>Fax · +65 6917 8977</li>
            </ul>
          </div>
        </div>
        <div className="tb-footer__legal">
          <span>© <strong style={{ fontWeight: 600 }}>2BIRDS PRIVATE LIMITED</strong> · Singapore · All rights reserved.</span>
          <span className="tb-footer__legalRight">
            <a href="privacy.html">Privacy Policy</a> · <a href="engagement.html">Engagement</a> · <a href="terms.html">Legal Statement</a>
          </span>
        </div>
      </div>
    </footer>);
}

function FloatingWhatsapp() {
  return (
    <a
      className="tb-fab-wa"
      href="https://wa.me/85953945"
      target="_blank"
      rel="noopener"
      aria-label="Chat with 2birds on WhatsApp"
    >
      <span className="tb-fab-wa__ring" aria-hidden="true" />
      <svg className="tb-fab-wa__icon" viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
        <path fill="currentColor" d="M16.02 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.59 4.46 1.72 6.41L3.2 28.8l6.55-1.71a12.78 12.78 0 0 0 6.27 1.61h.01c7.06 0 12.8-5.73 12.8-12.8S23.09 3.2 16.02 3.2zm0 23.45h-.01a10.6 10.6 0 0 1-5.42-1.49l-.39-.23-3.89 1.02 1.04-3.79-.25-.39a10.64 10.64 0 1 1 19.62-5.77c0 5.87-4.77 10.65-10.7 10.65zm5.84-7.97c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.51-.16-.72.16-.21.32-.83 1.04-1.02 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59a9.66 9.66 0 0 1-1.78-2.22c-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.53-.54-.72-.55l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.66 0 1.57 1.14 3.08 1.3 3.29.16.21 2.25 3.43 5.45 4.81.76.33 1.35.52 1.82.67.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.16-1.52.27-.74.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37z" />
      </svg>
    </a>
  );
}

Object.assign(window, {
  EyebrowLockup, NavBar, PageHero, SectionHead, CTAPanel, Footer, FloatingWhatsapp
});

// Auto-mount a floating WhatsApp button on every page using shared.jsx
(function mountFab() {
  function inject() {
    if (document.querySelector(".tb-fab-wa")) return;
    var a = document.createElement("a");
    a.className = "tb-fab-wa";
    a.href = "https://wa.me/85953945";
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Chat with 2birds on WhatsApp");
    a.innerHTML =
      '<span class="tb-fab-wa__ring" aria-hidden="true"></span>' +
      '<svg class="tb-fab-wa__icon" viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">' +
      '<path fill="currentColor" d="M16.02 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.59 4.46 1.72 6.41L3.2 28.8l6.55-1.71a12.78 12.78 0 0 0 6.27 1.61h.01c7.06 0 12.8-5.73 12.8-12.8S23.09 3.2 16.02 3.2zm0 23.45h-.01a10.6 10.6 0 0 1-5.42-1.49l-.39-.23-3.89 1.02 1.04-3.79-.25-.39a10.64 10.64 0 1 1 19.62-5.77c0 5.87-4.77 10.65-10.7 10.65zm5.84-7.97c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.51-.16-.72.16-.21.32-.83 1.04-1.02 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59a9.66 9.66 0 0 1-1.78-2.22c-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.53-.54-.72-.55l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.66 0 1.57 1.14 3.08 1.3 3.29.16.21 2.25 3.43 5.45 4.81.76.33 1.35.52 1.82.67.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.16-1.52.27-.74.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37z" />' +
      '</svg>';
    document.body.appendChild(a);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
// REVEAL_OBSERVER_HOOK
// Scroll-driven reveal. Deliberately NOT using IntersectionObserver: its
// callbacks do not fire reliably inside some sandboxed preview iframes, which
// would leave every .tb-reveal section stuck at opacity:0 forever (the whole
// page below the hero, videos included, goes blank). A getBoundingClientRect
// check on scroll/resize works everywhere and still gives the on-scroll cascade.
(function initRevealObserver() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    const revealAll = () => document.querySelectorAll('.tb-reveal').forEach(el => el.classList.add('is-in'));
    revealAll();
    setTimeout(revealAll, 300);
    setTimeout(revealAll, 1200);
    return;
  }

  // Reveal anything whose top edge has entered the lower ~92% of the viewport.
  let healArmed = false;
  function check() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const trigger = vh * 0.92;
    const els = document.querySelectorAll('.tb-reveal:not(.is-in)');
    let added = 0;
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect();
      // Reveal once the element's top has crossed the trigger line. No lower
      // bound, so elements jumped past (anchor links, restored scroll) still
      // end up visible rather than stranded at opacity:0.
      if (r.top < trigger) { els[i].classList.add('is-in'); added++; }
    }
    if (added && !healArmed) { healArmed = true; setTimeout(healIfStuck, 1500); }
  }

  // Some sandboxed preview iframes pause the document timeline, so the CSS
  // opacity/transform transition on .is-in never advances and content would
  // stay blank forever. If a revealed element hasn't actually become visible,
  // snap all reveals to their end state (kills the transition, keeps content).
  function healIfStuck() {
    const probe = document.querySelector('.tb-reveal.is-in');
    if (!probe) return;
    if (parseFloat(getComputedStyle(probe).opacity) < 0.85) {
      document.documentElement.classList.add('tb-reveal-snap');
    }
  }

  let raf = 0;
  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; check(); });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // Initial passes — React (via in-browser Babel) may mount the content well
  // after first paint, so re-check on a few timers and whenever the DOM grows.
  check();
  [120, 400, 900, 1800, 3000].forEach(t => setTimeout(check, t));

  function startMutationWatch() {
    if (!('MutationObserver' in window)) return;
    let moRaf = 0;
    const mo = new MutationObserver(() => {
      if (moRaf) return;
      moRaf = requestAnimationFrame(() => { moRaf = 0; check(); });
    });
    const target = document.getElementById('root') || document.body;
    if (target) mo.observe(target, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 12000);
  }
  if (document.body) startMutationWatch();
  else document.addEventListener('DOMContentLoaded', startMutationWatch);
})();
