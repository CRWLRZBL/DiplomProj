import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/api/orderService';
import {
  addMonths,
  parseNonNegativeInt,
  sanitizeDigits,
  toIsoDate,
} from '../../utils/validation';

type Reminder = {
  nextServiceDate?: string;
  currentMileage?: number;
  nextServiceMileage?: number;
};

const MILEAGE_MAX_DIGITS = 7;
const MILEAGE_MAX = 9_999_999;

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

function defaultServiceDateFromOrders(orderDates: string[]): string {
  const completed = orderDates
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  const base = completed[0] ?? new Date();
  return toIsoDate(addMonths(base, 6));
}

export const MaintenanceReminders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.userId ?? 0;

  const [reminder, setReminder] = useState<Reminder>({});
  const [mileageText, setMileageText] = useState('');
  const [serviceMileageText, setServiceMileageText] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);

  const todayIso = toIsoDate(new Date());
  const maxDateIso = toIsoDate(addMonths(new Date(), 60));

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      let stored: Reminder = {};
      try {
        const raw = localStorage.getItem(storageKey(userId));
        if (raw) stored = JSON.parse(raw) as Reminder;
      } catch {
        // ignore
      }

      if (!stored.nextServiceDate) {
        try {
          const orders = await orderService.getUserOrders(userId);
          const saleDates = orders
            .filter((o) => o.orderStatus === 'Completed')
            .map((o) => o.orderDate);
          stored.nextServiceDate = defaultServiceDateFromOrders(saleDates);
        } catch {
          stored.nextServiceDate = toIsoDate(addMonths(new Date(), 6));
        }
      }

      setReminder(stored);
      setMileageText(
        typeof stored.currentMileage === 'number' ? String(stored.currentMileage) : ''
      );
      setServiceMileageText(
        typeof stored.nextServiceMileage === 'number' ? String(stored.nextServiceMileage) : ''
      );
      setInitialized(true);
    };

    void load();
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

    if (mileageText) {
      const m = parseNonNegativeInt(mileageText);
      if (m == null) {
        setError('Текущий пробег: только целое число от 0');
        return;
      }
      if (m > MILEAGE_MAX) {
        setError(`Текущий пробег: не более ${MILEAGE_MAX.toLocaleString('ru-RU')} км`);
        return;
      }
      reminder.currentMileage = m;
    } else {
      reminder.currentMileage = undefined;
    }

    if (serviceMileageText) {
      const m = parseNonNegativeInt(serviceMileageText);
      if (m == null) {
        setError('ТО на пробеге: только целое число от 0');
        return;
      }
      if (m > MILEAGE_MAX) {
        setError(`ТО на пробеге: не более ${MILEAGE_MAX.toLocaleString('ru-RU')} км`);
        return;
      }
      reminder.nextServiceMileage = m;
    } else {
      reminder.nextServiceMileage = undefined;
    }

    if (reminder.nextServiceDate && reminder.nextServiceDate < todayIso) {
      setError('Дата ТО не может быть в прошлом');
      return;
    }

    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(reminder));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setError('Не удалось сохранить. Проверьте настройки браузера.');
    }
  };

  const requestService = () => {
    const lines = [
      'Хочу записаться на ТО.',
      reminder.nextServiceDate ? `Плановая дата: ${reminder.nextServiceDate}` : null,
      typeof reminder.currentMileage === 'number' ? `Текущий пробег: ${reminder.currentMileage} км` : null,
      typeof reminder.nextServiceMileage === 'number' ? `ТО на пробеге: ${reminder.nextServiceMileage} км` : null,
    ].filter(Boolean);

    navigate('/messages');
    setTimeout(() => {
      try {
        navigator.clipboard.writeText(lines.join('\n'));
      } catch {
        // ignore
      }
    }, 0);
  };

  if (!initialized) return null;

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
                min={todayIso}
                max={maxDateIso}
                value={reminder.nextServiceDate || ''}
                onChange={(e) =>
                  setReminder((p) => ({ ...p, nextServiceDate: e.target.value || undefined }))
                }
              />
              <Form.Text className="text-muted">
                По умолчанию — через 6 месяцев после даты продажи. Нельзя выбрать прошлую дату.
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Текущий пробег (км)</Form.Label>
              <Form.Control
                type="text"
                inputMode="numeric"
                value={mileageText}
                onChange={(e) => setMileageText(sanitizeDigits(e.target.value, MILEAGE_MAX_DIGITS))}
                placeholder="0"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>ТО на пробеге (км)</Form.Label>
              <Form.Control
                type="text"
                inputMode="numeric"
                value={serviceMileageText}
                onChange={(e) =>
                  setServiceMileageText(sanitizeDigits(e.target.value, MILEAGE_MAX_DIGITS))
                }
                placeholder="15000"
              />
              <Form.Text className="text-muted">Например, 15000, 30000 и т.д.</Form.Text>
            </Form.Group>
          </Col>
          <Col md={6} className="d-flex align-items-end">
            <div className="w-100 d-flex gap-2 justify-content-end">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setReminder({});
                  setMileageText('');
                  setServiceMileageText('');
                }}
              >
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
