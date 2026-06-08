import React, { useMemo } from 'react';
import { Badge, Button, Modal, Table } from 'react-bootstrap';
import type { Model } from '../../services/models/car';
import { BODY_TYPE_LABELS, FUEL_TYPE_LABELS, utils } from '../../utils/constants';

type CompareKey =
  | 'basePrice'
  | 'bodyType'
  | 'modelYear'
  | 'engineCapacity'
  | 'fuelType'
  | 'availableCount';

const ROWS: { key: CompareKey; label: string; format: (m: Model) => string }[] = [
  { key: 'basePrice', label: 'Цена от', format: (m) => utils.formatPrice(m.basePrice) },
  {
    key: 'bodyType',
    label: 'Кузов',
    format: (m) => (m.bodyType ? BODY_TYPE_LABELS[m.bodyType] || m.bodyType : '—'),
  },
  { key: 'modelYear', label: 'Год', format: (m) => (m.modelYear ? String(m.modelYear) : '—') },
  {
    key: 'engineCapacity',
    label: 'Двигатель',
    format: (m) => (m.engineCapacity ? `${m.engineCapacity}L` : '—'),
  },
  {
    key: 'fuelType',
    label: 'Топливо',
    format: (m) => (m.fuelType ? FUEL_TYPE_LABELS[m.fuelType] || m.fuelType : '—'),
  },
  {
    key: 'availableCount',
    label: 'В наличии',
    format: (m) => `${m.availableCount ?? 0} шт.`,
  },
];

function modelTitle(m: Model): string {
  return `${m.brandName || ''} ${m.modelName || ''}`.trim() || '—';
}

export const ModelCompareModal: React.FC<{
  show: boolean;
  onHide: () => void;
  models: Model[];
  onRemove: (modelId: number) => void;
  onClear: () => void;
}> = ({ show, onHide, models, onRemove, onClear }) => {
  const ids = useMemo(() => models.map((m) => m.modelId).join(','), [models]);

  const valuesByRow = useMemo(() => {
    const map = new Map<CompareKey, string[]>();
    for (const r of ROWS) {
      map.set(r.key, models.map((m) => r.format(m)));
    }
    return map;
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps

  const diffCells = (rowKey: CompareKey) => {
    const values = valuesByRow.get(rowKey) || [];
    const unique = new Set(values);
    // If all values equal — no highlight
    if (unique.size <= 1) return values.map(() => false);
    // highlight all non-empty values when there is a difference
    return values.map((v) => v !== '—' && v !== '0 шт.');
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Сравнение моделей</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div className="text-muted small">
            Выбрано: <strong>{models.length}</strong> (можно сравнить до 5)
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={onClear}>
              Очистить
            </Button>
          </div>
        </div>

        <div className="table-responsive">
          <Table bordered hover className="align-middle">
            <thead>
              <tr>
                <th style={{ width: 220 }}>Параметр</th>
                {models.map((m) => (
                  <th key={m.modelId}>
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="fw-semibold">{modelTitle(m)}</div>
                        <div className="small text-muted">
                          <Badge bg={m.availableCount > 0 ? 'success' : 'secondary'}>
                            {m.availableCount > 0 ? `В наличии: ${m.availableCount}` : 'Нет в наличии'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => onRemove(m.modelId)}
                        aria-label="Убрать из сравнения"
                      >
                        ×
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const values = valuesByRow.get(row.key) || models.map(() => '—');
                const highlight = diffCells(row.key);
                return (
                  <tr key={row.key}>
                    <td className="bg-light fw-semibold">{row.label}</td>
                    {values.map((v, idx) => (
                      <td
                        key={`${row.key}-${idx}`}
                        style={{
                          backgroundColor: highlight[idx] ? 'rgba(13, 110, 253, 0.08)' : undefined,
                        }}
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

