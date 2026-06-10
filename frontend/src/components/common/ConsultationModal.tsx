import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { getSiteModalManager } from '../../utils/siteModalManager';
import './ConsultationModal.css';

type Props = {
  show: boolean;
  onHide: () => void;
  title?: string;
  description?: string;
  source?: string;
};

import { normalizePhone, PHONE_PATTERN } from '../../utils/validation';

const ConsultationModal: React.FC<Props> = ({
  show,
  onHide,
  title = 'Получить консультацию',
  description = 'Оставьте номер телефона и менеджер ответит на ваши вопросы.',
  source,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const phoneFormatted = useMemo(() => normalizePhone(phone), [phone]);
  const phoneValid = PHONE_PATTERN.test(phoneFormatted);

  const canSubmit = agreed && phoneValid;

  const handleClose = () => {
    onHide();
    setStatus('idle');
  };

  const onHideRef = useRef(handleClose);
  useEffect(() => {
    onHideRef.current = handleClose;
  });

  useBodyScrollLock(show, () => onHideRef.current());

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Пока без бэкенда: имитируем успешную отправку.
    // Если захочешь — подключим к реальному endpoint (например /api/leads).
    void source;
    void name;
    void phoneFormatted;
    void message;

    setStatus('success');
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      backdrop={false}
      enforceFocus={false}
      restoreFocus
      scrollable
      manager={getSiteModalManager()}
      container={typeof document !== 'undefined' ? document.body : undefined}
      className="consultation-modal"
      dialogClassName="consultation-modal-dialog"
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {status === 'success' ? (
          <Alert variant="success" className="mb-0">
            <div className="fw-bold mb-1">Спасибо за обращение!</div>
            <div>Менеджер свяжется с вами в ближайшее время.</div>
          </Alert>
        ) : (
          <>
            <p className="text-muted mb-3">{description}</p>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Control
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Имя"
                  autoComplete="name"
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Control
                  value={phoneFormatted}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  inputMode="tel"
                  autoComplete="tel"
                  isInvalid={phone.length > 0 && !phoneValid}
                />
                <Form.Control.Feedback type="invalid">
                  Введите телефон в формате +7 (999) 999-99-99
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Сообщение"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  label={
                    <>
                      Нажимая на кнопку, я даю согласие на обработку персональных данных
                    </>
                  }
                />
              </Form.Group>

              <div className="d-grid">
                <Button type="submit" className="btn-dealership-dark w-100" disabled={!canSubmit}>
                  Перезвоните мне
                </Button>
              </div>
            </Form>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ConsultationModal;
