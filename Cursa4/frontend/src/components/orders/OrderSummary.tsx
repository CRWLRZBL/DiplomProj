import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { Car, Configuration, AdditionalOption } from '../../services/models/car';
import { carService } from '../../services/api/carService';
import type { PricingQuote } from '../../services/models/order';
import { getModelImagePath } from '../../utils/imageUtils';
import Icon from '../common/Icon';

interface OrderSummaryProps {
  car: Car;
  modelId: number;
  configurationId: number;
  color?: string;
  optionIds?: number[];
  totalPrice: number;
  basePrice: number;
  quote?: PricingQuote | null;
}

interface SummaryData {
  configuration?: Configuration;
  color?: { name: string; hexCode: string };
  options?: AdditionalOption[];
  engine?: { capacity: number; fuelType: string; power?: number };
  transmission?: { type: string; description: string };
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  car,
  modelId,
  configurationId,
  color,
  optionIds = [],
  totalPrice,
  basePrice,
  quote,
}) => {
  const [summaryData, setSummaryData] = useState<SummaryData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummaryData();
  }, [modelId, configurationId, color, optionIds]);

  const loadSummaryData = async () => {
    try {
      setLoading(true);
      const data: SummaryData = {};

      // Загружаем комплектацию
      try {
        const configs = await carService.getConfigurationsByModelId(modelId);
        data.configuration = configs.find(c => c.configurationId === configurationId);
      } catch (err) {
        console.error('Error loading configuration:', err);
      }

      // Загружаем цвет
      if (color) {
        try {
          const colors = await carService.getColors();
          const colorData = colors.find((c: any) => 
            (c.name || c.colorName) === color
          );
          if (colorData) {
            data.color = {
              name: colorData.name || colorData.colorName || color,
              hexCode: colorData.hexCode || colorData.colorCode || '#CCCCCC',
            };
          } else {
            data.color = {
              name: color,
              hexCode: '#CCCCCC',
            };
          }
        } catch (err) {
          console.error('Error loading color:', err);
          data.color = {
            name: color,
            hexCode: '#CCCCCC',
          };
        }
      }

      // Загружаем опции
      if (optionIds.length > 0) {
        try {
          const options = await carService.getAdditionalOptions();
          data.options = options.filter(opt => optionIds.includes(opt.optionId));
        } catch (err) {
          console.error('Error loading options:', err);
        }
      }

      // Загружаем двигатель и трансмиссию из комплектации
      if (data.configuration) {
        data.engine = {
          capacity: data.configuration.engineCapacity || 0,
          fuelType: data.configuration.fuelType || 'Petrol',
          power: data.configuration.enginePower || undefined,
        };
        data.transmission = {
          type: data.configuration.transmissionType || '',
          description: data.configuration.transmissionType || '',
        };
      }

      setSummaryData(data);
    } catch (err) {
      console.error('Error loading summary data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatEngineName = () => {
    if (!summaryData.engine) return '';
    const capacity = summaryData.engine.capacity?.toFixed(1) || '';
    const power = summaryData.engine.power ? ` (${summaryData.engine.power} л.с.)` : '';
    const fuelType = summaryData.engine.fuelType === 'Petrol' ? 'Бензин' : summaryData.engine.fuelType;
    return `${capacity}L ${fuelType}${power}`;
  };

  const formatTransmissionName = () => {
    if (!summaryData.transmission) return '';
    const type = summaryData.transmission.type;
    if (type?.includes('Механическая') || type?.includes('Manual')) return 'Механическая';
    if (type?.includes('Автоматическая') || type?.includes('Automatic')) return 'Автоматическая';
    if (type?.includes('Вариатор') || type?.includes('CVT')) return 'Вариатор CVT';
    return type;
  };

  const effectiveBasePrice = quote?.basePrice ?? basePrice;
  const effectiveTotalPrice = quote?.totalPrice ?? totalPrice;

  return (
    <div className="order-summary">
      <Row>
        <Col lg={6}>
          {/* Изображение автомобиля */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Body className="text-center p-4">
              {loading ? (
                <div className="py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <img
                  src={
                    getModelImagePath(
                      car.modelName || '',
                      car.bodyType || 'Sedan',
                      undefined,
                      summaryData.configuration?.configurationName,
                      summaryData.color?.name || color || 'Ледниковый'
                    )
                  }
                  alt={`${car.brandName} ${car.modelName}`}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: '400px',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getModelImagePath(
                      car.modelName || '',
                      car.bodyType || 'Sedan',
                      undefined,
                      summaryData.configuration?.configurationName,
                      'Ледниковый'
                    );
                  }}
                />
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          {/* Сводка конфигурации */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-light">
              <h5 className="mb-0 d-flex align-items-center">
                <Icon name="description" className="me-2" />
                Сводка конфигурации
              </h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h4 className="mb-3">
                      {car.brandName} {car.modelName}
                    </h4>

                    <div className="summary-details">
                      {summaryData.color && (
                        <div className="d-flex align-items-center mb-2">
                          <strong className="me-2" style={{ minWidth: '120px' }}>Цвет:</strong>
                          <div className="d-flex align-items-center">
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: summaryData.color.hexCode,
                                border: '1px solid #ddd',
                                marginRight: '8px',
                              }}
                            />
                            <span>{summaryData.color.name}</span>
                          </div>
                        </div>
                      )}

                      {summaryData.engine && (
                        <div className="mb-2">
                          <strong className="me-2" style={{ minWidth: '120px' }}>Двигатель:</strong>
                          <span>{formatEngineName()}</span>
                        </div>
                      )}

                      {summaryData.transmission && (
                        <div className="mb-2">
                          <strong className="me-2" style={{ minWidth: '120px' }}>КПП:</strong>
                          <span>{formatTransmissionName()}</span>
                        </div>
                      )}

                      {summaryData.configuration && (
                        <div className="mb-2">
                          <strong className="me-2" style={{ minWidth: '120px' }}>Комплектация:</strong>
                          <span>{summaryData.configuration.configurationName}</span>
                        </div>
                      )}

                      {summaryData.options && summaryData.options.length > 0 && (
                        <div className="mb-2">
                          <strong className="me-2" style={{ minWidth: '120px' }}>Доп. опции:</strong>
                          <span>{summaryData.options.length} шт.</span>
                          <div className="mt-2 ms-4">
                            <ul className="mb-0 small">
                              {summaryData.options.map(opt => (
                                <li key={opt.optionId}>{opt.optionName} (+{formatPrice(opt.optionPrice)})</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Цены */}
                  <div className="price-section border-top pt-3">
                    {quote?.lines?.length ? (
                      <>
                        {quote.lines.map((line, idx) => (
                          <div key={`${line.code}-${idx}`} className="d-flex justify-content-between mb-2">
                            <span className="text-muted">{line.label}:</span>
                            <span className="fw-semibold">
                              {line.amount >= 0 ? formatPrice(line.amount) : `-${formatPrice(Math.abs(line.amount))}`}
                            </span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Базовая цена:</span>
                        <span className="fw-semibold">{formatPrice(effectiveBasePrice)}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between pt-2 border-top">
                      <strong className="fs-5">Итого:</strong>
                      <strong className="fs-4 text-primary">{formatPrice(effectiveTotalPrice)}</strong>
                    </div>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OrderSummary;

