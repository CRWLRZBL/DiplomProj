import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Modal, Card, Badge, InputGroup } from 'react-bootstrap';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES, PAGINATION } from '../utils/constants';
import { carService } from '../services/api/carService';
import { Car, SaveCarListing } from '../services/models/car';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { getSiteModalManager } from '../utils/siteModalManager';
import {
  resolvePublicImageUrl,
  resolveCatalogImageSrc,
  handleCatalogImageError,
} from '../utils/catalogImage';
import './CatalogManage.css';
import {
  CAR_CONDITION_OPTIONS,
  DEFAULT_CONDITION_NEW,
  DEFAULT_CONDITION_USED,
} from '../constants/carConditions';
import {
  BODY_TYPE_OPTIONS,
  DRIVE_OPTIONS,
  FUEL_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
} from '../constants/vehicleForm';
import {
  validateCatalogForm,
  sanitizeVinInput,
  sanitizeDigits,
  sanitizeDecimalInput,
  parseDecimalInput,
  parseNonNegativeInt,
  FIELD_LIMITS,
  MAX_CAR_YEAR,
  MIN_CAR_YEAR,
  type FieldErrors,
} from '../utils/validation';
import { getApiErrorMessage } from '../utils/apiError';

const emptyForm = (): SaveCarListing => ({
  listingType: 'New',
  brandName: '',
  modelName: '',
  title: '',
  bodyType: '',
  basePrice: 0,
  showPriceFrom: true,
  color: '',
  status: 'Available',
  vin: '',
  mileage: 0,
  modelYear: new Date().getFullYear(),
  fuelType: '',
  engineCapacity: null,
  transmission: '',
  driveType: '',
  trim: '',
  generation: '',
  condition: DEFAULT_CONDITION_NEW,
  description: '',
  imageUrl: '',
  imageUrls: [],
  tradeInDiscount: null,
  creditDiscount: null,
  isPublished: true,
  configuratorModelId: null,
});

const carToForm = (car: Car): SaveCarListing => ({
  listingType: car.listingType === 'Used' ? 'Used' : 'New',
  brandName: car.brandName,
  modelName: car.modelName,
  title: car.title ?? '',
  bodyType: car.bodyType,
  basePrice: car.basePrice,
  showPriceFrom: car.listingType !== 'Used',
  color: car.color,
  status: car.status,
  vin: car.vin,
  mileage: car.mileage ?? 0,
  modelYear: car.modelYear,
  fuelType: car.fuelType,
  engineCapacity: car.engineCapacity ?? null,
  transmission: car.transmission ?? '',
  driveType: car.driveType ?? '',
  trim: car.trim ?? '',
  generation: car.generation ?? '',
  condition: car.condition ?? '',
  description: car.description ?? '',
  imageUrl: car.imageUrl ?? '',
  imageUrls: car.imageUrls ?? [],
  tradeInDiscount: car.tradeInDiscount ?? null,
  creditDiscount: car.creditDiscount ?? null,
  isPublished: car.isPublished ?? true,
  configuratorModelId: car.configuratorModelId ?? null,
});

