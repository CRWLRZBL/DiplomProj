import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Nav, Table, Badge, Button, Modal, Form, InputGroup, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Order } from '../services/models/order';
import { Car } from '../services/models/car';
import { orderService } from '../services/api/orderService';
import { carService } from '../services/api/carService';
import { ORDER_STATUS_LABELS, CAR_STATUS_LABELS, CAR_STATUS, utils } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import SalesReportExport from '../components/admin/SalesReportExport';
import CarImport from '../components/admin/CarImport';
import AddSingleCar from '../components/admin/AddSingleCar';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { getSiteModalManager } from '../utils/siteModalManager';
import { getApiErrorMessage } from '../utils/apiError';
import { validateVin, parseNonNegativeInt } from '../utils/validation';
import Pagination from '../components/common/Pagination';
import {
  resolvePublicImageUrl,
  handleCatalogImageError,
} from '../utils/catalogImage';
import {
  CAR_CONDITION_OPTIONS,
  DEFAULT_CONDITION_NEW,
  DEFAULT_CONDITION_USED,
} from '../constants/carConditions';

type SortField = 'orderId' | 'customerName' | 'carModel' | 'totalPrice' | 'orderStatus' | 'orderDate';
type CarSortField = 'carId' | 'brandName' | 'modelName' | 'color' | 'basePrice' | 'status';
type SortDirection = 'asc' | 'desc';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    color: '',
    status: '',
    vin: '',
    mileage: 0,
    imageUrl: '',
    condition: DEFAULT_CONDITION_NEW,
    listingType: 'New' as 'New' | 'Used',
  });
  const [photoGallery, setPhotoGallery] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingCarId, setDeletingCarId] = useState<number | null>(null);
  const [success, setSuccess] = useState('');
  const [showAddCar, setShowAddCar] = useState(false);
  const [colorOptions, setColorOptions] = useState<string[]>([]);

  // Состояния для поиска и фильтрации заказов
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSortField, setOrderSortField] = useState<SortField>('orderId');
  const [orderSortDirection, setOrderSortDirection] = useState<SortDirection>('desc');
  const [orderPage, setOrderPage] = useState(1);
  const orderItemsPerPage = 10;
  
  // Состояния для поиска и фильтрации автомобилей
  const [carSearch, setCarSearch] = useState('');
  const [carStatusFilter, setCarStatusFilter] = useState<string>('all');
  const [carSortField, setCarSortField] = useState<CarSortField>('carId');
  const [carSortDirection, setCarSortDirection] = useState<SortDirection>('desc');
  const [carPage, setCarPage] = useState(1);
  const carItemsPerPage = 10;

  useBodyScrollLock(showEditModal);
  const isAdmin = user?.roleName === 'Admin';
  const isManager = user?.roleName === 'Manager';
  const isStaff = isAdmin || isManager;

  useEffect(() => {
    if (isStaff) {
      loadData();
    }
    if (isAdmin) {
      void carService.getColors().then((colors) => {
        if (colors.length > 0) setColorOptions(colors.map((c) => c.name));
      });
    }
  }, [user, isStaff, isAdmin]);

  useEffect(() => {
    if (isManager && activeTab !== 'orders') {
      setActiveTab('orders');
    }
  }, [isManager, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, carsData] = await Promise.all([
        orderService.getAllOrders(),
        carService.getCars(undefined, undefined, true) // Получаем все автомобили, не только доступные
      ]);
      setOrders(ordersData);
      setCars(carsData);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      setError(''); // Очищаем предыдущие ошибки
      console.log('Updating order status:', { orderId, newStatus });
      await orderService.updateOrderStatus(orderId, newStatus);
      await loadData(); // Перезагружаем данные
    } catch (err: any) {
      console.error('Error updating order status:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.error 
        || err.response?.data?.message 
        || err.message 
        || 'Ошибка при обновлении статуса';
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
      await loadData(); // Перезагружаем данные
    } catch (err: any) {
      console.error('Error deleting order:', err);
      const errorMessage = err.response?.data?.error 
        || err.response?.data?.message 
        || err.message 
        || 'Ошибка при удалении заказа';
      setError(errorMessage);
    }
  };

  const getAvailableActions = (orderStatus: string) => {
    const actions: { label: string; status: string; variant: string }[] = [];
    
    switch (orderStatus) {
      case 'Pending':
        actions.push(
          { label: 'Подтвердить', status: 'Confirmed', variant: 'success' },
          { label: 'Отменить', status: 'Cancelled', variant: 'danger' }
        );
        break;
      case 'Confirmed':
        actions.push(
          { label: 'В производство', status: 'InProduction', variant: 'primary' },
          { label: 'Отменить', status: 'Cancelled', variant: 'danger' }
        );
        break;
      case 'InProduction':
        actions.push(
          { label: 'Завершить', status: 'Completed', variant: 'success' }
        );
        break;
    }
    
    return actions;
  };

  const applyPhotoGallery = (urls: string[]) => {
    const unique = urls.map((u) => resolvePublicImageUrl(u)).filter(Boolean);
    setPhotoGallery(unique);
    setEditForm((f) => ({ ...f, imageUrl: unique[0] ?? '' }));
  };

  const handleEditCar = (car: Car) => {
    setEditingCar(car);
    const gallery =
      car.imageUrls && car.imageUrls.length > 0
        ? car.imageUrls
        : car.imageUrl
          ? [car.imageUrl]
          : [];
    setEditForm({
      color: car.color || '',
      status: car.status || '',
      vin: car.vin || '',
      mileage: car.mileage ?? 0,
      imageUrl: car.imageUrl || gallery[0] || '',
      condition: car.condition || (car.listingType === 'Used' ? DEFAULT_CONDITION_USED : DEFAULT_CONDITION_NEW),
      listingType: car.listingType === 'Used' ? 'Used' : 'New',
    });
    applyPhotoGallery(gallery);
    setShowEditModal(true);
  };

  const uploadCarPhoto = async (file: File) => {
    setUploadingPhoto(true);
    setError('');
    try {
      const url = await carService.uploadCatalogImage(file);
      applyPhotoGallery([url, ...photoGallery.filter((u) => u !== url)]);
    } catch {
      setError('Не удалось загрузить фото.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhotoAt = (index: number) => {
    applyPhotoGallery(photoGallery.filter((_, i) => i !== index));
  };

  const handleSaveCar = async () => {
    if (!editingCar) return;

    const vinError = validateVin(editForm.vin);
    if (vinError) {
      setError(vinError);
      return;
    }
    if (!editForm.color.trim()) {
      setError('Укажите цвет автомобиля');
      return;
    }
    const mileage = parseNonNegativeInt(String(editForm.mileage));
    if (mileage == null) {
      setError('Пробег должен быть неотрицательным числом');
      return;
    }

    try {
      setError('');
      await carService.updateCar(editingCar.carId, {
        color: editForm.color,
        status: editForm.status,
        vin: editForm.vin,
        mileage: mileage || undefined,
        imageUrl: photoGallery[0] ?? (editForm.imageUrl.trim() ? editForm.imageUrl.trim() : null),
        imageUrls: photoGallery,
        condition: editForm.condition,
      });
      setShowEditModal(false);
      setEditingCar(null);
      setPhotoGallery([]);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось обновить автомобиль.'));
      console.error('Error updating car:', err);
    }
  };

  const handleDeleteCar = async (car: Car) => {
    if (
      !window.confirm(
        `Удалить автомобиль #${car.carId} (${car.brandName} ${car.modelName})?\n\nКарточка будет архивирована и скрыта из каталога.`
      )
    ) {
      return;
    }
    try {
      setDeletingCarId(car.carId);
      setError('');
      await carService.deleteCar(car.carId);
      setCars((prev) => prev.filter((c) => c.carId !== car.carId));
      setSuccess(`Автомобиль #${car.carId} удалён из списка (архивирован).`);
      if (editingCar?.carId === car.carId) {
        setShowEditModal(false);
        setEditingCar(null);
        setPhotoGallery([]);
      }
      await loadData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Ошибка при удалении автомобиля';
      setError(msg);
    } finally {
      setDeletingCarId(null);
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

  // Фильтрация и сортировка заказов
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];

    // Поиск
    if (orderSearch) {
      const searchLower = orderSearch.toLowerCase();
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(searchLower) ||
        order.carModel.toLowerCase().includes(searchLower) ||
        order.configuration?.toLowerCase().includes(searchLower) ||
        order.orderId.toString().includes(searchLower)
      );
    }

    // Фильтр по статусу
    if (orderStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === orderStatusFilter);
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue: any = a[orderSortField];
      let bValue: any = b[orderSortField];

      // Обработка даты
      if (orderSortField === 'orderDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return orderSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return orderSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [orders, orderSearch, orderStatusFilter, orderSortField, orderSortDirection]);

  // Пагинация заказов
  const paginatedOrders = useMemo(() => {
    const startIndex = (orderPage - 1) * orderItemsPerPage;
    return filteredAndSortedOrders.slice(startIndex, startIndex + orderItemsPerPage);
  }, [filteredAndSortedOrders, orderPage, orderItemsPerPage]);

  // Фильтрация и сортировка автомобилей
  const filteredAndSortedCars = useMemo(() => {
    let filtered = cars.filter((car) => car.status !== 'Archived');

    // Поиск
    if (carSearch) {
      const searchLower = carSearch.toLowerCase();
      filtered = filtered.filter(car =>
        car.brandName.toLowerCase().includes(searchLower) ||
        car.modelName.toLowerCase().includes(searchLower) ||
        car.color.toLowerCase().includes(searchLower) ||
        car.vin.toLowerCase().includes(searchLower) ||
        car.carId.toString().includes(searchLower)
      );
    }

    // Фильтр по статусу
    if (carStatusFilter !== 'all') {
      filtered = filtered.filter(car => car.status === carStatusFilter);
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue: any = a[carSortField];
      let bValue: any = b[carSortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return carSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return carSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [cars, carSearch, carStatusFilter, carSortField, carSortDirection]);

  // Пагинация автомобилей
  const paginatedCars = useMemo(() => {
    const startIndex = (carPage - 1) * carItemsPerPage;
    return filteredAndSortedCars.slice(startIndex, startIndex + carItemsPerPage);
  }, [filteredAndSortedCars, carPage, carItemsPerPage]);

  const handleSort = (field: SortField, currentField: SortField, currentDirection: SortDirection, setField: (f: SortField) => void, setDirection: (d: SortDirection) => void) => {
    if (field === currentField) {
      setDirection(currentDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setField(field);
      setDirection('asc');
    }
  };

  const handleCarSort = (field: CarSortField) => {
    if (field === carSortField) {
      setCarSortDirection(carSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setCarSortField(field);
      setCarSortDirection('asc');
    }
  };

  const SortIcon = ({ field, sortField, sortDirection }: { field: string; sortField: string; sortDirection: SortDirection }) => {
    if (field !== sortField) return <i className="bi bi-sort-alpha-down text-muted ms-1"></i>;
    return sortDirection === 'asc' ? <i className="bi bi-sort-alpha-down ms-1"></i> : <i className="bi bi-sort-alpha-down-alt ms-1"></i>;
  };

  // Условные return после всех хуков
  if (!user || !isStaff) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <LoadingSpinner message="Загрузка админ-панели..." />;
  }

  const pendingOrders = orders.filter(order => order.orderStatus === 'Pending');
  const availableCars = cars.filter(car => car.status === 'Available' || car.status === 'В наличии');

  return (
    <div className="admin-page">
      <Container fluid className="px-0">
        <Container fluid>
          {/* Заголовок страницы */}
          <Row className="mb-4">
            <Col>
              <div>
                <h1 className="display-5 fw-bold mb-2 text-dark">
                  {isManager ? 'Управление заказами' : 'Админ-панель'}
                </h1>
                <p className="text-dark mb-0" style={{ fontSize: '1.125rem' }}>
                  {isManager
                    ? 'Просмотр заказов, деталей и смена статуса'
                    : 'Управление заказами, автомобилями и отчёты'}
                </p>
              </div>
            </Col>
          </Row>

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mb-3">
            {success}
          </Alert>
        )}

        {error && (
          <ErrorAlert 
            message={error}
            onRetry={loadData}
            onDismiss={() => setError('')}
          />
        )}

        <Row>
          <Col lg={3}>
            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Меню</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Nav variant="pills" className="flex-column admin-side-nav">
                  <Nav.Link 
                    active={activeTab === 'orders'} 
                    onClick={() => setActiveTab('orders')}
                    className="admin-side-nav__link px-4 py-3"
                  >
                    <i className="bi bi-speedometer2 me-2"></i>
                    Панель управления
                  </Nav.Link>
                  {isAdmin && (
                    <>
                      <Nav.Link
                        active={activeTab === 'cars'}
                        onClick={() => setActiveTab('cars')}
                        className="admin-side-nav__link px-4 py-3"
                      >
                        <i className="bi bi-car-front me-2"></i>
                        Управление автомобилями
                      </Nav.Link>
                      <Nav.Link
                        active={activeTab === 'reports'}
                        onClick={() => setActiveTab('reports')}
                        className="admin-side-nav__link px-4 py-3"
                      >
                        <i className="bi bi-graph-up me-2"></i>
                        Отчеты по продажам
                      </Nav.Link>
                      <Nav.Link as={Link} to="/catalog/manage" className="admin-side-nav__link px-4 py-3">
                        <i className="bi bi-grid me-2"></i>
                        Управление каталогом
                      </Nav.Link>
                    </>
                  )}
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={9}>
            {/* Управление заказами с дашбордом */}
            {activeTab === 'orders' && (
              <>
                {isAdmin && (
                  <Card className="shadow-sm border-0 mb-4">
                    <Card.Header className="bg-light">
                      <h4 className="mb-0">
                        <i className="bi bi-speedometer2 me-2"></i>
                        Общая статистика
                      </h4>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={3}>
                          <Card className="bg-primary text-white text-center">
                            <Card.Body>
                              <h3>{pendingOrders.length}</h3>
                              <p>Новых заказов</p>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={3}>
                          <Card className="bg-success text-white text-center">
                            <Card.Body>
                              <h3>{availableCars.length}</h3>
                              <p>Автомобилей в наличии</p>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={3}>
                          <Card className="bg-info text-white text-center">
                            <Card.Body>
                              <h3>{orders.length}</h3>
                              <p>Всего заказов</p>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={3}>
                          <Card className="bg-warning text-white text-center">
                            <Card.Body>
                              <h3>{formatPrice(
                                orders
                                  .filter(order => {
                                    const car = cars.find(c => c.carId === order.carId);
                                    return car?.status === 'Sold' || order.orderStatus === 'Completed';
                                  })
                                  .reduce((sum, order) => sum + order.totalPrice, 0)
                              )}</h3>
                              <p>Общая выручка</p>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                <Card className="shadow-sm border-0">
                  <Card.Header className="bg-light">
                    <h4 className="mb-0">
                      <i className="bi bi-cart-check me-2"></i>
                      Управление заказами
                    </h4>
                  </Card.Header>
                  <Card.Body>
                    {/* Поиск и фильтры */}
                    <Row className="mb-3">
                      <Col md={5}>
                        <InputGroup>
                          <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                          <Form.Control
                            placeholder="Поиск по клиенту, автомобилю, комплектации или № заказа..."
                            value={orderSearch}
                            onChange={(e) => {
                              setOrderSearch(e.target.value);
                              setOrderPage(1);
                            }}
                          />
                        </InputGroup>
                      </Col>
                      <Col md={3}>
                        <Form.Select
                          value={orderStatusFilter}
                          onChange={(e) => {
                            setOrderStatusFilter(e.target.value);
                            setOrderPage(1);
                          }}
                        >
                          <option value="all">Все статусы</option>
                          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={4} className="text-end">
                        <small className="text-muted">
                          Найдено: {filteredAndSortedOrders.length} заказов
                        </small>
                      </Col>
                    </Row>

                    <Table responsive>
                      <thead>
                        <tr>
                          <th 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('orderId', orderSortField, orderSortDirection, setOrderSortField, setOrderSortDirection)}
                          >
                            № <SortIcon field="orderId" sortField={orderSortField} sortDirection={orderSortDirection} />
                          </th>
                          <th 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('customerName', orderSortField, orderSortDirection, setOrderSortField, setOrderSortDirection)}
                          >
                            Клиент <SortIcon field="customerName" sortField={orderSortField} sortDirection={orderSortDirection} />
                          </th>
                          <th 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('carModel', orderSortField, orderSortDirection, setOrderSortField, setOrderSortDirection)}
                          >
                            Автомобиль <SortIcon field="carModel" sortField={orderSortField} sortDirection={orderSortDirection} />
                          </th>
                          <th>Комплектация</th>
                          <th 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('totalPrice', orderSortField, orderSortDirection, setOrderSortField, setOrderSortDirection)}
                          >
                            Стоимость <SortIcon field="totalPrice" sortField={orderSortField} sortDirection={orderSortDirection} />
                          </th>
                          <th 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('orderStatus', orderSortField, orderSortDirection, setOrderSortField, setOrderSortDirection)}
                          >
                            Статус <SortIcon field="orderStatus" sortField={orderSortField} sortDirection={orderSortDirection} />
                          </th>
                          <th 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('orderDate', orderSortField, orderSortDirection, setOrderSortField, setOrderSortDirection)}
                          >
                            Дата <SortIcon field="orderDate" sortField={orderSortField} sortDirection={orderSortDirection} />
                          </th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedOrders.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-5 text-muted">
                              Заказы не найдены
                            </td>
                          </tr>
                        ) : (
                          paginatedOrders.map(order => (
                            <tr key={order.orderId}>
                              <td>#{order.orderId}</td>
                              <td>{order.customerName}</td>
                              <td>{order.carModel}</td>
                              <td>{order.configuration}</td>
                              <td>{formatPrice(order.totalPrice)}</td>
                              <td>
                                <Badge 
                                  bg="secondary"
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                  }}
                                >
                                  {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
                                </Badge>
                              </td>
                              <td>
                                <small>{utils.formatDate(order.orderDate)}</small>
                              </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                {order.orderStatus === 'Cancelled' ? (
                                  <Button 
                                    variant="outline-secondary" 
                                    size="sm"
                                    onClick={() => handleDeleteOrder(order.orderId)}
                                  >
                                    <i className="bi bi-trash me-1"></i>
                                    Удалить
                                  </Button>
                                ) : (
                                  getAvailableActions(order.orderStatus).map((action, idx) => (
                                    <Button
                                      key={idx}
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => handleStatusUpdate(order.orderId, action.status)}
                                    >
                                      {action.label}
                                    </Button>
                                  ))
                                )}
                              </div>
                            </td>
                            </tr>
                          ))
                        )
                      }
                      </tbody>
                    </Table>
                    
                    {/* Пагинация заказов */}
                    {filteredAndSortedOrders.length > 0 && (
                      <div className="mt-3">
                        <Pagination
                          currentPage={orderPage}
                          totalPages={Math.ceil(filteredAndSortedOrders.length / orderItemsPerPage)}
                          onPageChange={setOrderPage}
                          itemsPerPage={orderItemsPerPage}
                          totalItems={filteredAndSortedOrders.length}
                        />
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}

            {/* Управление автомобилями */}
            {activeTab === 'cars' && (
              <>
                <Row>
                  <Col md={12} className="mb-4">
                    <CarImport />
                  </Col>
                </Row>
                <Card className="shadow-sm border-0">
                  <Card.Header className="bg-light">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <h4 className="mb-0">
                        <i className="bi bi-car-front me-2"></i>
                        Управление автомобилями
                      </h4>
                      <div className="d-flex gap-2">
                        <Button
                          className="btn-dealership-dark"
                          size="sm"
                          onClick={() => setShowAddCar(true)}
                        >
                          Добавить
                        </Button>
                        <Button variant="outline-primary" size="sm" onClick={loadData}>
                          Обновить
                        </Button>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {/* Поиск и фильтры */}
                    <Row className="mb-3">
                      <Col md={4}>
                        <InputGroup>
                          <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                          <Form.Control
                            placeholder="Поиск по марке, модели, цвету, VIN или ID..."
                            value={carSearch}
                            onChange={(e) => {
                              setCarSearch(e.target.value);
                              setCarPage(1);
                            }}
                          />
                        </InputGroup>
                      </Col>
                      <Col md={3}>
                        <Form.Select
                          value={carStatusFilter}
                          onChange={(e) => {
                            setCarStatusFilter(e.target.value);
                            setCarPage(1);
                          }}
                        >
                          <option value="all">Все статусы</option>
                          {Object.entries(CAR_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={5} className="text-end">
                        <small className="text-muted">
                          Найдено: {filteredAndSortedCars.length} автомобилей
                        </small>
                      </Col>
                    </Row>

                    <Table responsive>
                      <thead>
                        <tr>
                          <th 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleCarSort('carId')}
                          >
                            ID <SortIcon field="carId" sortField={carSortField} sortDirection={carSortDirection} />
                          </th>
                          <th 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleCarSort('brandName')}
                          >
                            Марка <SortIcon field="brandName" sortField={carSortField} sortDirection={carSortDirection} />
                          </th>
                          <th 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleCarSort('modelName')}
                          >
                            Модель <SortIcon field="modelName" sortField={carSortField} sortDirection={carSortDirection} />
                          </th>
                          <th>Комплектация</th>
                          <th 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleCarSort('color')}
                          >
                            Цвет <SortIcon field="color" sortField={carSortField} sortDirection={carSortDirection} />
                          </th>
                          <th 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleCarSort('basePrice')}
                          >
                            Цена <SortIcon field="basePrice" sortField={carSortField} sortDirection={carSortDirection} />
                          </th>
                          <th 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleCarSort('status')}
                          >
                            Статус <SortIcon field="status" sortField={carSortField} sortDirection={carSortDirection} />
                          </th>
                          <th>VIN</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCars.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center py-5 text-muted">
                              Автомобили не найдены
                            </td>
                          </tr>
                        ) : (
                          paginatedCars.map(car => (
                          <tr key={car.carId}>
                            <td>{car.carId}</td>
                            <td>{car.brandName}</td>
                            <td>{car.modelName}</td>
                            <td>{car.configurationName || <span className="text-muted">—</span>}</td>
                            <td>{car.color}</td>
                            <td>{formatPrice(car.basePrice)}</td>
                            <td>
                              <Badge 
                                bg={getStatusVariant(car.status)}
                                style={{
                                  backgroundColor: car.status === 'Available' ? '#28a745' : 
                                                   car.status === 'Reserved' ? '#ffc107' : 
                                                   car.status === 'Sold' ? '#dc3545' : '#495057',
                                  color: car.status === 'Reserved' ? '#000' : '#fff',
                                  padding: '6px 12px',
                                  fontSize: '0.875rem',
                                  fontWeight: '500'
                                }}
                              >
                                {CAR_STATUS_LABELS[car.status] || car.status}
                              </Badge>
                            </td>
                            <td>
                              <code style={{
                                backgroundColor: '#f8f9fa',
                                color: '#212529',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                border: '1px solid #dee2e6',
                                display: 'inline-block',
                                minWidth: '150px',
                                textAlign: 'center',
                                fontWeight: '500'
                              }}>{car.vin}</code>
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEditCar(car)}
                                >
                                  Редактировать
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  disabled={deletingCarId === car.carId}
                                  onClick={() => void handleDeleteCar(car)}
                                >
                                  {deletingCarId === car.carId ? '…' : 'Удалить'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                        )}
                      </tbody>
                    </Table>
                    
                    {/* Пагинация автомобилей */}
                    {filteredAndSortedCars.length > 0 && (
                      <div className="mt-3">
                        <Pagination
                          currentPage={carPage}
                          totalPages={Math.ceil(filteredAndSortedCars.length / carItemsPerPage)}
                          onPageChange={setCarPage}
                          itemsPerPage={carItemsPerPage}
                          totalItems={filteredAndSortedCars.length}
                        />
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}

            {/* Отчеты по продажам */}
            {activeTab === 'reports' && (
              <>
                <SalesReportExport />
              </>
            )}
          </Col>
        </Row>

        {/* Модальное окно редактирования автомобиля */}
        <AddSingleCar
          show={showAddCar}
          onHide={() => setShowAddCar(false)}
          onCreated={() => {
            setSuccess('Автомобиль добавлен в склад.');
            void loadData();
          }}
        />

        <Modal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          scrollable
          backdrop={false}
          enforceFocus={false}
          manager={getSiteModalManager()}
          className="consultation-modal"
          dialogClassName="consultation-modal-dialog"
          container={typeof document !== 'undefined' ? document.body : undefined}
        >
          <Modal.Header closeButton>
            <Modal.Title>Редактирование автомобиля #{editingCar?.carId}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Модель</Form.Label>
                <Form.Control 
                  type="text" 
                  value={`${editingCar?.brandName} ${editingCar?.modelName}` || ''} 
                  disabled 
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Цвет *</Form.Label>
                {colorOptions.length > 0 ? (
                  <Form.Select
                    value={editForm.color}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    required
                  >
                    <option value="">Выберите цвет</option>
                    {colorOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Form.Select>
                ) : (
                  <Form.Control
                    type="text"
                    value={editForm.color}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    placeholder="Введите цвет"
                    required
                  />
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Статус</Form.Label>
                <Form.Select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value={CAR_STATUS.AVAILABLE}>{CAR_STATUS_LABELS[CAR_STATUS.AVAILABLE]}</option>
                  <option value={CAR_STATUS.RESERVED}>{CAR_STATUS_LABELS[CAR_STATUS.RESERVED]}</option>
                  <option value={CAR_STATUS.SOLD}>{CAR_STATUS_LABELS[CAR_STATUS.SOLD]}</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>VIN *</Form.Label>
                <Form.Control
                  type="text"
                  value={editForm.vin}
                  onChange={(e) => setEditForm({ ...editForm, vin: e.target.value.toUpperCase() })}
                  placeholder="17 символов"
                  maxLength={17}
                  required
                />
              </Form.Group>

              {editForm.listingType === 'Used' && (
                <Form.Group className="mb-3">
                  <Form.Label>Состояние</Form.Label>
                  <Form.Select
                    value={editForm.condition}
                    onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                  >
                    {CAR_CONDITION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Пробег</Form.Label>
                <Form.Control
                  type="text"
                  inputMode="numeric"
                  value={editForm.mileage}
                  onChange={(e) => {
                    const n = parseNonNegativeInt(e.target.value);
                    setEditForm({ ...editForm, mileage: n ?? 0 });
                  }}
                  placeholder="0"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Фотографии ({photoGallery.length})</Form.Label>
                <div className="mb-2">
                  <Button
                    as="label"
                    variant="outline-dark"
                    size="sm"
                    className="mb-0"
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? 'Загрузка…' : '+ Загрузить фото'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files?.length) return;
                        void (async () => {
                          setUploadingPhoto(true);
                          setError('');
                          try {
                            const urls: string[] = [];
                            for (const file of Array.from(files)) {
                              urls.push(await carService.uploadCatalogImage(file));
                            }
                            applyPhotoGallery([...photoGallery, ...urls]);
                          } catch {
                            setError('Не удалось загрузить фото.');
                          } finally {
                            setUploadingPhoto(false);
                            e.target.value = '';
                          }
                        })();
                      }}
                    />
                  </Button>
                </div>
                {photoGallery.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {photoGallery.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className="position-relative border rounded overflow-hidden"
                        style={{ width: 100 }}
                      >
                        {idx === 0 && (
                          <span className="position-absolute top-0 start-0 m-1 badge bg-dark" style={{ fontSize: '0.6rem' }}>
                            Главное
                          </span>
                        )}
                        <img
                          src={resolvePublicImageUrl(url)}
                          alt=""
                          width={100}
                          height={75}
                          style={{ objectFit: 'cover', display: 'block' }}
                          onError={handleCatalogImageError}
                        />
                        <div className="p-1 bg-light border-top">
                          <Button
                            type="button"
                            variant="outline-danger"
                            size="sm"
                            className="w-100"
                            style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.2rem 0.4rem' }}
                            onClick={() => removePhotoAt(idx)}
                          >
                            <i className="bi bi-trash3 me-1" aria-hidden />
                            Удалить
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Form.Text className="text-muted d-block mb-2">
                    Загрузите фото с компьютера или укажите URL ниже.
                  </Form.Text>
                )}
                <Form.Control
                  type="text"
                  value={editForm.imageUrl}
                  onChange={(e) => {
                    const url = e.target.value.trim();
                    if (!url) {
                      applyPhotoGallery(photoGallery.slice(1));
                      return;
                    }
                    applyPhotoGallery([url, ...photoGallery.filter((u) => u !== url)]);
                  }}
                  placeholder="Или URL: /uploads/catalog/... или https://..."
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-between">
            <Button
              variant="outline-danger"
              onClick={() => editingCar && void handleDeleteCar(editingCar)}
              disabled={!editingCar || deletingCarId === editingCar?.carId}
            >
              Удалить автомобиль
            </Button>
            <div>
              <Button variant="secondary" className="me-2" onClick={() => setShowEditModal(false)}>
                Отмена
              </Button>
              <Button variant="primary" onClick={() => void handleSaveCar()}>
                Сохранить
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      </Container>
    </Container>
    </div>
  );
};

export default Admin;