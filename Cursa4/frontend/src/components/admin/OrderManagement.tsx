import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Badge, Button, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { Order } from '../../services/models/order';
import { orderService } from '../../services/api/orderService';
import { utils, ORDER_STATUS, ORDER_STATUS_LABELS } from '../../utils/constants';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import Pagination from '../common/Pagination';

type SortField = 'orderId' | 'customerName' | 'carModel' | 'totalPrice' | 'orderStatus' | 'orderDate';
type SortDirection = 'asc' | 'desc';

/**
 * Компонент управления заказами
 * Предоставляет интерфейс для просмотра, фильтрации и изменения статусов заказов
 */
const OrderManagement: React.FC = () => {
  // Состояние для хранения списка всех заказов
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Состояние для хранения отфильтрованных заказов (отображаются в таблице)
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  
  // Состояние загрузки данных
  const [loading, setLoading] = useState(true);
  
  // Состояние для хранения сообщения об ошибке
  const [error, setError] = useState('');
  
  // Поисковый запрос для фильтрации заказов
  const [searchTerm, setSearchTerm] = useState('');
  
  // Фильтр по статусу заказа ('all' - показать все, иначе - конкретный статус)
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Сортировка
  const [sortField, setSortField] = useState<SortField>('orderId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Эффект: загружаем заказы при монтировании компонента
  useEffect(() => {
    loadOrders();
  }, []);

  // Эффект: применяем фильтры при изменении списка заказов, поискового запроса или фильтра статуса
  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter, sortField, sortDirection]);

  /**
   * Асинхронная функция для загрузки списка всех заказов из API
   * Обновляет состояние загрузки, получает данные и обрабатывает ошибки
   */
  const loadOrders = async () => {
    try {
      // Устанавливаем состояние загрузки в true для отображения индикатора загрузки
      setLoading(true);
      
      // Загружаем все заказы через сервис
      const ordersData = await orderService.getAllOrders();
      
      // Обновляем состояние со списком заказов
      setOrders(ordersData);
    } catch (err) {
      // При ошибке устанавливаем сообщение об ошибке для отображения пользователю
      setError('Ошибка при загрузке заказов');
      // Логируем ошибку в консоль для отладки
      console.error('Error loading orders:', err);
    } finally {
      // В любом случае (успех или ошибка) отключаем индикатор загрузки
      setLoading(false);
    }
  };

  /**
   * Применяет фильтры к списку заказов
   * Фильтрует заказы по поисковому запросу и статусу, сортирует, затем обновляет отфильтрованный список
   */
  const applyFilters = () => {
    // Создаем копию массива заказов для фильтрации
    let filtered = [...orders];

    // Фильтр по поисковому запросу
    // Ищет совпадения в имени клиента, модели автомобиля или номере заказа
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.configuration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderId.toString().includes(searchTerm)
      );
    }

    // Фильтр по статусу заказа
    // Если выбран конкретный статус (не 'all'), фильтруем только заказы с этим статусом
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Обновляем состояние отфильтрованных заказов для отображения в таблице
    setFilteredOrders(filtered);
    setCurrentPage(1); // Сбрасываем на первую страницу при изменении фильтров
  };

  // Пагинация
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (field !== sortField) return <i className="bi bi-sort-alpha-down text-muted ms-1"></i>;
    return sortDirection === 'asc' ? <i className="bi bi-sort-alpha-down ms-1"></i> : <i className="bi bi-sort-alpha-down-alt ms-1"></i>;
  };

  /**
   * Обновляет статус заказа
   * Отправляет запрос на изменение статуса и перезагружает список заказов
   * 
   * @param orderId - ID заказа, статус которого нужно изменить
   * @param newStatus - Новый статус заказа
   */
  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      setError(''); // Очищаем предыдущие ошибки
      console.log('Updating order status:', { orderId, newStatus });
      // Отправляем запрос на обновление статуса заказа через сервис
      // Передаем ID заказа, новый статус и комментарий об изменении
      await orderService.updateOrderStatus(
        orderId, 
        newStatus, 
        `Статус изменен администратором на: ${ORDER_STATUS_LABELS[newStatus]}`
      );
      
      // После успешного обновления перезагружаем список заказов для отображения изменений
      await loadOrders();
    } catch (err: any) {
      console.error('Error updating order status:', err);
      console.error('Error response:', err.response);
      // При ошибке устанавливаем сообщение об ошибке
      const errorMessage = err.response?.data?.error 
        || err.response?.data?.message 
        || err.message 
        || 'Ошибка при обновлении статуса заказа';
      setError(errorMessage);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      return;
    }
    
    try {
      setError('');
      await orderService.deleteOrder(orderId);
      await loadOrders();
    } catch (err: any) {
      console.error('Error deleting order:', err);
      const errorMessage = err.response?.data?.error 
        || err.response?.data?.message 
        || err.message 
        || 'Ошибка при удалении заказа';
      setError(errorMessage);
    }
  };

  /**
   * Определяет доступные действия для заказа в зависимости от его текущего статуса
   * Возвращает массив действий (кнопок), которые можно выполнить с заказом
   * 
   * @param currentStatus - Текущий статус заказа
   * @returns Массив объектов с информацией о доступных действиях (статус, подпись, вариант стиля)
   */
  const getStatusActions = (currentStatus: string) => {
    // Типизированный массив для хранения доступных действий
    const actions: Array<{ status: string; label: string; variant: string }> = [];

    // Определяем доступные действия в зависимости от текущего статуса
    switch (currentStatus) {
      // Для заказов со статусом "Ожидает подтверждения"
      case ORDER_STATUS.PENDING:
        actions.push(
          { status: ORDER_STATUS.CONFIRMED, label: 'Подтвердить', variant: 'success' },
          { status: ORDER_STATUS.CANCELLED, label: 'Отменить', variant: 'danger' }
        );
        break;
      
      // Для заказов со статусом "Подтвержден"
      case ORDER_STATUS.CONFIRMED:
        actions.push(
          { status: ORDER_STATUS.IN_PRODUCTION, label: 'В производство', variant: 'primary' },
          { status: ORDER_STATUS.CANCELLED, label: 'Отменить', variant: 'danger' }
        );
        break;
      
      // Для отмененных заказов - только удаление
      case ORDER_STATUS.CANCELLED:
        // Возвращаем пустой массив, удаление обрабатывается отдельно
        break;
      
      // Для заказов со статусом "В производстве"
      case ORDER_STATUS.IN_PRODUCTION:
        actions.push(
          { status: ORDER_STATUS.COMPLETED, label: 'Завершить', variant: 'success' }
        );
        break;
    }

    return actions;
  };

  // Отображаем индикатор загрузки, пока данные загружаются
  if (loading) {
    return <LoadingSpinner message="Загрузка заказов..." />;
  }

  return (
    <div>
      {/* Заголовок страницы с кнопкой обновления */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Управление заказами</h4>
        <div className="d-flex gap-2">
          {/* Кнопка для ручного обновления списка заказов */}
          <Button variant="outline-primary" size="sm" onClick={loadOrders}>
            Обновить
          </Button>
        </div>
      </div>

      {/* Отображение ошибки, если она возникла при загрузке данных */}
      {error && (
        <ErrorAlert 
          message={error}
          onRetry={loadOrders}
          onDismiss={() => setError('')}
        />
      )}

      {/* Блок фильтров для поиска и фильтрации заказов */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            {/* Поле поиска по клиенту, автомобилю или номеру заказа */}
            <Col md={6}>
              <InputGroup>
                <Form.Control
                  placeholder="Поиск по клиенту, автомобилю или № заказа..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            
            {/* Выпадающий список для фильтрации по статусу заказа */}
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Все статусы</option>
                {/* Генерируем опции для каждого возможного статуса заказа */}
                {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            
            {/* Счетчик отфильтрованных заказов */}
            <Col md={3} className="text-end">
              <small className="text-muted">
                Найдено: {filteredOrders.length} заказов
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Таблица с отфильтрованными заказами */}
      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            {/* Заголовки таблицы */}
            <thead className="bg-light">
              <tr>
                <th 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('orderId')}
                >
                  № Заказа <SortIcon field="orderId" />
                </th>
                <th 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('customerName')}
                >
                  Клиент <SortIcon field="customerName" />
                </th>
                <th 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('carModel')}
                >
                  Автомобиль <SortIcon field="carModel" />
                </th>
                <th>Комплектация</th>
                <th 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('totalPrice')}
                >
                  Стоимость <SortIcon field="totalPrice" />
                </th>
                <th 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('orderDate')}
                >
                  Дата <SortIcon field="orderDate" />
                </th>
                <th 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('orderStatus')}
                >
                  Статус <SortIcon field="orderStatus" />
                </th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {/* Рендерим строки таблицы для каждого отфильтрованного заказа */}
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    Заказы не найдены
                  </td>
                </tr>
              ) : (
                paginatedOrders.map(order => {
                // Получаем список доступных действий для заказа с текущим статусом
                const statusActions = getStatusActions(order.orderStatus);
                
                return (
                  <tr key={order.orderId}>
                    {/* Номер заказа */}
                    <td>
                      <strong>#{order.orderId}</strong>
                    </td>
                    
                    {/* Имя клиента */}
                    <td>{order.customerName}</td>
                    
                    {/* Модель автомобиля (с ограничением ширины для длинных названий) */}
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '150px' }}>
                        {order.carModel}
                      </div>
                    </td>
                    
                    {/* Название комплектации */}
                    <td>{order.configuration}</td>
                    
                    {/* Стоимость заказа (отформатированная с валютой) */}
                    <td className="fw-bold text-primary">
                      {utils.formatPrice(order.totalPrice)}
                    </td>
                    
                    {/* Дата создания заказа (отформатированная) */}
                    <td>
                      <small>
                        {utils.formatDate(order.orderDate)}
                      </small>
                    </td>
                    
                    {/* Статус заказа (отображается цветным бейджем) */}
                    <td>
                      <Badge 
                        bg={utils.getStatusVariant(order.orderStatus, 'order')}
                        style={{
                          backgroundColor: order.orderStatus === 'Pending' ? '#ffc107' : 
                                           order.orderStatus === 'Confirmed' ? '#17a2b8' : 
                                           order.orderStatus === 'InProduction' ? '#007bff' : 
                                           order.orderStatus === 'Completed' ? '#28a745' : 
                                           order.orderStatus === 'Cancelled' ? '#dc3545' : '#6c757d',
                          color: '#fff',
                          padding: '6px 12px',
                          fontSize: '0.875rem'
                        }}
                      >
                        {utils.getStatusLabel(order.orderStatus, 'order')}
                      </Badge>
                    </td>
                    
                    {/* Действия с заказом (выпадающее меню с кнопками изменения статуса) */}
                    <td>
                      {order.orderStatus === ORDER_STATUS.CANCELLED ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteOrder(order.orderId)}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Удалить
                        </Button>
                      ) : statusActions.length > 0 ? (
                        <div className="btn-group btn-group-sm">
                          {statusActions.map(action => (
                            <Button
                              key={action.status}
                              variant={action.variant as any}
                              size="sm"
                              onClick={() => handleStatusUpdate(order.orderId, action.status)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <small className="text-muted">Нет действий</small>
                      )}
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </Table>

          {/* Пагинация */}
          {filteredOrders.length > 0 && (
            <div className="p-3">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredOrders.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredOrders.length}
              />
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default OrderManagement;