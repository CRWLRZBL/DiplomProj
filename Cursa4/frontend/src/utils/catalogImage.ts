import type { SyntheticEvent } from 'react';
import { Car } from '../services/models/car';
import { getModelImagePath } from './imageUtils';

const DEFAULT_CAR_IMAGE = '/images/cars/default.svg';

/** Нормализует URL фото для браузера (относительные пути с ведущим /). */
export function resolvePublicImageUrl(url: string | null | undefined): string {
  const u = url?.trim();
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) return u;
  return u.startsWith('/') ? u : `/${u}`;
}

/** Временный служебный VIN каталога (Guid), не показываем пользователю. */
export function isGeneratedCatalogVin(vin?: string | null): boolean {
  if (!vin?.trim()) return true;
  const v = vin.trim();
  if (v.startsWith('TMP-')) return true;
  return /^[a-f0-9]{17}$/i.test(v);
}

/** Публичный URL картинки для карточки каталога */
export function resolveCatalogImageSrc(car: Car): string {
  const explicit = (car.imageUrls && car.imageUrls[0]) || car.imageUrl;
  if (explicit?.trim()) {
    const url = resolvePublicImageUrl(explicit);
    if (url) return url;
  }

  if (car.brandName === 'LADA' && car.modelName) {
    return getModelImagePath(
      car.modelName,
      car.bodyType || 'Sedan',
      undefined,
      car.configurationName,
      car.color
    );
  }

  return DEFAULT_CAR_IMAGE;
}

export function handleCatalogImageError(e: SyntheticEvent<HTMLImageElement, Event>) {
  const img = e.currentTarget;
  if (img.src.includes('default.svg')) return;
  img.src = DEFAULT_CAR_IMAGE;
  img.onerror = null;
}
