import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type Reminder = {
  nextServiceDate?: string; // YYYY-MM-DD
  currentMileage?: number;
  nextServiceMileage?: number;
};

function storageKey(userId: number): string {
  return `maintenanceReminder:v1:${userId}`;
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export const MaintenanceReminders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.userId ?? 0;

  const [reminder, setReminder] = useState<Reminder>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (raw) setReminder(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, [userId]);

  const status = useMemo(() => {
    const d = daysUntil(reminder.nextServiceDate);
    const mileageLeft =
      typeof reminder.currentMileage === 'number' && typeof reminder.nextServiceMileage === 'number'
        ? reminder.nextServiceMileage - reminder.currentMileage
        : null;

    if (d != null && d <= 0) return { variant: 'danger' as const, text: 'ТО просрочено — лучше записаться.' };
    if (mileageLeft != null && mileageLeft <= 0)
      return { variant: 'danger' as const, text: 'Пробег для ТО превышен — лучше записаться.' };
    if ((d != null && d <= 14) || (mileageLeft != null && mileageLeft <= 500))
      return { variant: 'warning' as const, text: 'ТО скоро — можно выбрать время заранее.' };
    return { variant: 'success' as const, text: 'Всё ок. Напоминание будет в профиле.' };
  }, [reminder]);

  const save = () => {
    if (!userId) return;
    setSaved(false);
    setError('');
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(reminder));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError('Не удалось сохранить. Проверьте настройки браузера (localStorage).');
    }
  };

  const requestService = () => {
    const lines = [
      'Хочу записаться на ТО.',
      reminder.nextServiceDate ? `Плановая дата: ${reminder.nextServiceDate}` : null,
      typeof reminder.currentMileage === 'number' ? `Текущий пробег: ${reminder.currentMileage} км` : null,
      typeof reminder.nextServiceMileage === 'number' ? `ТО на пробеге: ${reminder.nextServiceMileage} км` : null,
    ].filter(Boolean);

    // MVP: отправляем пользователя в чат, где он вставит это сообщение.
    navigate('/messages');
    setTimeout(() => {
      try {
        navigator.clipboard.writeText(lines.join('\n'));
      } catch {
        // ignore clipboard failures
      }
    }, 0);
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-light">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span className="fw-semibold">Пульс авто: напоминания о ТО</span>
          <span className={`badge bg-${status.variant}`}>{status.text}</span>
        </div>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {saved && <Alert variant="success">Сохранено.</Alert>}

        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Следующая дата ТО</Form.Label>
              <Form.Control
                type="date"
                value={reminder.nextServiceDate || ''}
                onChange={(e) => setReminder((p) => ({ ...p, nextServiceDate: e.target.value || undefined }))}
              />
              <Form.Text className="text-muted">
                Если дата близко — приложение подсветит напоминание.
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Текущий пробег (км)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={100}
                value={typeof reminder.currentMileage === 'number' ? String(reminder.currentMileage) : ''}
                onChange={(e) =>
                  setReminder((p) => ({
                    ...p,
                    currentMileage: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>ТО на пробеге (км)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={100}
                value={typeof reminder.nextServiceMileage === 'number' ? String(reminder.nextServiceMileage) : ''}
                onChange={(e) =>
                  setReminder((p) => ({
                    ...p,
                    nextServiceMileage: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
              <Form.Text className="text-muted">Например, 15000, 30000 и т.д.</Form.Text>
            </Form.Group>
          </Col>
          <Col md={6} className="d-flex align-items-end">
            <div className="w-100 d-flex gap-2 justify-content-end">
              <Button variant="outline-secondary" onClick={() => setReminder({})}>
                Очистить
              </Button>
              <Button variant="primary" onClick={save}>
                Сохранить
              </Button>
            </div>
          </Col>
        </Row>

        <div className="mt-4 d-flex justify-content-end">
          <Button className="btn-dealership-coral" onClick={requestService}>
            Записаться в сервис (через чат)
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

