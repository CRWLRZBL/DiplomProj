import React, { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../utils/apiError';
import { validateEmail } from '../../utils/validation';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      setLoading(false);
      return;
    }

    try {
      await login({ email, password });
      navigate(redirect || '/');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Не удалось войти. Проверьте email и пароль.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Card.Body>
        <h3 className="text-center mb-4">Вход в систему</h3>
        
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Введите ваш email"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Пароль</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Введите ваш пароль"
            />
          </Form.Group>

          <div className="d-grid">
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </div>
          <p className="small text-muted mt-3 mb-0">
            Забыли пароль или нет доступа к почте?{' '}
            <Link to="/contacts">Свяжитесь с салоном</Link>
            {' '}или напишите менеджеру в{' '}
            <Link to="/messages">сообщениях</Link> после входа под другим аккаунтом.
          </p>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default LoginForm;