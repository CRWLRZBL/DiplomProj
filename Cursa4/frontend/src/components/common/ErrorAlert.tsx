import React from 'react';
import { Alert, Button } from 'react-bootstrap';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  message, 
  onRetry, 
  onDismiss 
}) => {
  return (
    <Alert variant="danger" className="d-flex align-items-center">
      <div className="flex-grow-1">
        {message}
      </div>
      <div className="ms-3">
        {onRetry && (
          <Button variant="outline-danger" size="sm" onClick={onRetry} className="me-2">
            Повторить
          </Button>
        )}
        {onDismiss && (
          <Button variant="danger" size="sm" onClick={onDismiss}>
            Закрыть
          </Button>
        )}
      </div>
    </Alert>
  );
};

export default ErrorAlert;