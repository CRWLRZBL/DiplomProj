import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import VkLink from './VkLink';
import {
  SITE_NAME,
  SITE_NAME_BRAND,
  SITE_TAGLINE,
  SITE_LOCATIONS,
  VK_URL,
} from '../../constants/siteContacts';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Автомобили',
      links: [
        { name: 'Автомобили с пробегом', path: '/catalog?type=used' },
        { name: 'Новые автомобили', path: '/catalog' },
        { name: 'Продать автомобиль', path: '/contacts' },
      ],
    },
    {
      title: 'Услуги',
      links: [
        { name: 'Акции', path: '/catalog' },
        { name: 'Кредитование автомобиля', path: '/catalog' },
        { name: 'Страхование ОСАГО', path: '/contacts' },
        { name: 'Страхование КАСКО и GAP', path: '/contacts' },
        { name: 'Помощь на дорогах', path: '/contacts' },
      ],
    },
    {
      title: 'Информация',
      links: [
        { name: 'О компании', path: '/about' },
        { name: 'Контакты', path: '/contacts' },
      ],
    },
  ];

  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-top d-flex flex-wrap justify-content-between align-items-start gap-3 pb-4 mb-4">
          <Link to="/" className="footer-brand-block text-decoration-none">
            <div className="footer-brand-title">{SITE_NAME_BRAND}</div>
            <div className="footer-tag">{SITE_TAGLINE}</div>
          </Link>
          <div className="footer-social-top d-flex align-items-center gap-2">
            <span className="footer-muted small">Мы в соц.сетях</span>
            <VkLink href={VK_URL} />
          </div>
        </div>

        <Row className="footer-columns g-4">
          {footerSections.map((section) => (
            <Col key={section.title} sm={6} lg={3}>
              <h6 className="footer-col-title">{section.title}</h6>
              <Nav className="flex-column">
                {section.links.map((link) => (
                  <Nav.Link key={link.name} as={Link} to={link.path} className="footer-link">
                    {link.name}
                  </Nav.Link>
                ))}
              </Nav>
            </Col>
          ))}

          <Col sm={6} lg={3}>
            {SITE_LOCATIONS.map((loc) => (
              <div key={loc.city} className="footer-location mb-4 mb-lg-3">
                <Link to="/contacts" className="footer-city text-decoration-none">
                  {loc.city}
                </Link>
                <a
                  href={loc.mapUrl}
                  className="footer-muted small d-block mb-1 text-decoration-none footer-address"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {loc.address}
                </a>
                <a href={`tel:${loc.tel}`} className="footer-phone text-decoration-none">
                  {loc.phone}
                </a>
              </div>
            ))}
          </Col>
        </Row>

        <Row className="footer-bottom pt-4 mt-2 border-top border-subtle">
          <Col>
            <p className="footer-legal mb-0">
              © {currentYear} {SITE_NAME}. Информация на сайте носит справочный характер и не является
              публичной офертой.{' '}
              <Link to="/contacts" className="footer-link footer-link--inline">
                Политика конфиденциальности
              </Link>
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
