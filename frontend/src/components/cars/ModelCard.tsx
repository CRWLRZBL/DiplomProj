import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Form } from 'react-bootstrap';
import { Model } from '../../services/models/car';
import { useNavigate } from 'react-router-dom';
import { utils, BODY_TYPE_LABELS, FUEL_TYPE_LABELS } from '../../utils/constants';
import { getModelImagePath } from '../../utils/imageUtils';

interface ModelCardProps {
  model: Model;
  compareSelected?: boolean;
  onToggleCompare?: () => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, compareSelected = false, onToggleCompare }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImagePath, setCurrentImagePath] = useState<string>('');

  // Доступные цвета для Aura (если Ледниковый не найден)
  const auraFallbackColors = ['Платина', 'Кориандр', 'Пантера'];

  useEffect(() => {
    const path = getModelImagePath(
      model.modelName || '',
      model.bodyType || 'Sedan',
      model.imageUrl,
      undefined
    );
    setCurrentImagePath(path);
  }, [model]);

  const handleSelectModel = () => {
    navigate(`/configurator?modelId=${model.modelId}`);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    // Для Aura пробуем другие доступные цвета
    if (model.modelName?.toLowerCase().includes('aura') && currentImagePath.includes('Ледниковый')) {
      const modelFolder = 'Aura';
      const configPrefix = 'Aura';
      
      // Пробуем цвета по порядку
      const triedColorIndex = auraFallbackColors.findIndex(color => 
        currentImagePath.includes(color.replace(/\s+/g, ''))
      );
      
      if (triedColorIndex < auraFallbackColors.length - 1) {
        const nextColor = auraFallbackColors[triedColorIndex + 1];
        const normalizedColor = nextColor.replace(/\s+/g, '');
        const newPath = `/images/cars/${modelFolder}/${configPrefix}-${normalizedColor}.png`;
        setCurrentImagePath(newPath);
        setImageLoaded(false); // Сбрасываем, чтобы попробовать загрузить новое изображение
        return; // Попробуем загрузить новое изображение
      }
    }
    
    setImageError(true);
    setImageLoaded(true);
  };

  // Формируем путь к изображению модели в базовом цвете Ледниковый
  const imagePath = currentImagePath || getModelImagePath(
    model.modelName || '',
    model.bodyType || 'Sedan',
    model.imageUrl,
    undefined // configurationName не доступен в ModelCard
  );

  return (
    <Card className="h-100 car-card shadow-sm">
      <div className="car-image-container position-relative">
        {!imageLoaded && (
          <div className="image-placeholder d-flex align-items-center justify-content-center"
               style={{ height: '250px', backgroundColor: '#f8f9fa' }}>
            <Spinner animation="border" variant="secondary" size="sm" />
          </div>
        )}
        
        <Card.Img 
          variant="top" 
          src={imageError 
            ? '/images/cars/default.svg' 
            : (currentImagePath || imagePath || '/images/cars/default.svg')
          }
          alt={`${model.brandName || ''} ${model.modelName || ''}`}
          className="car-card-image"
          style={{ 
            display: imageLoaded ? 'block' : 'none'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          key={currentImagePath} // Перезагружаем при изменении пути
        />
        
        <Badge 
          bg={model.availableCount > 0 ? 'success' : 'secondary'} 
          className="position-absolute top-0 end-0 m-2"
        >
          {model.availableCount > 0 ? `В наличии: ${model.availableCount}` : 'Нет в наличии'}
        </Badge>
      </div>
      
      <Card.Body className="d-flex flex-column">
        {onToggleCompare && (
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Check
              type="checkbox"
              id={`cmp-${model.modelId}`}
              label="Сравнить"
              checked={compareSelected}
              onChange={onToggleCompare}
            />
            {compareSelected && (
              <Badge bg="primary">Выбрано</Badge>
            )}
          </div>
        )}
        <div className="mb-2">
          <Badge bg="light" text="dark" className="me-2">
            {model.bodyType ? (BODY_TYPE_LABELS[model.bodyType] || model.bodyType) : 'Не указано'}
          </Badge>
          {model.fuelType && (
            <Badge bg="light" text="dark">
              {FUEL_TYPE_LABELS[model.fuelType] || model.fuelType}
            </Badge>
          )}
        </div>
        
        <Card.Title className="h5 mb-2" style={{ fontWeight: 600, color: '#212529' }}>
          {model.brandName || 'Не указано'} {model.modelName || 'Не указано'}
        </Card.Title>
        
        <Card.Text className="text-muted small mb-2" style={{ lineHeight: '1.6', color: '#6c757d' }}>
          {model.modelYear && <><strong>Год:</strong> {model.modelYear}<br /></>}
          {model.engineCapacity && <><strong>Двигатель:</strong> {model.engineCapacity}L<br /></>}
          {model.availableCount > 0 && (
            <><strong>Доступно:</strong> {model.availableCount} {model.availableCount === 1 ? 'автомобиль' : 
              model.availableCount < 5 ? 'автомобиля' : 'автомобилей'}</>
          )}
        </Card.Text>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="h4 text-primary mb-0" style={{ fontWeight: 700 }}>
              {utils.formatPrice(model.basePrice)}
            </span>
          </div>
          
          <Button 
            variant="primary" 
            onClick={handleSelectModel}
            disabled={!model.isActive}
            className="w-100"
            style={{ fontWeight: 500 }}
          >
            {model.isActive ? 'Выбрать' : 'Недоступно'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ModelCard;

