import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { carService } from '../../services/api/carService';
import { Model } from '../../services/models/car';
import { CAR_STATUS, CAR_STATUS_LABELS } from '../../utils/constants';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { getApiErrorMessage } from '../../utils/apiError';
import { validateVin, parseNonNegativeInt } from '../../utils/validation';
import { DEFAULT_CATALOG_COLORS } from '../../constants/vehicleForm';

type Props = {
  show: boolean;
  onHide: () => void;
  onCreated: () => void;
};

const AddSingleCar: React.FC<Props> = ({ show, onHide, onCreated }) => {
  const [models, setModels] = useState<Model[]>([]);
  const [colors, setColors] = useState<string[]>([...DEFAULT_CATALOG_COLORS]);
  const [modelId, setModelId] = useState('');
  const [color, setColor] = useState('');
  const [vin, setVin] = useState('');
  const [status, setStatus] = useState(CAR_STATUS.AVAILABLE);
  const [mileage, setMileage] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useBodyScrollLock(show, onHide);

  useEffect(() => {
    if (!show) return;
    void Promise.all([
      carService.getModels(),
      carService.getColors(),
    ]).then(([modelsData, colorsData]) => {
      setModels(modelsData);
      if (colorsData.length > 0) {
        setColors(colorsData.map((c) => c.name));
      }
    });
  }, [show]);

  const sortedModels = useMemo(
    () => [...models].sort((a, b) => `${a.brandName} ${a.modelName}`.localeCompare(`${b.brandName} ${b.modelName}`, 'ru')),
    [models]
  );

  const reset = () => {
    setModelId('');
    setColor('');
    setVin('');
    setStatus(CAR_STATUS.AVAILABLE);
    setMileage('0');
    setError('');
  };

  const handleClose = () => {
    reset();
    onHide();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!modelId) {
      setError('Выберите модель автомобиля');
      return;
    }
    if (!color.trim()) {
      setError('Выберите цвет');
      return;
    }
    const vinError = validateVin(vin);
    if (vinError) {
      setError(vinError);
      return;
    }
    const mileageNum = parseNonNegativeInt(mileage);
    if (mileageNum == null) {
      setError('Пробег должен быть неотрицательным числом');
      return;
    }

    setLoading(true);
    try {
      await carService.createInventoryCar({
        modelId: Number(modelId),
        color: color.trim(),
        vin: vin.trim().toUpperCase(),
        status,
        mileage: mileageNum,
      });
      reset();
      onCreated();
      onHide();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось добавить автомобиль.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      scrollable
      backdrop={false}
      enforceFocus={false}
      className="consultation-modal"
      dialogClassName="consultation-modal-dialog modal-dialog-centered"
      container={typeof document !== 'undefined' ? document.body : undefined}
    >
      <Modal.Header closeButton>
        <Modal.Title>Добавить автомобиль</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Модель *</Form.Label>
            <Form.Select required value={modelId} onChange={(e) => setModelId(e.target.value)}>
              <option value="">Выберите модель</option>
              {sortedModels.map((m) => (
                <option key={m.modelId} value={m.modelId}>
                  {m.brandName} {m.modelName}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Марка и модель выбираются из справочника конфигуратора.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Цвет *</Form.Label>
            <Form.Select required value={color} onChange={(e) => setColor(e.target.value)}>
              <option value="">Выберите цвет</option>
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>VIN *</Form.Label>
            <Form.Control
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              maxLength={17}
              placeholder="17 символов"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Статус</Form.Label>
            <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value={CAR_STATUS.AVAILABLE}>{CAR_STATUS_LABELS[CAR_STATUS.AVAILABLE]}</option>
              <option value={CAR_STATUS.RESERVED}>{CAR_STATUS_LABELS[CAR_STATUS.RESERVED]}</option>
              <option value={CAR_STATUS.SOLD}>{CAR_STATUS_LABELS[CAR_STATUS.SOLD]}</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Пробег, км</Form.Label>
            <Form.Control
              type="text"
              inputMode="numeric"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="0"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Сохранение…' : 'Добавить'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddSingleCar;
