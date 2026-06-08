import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Badge, Accordion } from 'react-bootstrap';
import { Car, Configuration, AdditionalOption } from '../../services/models/car';
import { ColorOption, EngineOption, TransmissionOption } from '../../services/models/carConfig';
import { BODY_TYPE_LABELS, FUEL_TYPE_LABELS, OPTION_CATEGORY_LABELS } from '../../utils/constants';

interface CarConfiguratorProps {
  car: Car;
  configurations: Configuration[];
  options: AdditionalOption[];
  initialConfigurationId?: number;
  initialColor?: string;
  initialOptionIds?: number[];
  onConfigurationChange: (config: {
    colorId?: number;
    engineId?: number;
    transmissionId?: number;
    configurationId: number | null;
    optionIds: number[];
    totalPrice: number;
  }) => void;
}

// Временные данные для демонстрации (в реальности должны загружаться с API)
// Используются официальные названия цветов LADA
const DEFAULT_COLORS: ColorOption[] = [
  { colorId: 1, colorName: 'Ледниковый', colorCode: '#FFFFFF', priceModifier: 0 },
  { colorId: 2, colorName: 'Пантера', colorCode: '#000000', priceModifier: 20000 },
  { colorId: 3, colorName: 'Платина', colorCode: '#C0C0C0', priceModifier: 20000 },
  { colorId: 4, colorName: 'Фламенко', colorCode: '#DC2626', priceModifier: 20000 },
  { colorId: 5, colorName: 'Борнео', colorCode: '#1E3A8A', priceModifier: 20000 },
  { colorId: 6, colorName: 'Капитан', colorCode: '#3B82F6', priceModifier: 20000 },
  { colorId: 7, colorName: 'Кориандр', colorCode: '#92400E', priceModifier: 20000 },
];

const DEFAULT_ENGINES: EngineOption[] = [
  { engineId: 1, engineName: '1.6L Бензин', engineCapacity: 1.6, power: 90, fuelType: 'Petrol', priceModifier: 0 },
  { engineId: 2, engineName: '1.6L Бензин Turbo', engineCapacity: 1.6, power: 106, fuelType: 'Petrol', priceModifier: 50000 },
  { engineId: 3, engineName: '1.8L Бензин', engineCapacity: 1.8, power: 122, fuelType: 'Petrol', priceModifier: 80000 },
  { engineId: 4, engineName: '1.5L Бензин', engineCapacity: 1.5, power: 113, fuelType: 'Petrol', priceModifier: 40000 },
];

const DEFAULT_TRANSMISSIONS: TransmissionOption[] = [
  { transmissionId: 1, transmissionName: 'Механическая 5-ступенчатая', transmissionType: 'Manual', gears: 5, priceModifier: 0 },
  { transmissionId: 2, transmissionName: 'Механическая 6-ступенчатая', transmissionType: 'Manual', gears: 6, priceModifier: 30000 },
  { transmissionId: 3, transmissionName: 'Автоматическая 4-ступенчатая', transmissionType: 'Automatic', gears: 4, priceModifier: 100000 },
  { transmissionId: 4, transmissionName: 'Автоматическая 6-ступенчатая', transmissionType: 'Automatic', gears: 6, priceModifier: 150000 },
  { transmissionId: 5, transmissionName: 'Вариатор CVT', transmissionType: 'CVT', gears: 0, priceModifier: 120000 },
];

