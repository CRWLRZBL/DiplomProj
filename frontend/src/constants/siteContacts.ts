export const SITE_NAME = 'Авторитет';
export const SITE_NAME_BRAND = 'АВТОРИТЕТ';
export const SITE_TAGLINE = 'АВТОМОБИЛИ ДОВЕРЯЮТ НАМ!';

export const VK_URL = 'https://vk.com/avtorit29';

export type SiteLocation = {
  city: string;
  address: string;
  phone: string;
  tel: string;
  mapUrl: string;
};

export const SITE_LOCATIONS: SiteLocation[] = [
  {
    city: 'Архангельск',
    address: 'г. Архангельск, ул. Октябрят 31',
    phone: '+7 (8182) 42-07-01',
    tel: '+78182420701',
    mapUrl:
      'https://yandex.ru/maps/?text=%D0%B3.%20%D0%90%D1%80%D1%85%D0%B0%D0%BD%D0%B3%D0%B5%D0%BB%D1%8C%D1%81%D0%BA%2C%20%D1%83%D0%BB.%20%D0%9E%D0%BA%D1%82%D1%8F%D0%B1%D1%80%D1%8F%D1%82%2031',
  },
  {
    city: 'Северодвинск',
    address: 'г. Северодвинск, Ягринское шоссе 6',
    phone: '+7 (8184) 92-00-29',
    tel: '+78184920029',
    mapUrl:
      'https://yandex.ru/maps/?text=%D0%B3.%20%D0%A1%D0%B5%D0%B2%D0%B5%D1%80%D0%BE%D0%B4%D0%B2%D0%B8%D0%BD%D1%81%D0%BA%2C%20%D0%AF%D0%B3%D1%80%D0%B8%D0%BD%D1%81%D0%BA%D0%BE%D0%B5%20%D1%88%D0%BE%D1%81%D1%81%D0%B5%206',
  },
];
