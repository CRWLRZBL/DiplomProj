import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner } from 'react-bootstrap';
import { AdditionalOption } from '../../../services/models/car';
import { carService } from '../../../services/api/carService';
import './Step4Options.css';

interface Step4OptionsProps {
  modelId?: number;
  selectedOptionIds: number[];
  onOptionsChange: (optionIds: number[]) => void;
  onContinue?: () => void;
}

const Step4Options: React.FC<Step4OptionsProps> = ({
  modelId,
  selectedOptionIds,
  onOptionsChange,
  onContinue,
}) => {
  const [options, setOptions] = useState<AdditionalOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoading(true);
      setError('');
      const optionsData = await carService.getAdditionalOptions();
      setOptions(optionsData);
    } catch (err) {
      setError('Ошибка при загрузке опций');
      console.error('Error loading options:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOption = (optionId: number) => {
    if (selectedOptionIds.includes(optionId)) {
      onOptionsChange(selectedOptionIds.filter(id => id !== optionId));
    } else {
      onOptionsChange([...selectedOptionIds, optionId]);
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

  if (options.length === 0) {
    return (
      <div className="step4-options">
        <h2 className="step-title mb-5">ДОПОЛНИТЕЛЬНЫЕ ОПЦИИ</h2>
        <Card className="text-center py-5">
          <Card.Body>
            <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>
              ДОПОЛНИТЕЛЬНЫХ ПАКЕТОВ ОПЦИЙ ДЛЯ ДАННОГО АВТОМОБИЛЯ НЕ ПРЕДУСМОТРЕНО
            </p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="step4-options">
      <h2 className="step-title mb-5">ДОПОЛНИТЕЛЬНЫЕ ОПЦИИ</h2>
      
      <Card className="options-container">
        <Card.Body>
          <div className="options-list">
            {options.map((option) => {
              const isSelected = selectedOptionIds.includes(option.optionId);
              
              return (
                <div
                  key={option.optionId}
                  className={`option-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleOption(option.optionId)}
                >
                  <div className="option-content">
                    <div className="option-header">
                      <h5 className="option-name">{option.optionName}</h5>
                      <div className="option-price">
                        +{formatPrice(option.optionPrice)}
                      </div>
                    </div>
                    {option.description && (
                      <p className="option-description text-muted small mb-0">
                        {option.description}
                      </p>
                    )}
                  </div>
                  <div className="option-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOption(option.optionId)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Кнопка продолжения (опции опциональны) */}
          {onContinue && (
            <div className="mt-4 text-center">
              <Button
                variant="primary"
                size="lg"
                onClick={onContinue}
                className="px-5"
              >
                Продолжить →
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Step4Options;

