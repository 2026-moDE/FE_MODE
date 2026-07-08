import {useState} from 'react';
import {launchImageLibrary} from 'react-native-image-picker';
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

    return {
      uri: asset.uri,
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
        file_name: image.fileName,
        content_type: image.type,
      });

      await uploadImageToS3({
        presignedUrl: presignedData.presigned_url,
        imageUri: image.uri,
        contentType: image.type,
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