/**
 * Home page scroll effects (GSAP ScrollTrigger):
 *  - pinned horizontal "Discography Vault": scrolling down glides the records sideways
 *  - hero title and sleeve drift apart as you scroll out of the hero
 * Phones and reduced-motion get a plain swipeable row instead.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
let mm: gsap.MatchMedia | null = null;

function init() {
  mm?.revert();
  mm = gsap.matchMedia();
  const vault = document.querySelector<HTMLElement>('[data-vault]');
  const pin = vault?.querySelector<HTMLElement>('[data-vault-pin]');
  const track = vault?.querySelector<HTMLElement>('[data-vault-track]');
  const bar = vault?.querySelector<HTMLElement>('[data-vault-bar]');
  const hero = document.querySelector<HTMLElement>('[data-hero]');

  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    if (pin && track) {
      const distance = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'center center',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => bar && gsap.set(bar, { scaleX: self.progress }),
        },
      });
    }
    if (hero) {
      const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 };
      gsap.to(hero.querySelector('.hero-title'), { yPercent: -18, ease: 'none', scrollTrigger: st });
      gsap.to(hero.querySelector('.hero-show'), { yPercent: 14, rotate: -4, ease: 'none', scrollTrigger: st });
      gsap.to(hero.querySelector('.visualizer'), { autoAlpha: 0, ease: 'none', scrollTrigger: st });
    }
  });
}

let gen = 0;
document.addEventListener('astro:page-load', () => {
  if (!document.querySelector('[data-vault], [data-hero]')) return;
  const mine = ++gen;
  // the vault is below the fold: set it up once the page has loaded and the browser is idle
  const start = () => {
    const run = () => mine === gen && (init(), document.fonts?.ready.then(() => ScrollTrigger.refresh()));
    'requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 1500 }) : setTimeout(run, 300);
  };
  document.readyState === 'complete' ? start() : addEventListener('load', start, { once: true });
});
document.addEventListener('astro:before-swap', () => {
  gen++;
  mm?.revert();
  mm = null;
});
