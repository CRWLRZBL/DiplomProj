import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { User } from '../../services/models/user';
import Icon from '../common/Icon';

type Props = {
  user: User;
  showEditLink?: boolean;
  className?: string;
};

const CustomerInfoCard: React.FC<Props> = ({ user, showEditLink = true, className = '' }) => (
  <Card className={`dp-card ${className}`.trim()}>
    <Card.Header className="dp-cardHeader">
      <Icon name="person" style={{ fontSize: '1.25rem' }} />
      Информация о клиенте
    </Card.Header>
    <Card.Body className="dp-cardBody">
      <div className="dp-fieldLabel">Имя</div>
      <div className="dp-fieldValue mb-3">
        {user.firstName} {user.lastName}
      </div>
      <div className="dp-fieldLabel">Email</div>
      <div className="dp-fieldValue mb-3">{user.email}</div>
      <div className="dp-fieldLabel">Телефон</div>
      <div className="dp-fieldValue mb-0">{user.phone?.trim() || 'Не указан'}</div>
      {showEditLink && (
        <Button
          as={Link as any}
          to="/profile"
          variant="outline-dark"
          size="sm"
          className="mt-3 w-100"
          style={{ borderRadius: 10 }}
        >
          Изменить в профиле
        </Button>
      )}
    </Card.Body>
  </Card>
);

export default CustomerInfoCard;
