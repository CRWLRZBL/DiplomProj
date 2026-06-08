import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { Car } from '../../services/models/car';
import CarCard from './CarCard';

/**
 * Интерфейс для пропсов компонента CarList.
 * Определяет структуру данных массива автомобилей для отображения.
 */
interface CarListProps {
  cars: Car[];
}

/**
 * Компонент CarList отображает сетку карточек автомобилей.
 * Использует метод map() для итерации по массиву автомобилей и рендерит
 * компонент CarCard для каждого автомобиля.
 * 
 * @param cars - Массив объектов с данными об автомобилях
 */
const CarList: React.FC<CarListProps> = ({ cars }) => {
  return (
    <Row>
      {/* Итерация по массиву автомобилей: для каждого автомобиля создается карточка
          Колонка с адаптивной шириной: 
          - xs={12} - на очень маленьких экранах занимает всю ширину
          - sm={6} - на маленьких экранах 2 карточки в ряд
          - lg={4} - на больших экранах 3 карточки в ряд
          - mb-4 - отступ снизу для разделения строк */}
      {cars.map(car => (
        <Col key={car.carId} xs={12} sm={6} lg={4} className="mb-4">
          {/* Компонент карточки автомобиля с передачей данных об автомобиле */}
          <CarCard car={car} />
        </Col>
      ))}
    </Row>
  );
};

export default CarList;