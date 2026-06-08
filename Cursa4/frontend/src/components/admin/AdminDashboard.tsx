import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, ProgressBar } from 'react-bootstrap';
import { Order } from '../../services/models/order';
import { Car } from '../../services/models/car';
import { orderService } from '../../services/api/orderService';
import { carService } from '../../services/api/carService';
import { utils, ORDER_STATUS, CAR_STATUS } from '../../utils/constants';
import LoadingSpinner from '../common/LoadingSpinner';

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    availableCars: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersData, carsData] = await Promise.all([
        orderService.getAllOrders(),
        carService.getCars()
      ]);
      
      setOrders(ordersData);
      setCars(carsData);
      
      calculateStats(ordersData, carsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData: Order[], carsData: Car[]) => {
    const totalRevenue = ordersData.reduce((sum, order) => sum + order.totalPrice, 0);
    const pendingOrders = ordersData.filter(order => order.orderStatus === ORDER_STATUS.PENDING).length;
    const availableCars = carsData.filter(car => car.status === CAR_STATUS.AVAILABLE).length;

    setStats({
      totalRevenue,
      totalOrders: ordersData.length,
      pendingOrders,
      availableCars
    });
  };

  const getOrderStatusDistribution = () => {
    const distribution = {
      [ORDER_STATUS.PENDING]: 0,
      [ORDER_STATUS.CONFIRMED]: 0,
      [ORDER_STATUS.IN_PRODUCTION]: 0,
      [ORDER_STATUS.COMPLETED]: 0,
      [ORDER_STATUS.CANCELLED]: 0,
    };

    orders.forEach(order => {
      distribution[order.orderStatus as keyof typeof distribution]++;
    });

    return distribution;
  };

  if (loading) {
    return <LoadingSpinner message="Загрузка дашборда..." />;
  }

  const statusDistribution = getOrderStatusDistribution();
  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <h4 className="mb-4">Обзор системы</h4>
      
      {/* Статистические карточки */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="stat-card border-0 bg-primary text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{utils.formatPrice(stats.totalRevenue)}</h4>
                  <small>Общая выручка</small>
                </div>
                <div className="display-6">💰</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="stat-card border-0 bg-success text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{stats.totalOrders}</h4>
                  <small>Всего заказов</small>
                </div>
                <div className="display-6">📦</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="stat-card border-0 bg-warning text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{stats.pendingOrders}</h4>
                  <small>Ожидают подтверждения</small>
                </div>
                <div className="display-6">⏳</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="stat-card border-0 bg-info text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{stats.availableCars}</h4>
                  <small>Авто в наличии</small>
                </div>
                <div className="display-6">🚗</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Распределение статусов */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Статусы заказов</h5>
            </Card.Header>
            <Card.Body>
              {Object.entries(statusDistribution).map(([status, count]) => (
                <div key={status} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>{utils.getStatusLabel(status, 'order')}</span>
                    <span className="fw-bold">{count}</span>
                  </div>
                  <ProgressBar 
                    now={(count / stats.totalOrders) * 100} 
                    variant={utils.getStatusVariant(status, 'order')}
                    style={{ height: '8px' }}
                  />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Последние заказы */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Последние заказы</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Клиент</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.orderId}>
                      <td>#{order.orderId}</td>
                      <td className="text-truncate" style={{ maxWidth: '120px' }}>
                        {order.customerName}
                      </td>
                      <td>{utils.formatPrice(order.totalPrice)}</td>
                      <td>
                        <Badge bg={utils.getStatusVariant(order.orderStatus, 'order')}>
                          {utils.getStatusLabel(order.orderStatus, 'order')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Быстрые действия */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Быстрые действия</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3} className="text-center mb-3">
              <div className="p-3 border rounded hover-card">
                <div className="display-6 mb-2">📋</div>
                <h6>Просмотреть все заказы</h6>
                <small className="text-muted">Управление заказами</small>
              </div>
            </Col>
            <Col md={3} className="text-center mb-3">
              <div className="p-3 border rounded hover-card">
                <div className="display-6 mb-2">🚗</div>
                <h6>Управление автомобилями</h6>
                <small className="text-muted">Каталог и наличие</small>
              </div>
            </Col>
            <Col md={3} className="text-center mb-3">
              <div className="p-3 border rounded hover-card">
                <div className="display-6 mb-2">📊</div>
                <h6>Отчеты по продажам</h6>
                <small className="text-muted">Аналитика и статистика</small>
              </div>
            </Col>
            <Col md={3} className="text-center mb-3">
              <div className="p-3 border rounded hover-card">
                <div className="display-6 mb-2">👥</div>
                <h6>Клиентская база</h6>
                <small className="text-muted">Управление пользователями</small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminDashboard;