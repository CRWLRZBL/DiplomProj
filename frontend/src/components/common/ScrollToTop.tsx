import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import './ScrollToTop.css';

const ScrollToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="site-scroll-top"
      aria-label="Наверх"
      title="Наверх"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <Icon name="keyboard_arrow_up" style={{ fontSize: '1.5rem' }} />
    </button>
  );
};

export default ScrollToTop;
