import React, { useEffect, useState } from 'react';
import ConsultationModal from './ConsultationModal';

export type ConsultationOpenDetail = {
  title?: string;
  description?: string;
  source?: string;
};

const ConsultationHost: React.FC = () => {
  const [show, setShow] = useState(false);
  const [options, setOptions] = useState<ConsultationOpenDetail>({});

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ConsultationOpenDetail>).detail ?? {};
      setOptions(detail);
      setShow(true);
    };

    window.addEventListener('open-consultation', handler);
    return () => window.removeEventListener('open-consultation', handler);
  }, []);

  return (
    <ConsultationModal
      show={show}
      onHide={() => setShow(false)}
      title={options.title ?? 'Получить консультацию'}
      description={
        options.description ??
        'Оставьте контакты — менеджер перезвонит или ответит в чате.'
      }
      source={options.source}
    />
  );
};

export default ConsultationHost;
