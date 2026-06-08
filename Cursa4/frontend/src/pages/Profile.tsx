import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Card, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import OrderList from '../components/orders/OrderList';
import { useSearchParams } from 'react-router-dom';
import { MaintenanceReminders } from '../components/service/MaintenanceReminders';
import ProfileEditor from '../components/profile/ProfileEditor';
import Icon from '../components/common/Icon';
import '../styles/DealershipPage.css';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'register' && !user) {
      setActiveTab('register');
    } else if (tab === 'service' && user) {
      setActiveTab('service');
    }
  }, [searchParams, user]);

  if (user) {
    return (
      <div className="dp-page">
        <Container>
          <div className="dp-pageHead">
            <h1 className="dp-pageTitle">Мой профиль</h1>
            <p className="dp-pageSub">Управление аккаунтом, заказами и напоминаниями о сервисе</p>
          </div>

          <Row className="g-4">
            <Col lg={4}>
              <Card className="dp-card h-100">
                <Card.Header className="dp-cardHeader">
                  <Icon name="person" style={{ fontSize: '1.25rem' }} />
                  Личные данные
                </Card.Header>
                <Card.Body className="dp-cardBody">
                  <ProfileEditor />
                </Card.Body>
              </Card>
            </Col>

            <Col lg={8}>
              <Card className="dp-card">
                <Card.Header className="p-0 border-0 bg-white">
                  <Nav
                    variant="tabs"
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k || 'orders')}
                    className="dp-tabs"
                  >
                    <Nav.Item>
                      <Nav.Link eventKey="orders">
                        <Icon name="shopping_cart_checkout" className="me-1" style={{ fontSize: '1.1rem' }} />
                        Мои заказы
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="service">
                        <Icon name="build_circle" className="me-1" style={{ fontSize: '1.1rem' }} />
                        Сервис
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Card.Header>
                <Card.Body className="p-4">
                  {activeTab === 'service' ? <MaintenanceReminders /> : <OrderList />}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  const guestTab = activeTab === 'register' ? 'register' : 'login';

  return (
    <div className="dp-page">
      <Container>
        <div className="dp-pageHead text-center">
          <h1 className="dp-pageTitle">
            {guestTab === 'register' ? 'Регистрация' : 'Вход в личный кабинет'}
          </h1>
          <p className="dp-pageSub mx-auto">
            {guestTab === 'register'
              ? 'Создайте аккаунт для оформления заказов и записи на сервис'
              : 'Войдите, чтобы видеть заказы и управлять профилем'}
          </p>
        </div>

        <Card className="dp-card dp-authCard">
          <Card.Body className="dp-cardBody p-4">
            <div className="dp-auth-switcher d-flex gap-2 mb-4" role="tablist">
              <Button
                type="button"
                role="tab"
                aria-selected={guestTab === 'login'}
                className={`flex-fill rounded-pill ${guestTab === 'login' ? 'btn-dealership-dark dp-auth-tab-active' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab('login')}
              >
                Вход
              </Button>
              <Button
                type="button"
                role="tab"
                aria-selected={guestTab === 'register'}
                className={`flex-fill rounded-pill ${guestTab === 'register' ? 'btn-dealership-dark dp-auth-tab-active' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab('register')}
              >
                Регистрация
              </Button>
            </div>
            {guestTab === 'login' ? <LoginForm /> : <RegisterForm />}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Profile;
