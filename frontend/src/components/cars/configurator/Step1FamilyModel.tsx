import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { Model } from '../../../services/models/car';
import { getModelImagePath } from '../../../utils/imageUtils';
import './Step1FamilyModel.css';

interface Step1FamilyModelProps {
  models: Model[];
  selectedModel: Model | null;
  onModelSelect: (model: Model) => void;
}

const Step1FamilyModel: React.FC<Step1FamilyModelProps> = ({
  models,
  selectedModel,
  onModelSelect,
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);

  // Группируем модели по семействам (по brandName)
  const families = useMemo(() => {
    const grouped = models.reduce((acc, model) => {
      const familyName = model.brandName;
      if (!acc[familyName]) {
        acc[familyName] = [];
      }
      acc[familyName].push(model);
      return acc;
    }, {} as Record<string, Model[]>);

    return Object.entries(grouped).map(([familyName, familyModels]) => ({
      familyName,
      models: familyModels,
    }));
  }, [models]);

  const scrollLeft = () => {
    setScrollPosition(prev => Math.max(0, prev - 1));
  };

  const scrollRight = () => {
    setScrollPosition(prev => Math.min(families.length - 1, prev + 1));
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
    <div className="step1-family-model">
      <div className="step-header mb-5">
        <h2 className="step-title">ВЫБЕРИТЕ СЕМЕЙСТВО</h2>
        <div className="step-navigation">
          <button
            className="nav-arrow"
            onClick={scrollLeft}
            disabled={scrollPosition === 0}
            aria-label="Предыдущее семейство"
          >
            ‹
          </button>
          <button
            className="nav-arrow"
            onClick={scrollRight}
            disabled={scrollPosition >= families.length - 1}
            aria-label="Следующее семейство"
          >
            ›
          </button>
        </div>
      </div>

      <div className="families-container">
        <Row className="g-4">
          {families.map((family, index) => (
            <Col key={family.familyName} xs={12} sm={6} md={4} lg={3}>
              <Card
                className={`family-card h-100 ${
                  selectedModel?.brandName === family.familyName ? 'selected' : ''
                }`}
                onClick={() => {
                  // Выбираем первую модель семейства
                  if (family.models.length > 0) {
                    onModelSelect(family.models[0]);
                  }
                }}
              >
                <div className="family-image-wrapper">
                  <Card.Img
                    variant="top"
                    src={
                      family.models[0] 
                        ? getModelImagePath(
                            family.models[0].modelName || '',
                            family.models[0].bodyType || 'Sedan',
                            family.models[0].imageUrl,
                            undefined
                          )
                        : '/images/cars/default.svg'
                    }
                    alt={family.familyName}
                    className="family-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/cars/default.svg';
                    }}
                  />
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="family-name">
                    {family.familyName.toUpperCase()}
                  </Card.Title>
                  <Card.Text className="family-price text-primary">
                    от {formatPrice(family.models[0]?.basePrice || 0)}
                  </Card.Text>
                  <div className="mt-auto">
                    <Button
                      variant="outline-primary"
                      className="w-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (family.models.length > 0) {
                          onModelSelect(family.models[0]);
                        }
                      }}
                    >
                      Выбрать
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {selectedModel && (
        <div className="selected-model-section mt-5">
          <h3 className="mb-4">ВЫБЕРИТЕ МОДЕЛЬ</h3>
          <Row className="g-4">
            {families
              .find(f => f.familyName === selectedModel.brandName)
              ?.models.map((model) => (
                <Col key={model.modelId} xs={12} md={6} lg={4}>
                  <Card
                    className={`model-card h-100 ${
                      selectedModel.modelId === model.modelId ? 'selected' : ''
                    }`}
                    onClick={() => onModelSelect(model)}
                  >
                    <div className="model-image-wrapper">
                      <Card.Img
                        variant="top"
                        src={getModelImagePath(
                          model.modelName || '',
                          model.bodyType || 'Sedan',
                          model.imageUrl,
                          undefined
                        )}
                        alt={`${model.brandName} ${model.modelName}`}
                        className="model-image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/cars/default.svg';
                        }}
                      />
                    </div>
                    <Card.Body>
                      <Card.Title className="model-name">
                        {model.brandName.toUpperCase()} {model.modelName.toUpperCase()}
                      </Card.Title>
                      {model.description && (
                        <Card.Text className="model-description text-muted small">
                          {model.description}
                        </Card.Text>
                      )}
                      <div className="model-price text-primary fw-bold">
                        от {formatPrice(model.basePrice)}
                      </div>
                      <Button
                        variant={selectedModel.modelId === model.modelId ? 'primary' : 'outline-primary'}
                        className="w-100 mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          onModelSelect(model);
                        }}
                      >
                        КОНФИГУРИРОВАТЬ
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export default Step1FamilyModel;

