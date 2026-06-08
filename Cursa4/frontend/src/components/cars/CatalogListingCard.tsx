import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Car } from '../../services/models/car';
import { utils } from '../../utils/constants';
import { resolveCatalogImageSrc, handleCatalogImageError } from '../../utils/catalogImage';

type Props = {
  car: Car;
};

const CatalogListingCard: React.FC<Props> = ({ car }) => {
  const image = resolveCatalogImageSrc(car);
  const displayPrice =
    car.priceWithDiscounts != null && car.priceWithDiscounts > 0
      ? car.priceWithDiscounts
      : car.basePrice;
  const showFrom = car.listingType !== 'Used';

  return (
    <Card className="h-100 catalog-listing-card shadow-sm border-0">
      <Link to={`/catalog/${car.carId}`} className="text-decoration-none">
        <div className="position-relative">
          <Card.Img
            variant="top"
            src={image}
            alt={car.title || `${car.brandName} ${car.modelName}`}
            style={{ height: 200, objectFit: 'cover' }}
            onError={handleCatalogImageError}
          />
          <Badge
            bg={car.listingType === 'Used' ? 'secondary' : 'dark'}
            className="position-absolute top-0 start-0 m-2 shadow-sm catalog-listing-type-badge"
          >
            {car.listingType === 'Used' ? 'С пробегом' : 'Новый'}
          </Badge>
        </div>
        <Card.Body className="text-dark">
          <Card.Title className="h6 mb-2" style={{ minHeight: '2.8em' }}>
            {car.title || `${car.brandName} ${car.modelName}`}
          </Card.Title>
          <div className="text-muted small mb-2">
            {car.brandName}
            {car.modelYear ? ` · ${car.modelYear}` : ''}
            {car.mileage && car.mileage > 0 ? ` · ${car.mileage.toLocaleString('ru-RU')} км` : ''}
          </div>
          <div className="fw-bold fs-5 mb-0">{utils.formatCatalogPrice(displayPrice, showFrom)}</div>
          {car.maxDiscount != null && car.maxDiscount > 0 && (
            <div className="small text-success mt-1">Скидки до {utils.formatPrice(car.maxDiscount)}</div>
          )}
        </Card.Body>
      </Link>
    </Card>
  );
};

export default CatalogListingCard;
