import { apiClient } from "./client"

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type PresignedUrlRequest = {
  file_name: string;
  content_type: string;
};

type PresignedUrlResponse = {
  presigned_url: string;
  image_url: string;
};

export const getPresignedUrl = async (
  body: PresignedUrlRequest,
): Promise<PresignedUrlResponse> => {
  const response = await apiClient.post<ApiResponse<PresignedUrlResponse>>(
    '/api/s3/presigned-url',
    body,
  );

  return response.data.data;
};

export const uploadImageToS3 = async ({
  presignedUrl,
  imageUri,
  contentType,
}: {
  presignedUrl: string;
  imageUri: string;
  contentType: string;
}) => {
  const imageResponse = await fetch(imageUri);
  const imageBlob = await imageResponse.blob();

  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: imageBlob,
  });

  if (!uploadResponse.ok) {
    throw new Error('S3 이미지 업로드 실패');
  }
};