// Global "pause motion" state (WCAG 2.2.2). The class lives on <html> so CSS can react too.
// Nothing is persisted.
const root = document.documentElement;
export const isPaused = () => root.classList.contains('motion-paused');
export const onPauseChange = (cb: (paused: boolean) => void) => {
  new MutationObserver(() => cb(isPaused())).observe(root, { attributes: true, attributeFilter: ['class'] });
};
export const setPaused = (paused: boolean) => root.classList.toggle('motion-paused', paused);
