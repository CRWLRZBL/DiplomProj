import { useEffect, useRef } from 'react';

const OVERLAY_CLASS = 'site-modal-overlay';

/** Блокирует прокрутку и добавляет полноэкранное затемнение (вне transform-контейнеров). */
export function useBodyScrollLock(locked: boolean, onOverlayClick?: () => void) {
  const onOverlayClickRef = useRef(onOverlayClick);
  onOverlayClickRef.current = onOverlayClick;

  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    const scrollY = window.scrollY;
    const { overflow, position, top, left, right, width } = document.body.style;

    const overlay = document.createElement('div');
    overlay.className = OVERLAY_CLASS;
    overlay.setAttribute('aria-hidden', 'true');
    const handleOverlayClick = () => onOverlayClickRef.current?.();
    overlay.addEventListener('click', handleOverlayClick);
    document.body.appendChild(overlay);

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.classList.add('site-modal-open');

    return () => {
      overlay.removeEventListener('click', handleOverlayClick);
      overlay.remove();
      document.body.classList.remove('site-modal-open');
      document.body.style.overflow = overflow;
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.left = left;
      document.body.style.right = right;
      document.body.style.width = width;
      window.scrollTo(0, scrollY);
    };
  // onOverlayClick намеренно не в deps — стабильный overlay без мерцания
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);
}