const CarConfigurator: React.FC<CarConfiguratorProps> = ({
  car,
  configurations,
  options,
  initialConfigurationId,
  initialColor,
  initialOptionIds,
  onConfigurationChange,
}) => {
  // Находим colorId по имени цвета
  const getColorIdByName = (colorName?: string): number => {
    if (!colorName) return 1; // По умолчанию Ледниковый
    const color = DEFAULT_COLORS.find(c => c.colorName === colorName);
    return color ? color.colorId : 1;
  };

  const [selectedColor, setSelectedColor] = useState<number>(getColorIdByName(initialColor));
  const [selectedEngine, setSelectedEngine] = useState<number>(1);
  const [selectedTransmission, setSelectedTransmission] = useState<number>(1);
  const [selectedConfig, setSelectedConfig] = useState<number | null>(
    initialConfigurationId || (configurations.length > 0 ? configurations[0].configurationId : null)
  );
  const [selectedOptions, setSelectedOptions] = useState<number[]>(initialOptionIds || []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateTotalPrice = (): number => {
    let total = car.basePrice;

    // Добавляем цену выбранного цвета
    const color = DEFAULT_COLORS.find(c => c.colorId === selectedColor);
    if (color) total += color.priceModifier;

    // Добавляем цену выбранного двигателя
    const engine = DEFAULT_ENGINES.find(e => e.engineId === selectedEngine);
    if (engine) total += engine.priceModifier;

    // Добавляем цену выбранной КПП
    const transmission = DEFAULT_TRANSMISSIONS.find(t => t.transmissionId === selectedTransmission);
    if (transmission) total += transmission.priceModifier;

    // Добавляем цену комплектации
    const config = configurations.find(c => c.configurationId === selectedConfig);
    if (config) total += config.additionalPrice;

    // Добавляем цены выбранных опций
    selectedOptions.forEach(optionId => {
      const option = options.find(o => o.optionId === optionId);
      if (option) total += option.optionPrice;
    });

    return total;
  };

  // Синхронизируем начальные значения при изменении пропсов
  useEffect(() => {
    if (initialConfigurationId && initialConfigurationId !== selectedConfig) {
      setSelectedConfig(initialConfigurationId);
    }
  }, [initialConfigurationId, selectedConfig]);

  useEffect(() => {
    if (initialColor) {
      const colorId = getColorIdByName(initialColor);
      if (colorId !== selectedColor) {
        setSelectedColor(colorId);
      }
    }
  }, [initialColor, selectedColor]);

  useEffect(() => {
    if (initialOptionIds && initialOptionIds.length > 0 && JSON.stringify(initialOptionIds) !== JSON.stringify(selectedOptions)) {
      setSelectedOptions(initialOptionIds);
    }
  }, [initialOptionIds]);

  useEffect(() => {
    const totalPrice = calculateTotalPrice();
    onConfigurationChange({
      colorId: selectedColor,
      engineId: selectedEngine,
      transmissionId: selectedTransmission,
      configurationId: selectedConfig,
      optionIds: selectedOptions,
      totalPrice,
    });
  }, [selectedColor, selectedEngine, selectedTransmission, selectedConfig, selectedOptions, car.basePrice]);

  const handleOptionToggle = (optionId: number) => {
    setSelectedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const getSelectedColor = () => DEFAULT_COLORS.find(c => c.colorId === selectedColor);
  const getSelectedEngine = () => DEFAULT_ENGINES.find(e => e.engineId === selectedEngine);
  const getSelectedTransmission = () => DEFAULT_TRANSMISSIONS.find(t => t.transmissionId === selectedTransmission);

  return (
    <div className="car-configurator">
      {/* Выбор цвета */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">🎨 Выбор цвета</h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            {DEFAULT_COLORS.map(color => (
              <Col xs={6} sm={4} md={3} key={color.colorId}>
                <div
                  className={`color-option p-3 border rounded cursor-pointer ${
                    selectedColor === color.colorId ? 'border-primary border-3' : ''
                  }`}
                  onClick={() => setSelectedColor(color.colorId)}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    className="color-preview mb-2 rounded"
                    style={{
                      width: '100%',
                      height: '60px',
                      backgroundColor: color.colorCode,
                      border: '1px solid #ddd',
                    }}
                  />
                  <div className="text-center">
                    <div className="fw-semibold small">{color.colorName}</div>
                    {color.priceModifier > 0 && (
                      <div className="text-success small">
                        +{formatPrice(color.priceModifier)}
                      </div>
                    )}
                    {color.priceModifier === 0 && (
                      <div className="text-muted small">В базовой комплектации</div>
                    )}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* Выбор двигателя */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-gear me-2"></i>
            Выбор двигателя
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            {DEFAULT_ENGINES.map(engine => (
              <Col md={6} key={engine.engineId}>
                <div
                  className={`engine-option p-3 border rounded ${
                    selectedEngine === engine.engineId ? 'border-primary border-3 bg-light' : ''
                  }`}
                  onClick={() => setSelectedEngine(engine.engineId)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{engine.engineName}</div>
                      <div className="text-muted small mt-1">
                        Объем: {engine.engineCapacity}L<br />
                        Мощность: {engine.power} л.с.<br />
                        Тип: {FUEL_TYPE_LABELS[engine.fuelType] || engine.fuelType}
                      </div>
                    </div>
                    <div className="text-end">
                      {engine.priceModifier > 0 ? (
                        <div className="text-success fw-bold">
                          +{formatPrice(engine.priceModifier)}
                        </div>
                      ) : (
                        <Badge bg="success">Базовая</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* Выбор коробки передач */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">🔧 Коробка передач</h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            {DEFAULT_TRANSMISSIONS.map(transmission => (
              <Col md={6} key={transmission.transmissionId}>
                <div
                  className={`transmission-option p-3 border rounded ${
                    selectedTransmission === transmission.transmissionId
                      ? 'border-primary border-3 bg-light'
                      : ''
                  }`}
                  onClick={() => setSelectedTransmission(transmission.transmissionId)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{transmission.transmissionName}</div>
                      <div className="text-muted small mt-1">
                        Тип: {transmission.transmissionType === 'Manual' ? 'Механическая' : 
                              transmission.transmissionType === 'Automatic' ? 'Автоматическая' :
                              transmission.transmissionType === 'CVT' ? 'Вариатор' : transmission.transmissionType}
                        {transmission.gears > 0 && ` • ${transmission.gears} передач`}
                      </div>
                    </div>
                    <div className="text-end">
                      {transmission.priceModifier > 0 ? (
                        <div className="text-success fw-bold">
                          +{formatPrice(transmission.priceModifier)}
                        </div>
                      ) : (
                        <Badge bg="success">Базовая</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* Выбор комплектации */}
      {configurations.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              <i className="bi bi-box-seam me-2"></i>
              Комплектация
            </h5>
          </Card.Header>
          <Card.Body>
            {configurations.map(config => (
              <div
                key={config.configurationId}
                className={`config-option p-3 border rounded mb-2 ${
                  selectedConfig === config.configurationId
                    ? 'border-primary border-3 bg-light'
                    : ''
                }`}
                onClick={() => setSelectedConfig(config.configurationId)}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-bold">{config.configurationName}</div>
                    <div className="text-muted small mt-1">{config.description}</div>
                  </div>
                  <div className="text-end">
                    {config.additionalPrice > 0 ? (
                      <div className="text-success fw-bold">
                        +{formatPrice(config.additionalPrice)}
                      </div>
                    ) : (
                      <Badge bg="success">Базовая</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* Дополнительные опции */}
      {options.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">✨ Дополнительные опции</h5>
          </Card.Header>
          <Card.Body>
            <Accordion defaultActiveKey="0">
              {Object.entries(
                options.reduce((acc, option) => {
                  const category = OPTION_CATEGORY_LABELS[option.category] || option.category;
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(option);
                  return acc;
                }, {} as Record<string, AdditionalOption[]>)
              ).map(([category, categoryOptions], index) => (
                <Accordion.Item eventKey={index.toString()} key={category}>
                  <Accordion.Header>{category}</Accordion.Header>
                  <Accordion.Body>
                    {categoryOptions.map(option => (
                      <div key={option.optionId} className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id={`option-${option.optionId}`}
                          label={
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{option.optionName}</strong>
                                <div className="text-muted small">{option.description}</div>
                              </div>
                              <div className="text-success ms-3">
                                +{formatPrice(option.optionPrice)}
                              </div>
                            </div>
                          }
                          checked={selectedOptions.includes(option.optionId)}
                          onChange={() => handleOptionToggle(option.optionId)}
                        />
                      </div>
                    ))}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </Card.Body>
        </Card>
      )}

      {/* Сводка конфигурации */}
      <Card className="mb-4 bg-light">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-file-text me-2"></i>
            Сводка конфигурации
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="mb-2">
                <strong>Цвет:</strong>{' '}
                <span className="d-inline-block align-middle me-2">
                  <span
                    className="rounded-circle d-inline-block"
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: getSelectedColor()?.colorCode,
                      border: '1px solid #ddd',
                      verticalAlign: 'middle',
                    }}
                  />
                </span>
                {getSelectedColor()?.colorName}
              </div>
              <div className="mb-2">
                <strong>Двигатель:</strong> {getSelectedEngine()?.engineName} ({getSelectedEngine()?.power} л.с.)
              </div>
              <div className="mb-2">
                <strong>КПП:</strong> {getSelectedTransmission()?.transmissionName}
              </div>
              {selectedConfig && (
                <div className="mb-2">
                  <strong>Комплектация:</strong>{' '}
                  {configurations.find(c => c.configurationId === selectedConfig)?.configurationName}
                </div>
              )}
              {selectedOptions.length > 0 && (
                <div className="mb-2">
                  <strong>Доп. опции:</strong> {selectedOptions.length} шт.
                </div>
              )}
            </Col>
            <Col md={6} className="text-end">
              <div className="mb-2">
                <small className="text-muted">Базовая цена:</small>
                <div>{formatPrice(car.basePrice)}</div>
              </div>
              {calculateTotalPrice() > car.basePrice && (
                <div className="mb-2">
                  <small className="text-muted">Доплата:</small>
                  <div className="text-success">
                    +{formatPrice(calculateTotalPrice() - car.basePrice)}
                  </div>
                </div>
              )}
              <div className="border-top pt-2 mt-2">
                <strong className="text-primary" style={{ fontSize: '1.5rem' }}>
                  Итого: {formatPrice(calculateTotalPrice())}
                </strong>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CarConfigurator;

