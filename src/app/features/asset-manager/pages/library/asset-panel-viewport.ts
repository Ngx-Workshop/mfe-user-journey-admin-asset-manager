import type { DestroyRef } from '@angular/core';

/** Size owned content, without depending on the design system's private markup. */
export function observeAssetPanel(
  body: HTMLElement,
  destroyRef: DestroyRef,
  setHeight: (height: number | null) => void,
  container?: HTMLElement,
  stackAt = container ? 1200 : 900
): void {
  const panel = body.closest('ngx-panel')!;
  const viewport = body.ownerDocument.defaultView!;
  let frame = 0;
  const measure = () => {
    if (viewport.innerWidth <= stackAt) {
      setHeight(null);
      return;
    }
    const bounds = panel.getBoundingClientRect();
    const chrome =
      bounds.height - body.getBoundingClientRect().height;
    setHeight(
      Math.max(
        0,
        Math.floor(
          (container
            ? container.getBoundingClientRect().bottom
            : viewport.innerHeight - 16) -
            bounds.top -
            chrome
        )
      )
    );
  };
  const schedule = () => {
    viewport.cancelAnimationFrame(frame);
    frame = viewport.requestAnimationFrame(measure);
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(panel);
  observer.observe(body);
  if (container) observer.observe(container);
  viewport.addEventListener('resize', schedule);
  viewport.addEventListener('scroll', schedule, {
    capture: true,
    passive: true,
  });
  measure();
  destroyRef.onDestroy(() => {
    observer.disconnect();
    viewport.cancelAnimationFrame(frame);
    viewport.removeEventListener('resize', schedule);
    viewport.removeEventListener('scroll', schedule, true);
  });
}
