import React, { useRef } from 'react';
import { Badge, Button, Card, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/common/Icon';
import { MARKETING_HERO_WEBP } from '../constants/marketingAssets';
import { getModelImagePath } from '../utils/imageUtils';
import './HomePage.css';

const Home: React.FC = () => {
  const { user } = useAuth();
  const stripRef = useRef<HTMLDivElement>(null);

  const openConsultation = () => {
    window.dispatchEvent(new CustomEvent('open-consultation', { detail: { source: 'home' } }));
  };

  const popularModels = [
    {
      id: 4,
      name: 'LADA Vesta Седан',
      shortTitle: 'LADA Vesta 1.6 MT',
      price: 1239900,
      type: 'Sedan',
      tag: 'В наличии',
      mileage: 'Новый',
      owners: 'Гарантия 3 года',
      drive: 'Передний'
    },
    {
      id: 1,
      name: 'LADA Granta Седан',
      shortTitle: 'LADA Granta 1.6 MT',
      price: 749900,
      type: 'Sedan',
      tag: 'Под заказ',
      mileage: 'Новый',
      owners: 'Гарантия 3 года',
      drive: 'Передний'
    },
    {
      id: 9,
      name: 'LADA Niva Travel',
      shortTitle: 'LADA Niva Travel 1.7 MT',
      price: 1314000,
      type: 'SUV',
      tag: 'В наличии',
      mileage: 'Новый',
      owners: 'Гарантия 3 года',
      drive: 'Полный'
    },
    {
      id: 3,
      name: 'LADA Granta Cross',
      shortTitle: 'LADA Granta Cross 1.6 MT',
      price: 899900,
      type: 'SUV',
      tag: 'В наличии',
      mileage: 'Новый',
      owners: 'Гарантия 3 года',
      drive: 'Передний'
    },
    {
      id: 5,
      name: 'LADA Granta Sportline',
      shortTitle: 'LADA Granta Sportline 1.6 MT',
      price: 999900,
      type: 'Sedan',
      tag: 'Под заказ',
      mileage: 'Новый',
      owners: 'Гарантия 3 года',
      drive: 'Передний'
    },
    {
      id: 7,
      name: 'LADA Vesta SW',
      shortTitle: 'LADA Vesta SW 1.6 MT',
      price: 1299900,
      type: 'StationWagon',
      tag: 'Под заказ',
      mileage: 'Новый',
      owners: 'Гарантия 3 года',
      drive: 'Передний'
    },
    {
      id: 10,
      name: 'LADA Largus Универсал',
      shortTitle: 'LADA Largus 1.6 MT',
      price: 1099900,
      type: 'StationWagon',
      tag: 'Под заказ',
      mileage: 'Новый',
      owners: 'Гарантия 3 года',
      drive: 'Передний'
    },
    {
      id: 15,
      name: 'LADA Iskra Седан',
      shortTitle: 'LADA Iskra 1.6 MT',
      price: 899900,
      type: 'Sedan',
      tag: 'В наличии',
      mileage: 'Новый',
      owners: 'Гарантия 3 года',
      drive: 'Передний'
    },
    {
      id: 18,
      name: 'LADA Aura',
      shortTitle: 'LADA Aura 1.8 AT',
      price: 1599900,
      type: 'Sedan',
      tag: 'Под заказ',
      mileage: 'Новый',
      owners: 'Гарантия 3 года',
      drive: 'Передний'
    }
  ];

  const serviceCards = [
    {
      title: 'Новые автомобили',
      text: 'Официальный дилер LADA: модели в наличии и под заказ',
      icon: 'directions_car',
      to: '/catalog'
    },
    {
      title: 'Онлайн-конфигуратор',
      text: 'Соберите комплектацию и получите прозрачный расчёт',
      icon: 'tune',
      to: '/configurator'
    },
    {
      title: 'Оформление и бронь',
      text: 'Заявка, бронь на 24 часа и запись на тест-драйв',
      icon: 'receipt_long',
      to: user ? '/order' : '/profile?redirect=/order'
    },
    {
      title: 'Поддержка',
      text: 'Задайте вопрос менеджеру — ответим в чате или по телефону',
      icon: 'support_agent',
      onClick: openConsultation
    }
  ];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);

  const estMonthly = (price: number) =>
    new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.max(1, Math.round(price / 96)));

  const scrollStrip = (dir: -1 | 1) => {
    stripRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  const promoDate = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  return (
    <div className="home-page home-page--dealership">
      <div className="hp-heroFrame">
        <section
          className="hp-heroShell"
          style={{ ['--hp-hero-img' as string]: `url(${MARKETING_HERO_WEBP})` }}
        >
          <div className="hp-heroTop">
            <Container fluid="xxl" className="px-lg-4">
              <h1 className="hp-heroTitle mb-0">Авторитет. Автомобили доверяют нам!</h1>
              <p className="hp-heroLead mb-0">
                Большой выбор новых автомобилей. Онлайн-конфигуратор, прозрачный расчёт, сопровождение сделки и сервис.
              </p>
              <div className="hp-heroActions">
                <Button as={Link as any} to="/catalog" className="btn-dealership-dark">
                  Купить авто
                  <Icon name="north_east" className="ms-2" style={{ fontSize: '1rem', verticalAlign: 'middle' }} />
                </Button>
                <Button as={Link as any} to="/configurator" className="hp-heroBtnSecondary fw-semibold">
                  Конфигуратор
                </Button>
                {!user && (
                  <Button as={Link as any} to="/profile" className="hp-heroBtnGhost fw-semibold">
                    Войти
                  </Button>
                )}
              </div>
            </Container>
          </div>

          <div className="hp-serviceRow mt-auto">
            <Container fluid="xxl" className="px-lg-4">
              <Row className="g-2 g-md-3">
                {serviceCards.map((item, idx) => (
                  <Col key={idx} md={6} xl={3}>
                    {item.to ? (
                      <Card as={Link as any} to={item.to} className="hp-serviceCard text-decoration-none">
                        <Card.Body>
                          <div className="hp-serviceIcon">
                            <Icon name={item.icon} style={{ fontSize: '1.5rem' }} />
                          </div>
                          <div>
                            <div className="hp-serviceTitle">{item.title}</div>
                            <div className="hp-serviceText">{item.text}</div>
                          </div>
                        </Card.Body>
                      </Card>
                    ) : (
                      <Card role="button" className="hp-serviceCard" onClick={item.onClick}>
                        <Card.Body>
                          <div className="hp-serviceIcon">
                            <Icon name={item.icon} style={{ fontSize: '1.5rem' }} />
                          </div>
                          <div>
                            <div className="hp-serviceTitle">{item.title}</div>
                            <div className="hp-serviceText">{item.text}</div>
                          </div>
                        </Card.Body>
                      </Card>
                    )}
                  </Col>
                ))}
              </Row>
            </Container>
          </div>
        </section>
      </div>

      <section className="hp-section">
        <Container>
          <div className="hp-sectionHead">
            <div>
              <h2 className="hp-sectionTitle mb-0">Популярные модели</h2>
              <p className="hp-sectionSub mb-0">Спрос и лучшие предложения в каталоге новых LADA</p>
            </div>
            <Link to="/catalog" className="hp-linkAll">
              Все авто
              <Icon name="north_east" style={{ fontSize: '1.1rem' }} />
            </Link>
          </div>

          <div className="hp-stripWrap">
            <div ref={stripRef} className="hp-carStrip">
              {popularModels.map((car) => (
                <article key={car.id} className="hp-modelCard">
                  <div className="position-relative">
                    <Card.Img
                      className="hp-modelCard__img"
                      src={getModelImagePath(car.name, car.type, undefined, undefined, 'Ледниковый')}
                      alt={car.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/cars/default.svg';
                      }}
                    />
                    <Badge bg="light" text="dark" className="position-absolute top-0 start-0 m-2 px-2 py-1 fw-semibold shadow-sm">
                      {car.tag}
                    </Badge>
                  </div>
                  <div className="hp-modelCard__body">
                    <div className="hp-modelCard__title">{car.shortTitle}</div>
                    <div className="hp-modelSpecs">
                      <span>
                        <Icon name="straighten" style={{ fontSize: '1rem' }} />
                        {car.mileage}
                      </span>
                      <span>
                        <Icon name="verified_user" style={{ fontSize: '1rem' }} />
                        {car.owners}
                      </span>
                      <span>
                        <Icon name="route" style={{ fontSize: '1rem' }} />
                        {car.drive}
                      </span>
                    </div>
                    <div className="hp-priceRow">
                      <span className="hp-priceMain">{formatPrice(car.price)}</span>
                      <span className="hp-priceNote">от {estMonthly(car.price)} ₽/мес</span>
                    </div>
                    <Button
                      as={Link as any}
                      to={`/configurator?modelId=${car.id}`}
                      className="btn-dealership-dark w-100 mt-3"
                      size="sm"
                    >
                      Настроить
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            <div className="hp-stripNav d-none d-md-flex">
              <button type="button" className="hp-stripBtn" aria-label="Назад" onClick={() => scrollStrip(-1)}>
                <Icon name="chevron_left" />
              </button>
              <button type="button" className="hp-stripBtn" aria-label="Вперёд" onClick={() => scrollStrip(1)}>
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>
        </Container>
      </section>

      <section className="hp-section pt-0">
        <Container>
          <div className="hp-brands">
            <h2 className="hp-sectionTitle mb-0">Официальный дилер LADA</h2>
            <p className="hp-sectionSub mb-0 mx-auto" style={{ maxWidth: '42rem' }}>
              Новые автомобили в наличии и под заказ, гарантия производителя и сервисное обслуживание.
            </p>
            <div className="hp-brands__logos">
              <span className="hp-brandBadge">LADA</span>
            </div>
          </div>
        </Container>
      </section>

      <section className="hp-section pt-0">
        <Container>
          <div className="hp-sectionHead">
            <div>
              <h2 className="hp-sectionTitle mb-0">Спецпредложения</h2>
              <p className="hp-sectionSub mb-0">Выгодные условия на покупку и обмен</p>
            </div>
            <Link to="/catalog" className="hp-linkAll">
              Все акции
              <Icon name="north_east" style={{ fontSize: '1.1rem' }} />
            </Link>
          </div>
          <Row className="g-4">
            <Col md={6}>
              <Card className="hp-promoCard">
                <div className="ratio ratio-16x9 position-relative bg-light">
                  <Card.Img
                    variant="top"
                    src={getModelImagePath('LADA Granta Седан', 'Sedan', undefined, undefined, 'Ледниковый')}
                    alt="Акция"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/cars/default.svg';
                    }}
                  />
                  <span className="hp-promoDate">{promoDate}</span>
                </div>
                <Card.Body>
                  <Card.Text className="mb-0 fw-semibold" style={{ color: '#1a1a1a' }}>
                    Скидка при покупке в кредит — уточняйте у менеджера актуальные программы банков-партнёров.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="hp-promoCard">
                <div className="ratio ratio-16x9 position-relative bg-light">
                  <Card.Img
                    variant="top"
                    src={getModelImagePath('LADA Niva Travel', 'SUV', undefined, undefined, 'Ледниковый')}
                    alt="Акция"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/cars/default.svg';
                    }}
                  />
                  <span className="hp-promoDate">{promoDate}</span>
                </div>
                <Card.Body>
                  <Card.Text className="mb-0 fw-semibold" style={{ color: '#1a1a1a' }}>
                    Trade-in и дополнительное оборудование — индивидуальный расчёт в конфигураторе и у менеджера.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="hp-section hp-about pt-0">
        <Container>
          <Row className="align-items-start gy-5">
            <Col lg={6}>
              <h2 className="hp-sectionTitle mb-3">Мы рядом на каждом этапе</h2>
              <p className="hp-about__text mb-3">
                Помогаем выбрать комплектацию, оформить заказ онлайн и пройти путь от заявки до передачи ключей без
                лишней суеты. Прозрачные цены, чат с менеджером и напоминания о сервисе после покупки.
              </p>
              <p className="hp-about__text mb-4">
                Работаем для частных и корпоративных клиентов. Если нужна доставка в другой регион или особые условия —
                оставьте заявку, мы предложим решение.
              </p>
              <Button as={Link as any} to="/about" className="btn-dealership-dark">
                О компании
                <Icon name="north_east" className="ms-2" style={{ fontSize: '1rem', verticalAlign: 'middle' }} />
              </Button>
            </Col>
            <Col lg={6}>
              <div className="hp-stats">
                <div className="hp-stat hp-stat--wide">
                  <div className="hp-stat__num">15+</div>
                  <div className="hp-stat__label">лет опыта команды в автобизнесе</div>
                </div>
                <div className="hp-stat">
                  <div className="hp-stat__num">1000+</div>
                  <div className="hp-stat__label">довольных клиентов</div>
                </div>
                <div className="hp-stat">
                  <div className="hp-stat__num">24ч</div>
                  <div className="hp-stat__label">бронь выбранной комплектации</div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="hp-ctaBand">
        <Container className="hp-ctaInner">
          <Row className="align-items-center gy-4">
            <Col lg={7}>
              <h2 className="hp-sectionTitle mb-2">Появились вопросы? Задайте их менеджеру!</h2>
              <p className="hp-sectionSub mb-4" style={{ maxWidth: '36rem' }}>
                Оставьте контакты — перезвоним или ответим в чате и поможем с комплектацией, кредитом и тест-драйвом.
              </p>
              <Button type="button" className="btn-dealership-dark" onClick={openConsultation}>
                Получить консультацию
                <Icon name="north_east" className="ms-2" style={{ fontSize: '1rem', verticalAlign: 'middle' }} />
              </Button>
            </Col>
            <Col lg={5}>
              <div className="hp-ctaVisual" aria-hidden>
                <div className="hp-ctaBlob">
                  <Icon name="support_agent" />
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <button
        type="button"
        className="hp-fab"
        aria-label="Получить консультацию"
        onClick={openConsultation}
      >
        <Icon name="call" style={{ fontSize: '1.5rem' }} />
      </button>

    </div>
  );
};

export default Home;
