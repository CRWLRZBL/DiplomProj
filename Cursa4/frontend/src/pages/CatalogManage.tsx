import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button, Table, Alert, Modal } from 'react-bootstrap';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import { carService } from '../services/api/carService';
import { Car, SaveCarListing } from '../services/models/car';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { resolvePublicImageUrl, handleCatalogImageError } from '../utils/catalogImage';
import {
  CAR_CONDITION_OPTIONS,
  DEFAULT_CONDITION_NEW,
  DEFAULT_CONDITION_USED,
} from '../constants/carConditions';

const emptyForm = (): SaveCarListing => ({
  listingType: 'New',
  brandName: '',
  modelName: '',
  title: '',
  bodyType: '',
  basePrice: 0,
  showPriceFrom: true,
  color: 'Не указан',
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

  const isStaff =
    user?.roleName === USER_ROLES.ADMIN || user?.roleName === USER_ROLES.MANAGER;

  useBodyScrollLock(showForm);

  useEffect(() => {
    if (isStaff) loadAll();
  }, [isStaff]);

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

  if (!user || !isStaff) {
    return <Navigate to="/catalog" replace />;
  }

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setPhotoGallery([]);
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
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.listingType === 'Used') {
      const vin = (form.vin ?? '').trim();
      if (vin.length < 17) {
        setError('Для авто с пробегом укажите VIN из 17 символов.');
        return;
      }
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload: SaveCarListing = {
        ...form,
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
    } catch {
      setError('Не удалось сохранить. Проверьте данные и подключение.');
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

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Table responsive hover className="align-middle bg-white shadow-sm">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Тип</th>
            <th>Цена</th>
            <th>Статус</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cars.map((c) => (
            <tr key={c.carId}>
              <td>{c.carId}</td>
              <td>
                <Link to={`/catalog/${c.carId}`}>{c.title || `${c.brandName} ${c.modelName}`}</Link>
              </td>
              <td>{c.listingType === 'Used' ? 'Б/У' : 'Новый'}</td>
              <td>{c.basePrice.toLocaleString('ru-RU')} ₽</td>
              <td>
                {c.isPublished ? (
                  <span className="text-success">Опубликован</span>
                ) : (
                  <span className="text-muted">Скрыт</span>
                )}
              </td>
              <td className="text-end">
                <Button size="sm" variant="outline-dark" className="me-2" onClick={() => openEdit(c)}>
                  Изменить
                </Button>
                <Button size="sm" variant="outline-danger" onClick={() => void handleDeleteListing(c.carId)}>
                  Удалить
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal
        show={showForm}
        onHide={() => setShowForm(false)}
        size="lg"
        centered
        scrollable
        backdrop={false}
        className="consultation-modal"
        container={typeof document !== 'undefined' ? document.body : undefined}
      >
        <Modal.Header closeButton>
          <Modal.Title>{editId ? 'Редактировать карточку' : 'Новый автомобиль'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
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
                    required
                    value={form.brandName}
                    onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                    placeholder="LADA, Kia, Hyundai..."
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Модель *</Form.Label>
                  <Form.Control
                    required
                    value={form.modelName}
                    onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                    placeholder="Vesta, Rio..."
                  />
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
                  <Form.Label>Цена, ₽ *</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    min={0}
                    value={form.basePrice || ''}
                    onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                  />
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
                    type="number"
                    min={0}
                    value={form.mileage ?? 0}
                    onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })}
                    disabled={form.listingType === 'New'}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Год</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.modelYear ?? ''}
                    onChange={(e) => setForm({ ...form, modelYear: Number(e.target.value) })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>VIN {form.listingType === 'Used' ? '*' : ''}</Form.Label>
                  <Form.Control
                    value={form.vin ?? ''}
                    onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
                    placeholder="17 символов, например XTA21144012345678"
                    maxLength={17}
                    required={form.listingType === 'Used'}
                  />
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
                  <Form.Label>Кузов</Form.Label>
                  <Form.Control
                    value={form.bodyType}
                    onChange={(e) => setForm({ ...form, bodyType: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Топливо</Form.Label>
                  <Form.Control
                    value={form.fuelType}
                    onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Объём, л</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={form.engineCapacity ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        engineCapacity: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>КПП</Form.Label>
                  <Form.Control
                    value={form.transmission}
                    onChange={(e) => setForm({ ...form, transmission: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Привод</Form.Label>
                  <Form.Control
                    value={form.driveType}
                    onChange={(e) => setForm({ ...form, driveType: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Комплектация</Form.Label>
                  <Form.Control
                    value={form.trim}
                    onChange={(e) => setForm({ ...form, trim: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Скидка трейд-ин, ₽</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={form.tradeInDiscount ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tradeInDiscount: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Скидка за кредит, ₽</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={form.creditDiscount ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        creditDiscount: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
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
                          className="position-relative border rounded overflow-hidden"
                          style={{ width: 120 }}
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
                            width={120}
                            height={90}
                            style={{ objectFit: 'cover', display: 'block' }}
                            onError={handleCatalogImageError}
                          />
                          <div className="d-flex gap-1 p-1 bg-light">
                            {idx > 0 && (
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="p-0 small"
                                onClick={() => setAsMainPhoto(idx)}
                              >
                                В главные
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="p-0 small text-danger ms-auto"
                              onClick={() => removePhotoAt(idx)}
                            >
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
