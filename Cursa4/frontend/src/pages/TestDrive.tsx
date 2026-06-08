import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { carService } from '../services/api/carService';
import { testDriveService } from '../services/api/testDriveService';
import type { Car } from '../services/models/car';
import type { TestDriveRouteType, TestDriveSlot } from '../services/models/testDrive';
import { isGeneratedCatalogVin, resolveCatalogImageSrc } from '../utils/catalogImage';

function toUtcDateString(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00Z`;
}

function fmtLocalTime(isoUtc: string): string {
  const d = new Date(isoUtc);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function fmtLocalDate(isoUtc: string): string {
  const d = new Date(isoUtc);
  return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
}

const ROUTE_LABELS: Record<TestDriveRouteType, string> = {
  city: 'Дворы/город',
  highway: 'Шоссе',
  offroad: 'Бездорожье',
};

const TestDrive: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const carId = Number(searchParams.get('carId') || 0);

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [day, setDay] = useState(() => new Date());
  const dayUtc = useMemo(() => toUtcDateString(day), [day]);

  const [slots, setSlots] = useState<TestDriveSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [routeType, setRouteType] = useState<TestDriveRouteType>('city');
  const [childSeat, setChildSeat] = useState(false);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<{ orderId: number; startsAtUtc: string } | null>(null);

  useEffect(() => {
    if (!carId) {
      setLoading(false);
      setError('Не указан автомобиль для тест-драйва.');
      return;
    }
    (async () => {
      setLoading(true);
      setError('');
      try {
        const c = await carService.getCarById(carId);
        setCar(c);
      } catch {
        setError('Не удалось загрузить автомобиль.');
      } finally {
        setLoading(false);
      }
    })();
  }, [carId]);

  useEffect(() => {
    if (!carId) return;
    let cancelled = false;
    (async () => {
      setError('');
      try {
        const list = await testDriveService.getSlots(dayUtc);
        if (!cancelled) {
          setSlots(list);
          setSelectedSlot(list[0]?.startsAtUtc || '');
        }
      } catch {
        if (!cancelled) setError('Не удалось загрузить слоты тест-драйва.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [carId, dayUtc]);

  if (!user) {
    return <Navigate to="/profile?redirect=/test-drive" replace />;
  }

  const carTitle = car
    ? car.title || `${car.brandName} ${car.modelName}`.trim()
    : '';

  return (
    <div className="test-drive-page py-4">
      <Container>
        <Row className="mb-3">
          <Col>
            <h1 className="h2 mb-2">Запись на тест-драйв</h1>
            <p className="text-muted mb-0">
              Выберите время и маршрут — запись создастся мгновенно.
            </p>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
            Запись создана. Заявка №{success.orderId}. Время: {fmtLocalDate(success.startsAtUtc)}{' '}
            {fmtLocalTime(success.startsAtUtc)}
          </Alert>
        )}

        <Row>
          <Col lg={7}>
            <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <span className="fw-semibold">Параметры тест-драйва</span>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Дата</Form.Label>
                        <Form.Control
                          type="date"
                          value={new Date(day).toISOString().slice(0, 10)}
                          onChange={(e) => {
                            const [y, m, d] = e.target.value.split('-').map(Number);
                            setDay(new Date(Date.UTC(y, (m || 1) - 1, d || 1)));
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Время</Form.Label>
                        <Form.Select
                          value={selectedSlot}
                          onChange={(e) => setSelectedSlot(e.target.value)}
                          disabled={slots.length === 0}
                        >
                          {slots.length === 0 ? (
                            <option value="">Нет доступных слотов</option>
                          ) : (
                            slots.map((s) => (
                              <option key={s.startsAtUtc} value={s.startsAtUtc}>
                                {fmtLocalTime(s.startsAtUtc)} ({s.durationMinutes} мин)
                              </option>
                            ))
                          )}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Маршрут</Form.Label>
                        <Form.Select
                          value={routeType}
                          onChange={(e) => setRouteType(e.target.value as TestDriveRouteType)}
                        >
                          <option value="city">{ROUTE_LABELS.city}</option>
                          <option value="highway">{ROUTE_LABELS.highway}</option>
                          <option value="offroad">{ROUTE_LABELS.offroad}</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6} className="d-flex align-items-end">
                      <Form.Check
                        type="switch"
                        id="child-seat"
                        label="Будет ребёнок в кресле"
                        checked={childSeat}
                        onChange={(e) => setChildSeat(e.target.checked)}
                      />
                    </Col>

                    <Col>
                      <Form.Group>
                        <Form.Label>Комментарий (опционально)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          maxLength={500}
                          placeholder="Например: хочу проверить парковку / шум на скорости / клиренс."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>

                <div className="d-flex justify-content-end mt-4">
                  <Button
                    variant="primary"
                    disabled={sending || !selectedSlot || !carId}
                    onClick={async () => {
                      setSending(true);
                      setError('');
                      try {
                        const res = await testDriveService.book({
                          userId: user.userId,
                          carId,
                          startsAtUtc: selectedSlot,
                          routeType,
                          childSeat,
                          notes: notes.trim() || undefined,
                        });
                        setSuccess({ orderId: res.orderId, startsAtUtc: res.startsAtUtc });
                      } catch (e: unknown) {
                        const err = e as { response?: { data?: { error?: string; message?: string } }; message?: string };
                        const msg =
                          err?.response?.data?.error ||
                          err?.response?.data?.message ||
                          err?.message ||
                          'Не удалось записаться на тест-драйв.';
                        setError(msg);
                      } finally {
                        setSending(false);
                      }
                    }}
                  >
                    {sending ? 'Записываем…' : 'Записаться'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={5}>
            <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <span className="fw-semibold">Автомобиль</span>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-muted">Загрузка…</div>
                ) : car ? (
                  <>
                    {resolveCatalogImageSrc(car) && (
                      <img
                        src={resolveCatalogImageSrc(car)}
                        alt={carTitle}
                        className="rounded mb-3 w-100"
                        style={{ maxHeight: 160, objectFit: 'cover' }}
                      />
                    )}
                    <div className="fw-semibold mb-2">{carTitle}</div>
                    <div className="small text-muted">
                      {car.listingType === 'Used' ? 'С пробегом' : 'Новый'}
                      {car.modelYear ? ` · ${car.modelYear} г.` : ''}
                      {car.mileage && car.mileage > 0
                        ? ` · ${car.mileage.toLocaleString('ru-RU')} км`
                        : ''}
                      <br />
                      Цвет: {car.color || 'не указан'}
                      <br />
                      Кузов: {car.bodyType || '—'}
                      <br />
                      Статус: {car.status === 'Available' ? 'В наличии' : car.status}
                      {!isGeneratedCatalogVin(car.vin) && (
                        <>
                          <br />
                          VIN: {car.vin}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-muted">Не удалось загрузить данные.</div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default TestDrive;
