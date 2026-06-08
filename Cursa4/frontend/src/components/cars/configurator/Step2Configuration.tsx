import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { Configuration } from '../../../services/models/car';
import { carService } from '../../../services/api/carService';
import './Step2Configuration.css';

interface Step2ConfigurationProps {
  modelId?: number;
  selectedConfigurationId: number | null;
  onConfigurationSelect: (configId: number) => void;
}

const Step2Configuration: React.FC<Step2ConfigurationProps> = ({
  modelId,
  selectedConfigurationId,
  onConfigurationSelect,
}) => {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (modelId) {
      loadConfigurations();
    }
  }, [modelId]);

  const loadConfigurations = async () => {
    if (!modelId) return;

    try {
      setLoading(true);
      setError('');
      // Получаем комплектации напрямую по modelId
      const configs = await carService.getConfigurationsByModelId(modelId);
      setConfigurations(configs);
    } catch (err) {
      setError('Ошибка при загрузке комплектаций');
      console.error('Error loading configurations:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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

  if (configurations.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">Комплектации для данной модели не найдены</p>
      </div>
    );
  }

  return (
    <div className="step2-configuration">
      <h2 className="step-title mb-5">ВЫБЕРИТЕ КОМПЛЕКТАЦИЮ</h2>
      
      <Row className="g-4">
        {configurations.map((config) => (
          <Col key={config.configurationId} xs={12} md={6} lg={4}>
            <Card
              className={`configuration-card h-100 ${
                selectedConfigurationId === config.configurationId ? 'selected' : ''
              }`}
              onClick={() => onConfigurationSelect(config.configurationId)}
            >
              <Card.Body className="d-flex flex-column">
                <div className="configuration-header mb-3">
                  <Card.Title className="configuration-name">
                    {config.configurationName.toUpperCase()}
                  </Card.Title>
                  {config.additionalPrice === 0 && (
                    <Badge bg="success" className="ms-2">Базовая</Badge>
                  )}
                </div>
                
                {config.description && (
                  <Card.Text className="configuration-description text-muted small mb-3">
                    {config.description}
                  </Card.Text>
                )}

                <div className="configuration-features mb-3">
                  <div className="feature-item">
                    <strong>Особенности:</strong>
                    <ul className="feature-list">
                      <li>Стандартное оборудование</li>
                      <li>Безопасность</li>
                      <li>Комфорт</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="configuration-price mb-3">
                    {config.additionalPrice > 0 ? (
                      <>
                        <div className="text-muted small">Доплата:</div>
                        <div className="text-primary fw-bold fs-5">
                          +{formatPrice(config.additionalPrice)}
                        </div>
                      </>
                    ) : (
                      <div className="text-success fw-bold">В базовой комплектации</div>
                    )}
                  </div>
                  
                  <Button
                    variant={
                      selectedConfigurationId === config.configurationId
                        ? 'primary'
                        : 'outline-primary'
                    }
                    className="w-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfigurationSelect(config.configurationId);
                    }}
                  >
                    ВЫБРАТЬ ЭТУ КОМПЛЕКТАЦИЮ
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Step2Configuration;

