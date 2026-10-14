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
  Explore: undefined;
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

  PieceStack:
    | {screen: keyof PieceStackParamList; params?: object}
    | undefined;

  ProfileEdit: {
    nickname: string;
    profileImageUrl: string | null;
  };

  // 마이페이지 조각 보드에서 조각 이름표를 눌러 진입
  PieceEdit: {
    pieceId: number;
    imageUrl: string;
    name: string | null;
    placeName: string;
    createdAt: string;
    visibility: 'PUBLIC' | 'PRIVATE';
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

  CongestionAreaSearch: {
    onSelectArea: (areaId: number, areaName: string) => void;
  };

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
  ReviewComplete: { photoUri: string; placeId: number; placeName: string; reviewId: number };
};

// 조각 모으기 전용 스택 (후기 등록 완료 화면에서 진입)
export type PieceStackParamList = {
  // reviewId: 조각 등록은 "이 리뷰로 만든 조각"이라 리뷰 id가 필요하다 (리뷰 1건당 조각 1개)
  PieceCamera: { reviewId: number; placeId: number; placeName: string };
  // 촬영 직후 화면. 여기서 누끼를 따고, 성공하면 윤곽선을 띄운 뒤 확인을 받음
  PieceDetect: { photoUri: string; reviewId: number; placeId: number; placeName: string };
  PieceInfo: {
    photoUri: string;
    cutoutUri: string;
    reviewId: number;
    placeId: number;
    placeName: string;
    // 촬영 시각 (ISO). 정보 입력 화면의 날짜 표시에만 씀 -
    // 서버에 저장되는 일시는 원본 리뷰의 작성 시각이라 따로 보내지 않는다
    capturedAt: string;
  };
  PieceComplete: { cutoutUri: string; placeName: string; label: string };
};