const CatalogManage: React.FC = () => {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<SaveCarListing>(emptyForm());
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [photoGallery, setPhotoGallery] = useState<string[]>([]);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [engineCapacityText, setEngineCapacityText] = useState('');
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE;

  const applyPhotoGallery = (urls: string[]) => {
    const unique = urls.map((u) => resolvePublicImageUrl(u)).filter(Boolean);
    setPhotoGallery(unique);
    setForm((f) => ({ ...f, imageUrl: unique[0] ?? '' }));
  };

  const removePhotoAt = (index: number) => {
    applyPhotoGallery(photoGallery.filter((_, i) => i !== index));
  };

  const setAsMainPhoto = (index: number) => {
    if (index <= 0) return;
    const next = [...photoGallery];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    applyPhotoGallery(next);
  };

  const isAdmin = user?.roleName === USER_ROLES.ADMIN;

  useBodyScrollLock(showForm);

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const data = await carService.getCatalogListings({ all: true });
      setCars(data.filter((c) => c.status !== 'Archived'));
    } catch {
      setError('Не удалось загрузить список автомобилей.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCars = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter(
      (c) =>
        `${c.carId} ${c.brandName} ${c.modelName} ${c.title ?? ''} ${c.vin ?? ''}`
          .toLowerCase()
          .includes(q)
    );
  }, [cars, searchQuery]);

  const paginatedCars = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredCars.slice(start, start + itemsPerPage);
  }, [filteredCars, page, itemsPerPage]);

  if (!user || !isAdmin) {
    return <Navigate to="/catalog" replace />;
  }

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setPhotoGallery([]);
    setEngineCapacityText('');
    setFieldErrors({});
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const uploadMainPhoto = async (file: File) => {
    setUploadingMain(true);
    setError('');
    try {
      const url = await carService.uploadCatalogImage(file);
      applyPhotoGallery([url, ...photoGallery.filter((u) => u !== url)]);
    } catch {
      setError('Не удалось загрузить главное фото.');
    } finally {
      setUploadingMain(false);
    }
  };

  const uploadExtraPhotos = async (files: FileList) => {
    setUploadingExtra(true);
    setError('');
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await carService.uploadCatalogImage(file));
      }
      applyPhotoGallery([...photoGallery, ...urls]);
    } catch {
      setError('Не удалось загрузить дополнительные фото.');
    } finally {
      setUploadingExtra(false);
    }
  };

  const openEdit = (car: Car) => {
    setEditId(car.carId);
    setForm(carToForm(car));
    const gallery =
      car.imageUrls && car.imageUrls.length > 0
        ? car.imageUrls
        : car.imageUrl
          ? [car.imageUrl]
          : [];
    applyPhotoGallery(gallery);
    setEngineCapacityText(
      car.engineCapacity != null ? String(car.engineCapacity).replace(',', '.') : ''
    );
    setFieldErrors({});
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const engineCapacity = parseDecimalInput(engineCapacityText);
    const formWithVolume = { ...form, engineCapacity };
    const errors = validateCatalogForm(formWithVolume);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Исправьте ошибки в полях формы.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload: SaveCarListing = {
        ...formWithVolume,
        imageUrl: photoGallery[0] ?? '',
        imageUrls: photoGallery,
        showPriceFrom: form.listingType === 'New',
        mileage: form.listingType === 'Used' ? form.mileage ?? 1 : 0,
      };
      if (editId) {
        await carService.updateCatalogListing(editId, payload);
        setSuccess('Карточка обновлена.');
      } else {
        await carService.createCatalogListing(payload);
        setSuccess('Автомобиль добавлен в каталог.');
      }
      setShowForm(false);
      await loadAll();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось сохранить карточку.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListing = async (carId: number) => {
    if (!window.confirm('Удалить карточку из каталога? Автомобиль будет архивирован.')) return;
    setError('');
    try {
      await carService.deleteCatalogListing(carId);
      setCars((prev) => prev.filter((c) => c.carId !== carId));
      setSuccess('Карточка удалена из списка.');
    } catch {
      setError('Не удалось удалить карточку.');
    }
  };

  if (loading) return <LoadingSpinner message="Загрузка..." />;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 mb-1">Управление каталогом</h1>
          <p className="text-muted mb-0">Добавление и редактирование карточек (любые марки и модели)</p>
        </div>
        <div className="d-flex gap-2">
          <Button as={Link as any} to="/catalog" variant="outline-secondary">
            В каталог
          </Button>
          <Button className="btn-dealership-dark" onClick={openCreate}>
            Добавить автомобиль
          </Button>
        </div>
      </div>

      {error && !showForm && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row className="mb-3 g-2 align-items-center">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Поиск по марке, модели, VIN или ID…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </InputGroup>
        </Col>
        <Col md={6} className="text-md-end text-muted small">
          Найдено: {filteredCars.length}
        </Col>
      </Row>

      {paginatedCars.length === 0 ? (
        <Alert variant="light" className="text-center text-muted">
          {searchQuery ? 'Ничего не найдено по вашему запросу.' : 'Карточек пока нет — добавьте первый автомобиль.'}
        </Alert>
      ) : (
        <Row className="g-3">
          {paginatedCars.map((c) => (
            <Col key={c.carId} xs={12} sm={6} lg={4} xl={3}>
              <Card
                className={`catalog-manage-card h-100 shadow-sm ${selectedId === c.carId ? 'selected' : ''}`}
                onClick={() => setSelectedId(c.carId)}
              >
                <div
                  className="catalog-listing-image-wrap"
                  style={{ height: 160 }}
                >
                  <img
                    src={resolveCatalogImageSrc(c)}
                    alt=""
                    onError={handleCatalogImageError}
                  />
                </div>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <Badge bg={c.listingType === 'Used' ? 'secondary' : 'dark'}>
                      {c.listingType === 'Used' ? 'Б/У' : 'Новый'}
                    </Badge>
                    <span className="text-muted small">#{c.carId}</span>
                  </div>
                  <Card.Title className="h6 mb-1" style={{ minHeight: '2.6em' }}>
                    <Link to={`/catalog/${c.carId}`} onClick={(e) => e.stopPropagation()}>
                      {c.title || `${c.brandName} ${c.modelName}`}
                    </Link>
                  </Card.Title>
                  <div className="fw-bold mb-2">{c.basePrice.toLocaleString('ru-RU')} ₽</div>
                  <div className="small mb-3">
                    {c.isPublished ? (
                      <span className="text-success">Опубликован</span>
                    ) : (
                      <span className="text-muted">Скрыт</span>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline-dark"
                      className="flex-fill"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(c);
                      }}
                    >
                      Изменить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteListing(c.carId);
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {filteredCars.length > itemsPerPage && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(filteredCars.length / itemsPerPage)}
            onPageChange={setPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredCars.length}
          />
        </div>
      )}

      <Modal
        show={showForm}
        onHide={() => setShowForm(false)}
        size="lg"
        scrollable
        backdrop={false}
        enforceFocus={false}
        manager={getSiteModalManager()}
        className="consultation-modal catalog-manage-modal"
        dialogClassName="consultation-modal-dialog catalog-manage-modal__dialog"
        container={typeof document !== 'undefined' ? document.body : undefined}
      >
        <Modal.Header closeButton>
          <Modal.Title>{editId ? 'Редактировать карточку' : 'Новый автомобиль'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            {error && showForm && (
              <Alert variant="danger" className="py-2 small">
                {error}
              </Alert>
            )}
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Раздел</Form.Label>
                  <Form.Select
                    value={form.listingType}
                    onChange={(e) => {
                      const listingType = e.target.value as 'New' | 'Used';
                      setForm({
                        ...form,
                        listingType,
                        showPriceFrom: listingType === 'New',
                        mileage: listingType === 'New' ? 0 : form.mileage,
                        condition:
                          listingType === 'New' ? DEFAULT_CONDITION_NEW : DEFAULT_CONDITION_USED,
                      });
                    }}
                  >
                    <option value="New">Новый</option>
                    <option value="Used">С пробегом</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Марка *</Form.Label>
                  <Form.Control
                    value={form.brandName}
                    maxLength={FIELD_LIMITS.brand}
                    isInvalid={!!fieldErrors.brandName}
                    onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                    placeholder="LADA, Kia, Hyundai..."
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.brandName}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Модель *</Form.Label>
                  <Form.Control
                    value={form.modelName}
                    maxLength={FIELD_LIMITS.model}
                    isInvalid={!!fieldErrors.modelName}
                    onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                    placeholder="Vesta, Rio..."
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.modelName}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Заголовок карточки</Form.Label>
                  <Form.Control
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="ВАЗ (LADA) Iskra Cross 1.6 MT, 2025"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Цвет *</Form.Label>
                  <Form.Control
                    value={form.color}
                    maxLength={FIELD_LIMITS.color}
                    isInvalid={!!fieldErrors.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="Ледниковый, Пантера..."
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.color}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Цена, ₽ *</Form.Label>
                  <Form.Control
                    type="text"
                    inputMode="numeric"
                    isInvalid={!!fieldErrors.basePrice}
                    value={form.basePrice ? String(form.basePrice) : ''}
                    onChange={(e) => {
                      const raw = sanitizeDigits(e.target.value, FIELD_LIMITS.priceDigits);
                      setForm({ ...form, basePrice: raw ? Number(raw) : 0 });
                    }}
                    placeholder="Например, 1000000"
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.basePrice}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              {form.listingType === 'New' && (
                <Col md={12}>
                  <Form.Text className="text-muted">
                    Для новых автомобилей цена в каталоге всегда отображается как «от …».
                  </Form.Text>
                </Col>
              )}
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Пробег, км</Form.Label>
                  <Form.Control
                    type="text"
                    inputMode="numeric"
                    isInvalid={!!fieldErrors.mileage}
                    value={form.mileage != null ? String(form.mileage) : ''}
                    onChange={(e) => {
                      const raw = sanitizeDigits(e.target.value, FIELD_LIMITS.mileageDigits);
                      setForm({ ...form, mileage: raw ? Number(raw) : 0 });
                    }}
                    disabled={form.listingType === 'New'}
                    placeholder="0"
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.mileage}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Год *</Form.Label>
                  <Form.Control
                    type="text"
                    inputMode="numeric"
                    isInvalid={!!fieldErrors.modelYear}
                    value={form.modelYear != null ? String(form.modelYear) : ''}
                    onChange={(e) => {
                      const raw = sanitizeDigits(e.target.value, 4);
                      setForm({ ...form, modelYear: raw ? Number(raw) : undefined });
                    }}
                    placeholder={`${MIN_CAR_YEAR}–${MAX_CAR_YEAR}`}
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.modelYear}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>VIN *</Form.Label>
                  <Form.Control
                    value={form.vin ?? ''}
                    isInvalid={!!fieldErrors.vin}
                    onChange={(e) => setForm({ ...form, vin: sanitizeVinInput(e.target.value) })}
                    placeholder="17 символов, например XTA21144012345678"
                    maxLength={17}
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.vin}</Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Уникальный номер кузова — отображается в карточке и админке.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Состояние</Form.Label>
                  {form.listingType === 'Used' ? (
                    <Form.Select
                      value={form.condition || DEFAULT_CONDITION_USED}
                      onChange={(e) => setForm({ ...form, condition: e.target.value })}
                      required
                    >
                      {CAR_CONDITION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control value={DEFAULT_CONDITION_NEW} disabled readOnly />
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Кузов *</Form.Label>
                  <Form.Select
                    value={form.bodyType}
                    isInvalid={!!fieldErrors.bodyType}
                    onChange={(e) => setForm({ ...form, bodyType: e.target.value })}
                  >
                    <option value="">Выберите тип кузова</option>
                    {BODY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{fieldErrors.bodyType}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Топливо *</Form.Label>
                  <Form.Select
                    value={form.fuelType}
                    isInvalid={!!fieldErrors.fuelType}
                    onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                  >
                    <option value="">Выберите топливо</option>
                    {FUEL_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{fieldErrors.fuelType}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Объём, л</Form.Label>
                  <Form.Control
                    type="text"
                    inputMode="decimal"
                    isInvalid={!!fieldErrors.engineCapacity}
                    value={engineCapacityText}
                    onChange={(e) => setEngineCapacityText(sanitizeDecimalInput(e.target.value))}
                    placeholder="Например, 1.6"
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.engineCapacity}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>КПП *</Form.Label>
                  <Form.Select
                    value={form.transmission}
                    isInvalid={!!fieldErrors.transmission}
                    onChange={(e) => setForm({ ...form, transmission: e.target.value })}
                  >
                    <option value="">Выберите КПП</option>
                    {TRANSMISSION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{fieldErrors.transmission}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Привод *</Form.Label>
                  <Form.Select
                    value={form.driveType}
                    isInvalid={!!fieldErrors.driveType}
                    onChange={(e) => setForm({ ...form, driveType: e.target.value })}
                  >
                    <option value="">Выберите привод</option>
                    {DRIVE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{fieldErrors.driveType}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Комплектация</Form.Label>
                  <Form.Control
                    value={form.trim}
                    maxLength={FIELD_LIMITS.trim}
                    onChange={(e) => setForm({ ...form, trim: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Скидка трейд-ин, ₽</Form.Label>
                  <Form.Control
                    type="text"
                    inputMode="numeric"
                    isInvalid={!!fieldErrors.tradeInDiscount}
                    value={form.tradeInDiscount ?? ''}
                    onChange={(e) => {
                      const raw = sanitizeDigits(e.target.value, FIELD_LIMITS.discountDigits);
                      setForm({ ...form, tradeInDiscount: raw ? Number(raw) : null });
                    }}
                    placeholder="0"
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.tradeInDiscount}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Скидка за кредит, ₽</Form.Label>
                  <Form.Control
                    type="text"
                    inputMode="numeric"
                    isInvalid={!!fieldErrors.creditDiscount}
                    value={form.creditDiscount ?? ''}
                    onChange={(e) => {
                      const raw = sanitizeDigits(e.target.value, FIELD_LIMITS.discountDigits);
                      setForm({ ...form, creditDiscount: raw ? Number(raw) : null });
                    }}
                    placeholder="0"
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.creditDiscount}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Фотографии ({photoGallery.length})</Form.Label>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    <Button
                      as="label"
                      variant="outline-dark"
                      size="sm"
                      className="mb-0"
                      disabled={uploadingMain}
                    >
                      {uploadingMain ? 'Загрузка…' : '+ Главное фото'}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadMainPhoto(file);
                          e.target.value = '';
                        }}
                      />
                    </Button>
                    <Button
                      as="label"
                      variant="outline-secondary"
                      size="sm"
                      className="mb-0"
                      disabled={uploadingExtra}
                    >
                      {uploadingExtra ? 'Загрузка…' : '+ Ещё фото'}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files?.length) void uploadExtraPhotos(files);
                          e.target.value = '';
                        }}
                      />
                    </Button>
                  </div>
                  {photoGallery.length > 0 ? (
                    <div className="d-flex flex-wrap gap-3">
                      {photoGallery.map((url, idx) => (
                        <div
                          key={`${url}-${idx}`}
                          className="catalog-photo-thumb position-relative border rounded overflow-hidden"
                        >
                          {idx === 0 && (
                            <span
                              className="position-absolute top-0 start-0 m-1 badge bg-dark"
                              style={{ fontSize: '0.65rem' }}
                            >
                              Главное
                            </span>
                          )}
                          <img
                            src={resolvePublicImageUrl(url)}
                            alt=""
                            width={132}
                            height={90}
                            style={{ objectFit: 'contain', display: 'block', background: '#f8f9fa' }}
                            onError={handleCatalogImageError}
                          />
                          <div className="catalog-photo-thumb__actions d-grid gap-1 p-1">
                            {idx > 0 && (
                              <Button
                                type="button"
                                variant="outline-primary"
                                size="sm"
                                className="catalog-photo-thumb__btn"
                                onClick={() => setAsMainPhoto(idx)}
                              >
                                <i className="bi bi-star-fill me-1" aria-hidden />
                                В главные
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline-danger"
                              size="sm"
                              className="catalog-photo-thumb__btn"
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
                    <Form.Text className="text-muted">
                      Загрузите одно или несколько фото — они появятся в карточке каталога.
                    </Form.Text>
                  )}
                  <Form.Control
                    className="mt-2"
                    value={form.imageUrl}
                    onChange={(e) => {
                      const url = e.target.value.trim();
                      if (!url) {
                        applyPhotoGallery(photoGallery.slice(1));
                        return;
                      }
                      applyPhotoGallery([url, ...photoGallery.filter((u) => u !== url)]);
                    }}
                    placeholder="Или вставьте URL главного фото: /uploads/... или https://..."
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Описание</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={12} className="d-flex align-items-end">
                <Form.Check
                  type="checkbox"
                  label="Опубликовать в каталоге"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отмена
            </Button>
            <Button type="submit" className="btn-dealership-dark" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default CatalogManage;
