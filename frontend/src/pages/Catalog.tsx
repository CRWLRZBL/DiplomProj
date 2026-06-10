import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Nav, Badge } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import CatalogListingCard from '../components/cars/CatalogListingCard';
import CarFilters from '../components/cars/CarFilters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import { Car } from '../services/models/car';
import { carService } from '../services/api/carService';
const Catalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('type') === 'used' ? 'Used' : 'New';

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [filters, setFilters] = useState({
    brand: '',
    bodyType: '',
    minPrice: '',
    maxPrice: '',
    searchQuery: '',
  });
  const [photoMatchIds, setPhotoMatchIds] = useState<number[] | null>(null);

  useEffect(() => {
    loadCars();
  }, [retryCount, tab]);

  const loadCars = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await carService.getCatalogListings({
        listingType: tab,
      });
      setCars(data);
    } catch (err) {
      setError('Не удалось загрузить каталог. Проверьте подключение к серверу.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCars = useMemo(() => {
    let list = [...cars];
    if (photoMatchIds && photoMatchIds.length > 0) {
      const set = new Set(photoMatchIds);
      list = list.filter((c) => set.has(c.carId));
    }
    if (filters.brand) {
      list = list.filter((c) =>
        c.brandName.toLowerCase().includes(filters.brand.toLowerCase())
      );
    }
    if (filters.bodyType) {
      list = list.filter((c) => c.bodyType === filters.bodyType);
    }
    if (filters.minPrice) {
      list = list.filter((c) => c.basePrice >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      list = list.filter((c) => c.basePrice <= Number(filters.maxPrice));
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          `${c.brandName} ${c.modelName} ${c.title ?? ''}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [cars, filters, photoMatchIds]);

  const setTab = (type: 'new' | 'used') => {
    setPhotoMatchIds(null);
    setSearchParams(type === 'used' ? { type: 'used' } : {});
  };

  if (loading) {
    return <LoadingSpinner message="Загружаем каталог..." />;
  }

  if (error) {
    return (
      <Container>
        <ErrorAlert message={error} onRetry={() => setRetryCount((n) => n + 1)} onDismiss={() => setError('')} />
      </Container>
    );
  }

  return (
    <div className="catalog-page">
      <Container className="py-4">
        <Row className="mb-4 align-items-end">
          <Col>
            <h1 className="display-6 fw-bold mb-2">Каталог автомобилей</h1>
            <p className="text-muted mb-0">Мультибрендовый салон «Авторитет» — новые и автомобили с пробегом</p>
          </Col>
        </Row>

        <Nav variant="tabs" className="mb-4 catalog-tabs">
          <Nav.Item>
            <Nav.Link active={tab === 'New'} onClick={() => setTab('new')}>
              Новые автомобили
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={tab === 'Used'} onClick={() => setTab('used')}>
              С пробегом
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Row>
          <Col lg={3} className="mb-4 mb-lg-0">
            <CarFilters
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={() => {
                setFilters({ brand: '', bodyType: '', minPrice: '', maxPrice: '', searchQuery: '' });
                setPhotoMatchIds(null);
              }}
              hideLadaPreset
              catalogCars={cars}
              photoMatchIds={photoMatchIds}
              onPhotoSearch={setPhotoMatchIds}
            />
          </Col>
          <Col lg={9}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <p className="text-muted mb-0">
                Найдено: <strong>{filteredCars.length}</strong>
              </p>
              <Badge bg="light" text="dark">
                {tab === 'New' ? 'Новые' : 'Б/У'}
              </Badge>
            </div>

            {filteredCars.length === 0 ? (
              <EmptyState
                title="Ничего не найдено"
                message={
                  cars.length === 0
                    ? 'Добавьте автомобили в разделе «Управление каталогом»'
                    : 'Измените параметры фильтра'
                }
                icon="car-front"
              />
            ) : (
              <Row className="g-4">
                {filteredCars.map((car) => (
                  <Col key={car.carId} sm={6} xl={4}>
                    <CatalogListingCard car={car} />
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Catalog;
