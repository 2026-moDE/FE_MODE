import {apiClient} from './client';

export type CongestionLevel = 'LOW' | 'MEDIUM' | 'HIGH';

type PresignedUrlResponse = {
  success: boolean;
  message: string;
  data: {
    presigned_url: string;
    image_url: string;
  };
};

export type CreateReviewRequest = {
  place_id: number;
  image_url: string;
  congestion_level: CongestionLevel;
  quick_tag?: string;
  comment?: string;
  latitude: number;
  longitude: number;
};

type CreateReviewResponse = {
  success: boolean;
  message: string;
  data: {
    review: {
      id: number;
      created_at: string;
    };
  };
};


type VerifyLocationResponse = {
  success: boolean;
  message: string;
  data: {
    verified: boolean;
    distance: number;
  };
};

// 1. S3 presigned URL 발급
export async function getPresignedUrl(fileName: string) {
  const response = await apiClient.post<PresignedUrlResponse>(
    '/api/s3/presigned-url',
    {
      file_name: fileName,
      content_type: 'image/jpeg',
    },
  );

  return response.data.data;
}

// 2. presigned_url로 S3에 이미지 업로드
export async function uploadImageToS3(photoUri: string, presignedUrl: string) {
  const imageResponse = await fetch(photoUri);
  const blob = await imageResponse.blob();

  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/jpeg',
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error('S3 이미지 업로드 실패');
  }
}

// 3. 리뷰 작성
export async function createReview(body: CreateReviewRequest) {
  const response = await apiClient.post<CreateReviewResponse>(
    '/api/reviews',
    body,
  );

  return response.data.data.review;
}

// 4. 위치 인증 확인
export async function verifyPlaceLocation(
  placeId: number,
  latitude: number,
  longitude: number,
) {
  const response = await apiClient.get<VerifyLocationResponse>(
    `/api/places/${placeId}/verify-location`,
    {
      params: {
        latitude,
        longitude,
      },
    },
  );

  return response.data.data;
}