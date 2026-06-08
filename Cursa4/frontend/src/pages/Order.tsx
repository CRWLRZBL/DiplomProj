import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Card, Button } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OrderWizard from '../components/orders/OrderWizard';
import { orderService } from '../services/api/orderService';
import { carService } from '../services/api/carService';
import { Car } from '../services/models/car';
import Icon from '../components/common/Icon';
import CustomerInfoCard from '../components/profile/CustomerInfoCard';
import '../styles/DealershipPage.css';

const Order: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const carId = searchParams.get('carId');
  const modelId = searchParams.get('modelId');
  const configurationId = searchParams.get('configurationId');
  const color = searchParams.get('color');
  const optionIds = searchParams.get('optionIds');

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      navigate('/profile?redirect=order');
      return;
    }

    if (carId) {
      loadCar();
    } else if (modelId) {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [carId, modelId, user, isLoading, navigate]);

  const loadCar = async () => {
    try {
      setLoading(true);
      const carData = await carService.getCarById(Number(carId));
      setCar(carData);
    } catch (err) {
      setError('Ошибка при загрузке автомобиля');
      console.error('Error loading car:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCreate = async (orderData: {
    carId?: number;
    modelId?: number;
    configurationId: number;
    color?: string;
    optionIds: number[];
    totalPrice: number;
  }) => {
    if (!user) {
      setError('Необходимо авторизоваться');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const result = await orderService.createOrder({
        userId: user.userId,
        carId: orderData.carId,
        modelId: orderData.modelId,
        configurationId: orderData.configurationId,
        color: orderData.color,
        optionIds: orderData.optionIds,
      });

      setSuccess(
        `Заказ №${result.orderId} успешно создан! ${orderData.carId ? '' : 'Автомобиль будет создан со статусом "В ожидании".'}`
      );

      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      const errorMessage =
        e.response?.data?.error ||
        e.response?.data?.message ||
        e.message ||
        'Ошибка при создании заказа. Попробуйте позже.';

      setError(errorMessage);
      setSuccess('');
    }
  };

  if (!user) {
    return (
      <Container className="py-4">
        <Alert variant="warning">Для оформления заказа необходимо авторизоваться</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <div className="dp-page">
        <Container className="text-center py-5 text-muted">Загрузка…</Container>
      </div>
    );
  }

  const stepBadge =
    modelId && configurationId ? 'Подтверждение заказа' : 'Шаг 2 из 3';

  return (
    <div className="dp-page">
      <Container>
        <div className="dp-pageHead d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <h1 className="dp-pageTitle mb-2">Оформление заказа</h1>
            <p className="dp-pageSub mb-0">
              {modelId && configurationId
                ? 'Проверьте параметры автомобиля и подтвердите заказ'
                : 'Настройте параметры автомобиля и выберите дополнительные опции'}
            </p>
          </div>
          <span className="dp-pill">{stepBadge}</span>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
            <Alert.Heading>Ошибка</Alert.Heading>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-4">
            <Alert.Heading>Успешно!</Alert.Heading>
            {success}
          </Alert>
        )}

        <Row className="g-4">
          <Col lg={8}>
            {carId ? (
              <OrderWizard carId={Number(carId)} onOrderCreate={handleOrderCreate} />
            ) : modelId ? (
              <OrderWizard
                modelId={Number(modelId)}
                configurationId={configurationId ? Number(configurationId) : undefined}
                color={color || undefined}
                optionIds={optionIds ? optionIds.split(',').map((id) => Number(id)) : []}
                onOrderCreate={handleOrderCreate}
              />
            ) : (
              <Card className="dp-card text-center py-5">
                <Card.Body className="px-4">
                  <div className="mb-3" style={{ color: 'var(--dp-coral)' }}>
                    <Icon name="directions_car" style={{ fontSize: '4rem' }} />
                  </div>
                  <h3 className="mb-3">Выберите автомобиль для заказа</h3>
                  <p className="text-muted mb-4">
                    Перейдите в каталог и выберите автомобиль для оформления заказа
                  </p>
                  <Button className="btn-dealership-dark" size="lg" onClick={() => navigate('/catalog')}>
                    Перейти в каталог
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col lg={4}>
            <div className="sticky-sidebar">
              <CustomerInfoCard user={user} className="mb-4" />

              <Card className="dp-card">
                <Card.Header className="dp-cardHeader">
                  <Icon name="description" style={{ fontSize: '1.25rem' }} />
                  Процесс заказа
                </Card.Header>
                <Card.Body className="dp-cardBody">
                  <div className="order-steps">
                    <div className="order-step completed mb-3">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <div className="fw-semibold">Выбор автомобиля</div>
                        <div className="text-muted small">Завершено</div>
                      </div>
                    </div>
                    <div className="order-step active mb-3">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <div className="fw-semibold">Конфигурация</div>
                        <div className="text-muted small">В процессе</div>
                      </div>
                    </div>
                    <div className="order-step mb-3">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <div className="fw-semibold">Подтверждение</div>
                        <div className="text-muted small">Ожидание</div>
                      </div>
                    </div>
                    <div className="order-step">
                      <div className="step-number">4</div>
                      <div className="step-content">
                        <div className="fw-semibold">Получение</div>
                        <div className="text-muted small">Ожидание</div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Order;
