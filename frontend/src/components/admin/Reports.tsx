import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Form, Button, Alert } from 'react-bootstrap';
import { SalesReportDto } from '../../services/models/order';
import { orderService } from '../../services/api/orderService';
import { carService } from '../../services/api/carService';
import { utils } from '../../utils/constants';
import LoadingSpinner from '../common/LoadingSpinner';

const Reports: React.FC = () => {
  const [salesReport, setSalesReport] = useState<SalesReportDto[]>([]);
  const [brands, setBrands] = useState<{ brandId: number; brandName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    brandId: ''
  });

  useEffect(() => {
    loadBrands();
    generateReport(); // Загружаем отчет по умолчанию
  }, []);

  const loadBrands = async () => {
    try {
      const brandsData = await carService.getBrands();
      setBrands(brandsData);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const report = await orderService.getSalesReport(
        filters.startDate || undefined,
        filters.endDate || undefined,
        filters.brandId ? parseInt(filters.brandId) : undefined
      );
      setSalesReport(report);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateReport();
  };

  const totalRevenue = salesReport.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalOrders = salesReport.reduce((sum, item) => sum + item.totalOrders, 0);

  // Устанавливаем даты по умолчанию (последние 30 дней)
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const defaultDates = getDefaultDates();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Отчеты по продажам</h4>
        <Button 
          variant="outline-primary" 
          onClick={generateReport}
          disabled={loading}
        >
          {loading ? 'Обновление...' : 'Обновить отчет'}
        </Button>
      </div>

      {/* Фильтры */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Параметры отчета</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Дата начала</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.startDate || defaultDates.start}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Дата окончания</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.endDate || defaultDates.end}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Марка автомобиля</Form.Label>
                  <Form.Select
                    value={filters.brandId}
                    onChange={(e) => handleFilterChange('brandId', e.target.value)}
                  >
                    <option value="">Все марки</option>
                    {brands.map(brand => (
                      <option key={brand.brandId} value={brand.brandId}>
                        {brand.brandName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                  Сформировать
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Сводная статистика */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="bg-primary text-white">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="mb-0">{utils.formatPrice(totalRevenue)}</h4>
                  <small>Общая выручка</small>
                </div>
                <div className="display-6">💰</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-success text-white">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="mb-0">{totalOrders}</h4>
                  <small>Всего заказов</small>
                </div>
                <div className="display-6">📦</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-info text-white">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="mb-0">
                    {totalOrders > 0 ? utils.formatPrice(totalRevenue / totalOrders) : utils.formatPrice(0)}
                  </h4>
                  <small>Средний чек</small>
                </div>
                <div className="display-6">📊</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {loading ? (
        <LoadingSpinner message="Формирование отчета..." />
      ) : (
        <>
          {/* Детальный отчет */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Детальный отчет по продажам</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {salesReport.length > 0 ? (
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Марка</th>
                      <th>Модель</th>
                      <th>Кол-во заказов</th>
                      <th>Общая выручка</th>
                      <th>Средний чек</th>
                      <th>Доля в выручке</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport.map((item, index) => {
                      const revenueShare = (item.totalRevenue / totalRevenue) * 100;
                      
                      return (
                        <tr key={index}>
                          <td>
                            <strong>{item.brandName}</strong>
                          </td>
                          <td>{item.modelName}</td>
                          <td>
                            <Badge bg="primary">{item.totalOrders}</Badge>
                          </td>
                          <td className="fw-bold text-success">
                            {utils.formatPrice(item.totalRevenue)}
                          </td>
                          <td>{utils.formatPrice(item.averageOrderValue)}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="flex-grow-1 me-3">
                                <ProgressBar 
                                  now={revenueShare} 
                                  variant="success"
                                  style={{ height: '6px' }}
                                />
                              </div>
                              <small className="text-muted">
                                {revenueShare.toFixed(1)}%
                              </small>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info" className="m-3">
                  <div className="text-center">
                    <div className="h4 mb-2">📊</div>
                    <p className="mb-0">Нет данных для отображения за выбранный период</p>
                  </div>
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Визуализация (можно добавить графики позже) */}
          {salesReport.length > 0 && (
            <Card className="mt-4">
              <Card.Header>
                <h5 className="mb-0">Распределение по маркам</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {salesReport.slice(0, 4).map((item, index) => {
                    const revenueShare = (item.totalRevenue / totalRevenue) * 100;
                    const colors = ['primary', 'success', 'warning', 'info'];
                    
                    return (
                      <Col key={index} md={6} lg={3} className="mb-3">
                        <div className="text-center">
                          <div 
                            className="display-6 mb-2"
                            style={{ color: `var(--bs-${colors[index]})` }}
                          >
                            🚗
                          </div>
                          <h6>{item.brandName}</h6>
                          <div className="h5 text-primary">
                            {utils.formatPrice(item.totalRevenue)}
                          </div>
                          <small className="text-muted">
                            {revenueShare.toFixed(1)}% от общей выручки
                          </small>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// Временные компоненты для стилизации
const Badge: React.FC<{ bg: string; children: React.ReactNode }> = ({ bg, children }) => (
  <span className={`badge bg-${bg}`}>{children}</span>
);

const ProgressBar: React.FC<{ now: number; variant: string; style?: React.CSSProperties }> = ({ 
  now, 
  variant, 
  style 
}) => (
  <div className={`progress`} style={style}>
    <div 
      className={`progress-bar bg-${variant}`}
      style={{ width: `${now}%` }}
    ></div>
  </div>
);

export default Reports;