import {useState} from 'react';
import {launchImageLibrary} from 'react-native-image-picker';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import {getPresignedUrl, uploadImageToS3} from '../api/imageUpload';

export type PickedProfileImage = {
  uri: string;
  fileName: string;
  type: string;
};

export const useProfileImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  // 1. 갤러리에서 사진만 선택
  const pickProfileImage = async (): Promise<PickedProfileImage | null> => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.9,
    });

    if (result.didCancel) {
      return null;
    }

    const asset = result.assets?.[0];

    if (!asset?.uri) {
      return null;
    }

    const type = asset.type ?? 'image/jpeg';
    const extension = type.split('/')[1] ?? 'jpg';

    // 수동으로 90도/270도 돌리지 않고 EXIF 방향을 실제 픽셀에 반영한 새 파일 생성.
    // 이걸 안 하면 세로로 찍은 사진이 눕거나 뒤집힌 채로 업로드됨 (리뷰 사진과 동일한 처리)
    let uri = asset.uri;
    try {
      const normalized = await ImageResizer.createResizedImage(
        asset.uri,
        asset.width ?? 1024,
        asset.height ?? 1024,
        'JPEG',
        100,
        0,
        undefined,
        false,
        {mode: 'contain', onlyScaleDown: true},
      );
      uri = normalized.uri;
    } catch (error) {
      // 정규화 실패해도 원본으로 업로드는 되게 함 (각도만 틀어질 수 있음)
      console.log('프로필 이미지 방향 보정 실패:', error);
    }

    return {
      uri,
      fileName: asset.fileName ?? `profile_${Date.now()}.${extension}`,
      type,
    };
  };

  // 2. 확인 누른 뒤 S3 업로드
  const uploadProfileImage = async (
    image: PickedProfileImage,
  ): Promise<string | null> => {
    try {
      setUploading(true);

      const presignedData = await getPresignedUrl({
        file_name: `profile_original/${image.fileName}`,
        content_type: 'image/jpeg',
      });

      await uploadImageToS3({
        presignedUrl: presignedData.presigned_url,
        imageUri: image.uri,
        contentType: 'image/jpeg',
      });

      return presignedData.image_url;
    } catch (error) {
      console.log('프로필 이미지 업로드 실패:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    pickProfileImage,
    uploadProfileImage,
  };
};