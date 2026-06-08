import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Загрузка...', 
  size = 'lg' 
}) => {
  return (
    <Container className="text-center py-5">
      <Spinner animation="border" variant="primary" size={size} />
      {message && (
        <div className="mt-3 text-muted">
          {message}
        </div>
      )}
    </Container>
  );
};

export default LoadingSpinner;