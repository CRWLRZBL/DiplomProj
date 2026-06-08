import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { Model } from '../../../services/models/car';
import { getModelImagePath } from '../../../utils/imageUtils';
import './Step1FamilyModel.css';

interface Step1ModelProps {
  models: Model[];
  selectedModel: Model | null;
  onModelSelect: (model: Model) => void;
}

const Step1Model: React.FC<Step1ModelProps> = ({
  models,
  selectedModel,
  onModelSelect,
}) => {
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
        <h2 className="step-title">ВЫБЕРИТЕ МОДЕЛЬ</h2>
      </div>

      <div className="models-container">
        <Row className="g-4">
          {models.map((model) => (
            <Col key={model.modelId} xs={12} sm={6} md={4} lg={3}>
              <Card
                className={`model-card h-100 ${
                  selectedModel?.modelId === model.modelId ? 'selected' : ''
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
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="model-name">
                    {model.brandName.toUpperCase()} {model.modelName.toUpperCase()}
                  </Card.Title>
                  {model.description && (
                    <Card.Text className="model-description text-muted small">
                      {model.description}
                    </Card.Text>
                  )}
                  <Card.Text className="model-price text-primary fw-bold">
                    от {formatPrice(model.basePrice)}
                  </Card.Text>
                  <div className="mt-auto">
                    <Button
                      variant={selectedModel?.modelId === model.modelId ? 'primary' : 'outline-primary'}
                      className="w-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onModelSelect(model);
                      }}
                    >
                      {selectedModel?.modelId === model.modelId ? 'Выбрано' : 'Выбрать'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Step1Model;

