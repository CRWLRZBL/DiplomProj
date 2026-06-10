import React, { useEffect, useState } from 'react';
import { Button, Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from './Icon';
import { MARKETING_LOGO_JPG } from '../../constants/marketingAssets';
import { SITE_NAME, SITE_LOCATIONS } from '../../constants/siteContacts';
import { USER_ROLES } from '../../utils/constants';
import './Header.css';

const STAFF_VIEW_KEY = 'autosalon-staff-view';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [staffView, setStaffView] = useState(false);

  const isStaff =
    user?.roleName === USER_ROLES.ADMIN || user?.roleName === USER_ROLES.MANAGER;
  const isAdmin = user?.roleName === USER_ROLES.ADMIN;

  useEffect(() => {
    if (!isStaff) {
      setStaffView(false);
      return;
    }
    const saved = localStorage.getItem(STAFF_VIEW_KEY);
    setStaffView(saved !== 'client');
  }, [isStaff, user?.roleName]);

  const toggleStaffView = (mode: 'staff' | 'client') => {
    const next = mode === 'staff';
    setStaffView(next);
    localStorage.setItem(STAFF_VIEW_KEY, next ? 'staff' : 'client');
    if (next) {
      navigate('/admin');
    } else {
      navigate('/catalog');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openConsultation = () => {
    window.dispatchEvent(new CustomEvent('open-consultation'));
  };

  return (
    <>
      <div className="site-topbar py-2 d-none d-lg-block">
        <Container className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <Link to="/" className="site-topbar-brand text-decoration-none">
            {SITE_NAME}
          </Link>
          <div className="d-flex gap-4 flex-wrap">
            {SITE_LOCATIONS.map((loc) => (
              <div key={loc.city} className="d-flex align-items-center gap-2">
                <Link to="/contacts" className="site-topbar-city text-decoration-none">
                  {loc.city}
                </Link>
                <a href={`tel:${loc.tel}`} className="site-topbar-phone">
                  {loc.phone}
                </a>
              </div>
            ))}
          </div>
        </Container>
      </div>

      <Navbar expand="lg" className="site-navbar">
        <Container className="d-flex align-items-center flex-wrap gap-2">
          <Navbar.Brand as={Link} to="/" className="site-brand site-brand--with-logo me-lg-4 py-0">
            <img
              src={MARKETING_LOGO_JPG}
              alt={SITE_NAME}
              className="site-brand__logo"
              width={180}
              height={48}
            />
            <span className="site-brand__tagline d-none d-md-inline">Автомобили доверяют нам!</span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="main-nav" className="ms-auto" />
          <Navbar.Collapse id="main-nav" className="site-nav">
            <Nav className="me-auto my-2 my-lg-0 mx-lg-auto">
              {isStaff && staffView ? (
                <>
                  <Nav.Link as={Link} to="/admin">
                    Заказы
                  </Nav.Link>
                  <Nav.Link as={Link} to="/messages">
                    Сообщения
                  </Nav.Link>
                  {isAdmin && (
                    <Nav.Link as={Link} to="/admin">
                      Админ-панель
                    </Nav.Link>
                  )}
                </>
              ) : (
                <>
                  <NavDropdown title="Купить авто" id="nav-buy">
                    <NavDropdown.Item as={Link} to="/catalog">
                      Новые автомобили
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/catalog?type=used">
                      Авто с пробегом
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/configurator">
                      Онлайн‑конфигуратор
                    </NavDropdown.Item>
                  </NavDropdown>

                  <Nav.Link as={Link} to={user ? '/order' : '/profile?redirect=/order'}>
                    Оформить заказ
                  </Nav.Link>
                  <Nav.Link as={Link} to={user ? '/messages' : '/profile?redirect=/messages'}>
                    Сообщения
                  </Nav.Link>

                  <Nav.Link as={Link} to="/about">
                    О компании
                  </Nav.Link>
                  <Nav.Link as={Link} to="/contacts">
                    Контакты
                  </Nav.Link>
                </>
              )}
            </Nav>

            <div className="site-header-actions d-flex align-items-center gap-2 ms-lg-2">
              <button
                type="button"
                className="site-header-call"
                aria-label="Получить консультацию"
                title="Консультация"
                onClick={openConsultation}
              >
                <Icon name="call" style={{ fontSize: '1.35rem' }} />
              </button>

              {user ? (
                <NavDropdown
                  align="end"
                  title={`${user.firstName} ${user.lastName}`}
                  id="user-dropdown"
                >
                  <NavDropdown.Item as={Link} to="/profile">
                    <Icon name="person" className="me-2" style={{ verticalAlign: 'middle' }} />
                    Мой профиль
                  </NavDropdown.Item>
                  {isStaff && (
                    <NavDropdown.Item onClick={() => toggleStaffView(staffView ? 'client' : 'staff')}>
                      <Icon name="swap_horiz" className="me-2" style={{ verticalAlign: 'middle' }} />
                      {staffView ? 'Вид клиента' : 'Режим персонала'}
                    </NavDropdown.Item>
                  )}
                  {isAdmin && (
                    <>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/admin">
                        <Icon name="admin_panel_settings" className="me-2" style={{ verticalAlign: 'middle' }} />
                        Админ‑панель
                      </NavDropdown.Item>
                    </>
                  )}
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <Icon name="logout" className="me-2" style={{ verticalAlign: 'middle' }} />
                    Выйти
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Button as={Link as any} to="/profile" className="btn-dealership-dark">
                  Войти
                </Button>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default Header;
