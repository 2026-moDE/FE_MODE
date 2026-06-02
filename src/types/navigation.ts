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

// 하단 탭 네비게이터
export type TabParamList = {
  Home: undefined;
  Review: { placeId: number; placeName: string };
  Mypage: undefined;
};

// 스택 네비게이터 (탭 위에 쌓이는 화면들)
export type AppStackParamList = {
  Tab: undefined;
  Search: undefined;
  PlaceDetail: { placeId: number; placeName: string };
};