import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../services/models/order';
import { orderService } from '../../services/api/orderService';
import { ORDER_STATUS_LABELS } from '../../utils/constants';

const OrderList: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const ordersData = await orderService.getUserOrders(user!.userId);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Confirmed': return 'info';
      case 'InProduction': return 'primary';
      case 'Completed': return 'success';
      case 'Cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return <div>Загрузка заказов...</div>;
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">История заказов</h5>
      </Card.Header>
      <Card.Body>
        {orders.length === 0 ? (
          <div className="text-center text-muted py-4">
            У вас пока нет заказов
          </div>
        ) : (
          <Table responsive>
            <thead>
              <tr>
                <th>№ Заказа</th>
                <th>Автомобиль</th>
                <th>Комплектация</th>
                <th>Стоимость</th>
                <th>Статус</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.orderId}>
                  <td>#{order.orderId}</td>
                  <td>{order.carModel}</td>
                  <td>{order.configuration}</td>
                  <td>{formatPrice(order.totalPrice)}</td>
                  <td>
                    <Badge bg={getStatusVariant(order.orderStatus)}>
                      {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
                    </Badge>
                  </td>
                  <td>{new Date(order.orderDate).toLocaleDateString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default OrderList;