export type TermItem = {
  id: number;
  title: string;
  required: boolean;
};

export const termsMock: TermItem[] = [
  {id: 1, title: '모잉 서비스 이용약관', required: true},
  {id: 2, title: '모잉 위치기반서비스 이용약관', required: true},
  {id: 3, title: '개인정보 수집 및 이용', required: false},
  {id: 4, title: '버블이 행동경로 위치정보 제공', required: false},
];