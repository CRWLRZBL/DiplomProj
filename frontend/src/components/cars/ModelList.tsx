import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { Model } from '../../services/models/car';
import ModelCard from './ModelCard';

interface ModelListProps {
  models: Model[];
  compareSelectedIds?: number[];
  onToggleCompare?: (modelId: number) => void;
}

const ModelList: React.FC<ModelListProps> = ({ models, compareSelectedIds = [], onToggleCompare }) => {
  return (
    <Row>
      {models.map(model => (
        <Col key={model.modelId} xs={12} sm={6} lg={4} className="mb-4">
          <ModelCard
            model={model}
            compareSelected={compareSelectedIds.includes(model.modelId)}
            onToggleCompare={onToggleCompare ? () => onToggleCompare(model.modelId) : undefined}
          />
        </Col>
      ))}
    </Row>
  );
};

export default ModelList;

