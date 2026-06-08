/** Простой perceptual hash (aHash) 8×8 для поиска похожих фото в каталоге */

export type PhotoSearchResult = {
  carId: number;
  distance: number;
  score: number;
};

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось прочитать изображение'));
    };
    img.src = url;
  });
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function computeAHashFromImage(img: HTMLImageElement): string {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const gray: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  const avg = gray.reduce((a, b) => a + b, 0) / gray.length;
  let hash = '';
  for (const g of gray) {
    hash += g >= avg ? '1' : '0';
  }
  return hash;
}

export function hammingDistance(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return 64;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) d++;
  }
  return d;
}

export async function computeHashFromFile(file: File): Promise<string> {
  const img = await loadImageFromFile(file);
  return computeAHashFromImage(img);
}

export async function computeHashFromUrl(url: string): Promise<string | null> {
  const img = await loadImageFromUrl(url);
  if (!img) return null;
  return computeAHashFromImage(img);
}

const PLACEHOLDER_PATTERN = /default\.svg$/i;

export async function findSimilarCarsByPhoto(
  file: File,
  items: { carId: number; imageUrl: string }[],
  maxResults = 12
): Promise<PhotoSearchResult[]> {
  const queryHash = await computeHashFromFile(file);
  const results: PhotoSearchResult[] = [];
  const comparable = items.filter((item) => !PLACEHOLDER_PATTERN.test(item.imageUrl));

  if (comparable.length === 0) {
    return [];
  }

  const maxDistance = Math.floor(queryHash.length * 0.35);

  await Promise.all(
    comparable.map(async (item) => {
      const hash = await computeHashFromUrl(item.imageUrl);
      if (!hash) return;
      const distance = hammingDistance(queryHash, hash);
      if (distance > maxDistance) return;
      const score = Math.max(0, 100 - Math.round((distance / queryHash.length) * 100));
      results.push({ carId: item.carId, distance, score });
    })
  );

  return results
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults);
}
