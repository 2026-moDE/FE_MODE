export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Terms: undefined;
  ProfileSetup: {
    terms_agreed: boolean;
    location_terms_agreed: boolean;
    privacy_agreed: boolean;
    marketing_agreed: boolean;
  };
  SignupComplete: undefined;
};

export type TabParamList = {
  Review: undefined;
  Home: undefined;
  ReviewEntry: undefined; // 탭에서 진입점만
  Mypage: undefined;
};

export type AppStackParamList = {
  Tab: undefined;
  Search: undefined;
  PlaceDetail: { placeId: number; placeName: string };
  ReviewStack: undefined; // 리뷰 스택 진입
};

// 리뷰 작성 전용 스택
export type ReviewStackParamList = {
  ReviewCamera: undefined;
  ReviewPhotoConfirm: { photoUri: string };
  ReviewPlaceSearch: { photoUri: string };
  ReviewLocationSelect: { photoUri: string };
  ReviewLocationConfirm: {
    photoUri: string;
    placeId: number;
    placeName: string;
    placeCategory: string;
    placeDistance: string;
    placeAddress: string;
  };
  ReviewWrite: { photoUri: string; placeId?: number; placeName?: string };
  ReviewComplete: undefined;
};