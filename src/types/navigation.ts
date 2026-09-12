export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Terms: {viewOnly?: boolean} | undefined;
  ProfileSetup: {
    terms_agreed: boolean;
    location_terms_agreed: boolean;
    privacy_agreed: boolean;
    marketing_agreed: boolean;
  };
  SignupComplete: undefined;
  TermsOfService: {initialOpenId?: number} | undefined;
};

export type TabParamList = {
  Home: undefined;
  ReviewEntry: undefined; // 탭에서 진입점만
  Mypage: undefined;
};

export type AppStackParamList = {
  Tab: undefined;
  Search:
    | {
        reviewPhotoUri?: string;
        reviewCongestion?: string;
        reviewText?: string;
      }
    | undefined;

  PlaceDetail: {
    placeId: number;
    placeName: string;
    initialTab?: 'current' | 'archived';
    reviewId?: number;   // 있으면 리뷰 상세 페이지가 아닌 해당 리뷰로
    notificationAction?: 'chat' | 'reactions';   // 댓글 알림 → 댓글 모달, 반응 알림 → 반응 목록 자동으로 열기
  };

  ReviewStack:
    | {screen: keyof ReviewStackParamList; params?: object}
    | undefined;

  ProfileEdit: {
    nickname: string;
    profileImageUrl: string | null;
  };

  Notification: undefined;

  ReviewReport: {
    reviewId: number;
    commentId?: number;   // 있으면 댓글 신고, 없으면 리뷰 신고
  };

  MyMap: undefined;

  MonthlyReview: undefined;

  Setting: undefined;

  TermsOfService: {initialOpenId?: number} | undefined;

  TermsAgreement: {viewOnly?: boolean} | undefined;

  FollowList: {initialTab?: 'friends' | 'requests'} | undefined;

  FriendSearch: undefined;

  UserMyPage: {
    userId: number;
  };
};

// 리뷰 작성 전용 스택
export type ReviewStackParamList = {
  // 장소 상세에서 진입 시 placeId/placeName을 미리 실어옴 (장소 자동 선택용)
  ReviewCamera: { placeId?: number; placeName?: string } | undefined;
  ReviewPhotoConfirm: { photoUri: string; placeId?: number; placeName?: string };
  ReviewLocationSelect: { photoUri: string };
  ReviewLocationConfirm: {
    photoUri: string;
    placeId: number;
    placeName: string;
    placeCategory: string;
    placeDistance: string;
    placeAddress: string;
    latitude?: number;
    longitude?: number;
    congestion?: string;
    reviewText?: string;
  };
  ReviewWrite: { photoUri: string; placeId?: number; placeName?: string; congestion?: string; reviewText?: string };
  ReviewComplete: undefined;
};
