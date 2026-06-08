import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Badge, Button, Card, ListGroup } from 'react-bootstrap';
import { carService } from '../services/api/carService';
import { Car } from '../services/models/car';
import { utils, getBodyTypeLabel, getFuelTypeLabel } from '../utils/constants';
import {
  resolveCatalogImageSrc,
  resolvePublicImageUrl,
  handleCatalogImageError,
  isGeneratedCatalogVin,
} from '../utils/catalogImage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';

const CatalogCarDetail: React.FC = () => {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!carId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await carService.getCarById(Number(carId));
        setCar(data);
        setActiveImage(0);
      } catch {
        setError('Не удалось загрузить карточку автомобиля.');
      } finally {
        setLoading(false);
      }
    })();
  }, [carId]);

  if (loading) return <LoadingSpinner message="Загружаем автомобиль..." />;
  if (error || !car) {
    return (
      <Container className="py-4">
        <ErrorAlert message={error || 'Автомобиль не найден'} onRetry={() => navigate(0)} />
        <Link to="/catalog">← В каталог</Link>
      </Container>
    );
  }

  const images = (
    car.imageUrls && car.imageUrls.length > 0
      ? car.imageUrls
      : car.imageUrl
        ? [car.imageUrl]
        : [resolveCatalogImageSrc(car)]
  )
    .map((u) => resolvePublicImageUrl(u))
    .filter(Boolean);
  const displayPrice =
    car.priceWithDiscounts != null && car.priceWithDiscounts > 0
      ? car.priceWithDiscounts
      : car.basePrice;
  const showFrom = car.listingType !== 'Used';
  const configId = car.configuratorModelId ?? car.modelId;

  const specs: { label: string; value?: string | number | null }[] = [
    { label: 'Год выпуска', value: car.modelYear || '—' },
    { label: 'Поколение', value: car.generation },
    { label: 'Состояние', value: car.condition },
    { label: 'Модификация', value: car.trim },
    { label: 'Объём двигателя', value: car.engineCapacity ? `${car.engineCapacity} л` : null },
    { label: 'Тип двигателя', value: getFuelTypeLabel(car.fuelType) },
    { label: 'Коробка передач', value: car.transmission },
    { label: 'Привод', value: car.driveType },
    { label: 'Комплектация', value: car.trim },
    { label: 'Тип кузова', value: getBodyTypeLabel(car.bodyType) },
    { label: 'Цвет', value: car.color },
    { label: 'Пробег', value: car.mileage && car.mileage > 0 ? `${car.mileage.toLocaleString('ru-RU')} км` : 'Новый' },
    ...(isGeneratedCatalogVin(car.vin)
      ? []
      : [{ label: 'VIN', value: car.vin }]),
  ].filter((s) => s.value);

  return (
    <Container className="py-4 catalog-detail">
      <Link to={car.listingType === 'Used' ? '/catalog?type=used' : '/catalog'} className="text-muted small">
        ← Назад в каталог
      </Link>

      <Row className="mt-3 g-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm mb-3 overflow-hidden">
            <div className="catalog-detail-main-image">
              <img
                src={images[activeImage]}
                alt={car.title || `${car.brandName} ${car.modelName}`}
                onError={handleCatalogImageError}
              />
            </div>
          </Card>
          {images.length > 1 && (
            <div className="d-flex flex-wrap gap-2">
              {images.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`catalog-thumb border p-0 rounded ${idx === activeImage ? 'border-primary border-2' : ''}`}
                  onClick={() => setActiveImage(idx)}
                >
                  <img
                    src={src}
                    alt=""
                    onError={handleCatalogImageError}
                  />
                </button>
              ))}
            </div>
          )}
        </Col>

        <Col lg={5}>
          <Badge
            bg={car.listingType === 'Used' ? 'secondary' : 'dark'}
            className="mb-2 catalog-listing-type-badge"
          >
            {car.listingType === 'Used' ? 'С пробегом' : 'Новый'}
          </Badge>
          <h1 className="h3 fw-bold">{car.title || `${car.brandName} ${car.modelName}`}</h1>
          <p className="text-muted">{car.brandName}</p>

          <div className="display-6 fw-bold mb-3">
            {utils.formatCatalogPrice(displayPrice, showFrom)}
          </div>

          {(car.tradeInDiscount || car.creditDiscount) && (
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h2 className="h6 fw-bold mb-3">Скидки от дилера</h2>
                <ListGroup variant="flush" className="bg-transparent">
                  <ListGroup.Item className="bg-transparent px-0 d-flex justify-content-between">
                    <span className="text-muted">Цена без скидки</span>
                    <span>{utils.formatPrice(car.basePrice)}</span>
                  </ListGroup.Item>
                  {car.tradeInDiscount ? (
                    <ListGroup.Item className="bg-transparent px-0 d-flex justify-content-between text-success">
                      <span>За трейд-ин</span>
                      <span>{utils.formatPrice(car.tradeInDiscount)}</span>
                    </ListGroup.Item>
                  ) : null}
                  {car.creditDiscount ? (
                    <ListGroup.Item className="bg-transparent px-0 d-flex justify-content-between text-success">
                      <span>За кредит</span>
                      <span>{utils.formatPrice(car.creditDiscount)}</span>
                    </ListGroup.Item>
                  ) : null}
                  {car.maxDiscount ? (
                    <ListGroup.Item className="bg-transparent px-0 d-flex justify-content-between fw-bold">
                      <span>Со всеми скидками</span>
                      <span>{utils.formatPrice(displayPrice)}</span>
                    </ListGroup.Item>
                  ) : null}
                </ListGroup>
              </Card.Body>
            </Card>
          )}

          <div className="d-grid gap-2 mb-4">
            {configId ? (
              <Button className="btn-dealership-dark" onClick={() => navigate(`/configurator?modelId=${configId}`)}>
                Настроить в конфигураторе
              </Button>
            ) : null}
            <Button variant="outline-dark" onClick={() => navigate(`/test-drive?carId=${car.carId}`)}>
              Записаться на тест-драйв
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('open-consultation', {
                    detail: {
                      source: 'catalog-detail',
                      title: 'Консультация по автомобилю',
                      description: `Вопрос по ${car.title || car.brandName + ' ' + car.modelName}. Оставьте контакты — менеджер перезвонит.`,
                    },
                  })
                )
              }
            >
              Получить консультацию
            </Button>
          </div>

          <Card className="border-0 bg-light mb-3">
            <Card.Body className="d-flex align-items-center gap-3">
              <div className="fs-4">🚗</div>
              <div>
                <div className="fw-bold">Авто в наличии</div>
                <div className="small text-muted">В салоне или на складе</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4 g-4">
        <Col lg={8}>
          <h2 className="h5 fw-bold mb-3">Характеристики</h2>
          <Row className="g-3">
            {specs.map((s) => (
              <Col key={s.label} sm={6}>
                <div className="catalog-spec-label small">{s.label}</div>
                <div className="catalog-spec-value fw-medium">{s.value}</div>
              </Col>
            ))}
          </Row>
        </Col>
        {car.description && (
          <Col lg={4}>
            <h2 className="h5 fw-bold mb-3">Описание</h2>
            <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>
              {car.description}
            </p>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default CatalogCarDetail;
