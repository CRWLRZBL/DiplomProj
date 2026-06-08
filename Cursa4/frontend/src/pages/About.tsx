import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { MARKETING_HERO_WEBP } from '../constants/marketingAssets';
import './StaticPage.css';

const About: React.FC = () => {
  return (
    <div className="static-page">
      <section
        className="static-hero"
        style={{ ['--static-hero-img' as string]: `url(${MARKETING_HERO_WEBP})` }}
      >
        <Container>
          <h1 className="display-6 mb-3">Авторитет</h1>
          <nav className="small opacity-95" aria-label="Навигация">
            <Link to="/" className="text-white text-decoration-none">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">О компании</span>
          </nav>
        </Container>
      </section>

      <Container className="static-body">
        <Row className="gy-4">
          <Col lg={7}>
            <h2>Официальный дилер LADA</h2>
            <p className="lead-muted mb-3">
              Мы продаём новые автомобили LADA с гарантией производителя, ведём клиента через онлайн‑конфигуратор,
              оформление заказа, кредитные программы и постпродажное сопровождение.
            </p>
            <p className="lead-muted mb-3">
              Наша цель — прозрачные цены и понятные шаги: вы выбираете комплектацию, получаете расчёт, бронируете авто
              на 24 часа или записываетесь на тест‑драйв, а менеджер подключается в чате, когда это удобно.
            </p>
            <p className="lead-muted mb-0">
              Работаем с частными и корпоративными клиентами. Если нужна доставка в другой регион или нестандартная
              комплектация — напишите нам через раздел «Контакты» или форму консультации на главной.
            </p>
          </Col>
          <Col lg={5}>
            <Row className="g-3">
              <Col sm={6} lg={12}>
                <div className="p-4 bg-white border rounded-4 shadow-sm">
                  <div className="display-6 fw-bold text-dark">15+</div>
                  <div className="text-muted small mt-2">лет опыта команды в автобизнесе</div>
                </div>
              </Col>
              <Col sm={6} lg={12}>
                <div className="p-4 bg-white border rounded-4 shadow-sm">
                  <div className="display-6 fw-bold text-dark">1000+</div>
                  <div className="text-muted small mt-2">довольных клиентов</div>
                </div>
              </Col>
              <Col sm={12} lg={12}>
                <div className="p-4 bg-white border rounded-4 shadow-sm">
                  <div className="display-6 fw-bold text-dark">24ч</div>
                  <div className="text-muted small mt-2">бронь выбранной комплектации</div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default About;
