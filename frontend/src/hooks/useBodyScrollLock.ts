import { useEffect, useRef } from 'react';

const OVERLAY_CLASS = 'site-modal-overlay';

/** Блокирует прокрутку и добавляет полноэкранное затемнение. Позицию страницы не сбрасывает. */
export function useBodyScrollLock(locked: boolean, onOverlayClick?: () => void) {
  const onOverlayClickRef = useRef(onOverlayClick);
  onOverlayClickRef.current = onOverlayClick;

  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    const html = document.documentElement;
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyPaddingRight: document.body.style.paddingRight,
    };

    const overlay = document.createElement('div');
    overlay.className = OVERLAY_CLASS;
    overlay.setAttribute('aria-hidden', 'true');
    const handleOverlayClick = () => onOverlayClickRef.current?.();
    overlay.addEventListener('click', handleOverlayClick);
    document.body.appendChild(overlay);

    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.classList.add('site-modal-open');

    return () => {
      overlay.removeEventListener('click', handleOverlayClick);
      overlay.remove();
      document.body.classList.remove('site-modal-open');
      html.style.overflow = prev.htmlOverflow;
      document.body.style.overflow = prev.bodyOverflow;
      document.body.style.paddingRight = prev.bodyPaddingRight;
    };
  // onOverlayClick намеренно не в deps — стабильный overlay без мерцания
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);
}
