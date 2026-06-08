import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Accordion, Alert, Spinner } from 'react-bootstrap';
import { carService } from '../../services/api/carService';
import { BODY_TYPE_LABELS } from '../../utils/constants';
import { Car } from '../../services/models/car';
import { findSimilarCarsByPhoto } from '../../utils/photoSearch';
import { resolveCatalogImageSrc } from '../../utils/catalogImage';

interface Filters {
  brand: string;
  bodyType: string;
  minPrice: string;
  maxPrice: string;
  searchQuery: string;
}

interface CarFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onClearFilters: () => void;
  hideLadaPreset?: boolean;
  catalogCars?: Car[];
  photoMatchIds?: number[] | null;
  onPhotoSearch?: (ids: number[] | null) => void;
}

interface Brand {
  brandId: number;
  brandName: string;
}

const CarFilters: React.FC<CarFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  hideLadaPreset = false,
  catalogCars = [],
  photoMatchIds = null,
  onPhotoSearch,
}) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [bodyTypes, setBodyTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [photoSearching, setPhotoSearching] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    if (catalogCars.length === 0) return;

    const catalogBrandNames = [
      ...new Set(catalogCars.map((c) => c.brandName).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, 'ru'));

    setBrands((prev) => {
      const merged = new Map<string, Brand>();
      prev.forEach((b) => merged.set(b.brandName.toLowerCase(), b));
      catalogBrandNames.forEach((name, i) => {
        const key = name.toLowerCase();
        if (!merged.has(key)) {
          merged.set(key, { brandId: 10_000 + i, brandName: name });
        }
      });
      return [...merged.values()].sort((a, b) =>
        a.brandName.localeCompare(b.brandName, 'ru')
      );
    });

    const catalogBodyTypes = [
      ...new Set(catalogCars.map((c) => c.bodyType).filter(Boolean)),
    ];
    setBodyTypes((prev) => [...new Set([...prev, ...catalogBodyTypes])].sort());
  }, [catalogCars]);

  const loadFilterData = async () => {
    try {
      setIsLoading(true);
      const [brandsData, bodyTypesData] = await Promise.all([
        carService.getBrands(),
        carService.getBodyTypes()
      ]);
      
      setBrands(brandsData);
      setBodyTypes(bodyTypesData);
    } catch (error) {
      console.error('Error loading filter data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof Filters, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const handleClearFilters = () => {
    onClearFilters();
  };

  const applyPreset = (preset: Partial<Filters>) => {
    onFilterChange({
      ...filters,
      ...preset,
    });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '');
  };

  const formatPriceValue = (value: string): string => {
    if (!value) return '';
    return parseInt(value).toLocaleString('ru-RU');
  };

  if (isLoading) {
    return (
      <Card className="sticky-filters">
        <Card.Header>
          <h5 className="mb-0">Фильтры</h5>
        </Card.Header>
        <Card.Body>
          <div className="text-center text-muted">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
            Загрузка фильтров...
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="sticky-filters">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Фильтры</h5>
        {hasActiveFilters() && (
          <Badge bg="primary" pill>
            Активно
          </Badge>
        )}
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <div className="text-muted small mb-2">Быстрые пресеты</div>
          <div className="d-flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => applyPreset({ maxPrice: '2000000' })}
            >
              До 2 млн ₽
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => applyPreset({ bodyType: 'Hatchback' })}
            >
              Для города
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => applyPreset({ bodyType: 'SUV' })}
            >
              Для семьи
            </Button>
            {!hideLadaPreset && (
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => applyPreset({ searchQuery: 'lada' })}
              >
                LADA
              </Button>
            )}
          </div>
          <div className="text-muted small mt-2">
            Пресеты работают по тем данным, которые уже есть в каталоге (цена/кузов/текстовый поиск).
          </div>
        </div>

        <Accordion defaultActiveKey="0" flush>
          {/* Поиск */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>Поиск</Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Поиск по названию</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Марка, модель, цвет..."
                  value={filters.searchQuery}
                  onChange={(e) => handleInputChange('searchQuery', e.target.value)}
                  className="shadow-sm"
                />
                <Form.Text className="text-muted">
                  Найдите автомобиль по названию марки, модели или цвету
                </Form.Text>
              </Form.Group>

              <div className="mt-3 p-2 border rounded bg-light">
                <div className="small fw-semibold mb-1">Поиск по фото</div>
                <div className="small text-muted mb-2">
                  Загрузите фото автомобиля — покажем похожие объявления в каталоге.
                </div>
                <Form.Control
                  type="file"
                  accept="image/*"
                  disabled={photoSearching || catalogCars.length === 0}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !onPhotoSearch) return;
                    setPhotoError('');
                    setPhotoSearching(true);
                    try {
                      const items = catalogCars.map((c) => ({
                        carId: c.carId,
                        imageUrl: resolveCatalogImageSrc(c),
                      }));
                      const matches = await findSimilarCarsByPhoto(file, items, 24);
                      if (matches.length === 0) {
                        const hasRealPhotos = catalogCars.some(
                          (c) => !resolveCatalogImageSrc(c).includes('default.svg')
                        );
                        setPhotoError(
                          hasRealPhotos
                            ? 'Похожие автомобили не найдены. Попробуйте другое фото.'
                            : 'В каталоге нет фотографий для сравнения — добавьте URL изображений в карточках автомобилей.'
                        );
                        onPhotoSearch([]);
                      } else {
                        onPhotoSearch(matches.map((m) => m.carId));
                      }
                    } catch {
                      setPhotoError('Не удалось обработать фото.');
                      onPhotoSearch?.(null);
                    } finally {
                      setPhotoSearching(false);
                      e.target.value = '';
                    }
                  }}
                />
                {photoSearching && (
                  <div className="small text-muted mt-2 d-flex align-items-center gap-2">
                    <Spinner size="sm" /> Сравниваем изображения…
                  </div>
                )}
                {photoError && (
                  <Alert variant="warning" className="small py-2 mt-2 mb-0">
                    {photoError}
                  </Alert>
                )}
                {photoMatchIds && photoMatchIds.length > 0 && (
                  <div className="small text-success mt-2">
                    Найдено похожих: {photoMatchIds.length}
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 ms-1"
                      onClick={() => onPhotoSearch?.(null)}
                    >
                      Сбросить
                    </Button>
                  </div>
                )}
              </div>
            </Accordion.Body>
          </Accordion.Item>

          {/* Марка и тип кузова */}
          <Accordion.Item eventKey="1">
            <Accordion.Header>Основные параметры</Accordion.Header>
            <Accordion.Body>
              {/* Бренд */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Марка автомобиля</Form.Label>
                <Form.Select
                  value={filters.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  className="shadow-sm"
                >
                  <option value="">Все марки</option>
                  {brands.map(brand => (
                    <option key={brand.brandId} value={brand.brandName}>
                      {brand.brandName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Тип кузова */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Тип кузова</Form.Label>
                <Form.Select
                  value={filters.bodyType}
                  onChange={(e) => handleInputChange('bodyType', e.target.value)}
                  className="shadow-sm"
                >
                  <option value="">Все типы</option>
                  {bodyTypes.map(type => (
                    <option key={type} value={type}>
                      {BODY_TYPE_LABELS[type] || type}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Accordion.Body>
          </Accordion.Item>

          {/* Цена */}
          <Accordion.Item eventKey="2">
            <Accordion.Header>Цена</Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Диапазон цен, ₽</Form.Label>
                <Row className="g-2">
                  <Col>
                    <Form.Control
                      type="number"
                      placeholder="От"
                      value={filters.minPrice}
                      onChange={(e) => handleInputChange('minPrice', e.target.value)}
                      className="shadow-sm"
                      min="0"
                      step="100000"
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      type="number"
                      placeholder="До"
                      value={filters.maxPrice}
                      onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                      className="shadow-sm"
                      min="0"
                      step="100000"
                    />
                  </Col>
                </Row>
                <Form.Text className="text-muted">
                  {filters.minPrice || filters.maxPrice ? (
                    <span>
                      Выбран диапазон: 
                      {filters.minPrice && ` от ${formatPriceValue(filters.minPrice)}₽`}
                      {filters.maxPrice && ` до ${formatPriceValue(filters.maxPrice)}₽`}
                    </span>
                  ) : (
                    "Укажите минимальную и максимальную цену"
                  )}
                </Form.Text>
              </Form.Group>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        {/* Кнопки управления фильтрами */}
        <div className="d-grid gap-2 mt-4">
          <Button 
            variant="outline-primary" 
            onClick={handleClearFilters}
            disabled={!hasActiveFilters()}
            size="sm"
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Сбросить фильтры
          </Button>
        </div>

        {/* Информация о активных фильтрах */}
        {hasActiveFilters() && (
          <div className="mt-3 p-3 bg-light rounded">
            <h6 className="fw-semibold mb-2">Активные фильтры:</h6>
            <div className="d-flex flex-wrap gap-1">
              {filters.searchQuery && (
                <span className="badge bg-secondary">
                  Поиск: {filters.searchQuery}
                </span>
              )}
              {filters.brand && (
                <span className="badge bg-secondary">
                  Марка: {filters.brand}
                </span>
              )}
              {filters.bodyType && (
                <span className="badge bg-secondary">
                  Кузов: {BODY_TYPE_LABELS[filters.bodyType] || filters.bodyType}
                </span>
              )}
              {filters.minPrice && (
                <span className="badge bg-secondary">
                  От: {formatPriceValue(filters.minPrice)}₽
                </span>
              )}
              {filters.maxPrice && (
                <span className="badge bg-secondary">
                  До: {formatPriceValue(filters.maxPrice)}₽
                </span>
              )}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

// Временный компонент Badge так как он не импортирован
const Badge: React.FC<{ bg: string; pill?: boolean; children: React.ReactNode }> = ({ 
  bg, 
  pill, 
  children 
}) => {
  return (
    <span className={`badge bg-${bg} ${pill ? 'rounded-pill' : ''}`}>
      {children}
    </span>
  );
};

export default CarFilters;