import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { carService } from '../../../services/api/carService';
import { getEngineImagePathWithFallback } from '../../../utils/engineImageUtils';
import './Step3EngineTransmission.css';

interface Engine {
  capacity: number;
  fuelType: string;
  power?: number;
}

interface Transmission {
  type: string;
  description: string;
}

interface Step3EngineTransmissionProps {
  modelId?: number;
  modelName?: string | null;
  configurationId: number | null;
  selectedEngineId: number | null;
  selectedTransmissionId: number | null;
  onEngineSelect: (engineId: number) => void;
  onTransmissionSelect: (transmissionId: number) => void;
}

const Step3EngineTransmission: React.FC<Step3EngineTransmissionProps> = ({
  modelId,
  modelName,
  configurationId,
  selectedEngineId,
  selectedTransmissionId,
  onEngineSelect,
  onTransmissionSelect,
}) => {
  const [engines, setEngines] = useState<Engine[]>([]);
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (modelId) {
      loadData();
    }
  }, [modelId, configurationId]);

  const loadData = async () => {
    if (!modelId) return;

    try {
      setLoading(true);
      setError('');

      // Если выбрана комплектация, загружаем варианты двигатель+трансмиссия для этой комплектации
      if (configurationId) {
        const configsResponse = await fetch(`http://localhost:5171/api/cars/models/${modelId}/configurations`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []);
        
        // Находим все варианты для выбранной комплектации (могут быть с разными трансмиссиями)
        const selectedConfig = configsResponse.find((c: any) => c.configurationId === configurationId);
        const configVariants = configsResponse.filter((c: any) => 
          c.configurationName === selectedConfig?.configurationName && 
          c.engineCapacity && 
          c.enginePower && 
          c.transmissionType
        );

        // Если для комплектации есть варианты с двигателем и трансмиссией
        if (configVariants.length > 0) {
          // Формируем список уникальных комбинаций двигатель+трансмиссия
          const engineTransmissionPairs = configVariants.map((config: any) => ({
            capacity: config.engineCapacity,
            fuelType: config.fuelType || 'Petrol',
            power: config.enginePower,
            transmissionType: config.transmissionType,
            transmissionDescription: config.transmissionType === 'Manual' ? 'Механическая трансмиссия' :
                                     config.transmissionType === 'CVT' ? 'Вариатор CVT' :
                                     config.transmissionType === 'Automatic' ? 'Автоматическая трансмиссия' :
                                     config.transmissionType === 'Robot' ? 'Роботизированная КПП' : config.transmissionType
          }));

          // Группируем по двигателю и добавляем все доступные трансмиссии
          const enginesMap = new Map<string, Engine & { transmissions: Transmission[] }>();
          
          engineTransmissionPairs.forEach((pair: any) => {
            const engineKey = `${pair.capacity}_${pair.power}_${pair.fuelType}`;
            if (!enginesMap.has(engineKey)) {
              enginesMap.set(engineKey, {
                capacity: pair.capacity,
                fuelType: pair.fuelType,
                power: pair.power,
                transmissions: []
              } as Engine & { transmissions: Transmission[] });
            }
            const engine = enginesMap.get(engineKey)!;
            if (!engine.transmissions.find(t => t.type === pair.transmissionType)) {
              engine.transmissions.push({
                type: pair.transmissionType,
                description: pair.transmissionDescription
              });
            }
          });

          setEngines(Array.from(enginesMap.values()) as any);
          setTransmissions([]); // Трансмиссии теперь внутри каждого двигателя
        } else {
          // Если для комплектации нет вариантов, загружаем все доступные варианты для модели
          const [enginesResponse, transmissionsResponse] = await Promise.all([
            fetch(`http://localhost:5171/api/cars/engines?modelId=${modelId}`)
              .then(res => res.ok ? res.json() : [])
              .catch(() => []),
            fetch(`http://localhost:5171/api/cars/transmissions?modelId=${modelId}`)
              .then(res => res.ok ? res.json() : [])
              .catch(() => []),
          ]);
          
          const enginesData = Array.isArray(enginesResponse) ? enginesResponse : [];
          const transmissionsData = Array.isArray(transmissionsResponse) ? transmissionsResponse : [];

          setEngines(enginesData);
          setTransmissions(transmissionsData);
        }
      } else {
        // Если комплектация не выбрана, загружаем все доступные варианты
        const [enginesResponse, transmissionsResponse] = await Promise.all([
          fetch(`http://localhost:5171/api/cars/engines?modelId=${modelId}`)
            .then(res => res.ok ? res.json() : [])
            .catch(() => []),
          fetch(`http://localhost:5171/api/cars/transmissions?modelId=${modelId}`)
            .then(res => res.ok ? res.json() : [])
            .catch(() => []),
        ]);
        
        const enginesData = Array.isArray(enginesResponse) ? enginesResponse : [];
        const transmissionsData = Array.isArray(transmissionsResponse) ? transmissionsResponse : [];

        setEngines(enginesData);
        setTransmissions(transmissionsData);
      }
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error('Error loading engine/transmission data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatEngineName = (engine: Engine) => {
    const capacity = engine.capacity.toFixed(1);
    const power = engine.power ? ` (${engine.power} л.с.)` : '';
    const fuelType = engine.fuelType === 'Petrol' ? 'Бензин' : engine.fuelType;
    return `${capacity} л ${fuelType}${power}`;
  };

  const formatTransmissionName = (transmission: Transmission) => {
    if (transmission.type === 'Manual') return 'Механическая трансмиссия';
    if (transmission.type === 'Automatic') return 'Автоматическая трансмиссия';
    if (transmission.type === 'CVT') return 'Вариатор CVT';
    if (transmission.type === 'Robot') return 'Роботизированная КПП';
    return transmission.type;
  };

  const getTransmissionIcon = (type: string) => {
    if (type === 'Manual') return 'H';
    if (type === 'Automatic') return 'A';
    if (type === 'CVT') return 'CVT';
    return '?';
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="step3-engine-transmission">
      <h2 className="step-title mb-5">ДВИГАТЕЛЬ И ТРАНСМИССИЯ</h2>

      <Row className="g-4">
        {(() => {
          // Если комплектация выбрана и у нас есть данные с трансмиссиями внутри двигателей
          if (configurationId && engines.length > 0 && (engines[0] as any).transmissions) {
            // Формируем список всех комбинаций двигатель+трансмиссия
            const combinations: Array<{engine: Engine, transmission: Transmission, id: number}> = [];
            let comboId = 1;
            
            engines.forEach((engine: any) => {
              if (engine.transmissions && engine.transmissions.length > 0) {
                engine.transmissions.forEach((transmission: Transmission) => {
                  combinations.push({ engine, transmission, id: comboId++ });
                });
              } else {
                // Если трансмиссий нет, добавляем с дефолтной
                combinations.push({ 
                  engine, 
                  transmission: { type: 'Manual', description: 'Механическая трансмиссия' }, 
                  id: comboId++ 
                });
              }
            });

            return combinations.map((combo) => {
              const isSelected = selectedEngineId === combo.id;
              return (
                <Col key={combo.id} xs={12} md={6}>
                  <Card
                    className={`engine-card h-100 ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => onEngineSelect(combo.id)}
                  >
                <Card.Body>
                  <div className="engine-header mb-3">
                    <Card.Title className="engine-name">
                      {formatEngineName(combo.engine)}
                    </Card.Title>
                  </div>

                  <div className="engine-image-wrapper mb-3">
                    {combo.engine.power ? (
                      <img
                        src={getEngineImagePathWithFallback(
                          combo.engine.capacity,
                          combo.engine.power,
                          combo.transmission.type || 'Manual',
                          modelName || undefined
                        )}
                        alt={`Двигатель ${formatEngineName(combo.engine)}`}
                        className="engine-image"
                        onError={(e) => {
                          // Если основное изображение не найдено, пробуем варианты
                          const img = e.target as HTMLImageElement;
                          const currentSrc = img.src;
                          let triedFallback = false;
                          
                          // Пробуем варианты с разными трансмиссиями
                          if (currentSrc.includes('_5mt')) {
                            // Пробуем 6mt
                            img.src = getEngineImagePathWithFallback(
                              combo.engine.capacity,
                              combo.engine.power,
                              'Robot',
                              modelName || undefined
                            );
                            triedFallback = true;
                          } else if (currentSrc.includes('_6mt')) {
                            // Пробуем at
                            img.src = getEngineImagePathWithFallback(
                              combo.engine.capacity,
                              combo.engine.power,
                              'Automatic',
                              modelName || undefined
                            );
                            triedFallback = true;
                          } else if (currentSrc.includes('_at')) {
                            // Пробуем 5mt
                            img.src = getEngineImagePathWithFallback(
                              combo.engine.capacity,
                              combo.engine.power,
                              'Manual',
                              modelName || undefined
                            );
                            triedFallback = true;
                          }
                          
                          // Если все варианты не найдены, показываем placeholder
                          if (!triedFallback) {
                            img.style.display = 'none';
                            const placeholder = img.parentElement?.querySelector('.engine-image-placeholder') as HTMLElement;
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="engine-image-placeholder d-flex align-items-center justify-content-center"
                           style={{ height: '200px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <span className="text-muted">Изображение недоступно</span>
                      </div>
                    )}
                  </div>

                  <div className="transmission-badge mb-3">
                    <Badge 
                      bg="warning" 
                      className="transmission-badge-content"
                      style={{ 
                        backgroundColor: '#ff6b35', 
                        color: 'white',
                        padding: '8px 16px',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      <span className="transmission-icon me-2">
                        {getTransmissionIcon(combo.transmission.type)}
                      </span>
                      {formatTransmissionName(combo.transmission)}
                    </Badge>
                  </div>

                  <div className="engine-price mb-3">
                    <div className="text-muted small">Цена от</div>
                    <div className="text-primary fw-bold fs-5">
                      от {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'RUB',
                        minimumFractionDigits: 0,
                      }).format(0)}
                    </div>
                  </div>

                  <Button
                    variant={isSelected ? 'primary' : 'outline-primary'}
                    className="w-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEngineSelect(combo.id);
                    }}
                  >
                    ВЫБРАТЬ ЭТОТ ДВИГАТЕЛЬ
                  </Button>
                </Card.Body>
              </Card>
            </Col>
              );
            });
          } else {
            // Старая логика для случая без комплектации или без данных о трансмиссиях
            return engines.map((engine, index) => {
              const engineId = index + 1;
              const isSelected = selectedEngineId === engineId;
              const engineTransmission = transmissions[index] || transmissions[0] || { type: 'Manual', description: 'Механическая трансмиссия' };
              
              return (
                <Col key={engineId} xs={12} md={6}>
                  <Card
                    className={`engine-card h-100 ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => onEngineSelect(engineId)}
                  >
                    <Card.Body>
                      <div className="engine-header mb-3">
                        <Card.Title className="engine-name">
                          {formatEngineName(engine)}
                        </Card.Title>
                      </div>

                      <div className="engine-image-wrapper mb-3">
                        {engine.power ? (
                          <img
                            src={getEngineImagePathWithFallback(
                              engine.capacity,
                              engine.power,
                              engineTransmission.type || 'Manual',
                              modelName || undefined
                            )}
                            alt={`Двигатель ${formatEngineName(engine)}`}
                            className="engine-image"
                            onError={(e) => {
                              // Если основное изображение не найдено, пробуем варианты
                              const img = e.target as HTMLImageElement;
                              const currentSrc = img.src;
                              let triedFallback = false;
                              
                              // Пробуем варианты с разными трансмиссиями
                              if (currentSrc.includes('_5mt')) {
                                // Пробуем 6mt
                                img.src = getEngineImagePathWithFallback(
                                  engine.capacity,
                                  engine.power,
                                  'Robot',
                                  modelName || undefined
                                );
                                triedFallback = true;
                              } else if (currentSrc.includes('_6mt')) {
                                // Пробуем at
                                img.src = getEngineImagePathWithFallback(
                                  engine.capacity,
                                  engine.power,
                                  'Automatic',
                                  modelName || undefined
                                );
                                triedFallback = true;
                              } else if (currentSrc.includes('_at')) {
                                // Пробуем 5mt
                                img.src = getEngineImagePathWithFallback(
                                  engine.capacity,
                                  engine.power,
                                  'Manual',
                                  modelName || undefined
                                );
                                triedFallback = true;
                              }
                              
                              // Если все варианты не найдены, показываем placeholder
                              if (!triedFallback) {
                                img.style.display = 'none';
                                const placeholder = img.parentElement?.querySelector('.engine-image-placeholder') as HTMLElement;
                                if (placeholder) {
                                  placeholder.style.display = 'flex';
                                }
                              }
                            }}
                          />
                        ) : (
                          <div className="engine-image-placeholder d-flex align-items-center justify-content-center"
                               style={{ height: '200px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <span className="text-muted">Изображение недоступно</span>
                          </div>
                        )}
                      </div>

                      <div className="transmission-badge mb-3">
                        <Badge 
                          bg="warning" 
                          className="transmission-badge-content"
                          style={{ 
                            backgroundColor: '#ff6b35', 
                            color: 'white',
                            padding: '8px 16px',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                          }}
                        >
                          <span className="transmission-icon me-2">
                            {getTransmissionIcon(engineTransmission.type)}
                          </span>
                          {formatTransmissionName(engineTransmission)}
                        </Badge>
                      </div>

                      <div className="engine-price mb-3">
                        <div className="text-muted small">Цена от</div>
                        <div className="text-primary fw-bold fs-5">
                          от {new Intl.NumberFormat('ru-RU', {
                            style: 'currency',
                            currency: 'RUB',
                            minimumFractionDigits: 0,
                          }).format(0)}
                        </div>
                      </div>

                      <Button
                        variant={isSelected ? 'primary' : 'outline-primary'}
                        className="w-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEngineSelect(engineId);
                        }}
                      >
                        ВЫБРАТЬ ЭТОТ ДВИГАТЕЛЬ
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            });
          }
        })()}
      </Row>
    </div>
  );
};

export default Step3EngineTransmission;

