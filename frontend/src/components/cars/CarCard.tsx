import React from 'react';
import { Card, Button, Badge, Spinner } from 'react-bootstrap';
import { Car } from '../../services/models/car';
import { useNavigate } from 'react-router-dom';
import { utils, CAR_STATUS, BODY_TYPE_LABELS, FUEL_TYPE_LABELS } from '../../utils/constants';
import { getModelImagePath } from '../../utils/imageUtils';

/**
 * Интерфейс для пропсов компонента CarCard.
 * Определяет структуру данных, необходимых для отображения карточки автомобиля.
 */
interface CarCardProps {
  car: Car;
}

/**
 * Компонент CarCard отображает карточку автомобиля с изображением, 
 * основными характеристиками и кнопкой для перехода в конфигуратор.
 * 
 * @param car - Объект с данными об автомобиле (марка, модель, цена, характеристики и т.д.)
 */
const CarCard: React.FC<CarCardProps> = ({ car }) => {
  // Хук для программной навигации по маршрутам
  const navigate = useNavigate();
  
  // Состояние загрузки изображения автомобиля
  const [imageLoaded, setImageLoaded] = React.useState(false);
  
  // Состояние ошибки загрузки изображения
  const [imageError, setImageError] = React.useState(false);

  /**
   * Обработчик клика по кнопке выбора автомобиля.
   * Перенаправляет пользователя на страницу конфигуратора с идентификатором модели.
   */
  const handleSelectCar = () => {
    // Переходим в конфигуратор с modelId
    navigate(`/configurator?modelId=${car.modelId}`);
  };

  const handleTestDrive = () => {
    navigate(`/test-drive?carId=${car.carId}`);
  };

  /**
   * Обработчик успешной загрузки изображения.
   * Скрывает индикатор загрузки после того, как изображение загрузилось.
   */
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  /**
   * Обработчик ошибки загрузки изображения.
   * Устанавливает флаг ошибки и скрывает индикатор загрузки,
   * чтобы отобразить изображение по умолчанию.
   */
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <Card className="h-100 car-card shadow-sm">
      {/* Контейнер для изображения автомобиля с относительным позиционированием */}
      <div className="car-image-container position-relative">
        {/* Показываем индикатор загрузки, пока изображение не загрузилось */}
        {!imageLoaded && (
          <div className="image-placeholder d-flex align-items-center justify-content-center"
               style={{ height: '200px', backgroundColor: '#f8f9fa' }}>
            <Spinner animation="border" variant="secondary" size="sm" />
          </div>
        )}
        
        {/* Изображение автомобиля: используем правильный путь к изображению модели */}
        <Card.Img 
          variant="top" 
          src={imageError 
            ? getModelImagePath(car.modelName || '', car.bodyType || '', car.imageUrl, undefined, 'Ледниковый')
            : getModelImagePath(car.modelName || '', car.bodyType || '', car.imageUrl, undefined, car.color || 'Ледниковый')
          }
          alt={`${car.brandName || ''} ${car.modelName || ''}`}
          className="car-card-image"
          style={{ 
            display: imageLoaded ? 'block' : 'none' // Скрываем изображение до завершения загрузки
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        
        {/* Бейдж со статусом автомобиля (в наличии, недоступен и т.д.) */}
        <Badge 
          bg={utils.getStatusVariant(car.status, 'car')} 
          className="position-absolute top-0 end-0 m-2"
          style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            padding: '6px 12px',
            textShadow: car.status === 'Reserved' ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {utils.getStatusLabel(car.status, 'car')}
        </Badge>
      </div>
      
      {/* Тело карточки с flex-контейнером для правильного размещения элементов */}
      <Card.Body className="d-flex flex-column">
        {/* Блок с бейджами типа кузова и типа топлива */}
        <div className="mb-2">
          {/* Бейдж типа кузова автомобиля (седан, хэтчбек и т.д.) */}
          <Badge bg="light" text="dark" className="me-2">
            {car.bodyType ? (BODY_TYPE_LABELS[car.bodyType] || car.bodyType) : 'Не указано'}
          </Badge>
          {/* Бейдж типа топлива (бензин, дизель, электрический и т.д.) */}
          <Badge bg="light" text="dark">
            {car.fuelType ? (FUEL_TYPE_LABELS[car.fuelType] || car.fuelType) : 'Не указано'}
          </Badge>
        </div>
        
        {/* Заголовок карточки с маркой и моделью автомобиля */}
        <Card.Title className="h5">
          {car.brandName || 'Не указано'} {car.modelName || 'Не указано'}
        </Card.Title>
        
        {/* Текст с дополнительными характеристиками автомобиля */}
        <Card.Text className="text-muted small mb-2">
          {/* Цвет автомобиля */}
          <strong>Цвет:</strong> {car.color || 'Не указан'}<br />
          {/* Год выпуска модели */}
          <strong>Год:</strong> {car.modelYear || 'Не указан'}<br />
          {/* Объем двигателя в литрах */}
          <strong>Двигатель:</strong> {car.engineCapacity ? `${car.engineCapacity}L` : 'Не указан'}
        </Card.Text>
        
        {/* Блок с ценой и кнопкой, прижатый к низу карточки */}
        <div className="mt-auto">
          {/* Блок с ценой автомобиля */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            {/* Отформатированная цена автомобиля */}
            <span className="h4 text-primary mb-0">
              {utils.formatPrice(car.basePrice)}
            </span>
          </div>
          
          {/* Кнопка выбора автомобиля: отключается, если автомобиль недоступен */}
          <div className="d-grid gap-2">
            <Button
              variant="primary"
              onClick={handleSelectCar}
              disabled={car.status !== CAR_STATUS.AVAILABLE}
              className="w-100"
            >
              {car.status === CAR_STATUS.AVAILABLE ? 'Выбрать' : 'Недоступно'}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={handleTestDrive}
              disabled={car.status !== CAR_STATUS.AVAILABLE}
              className="w-100"
            >
              Записаться на тест-драйв
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CarCard;