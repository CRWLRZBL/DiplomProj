import React, { useState } from 'react';
import { Card, Badge, Button, Collapse, Row, Col } from 'react-bootstrap';
import { Order } from '../../services/models/order';
import { utils } from '../../utils/constants';

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
  onStatusUpdate?: (orderId: number, newStatus: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  showActions = false,
  onStatusUpdate 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleStatusUpdate = (newStatus: string) => {
    if (onStatusUpdate) {
      onStatusUpdate(order.orderId, newStatus);
    }
  };

  const getStatusActions = (currentStatus: string) => {
    const actions = [];

    switch (currentStatus) {
      case 'Pending':
        actions.push(
          { status: 'Confirmed', label: 'Подтвердить', variant: 'success' },
          { status: 'Cancelled', label: 'Отменить', variant: 'danger' }
        );
        break;
      case 'Confirmed':
        actions.push(
          { status: 'InProduction', label: 'В производство', variant: 'primary' },
          { status: 'Cancelled', label: 'Отменить', variant: 'danger' }
        );
        break;
      case 'InProduction':
        actions.push(
          { status: 'Completed', label: 'Завершить', variant: 'success' }
        );
        break;
    }

    return actions;
  };

  const statusActions = getStatusActions(order.orderStatus);

  return (
    <Card className="mb-3 order-card">
      <Card.Body>
        <Row className="align-items-center">
          <Col md={showActions ? 6 : 8}>
            <div className="d-flex align-items-center mb-2">
              <h6 className="mb-0 me-3">Заказ #{order.orderId}</h6>
              <Badge bg={utils.getStatusVariant(order.orderStatus, 'order')}>
                {utils.getStatusLabel(order.orderStatus, 'order')}
              </Badge>
            </div>
            
            <p className="mb-1">
              <strong>Автомобиль:</strong> {order.carModel}
            </p>
            <p className="mb-1">
              <strong>Комплектация:</strong> {order.configuration}
            </p>
            <p className="mb-2">
              <strong>Дата заказа:</strong> {utils.formatDate(order.orderDate)}
            </p>
            
            <div className="d-flex align-items-center">
              <span className="h5 text-primary mb-0 me-3">
                {utils.formatPrice(order.totalPrice)}
              </span>
              
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Скрыть' : 'Подробнее'} 
                <i className={`ms-1 bi bi-chevron-${showDetails ? 'up' : 'down'}`}></i>
              </Button>
            </div>
          </Col>

          {showActions && statusActions.length > 0 && (
            <Col md={4}>
              <div className="d-flex flex-wrap gap-2 justify-content-end">
                {statusActions.map(action => (
                  <Button
                    key={action.status}
                    variant={action.variant as any}
                    size="sm"
                    onClick={() => handleStatusUpdate(action.status)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </Col>
          )}

          {!showActions && (
            <Col md={4} className="text-end">
              <small className="text-muted">
                {order.options.length} опций
              </small>
            </Col>
          )}
        </Row>

        <Collapse in={showDetails}>
          <div className="mt-3 pt-3 border-top">
            <Row>
              <Col md={6}>
                <h6>Дополнительные опции:</h6>
                {order.options.length > 0 ? (
                  <ul className="list-unstyled mb-0">
                    {order.options.map((option, index) => (
                      <li key={index} className="mb-1">
                        <small>
                          {option.optionName} 
                          <span className="text-success ms-2">
                            +{utils.formatPrice(option.price)}
                          </span>
                        </small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <small className="text-muted">Без дополнительных опций</small>
                )}
              </Col>
              
              <Col md={6}>
                <h6>Информация о заказе:</h6>
                <div className="small">
                  <p className="mb-1">
                    <strong>Клиент:</strong> {order.customerName}
                  </p>
                  <p className="mb-1">
                    <strong>Статус:</strong>{' '}
                    <Badge bg={utils.getStatusVariant(order.orderStatus, 'order')}>
                      {utils.getStatusLabel(order.orderStatus, 'order')}
                    </Badge>
                  </p>
                  <p className="mb-0">
                    <strong>ID заказа:</strong> #{order.orderId}
                  </p>
                </div>
              </Col>
            </Row>

            {/* Детали стоимости */}
            <Row className="mt-3">
              <Col>
                <div className="bg-light p-3 rounded">
                  <h6 className="mb-2">Детализация стоимости:</h6>
                  <Row>
                    <Col>
                      <small className="text-muted">Базовая цена автомобиля</small>
                    </Col>
                    <Col className="text-end">
                      <small>
                        {utils.formatPrice(order.totalPrice - order.options.reduce((sum, opt) => sum + opt.price, 0))}
                      </small>
                    </Col>
                  </Row>
                  
                  {order.options.map((option, index) => (
                    <Row key={index}>
                      <Col>
                        <small className="text-muted">{option.optionName}</small>
                      </Col>
                      <Col className="text-end">
                        <small className="text-success">
                          +{utils.formatPrice(option.price)}
                        </small>
                      </Col>
                    </Row>
                  ))}
                  
                  <hr className="my-2" />
                  <Row>
                    <Col>
                      <strong>Итого:</strong>
                    </Col>
                    <Col className="text-end">
                      <strong className="text-primary">
                        {utils.formatPrice(order.totalPrice)}
                      </strong>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  );
};

export default OrderCard;