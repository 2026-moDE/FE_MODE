import { Place } from '../types/place';

const REVIEW_SEARCH_PLACES: Place[] = [
  {
    id: 1,
    category: 'RESTAURANT',
    name: '리볼리 성수',
    address: '서울특별시 성동구 성수동2가 315-11',
    congestion_level: 'LOW',
    thumbnail_url: 'https://picsum.photos/seed/place1/200',
  },
  {
    id: 2,
    category: 'CAFE',
    name: '카페 어딘가',
    address: '서울특별시 중구 정동길 5',
    congestion_level: 'MODERATE',
    thumbnail_url: 'https://picsum.photos/seed/place2/200',
  },
  {
    id: 3,
    category: 'CAFE',
    name: '베이커리 모잉',
    address: '서울특별시 중구 세종대로 110',
    congestion_level: 'LOW',
    thumbnail_url: 'https://picsum.photos/seed/place3/200',
  },
  {
    id: 4,
    category: 'BAR',
    name: '와인바 해질녘',
    address: '서울특별시 중구 무교로 32',
    congestion_level: 'CROWDED',
    thumbnail_url: 'https://picsum.photos/seed/place4/200',
  },
  {
    id: 5,
    category: 'RESTAURANT',
    name: '브런치 더샵',
    address: '서울특별시 중구 을지로 16',
    congestion_level: 'MODERATE',
    thumbnail_url: 'https://picsum.photos/seed/place5/200',
  },
  {
    id: 6,
    category: 'SHOPPING',
    name: '책방 모잉문고',
    address: '서울특별시 중구 덕수궁길 15',
    congestion_level: 'LOW',
    thumbnail_url: 'https://picsum.photos/seed/place6/200',
  },
];

export function getReviewSearchPlacesMock(_keyword: string): Place[] {
  return REVIEW_SEARCH_PLACES;
}
