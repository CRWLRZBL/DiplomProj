import React from 'react';
import { Card, Button } from 'react-bootstrap';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  message, 
  icon = 'info-circle',
  action 
}) => {
  // Маппинг старых эмодзи на Bootstrap Icons
  const iconMap: Record<string, string> = {
    '🔍': 'search',
    '🚗': 'car-front',
    'search': 'search',
    'car-front': 'car-front',
  };

  const iconName = iconMap[icon] || icon;

  return (
    <Card className="text-center border-0 bg-light">
      <Card.Body className="py-5">
        <div className="display-1 mb-3">
          <i className={`bi bi-${iconName}`} style={{ fontSize: '4rem' }}></i>
        </div>
        <h4 className="text-muted">{title}</h4>
        <p className="text-muted mb-4">{message}</p>
        {action && (
          <Button variant="primary" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

export default EmptyState;