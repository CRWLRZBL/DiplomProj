import React from 'react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Icon from '../components/common/Icon';
import { MARKETING_HERO_WEBP } from '../constants/marketingAssets';
import { SITE_LOCATIONS } from '../constants/siteContacts';
import './StaticPage.css';

const locations = SITE_LOCATIONS.map((loc) => ({
  ...loc,
  hours: 'Ежедневно с 9:00 до 21:00',
}));

const Contacts: React.FC = () => {
  const openConsultation = () => {
    window.dispatchEvent(
      new CustomEvent('open-consultation', {
        detail: {
          source: 'contacts',
          title: 'Получить консультацию',
          description: 'Оставьте контакты — менеджер перезвонит или ответит в чате.',
        },
      })
    );
  };

  return (
    <div className="static-page">
      <section
        className="static-hero"
        style={{ ['--static-hero-img' as string]: `url(${MARKETING_HERO_WEBP})` }}
      >
        <Container>
          <h1 className="display-6 mb-2">Контактная информация</h1>
          <p className="mb-3 opacity-90">Автомобили доверяют нам!</p>
          <nav className="small opacity-95" aria-label="Навигация">
            <Link to="/" className="text-white text-decoration-none">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Контакты</span>
          </nav>
        </Container>
      </section>

      <Container className="static-body">
        <div className="text-center mb-5">
          <h2 className="mb-2">Свяжитесь с нами</h2>
          <p className="text-muted mb-0">Звонок, чат или форма обратной связи — как вам удобнее.</p>
        </div>

        <Row className="g-4 mb-5">
          {locations.map((loc) => (
            <Col md={6} key={loc.city}>
              <Card className="contact-card h-100">
                <Card.Body className="p-4">
                  <Card.Title as="h3" className="h5 mb-3">
                    {loc.city}
                  </Card.Title>
                  <p className="text-muted mb-2 d-flex align-items-start gap-2">
                    <Icon name="location_on" style={{ flexShrink: 0 }} />
                    {loc.address}
                  </p>
                  <p className="mb-2">
                    <a href={`tel:${loc.tel}`}>{loc.phone}</a>
                  </p>
                  <p className="text-muted small mb-3 d-flex align-items-center gap-2">
                    <Icon name="schedule" style={{ fontSize: '1.1rem' }} />
                    {loc.hours}
                  </p>
                  <Button variant="outline-dark" size="sm" href={loc.mapUrl} target="_blank" rel="noreferrer">
                    Показать на карте
                    <Icon name="north_east" className="ms-1" style={{ fontSize: '0.95rem', verticalAlign: 'middle' }} />
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="ratio ratio-21x9 bg-light mb-4" style={{ maxHeight: 480 }}>
          <iframe
            title="Карта — Архангельск"
            className="static-map"
            src="https://yandex.ru/map-widget/v1/?ll=40.5153%2C64.5401&mode=search&text=%D0%B3.%20%D0%90%D1%80%D1%85%D0%B0%D0%BD%D0%B3%D0%B5%D0%BB%D1%8C%D1%81%D0%BA%2C%20%D1%83%D0%BB.%20%D0%9E%D0%BA%D1%82%D1%8F%D0%B1%D1%80%D1%8F%D1%82%2031&z=15"
            allowFullScreen
          />
        </div>

        <div className="text-center">
          <Button className="btn-dealership-dark" type="button" onClick={openConsultation}>
            <Icon name="phone" className="me-2" style={{ verticalAlign: 'middle' }} />
            Получить консультацию
          </Button>
        </div>
      </Container>

    </div>
  );
};

export default Contacts;
