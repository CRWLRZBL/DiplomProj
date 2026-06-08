import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { ConfiguratorState } from '../CarConfiguratorWizard';
import { carService } from '../../../services/api/carService';
import { orderService } from '../../../services/api/orderService';
import { Configuration, AdditionalOption } from '../../../services/models/car';
import { useAuth } from '../../../context/AuthContext';
import { getModelImagePath, getModelFolderName, getConfigurationPrefix } from '../../../utils/imageUtils';
import './Step6Summary.css';

interface Step6SummaryProps {
  state: ConfiguratorState;
  onOrderCreate: () => void;
}

interface SummaryData {
  configuration?: Configuration;
  engine?: { capacity: number; fuelType: string; power?: number };
  transmission?: { type: string; description: string };
  color?: { name: string; hexCode: string };
  options?: AdditionalOption[];
}

const Step6Summary: React.FC<Step6SummaryProps> = ({ state, onOrderCreate }) => {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState<SummaryData>({});
  const [loading, setLoading] = useState(true);
  const [availableCarId, setAvailableCarId] = useState<number | null>(null);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveResult, setReserveResult] = useState<{ orderId: number; reservedUntil: string } | null>(
    null
  );
  const [reserveError, setReserveError] = useState<string>('');

  useEffect(() => {
    loadSummaryData();
  }, [state]);

  const loadSummaryData = async () => {
    try {
      setLoading(true);
      const data: SummaryData = {};
      setAvailableCarId(null);

      // Загружаем комплектацию
      if (state.selectedConfigurationId && state.selectedModel) {
        try {
          const models = await carService.getModels();
          const model = models.find(m => m.modelId === state.selectedModel?.modelId);
          if (model && model.availableCount > 0) {
            const cars = await carService.getCars();
            const car = cars.find(c => 
              c.brandName === model.brandName && 
              c.modelName === model.modelName
            );
            if (car) {
              setAvailableCarId(car.carId);
              const configs = await carService.getConfigurations(car.carId);
              data.configuration = configs.find(c => c.configurationId === state.selectedConfigurationId);
            }
          }
        } catch (err) {
          console.error('Error loading configuration:', err);
        }
      }

      // Загружаем двигатель
      if (state.selectedEngineId && state.selectedModel?.modelId) {
        try {
          const response = await fetch(`http://localhost:5171/api/cars/engines?modelId=${state.selectedModel.modelId}`);
          if (response.ok) {
            const engines = await response.json();
            if (Array.isArray(engines) && engines[state.selectedEngineId - 1]) {
              data.engine = engines[state.selectedEngineId - 1];
            }
          }
        } catch (err) {
          console.error('Error loading engine:', err);
        }
      }

      // Загружаем трансмиссию
      if (state.selectedTransmissionId && state.selectedModel?.modelId) {
        try {
          const response = await fetch(`http://localhost:5171/api/cars/transmissions?modelId=${state.selectedModel.modelId}`);
          if (response.ok) {
            const transmissions = await response.json();
            if (Array.isArray(transmissions) && transmissions[state.selectedTransmissionId - 1]) {
              data.transmission = transmissions[state.selectedTransmissionId - 1];
            }
          }
        } catch (err) {
          console.error('Error loading transmission:', err);
        }
      }

      // Загружаем цвет
      // Используем сохраненное название цвета из state
      if (state.selectedColorName) {
        try {
          const response = await fetch('http://localhost:5171/api/cars/colors');
          if (response.ok) {
            const allColors = await response.json();
            if (Array.isArray(allColors)) {
              // Ищем цвет по названию
              const colorData = allColors.find((c: any) => 
                (c.name || c.colorName) === state.selectedColorName
              );
              if (colorData) {
                data.color = {
                  name: colorData.name || colorData.colorName || state.selectedColorName,
                  hexCode: colorData.hexCode || colorData.colorCode || '#CCCCCC',
                };
              } else {
                // Fallback: используем сохраненное название
                data.color = {
                  name: state.selectedColorName,
                  hexCode: '#CCCCCC',
                };
              }
            }
          }
        } catch (err) {
          console.error('Error loading color:', err);
          // Fallback: используем сохраненное название
          if (state.selectedColorName) {
            data.color = {
              name: state.selectedColorName,
              hexCode: '#CCCCCC',
            };
          }
        }
      }

      // Загружаем опции
      if (state.selectedOptionIds.length > 0) {
        try {
          const options = await carService.getAdditionalOptions();
          data.options = options.filter(opt => state.selectedOptionIds.includes(opt.optionId));
        } catch (err) {
          console.error('Error loading options:', err);
        }
      }

      setSummaryData(data);
    } catch (err) {
      console.error('Error loading summary data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve24h = async () => {
    if (!user?.userId || !availableCarId) return;
    setReserveLoading(true);
    setReserveError('');
    setReserveResult(null);
    try {
      const res = await orderService.reserveCar24h({
        userId: user.userId,
        carId: availableCarId,
        configurationId: state.selectedConfigurationId || undefined,
        color: state.selectedColorName || undefined,
        optionIds: state.selectedOptionIds || [],
      });
      setReserveResult({ orderId: res.orderId, reservedUntil: res.reservedUntil });
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        'Не удалось забронировать автомобиль.';
      setReserveError(msg);
    } finally {
      setReserveLoading(false);
    }
  };

  const formatEngineName = (engine?: { capacity: number; fuelType: string; power?: number }) => {
    if (!engine) return '';
    const capacity = engine.capacity.toFixed(1);
    const power = engine.power ? ` (${engine.power} л.с.)` : '';
    const fuelType = engine.fuelType === 'Petrol' ? 'Бензин' : engine.fuelType;
    return `${capacity} л ${fuelType}${power}`;
  };

  const formatTransmissionName = (transmission?: { type: string; description: string }) => {
    if (!transmission) return '';
    if (transmission.type === 'Manual') return 'Механическая';
    if (transmission.type === 'Automatic') return 'Автоматическая';
    if (transmission.type === 'CVT') return 'Вариатор CVT';
    if (transmission.type === 'Robot') return 'Роботизированная';
    return transmission.type;
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="step6-summary">
      <h2 className="step-title mb-5">ВАШ АВТОМОБИЛЬ</h2>

      <Row>
        <Col lg={6}>
          {/* Изображение автомобиля */}
          <Card className="summary-car-image mb-4">
            <Card.Body className="text-center">
              <img
                src={
                  state.selectedModel?.imageUrl ||
                  (state.selectedModel 
                    ? getModelImagePath(
                        state.selectedModel.modelName || '',
                        state.selectedModel.bodyType || 'Sedan',
                        undefined,
                        summaryData.configuration?.configurationName,
                        state.selectedColorName || summaryData.color?.name
                      )
                    : '/images/cars/default.svg')
                }
                alt={`${state.selectedModel?.brandName} ${state.selectedModel?.modelName}`}
                className="summary-car-img"
                onError={(e) => {
                  // Если изображение с выбранным цветом не найдено, пробуем базовый цвет
                  if (state.selectedColorName && state.selectedModel) {
                    const fallbackPath = getModelImagePath(
                      state.selectedModel.modelName || '',
                      state.selectedModel.bodyType || 'Sedan',
                      undefined,
                      summaryData.configuration?.configurationName,
                      'Ледниковый'
                    );
                    (e.target as HTMLImageElement).src = fallbackPath;
                  } else {
                    (e.target as HTMLImageElement).src = '/images/cars/default.svg';
                  }
                }}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          {/* Детали конфигурации */}
          <Card className="summary-details">
            <Card.Body>
              <h3 className="summary-model-name mb-4">
                {state.selectedModel?.brandName.toUpperCase()}{' '}
                {state.selectedModel?.modelName.toUpperCase()}
              </h3>

              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <div className="summary-specs mb-4">
                  {summaryData.configuration && (
                    <div className="spec-item">
                      <strong>Комплектация:</strong>{' '}
                      <span>{summaryData.configuration.configurationName}</span>
                    </div>
                  )}
                  {summaryData.engine && (
                    <div className="spec-item">
                      <strong>Двигатель:</strong>{' '}
                      <span>{formatEngineName(summaryData.engine)}</span>
                    </div>
                  )}
                  {summaryData.transmission && (
                    <div className="spec-item">
                      <strong>Трансмиссия:</strong>{' '}
                      <span>{formatTransmissionName(summaryData.transmission)}</span>
                    </div>
                  )}
                  {summaryData.color && (
                    <div className="spec-item">
                      <strong>Цвет:</strong>{' '}
                      <span>{summaryData.color.name}</span>
                    </div>
                  )}
                  {summaryData.options && summaryData.options.length > 0 && (
                    <div className="spec-item">
                      <strong>Дополнительные опции:</strong>{' '}
                      <span>{summaryData.options.map(opt => opt.optionName).join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="summary-price-section">
                <div className="price-row">
                  <span className="price-label">Цена автомобиля:</span>
                  <span className="price-value">
                    {formatPrice(
                      state.basePrice + state.configurationPrice + state.colorPrice
                    )}
                  </span>
                </div>
                <div className="price-row">
                  <span className="price-label">Аксессуаров на сумму:</span>
                  <span className="price-value">{formatPrice(state.optionsPrice)}</span>
                </div>
                <div className="price-row total">
                  <span className="price-label">Итого:</span>
                  <span className="price-value total-price">
                    {formatPrice(state.totalPrice)}
                  </span>
                </div>
              </div>

              <div className="summary-actions mt-4">
                <Button
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => window.print()}
                >
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  СКАЧАТЬ PDF
                </Button>
                <Button
                  variant="outline-secondary"
                  className="me-2"
                  disabled={!user?.userId || !availableCarId || reserveLoading}
                  onClick={handleReserve24h}
                  title={!availableCarId ? 'Нет доступных автомобилей для резерва' : undefined}
                >
                  {reserveLoading ? 'Бронирование…' : 'Забронировать на 24 часа'}
                </Button>
                <Button variant="success" size="lg" onClick={onOrderCreate}>
                  Оформить заказ
                </Button>
              </div>

              {reserveError && (
                <div className="mt-3 text-danger small">
                  {reserveError}
                </div>
              )}
              {reserveResult && (
                <div className="mt-3 text-success small">
                  Авто зарезервировано. Заказ №{reserveResult.orderId}. До: {reserveResult.reservedUntil}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Step6Summary;

