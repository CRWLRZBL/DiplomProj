import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Row, Col, Alert, Badge } from 'react-bootstrap';
import { Car, Configuration, AdditionalOption, Model } from '../../services/models/car';
import { carService } from '../../services/api/carService';
import { orderService } from '../../services/api/orderService';
import type { PricingQuote } from '../../services/models/order';
import CarConfigurator from '../cars/CarConfigurator';
import OrderSummary from './OrderSummary';
import Icon from '../common/Icon';

interface OrderWizardProps {
  carId?: number;
  modelId?: number;
  configurationId?: number;
  color?: string;
  optionIds?: number[];
  onOrderCreate: (orderData: {
    carId?: number;
    modelId?: number;
    configurationId: number;
    color?: string;
    optionIds: number[];
    totalPrice: number;
  }) => void;
}

const OrderWizard: React.FC<OrderWizardProps> = ({ 
  carId, 
  modelId,
  configurationId: initialConfigurationId,
  color: initialColor,
  optionIds: initialOptionIds,
  onOrderCreate 
}) => {
  const [car, setCar] = useState<Car | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [options, setOptions] = useState<AdditionalOption[]>([]);
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string>('');
  const [currentConfig, setCurrentConfig] = useState<{
    colorId?: number;
    engineId?: number;
    transmissionId?: number;
    configurationId: number | null;
    optionIds: number[];
    totalPrice: number;
  }>({
    configurationId: null,
    optionIds: [],
    totalPrice: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<{
    car?: string;
    model?: string;
    configurations?: string;
    options?: string;
  }>({});

  const loadOptions = useCallback(async () => {
    try {
      const optionsData = await carService.getAdditionalOptions();
      setOptions(optionsData);
    } catch (err: any) {
      const errorMessage = 'Не удалось загрузить дополнительные опции';
      setErrors(prev => ({ ...prev, options: errorMessage }));
      
      if (import.meta.env.DEV) {
        console.error('Ошибка загрузки опций:', {
          status: err.response?.status,
          message: err.message,
          url: err.config?.url
        });
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!carId) return;
    
    setLoading(true);
    setError('');
    setErrors({});
    
    // Загружаем данные независимо друг от друга, чтобы если одна часть упала, другие могли загрузиться
    try {
      const carData = await carService.getCarById(carId);
      setCar(carData);
    } catch (err: any) {
      const errorMessage = err.response?.status === 404 
        ? 'Автомобиль не найден' 
        : 'Не удалось загрузить информацию об автомобиле';
      setErrors(prev => ({ ...prev, car: errorMessage }));
      
      if (import.meta.env.DEV) {
        console.error('Ошибка загрузки автомобиля:', {
          status: err.response?.status,
          message: err.message,
          url: err.config?.url
        });
      }
    }

    try {
      const configsData = await carService.getConfigurations(carId);
      setConfigurations(configsData);
      // Выбираем первую комплектацию по умолчанию
      if (configsData.length > 0) {
        setCurrentConfig(prev => ({
          ...prev,
          configurationId: configsData[0].configurationId,
        }));
      }
    } catch (err: any) {
      let errorMessage = 'Не удалось загрузить комплектации';
      
      if (err.response?.status === 500) {
        // Проверяем, есть ли детали ошибки в ответе
        const errorData = err.response?.data;
        if (typeof errorData === 'string' && errorData.includes('JsonException')) {
          errorMessage = 'Ошибка обработки данных на сервере. Комплектации временно недоступны. Обратитесь в поддержку.';
        } else {
          errorMessage = 'Ошибка сервера при загрузке комплектаций. Попробуйте обновить страницу или обратитесь в поддержку.';
        }
      } else if (err.response?.status === 404) {
        errorMessage = 'Комплектации для этого автомобиля не найдены';
      }
      
      setErrors(prev => ({ ...prev, configurations: errorMessage }));
      
      // Логируем только в режиме разработки и только детали ошибки
      if (import.meta.env.DEV) {
        console.error('Ошибка загрузки комплектаций:', {
          status: err.response?.status,
          message: err.message,
          url: err.config?.url
        });
      }
    }

    try {
      await loadOptions();
    } catch (err: any) {
      // Ошибка уже обработана в loadOptions
    }

    setLoading(false);
  }, [carId, loadOptions]);

  const loadModelData = useCallback(async () => {
    if (!modelId) return;
    
    setLoading(true);
    setError('');
    setErrors({});
    
    try {
      const modelData = await carService.getModelById(Number(modelId));
      setModel(modelData);
    } catch (err: any) {
      const errorMessage = err.response?.status === 404 
        ? 'Модель не найдена' 
        : 'Не удалось загрузить информацию о модели';
      setErrors(prev => ({ ...prev, model: errorMessage }));
      
      if (import.meta.env.DEV) {
        console.error('Ошибка загрузки модели:', {
          status: err.response?.status,
          message: err.message,
          url: err.config?.url
        });
      }
    }

    try {
      const configsData = await carService.getConfigurationsByModelId(Number(modelId));
      setConfigurations(configsData);
      // Выбираем указанную комплектацию или первую по умолчанию
      // Но только если комплектация еще не была установлена
      setCurrentConfig(prev => {
        if (prev.configurationId) {
          // Если комплектация уже установлена (из initialConfigurationId), не перезаписываем
          return prev;
        }
        if (initialConfigurationId) {
          return {
            ...prev,
            configurationId: initialConfigurationId,
          };
        } else if (configsData.length > 0) {
          return {
            ...prev,
            configurationId: configsData[0].configurationId,
          };
        }
        return prev;
      });
    } catch (err: any) {
      let errorMessage = 'Не удалось загрузить комплектации';
      
      if (err.response?.status === 500) {
        const errorData = err.response?.data;
        if (typeof errorData === 'string' && errorData.includes('JsonException')) {
          errorMessage = 'Ошибка обработки данных на сервере. Комплектации временно недоступны. Обратитесь в поддержку.';
        } else {
          errorMessage = 'Ошибка сервера при загрузке комплектаций. Попробуйте обновить страницу или обратитесь в поддержку.';
        }
      } else if (err.response?.status === 404) {
        errorMessage = 'Комплектации для этой модели не найдены';
      }
      
      setErrors(prev => ({ ...prev, configurations: errorMessage }));
      
      if (import.meta.env.DEV) {
        console.error('Ошибка загрузки комплектаций:', {
          status: err.response?.status,
          message: err.message,
          url: err.config?.url
        });
      }
    }

    try {
      await loadOptions();
    } catch (err: any) {
      // Ошибка уже обработана в loadOptions
    }

    setLoading(false);
  }, [modelId, initialConfigurationId, initialOptionIds, loadOptions]);

  // Инициализируем начальные значения из пропсов (цену теперь считаем на сервере через quote)
  useEffect(() => {
    if (initialConfigurationId) {
      setCurrentConfig(prev => ({
        ...prev,
        configurationId: initialConfigurationId,
      }));
    }
    if (initialOptionIds && initialOptionIds.length > 0) {
      setCurrentConfig(prev => ({
        ...prev,
        optionIds: initialOptionIds,
      }));
    }
  }, [initialConfigurationId, initialOptionIds, initialColor, modelId, model, car]);

  // Получаем прозрачный расчёт цены с сервера
  useEffect(() => {
    let cancelled = false;

    const cfgId = currentConfig.configurationId;
    const resolvedColor = initialColor || car?.color || 'Ледниковый';
    const resolvedCarId = carId;
    const resolvedModelId = modelId || car?.modelId;

    if (!cfgId) return;
    if (!resolvedCarId && !resolvedModelId) return;

    (async () => {
      setQuoteLoading(true);
      setQuoteError('');
      try {
        const q = await orderService.getQuote({
          carId: resolvedCarId,
          modelId: resolvedCarId ? undefined : resolvedModelId,
          configurationId: cfgId,
          color: resolvedColor,
          optionIds: currentConfig.optionIds || [],
        });
        if (cancelled) return;
        setQuote(q);
        setCurrentConfig(prev => ({ ...prev, totalPrice: q.totalPrice }));
      } catch (e: any) {
        if (cancelled) return;
        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          'Не удалось рассчитать цену.';
        setQuote(null);
        setQuoteError(msg);
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [carId, modelId, car?.modelId, car?.color, initialColor, currentConfig.configurationId, currentConfig.optionIds]);

  useEffect(() => {
    if (carId) {
      loadData();
    } else if (modelId) {
      // Если перешли из конфигуратора, загружаем модель и опции
      loadModelData();
    }
  }, [carId, modelId, loadData, loadModelData]);

  const handleConfigurationChange = (config: {
    colorId?: number;
    engineId?: number;
    transmissionId?: number;
    configurationId: number | null;
    optionIds: number[];
    totalPrice: number;
  }) => {
    setCurrentConfig(config);
  };

  const handleCreateOrder = () => {
    if (!currentConfig.configurationId) {
      setError('Выберите комплектацию');
      return;
    }

    onOrderCreate({
      carId: carId,
      modelId: modelId,
      configurationId: currentConfig.configurationId,
      color: initialColor,
      optionIds: currentConfig.optionIds,
      totalPrice: quote?.totalPrice ?? currentConfig.totalPrice
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return <div className="text-center">Загрузка...</div>;
  }

  if (error || errors.car) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Ошибка загрузки</Alert.Heading>
        <p>{error || errors.car}</p>
        <Button variant="outline-danger" onClick={loadData} className="mt-2">
          Повторить попытку
        </Button>
      </Alert>
    );
  }

  if (!car && carId) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Автомобиль не найден</Alert.Heading>
        <p>Не удалось загрузить информацию об автомобиле. Проверьте правильность ссылки.</p>
        <Button variant="outline-warning" onClick={loadData} className="mt-2">
          Повторить попытку
        </Button>
      </Alert>
    );
  }

  if (!car && !model && modelId) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Модель не найдена</Alert.Heading>
        <p>Не удалось загрузить информацию о модели. Проверьте правильность ссылки.</p>
        <Button variant="outline-warning" onClick={loadModelData} className="mt-2">
          Повторить попытку
        </Button>
      </Alert>
    );
  }

  // Создаем объект car из model для использования в CarConfigurator
  const displayCar: Car | null = car || (model ? {
    carId: 0,
    modelId: model.modelId,
    brandName: model.brandName,
    modelName: model.modelName,
    bodyType: model.bodyType,
    basePrice: model.basePrice,
    color: initialColor || '',
    status: '',
    vin: '',
    modelYear: model.modelYear,
    fuelType: model.fuelType || '',
    engineCapacity: model.engineCapacity || 0,
  } : null);

  if (!displayCar) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Ошибка</Alert.Heading>
        <p>Не удалось загрузить данные для оформления заказа.</p>
      </Alert>
    );
  }

  // Если пришли из конфигуратора (есть configurationId и modelId), показываем только сводку
  const showSummaryOnly = modelId && initialConfigurationId && !carId;

  return (
    <div className="order-wizard">
      {/* Информация об автомобиле */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Header className="bg-gradient bg-primary text-white">
          <Row className="align-items-center">
            <Col>
              <h4 className="mb-0 d-flex align-items-center">
                <Icon name="directions_car" className="me-2" style={{ verticalAlign: 'middle' }} />
                {displayCar.brandName} {displayCar.modelName}
              </h4>
            </Col>
            <Col xs="auto">
              <Badge bg="light" text="dark" className="fs-6 px-3 py-2">
                {formatPrice(displayCar.basePrice)}
              </Badge>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <div className="d-flex align-items-center">
                <span className="text-muted me-2">Тип кузова:</span>
                <span className="fw-semibold">{displayCar.bodyType}</span>
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex align-items-center">
                <span className="text-muted me-2">Год выпуска:</span>
                <span className="fw-semibold">{displayCar.modelYear}</span>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Если пришли из конфигуратора - показываем только сводку */}
      {showSummaryOnly && initialConfigurationId && modelId ? (
        <>
          {errors.configurations && (
            <Alert variant="warning" className="mb-3">
              <Alert.Heading>Внимание</Alert.Heading>
              <p className="mb-2">{errors.configurations}</p>
            </Alert>
          )}

          <OrderSummary
            car={displayCar}
            modelId={modelId}
            configurationId={initialConfigurationId}
            color={initialColor}
            optionIds={initialOptionIds && initialOptionIds.length > 0 ? initialOptionIds : currentConfig.optionIds}
            totalPrice={(quote?.totalPrice ?? currentConfig.totalPrice) || displayCar.basePrice}
            basePrice={displayCar.basePrice}
            quote={quote}
          />
        </>
      ) : (
        <>
          {/* Конфигуратор - показываем только если не пришли из конфигуратора */}
          {errors.configurations && (
            <Alert variant="warning" className="mb-3">
              <Alert.Heading>Внимание</Alert.Heading>
              <p className="mb-2">{errors.configurations}</p>
              <Button variant="outline-warning" size="sm" onClick={loadData}>
                Повторить загрузку
              </Button>
            </Alert>
          )}

          {errors.options && (
            <Alert variant="warning" className="mb-3">
              <p className="mb-2">{errors.options}</p>
              <Button variant="outline-warning" size="sm" onClick={carId ? loadData : loadModelData}>
                Повторить загрузку
              </Button>
            </Alert>
          )}

          <CarConfigurator
            car={displayCar}
            configurations={configurations}
            options={options}
            initialConfigurationId={initialConfigurationId || currentConfig.configurationId || undefined}
            initialColor={initialColor}
            initialOptionIds={initialOptionIds && initialOptionIds.length > 0 ? initialOptionIds : currentConfig.optionIds.length > 0 ? currentConfig.optionIds : undefined}
            onConfigurationChange={handleConfigurationChange}
          />

          {quote?.lines?.length ? (
            <Card className="mt-4 shadow-sm border-0">
              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">Расчёт стоимости</span>
                  <Badge bg="primary">{formatPrice(quote.totalPrice)}</Badge>
                </div>
              </Card.Header>
              <Card.Body>
                {quote.lines.map((line, idx) => (
                  <div key={`${line.code}-${idx}`} className="d-flex justify-content-between mb-2">
                    <span className="text-muted">{line.label}</span>
                    <span className="fw-semibold">{formatPrice(line.amount)}</span>
                  </div>
                ))}
              </Card.Body>
            </Card>
          ) : null}
        </>
      )}

      {/* Кнопка оформления заказа - sticky внизу */}
      <div className="order-action-bar">
        <Card className="shadow-lg border-0">
          <Card.Body className="p-4">
            <Row className="align-items-center">
              <Col md={6} className="mb-3 mb-md-0">
                {error && (
                  <Alert variant="danger" className="mb-0 py-2">
                    <small>{error}</small>
                  </Alert>
                )}
                {!error && quoteError && (
                  <Alert variant="warning" className="mb-0 py-2">
                    <small>{quoteError}</small>
                  </Alert>
                )}
                {!error && (
                  <div>
                    <div className="text-muted small mb-1">Итоговая стоимость</div>
                    <div className="h3 mb-0 text-primary fw-bold">
                      {quoteLoading
                        ? 'Расчёт…'
                        : formatPrice((quote?.totalPrice ?? currentConfig.totalPrice) || displayCar.basePrice)}
                    </div>
                  </div>
                )}
              </Col>
              <Col md={6} className="text-md-end">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={handleCreateOrder}
                  disabled={!currentConfig.configurationId}
                  className="w-100 w-md-auto px-5"
                >
                  <Icon name="check_circle" className="me-2" style={{ verticalAlign: 'middle' }} />
                  Оформить заказ
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default OrderWizard;