// Pauses the CSS marquee while it is off-screen or the tab is hidden.
// (Under reduced motion the CSS shows a static, wrapped list instead.)
const marquee = document.querySelector<HTMLElement>('.marquee');
if (marquee) {
  let visible = false;
  const sync = () => marquee.classList.toggle('is-paused', !visible || document.hidden);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    sync();
  }).observe(marquee);
  document.addEventListener('visibilitychange', sync);
}
