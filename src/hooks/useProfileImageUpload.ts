import {useState} from 'react';
import ImagePicker from 'react-native-image-crop-picker';
import {getPresignedUrl, uploadImageToS3} from '../api/imageUpload';

export type PickedProfileImage = {
  uri: string;
  fileName: string;
  type: string;
};

export const useProfileImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  // 1. 갤러리에서 사진 선택 + 확대/축소·위치 조정(크롭)
  const pickProfileImage = async (): Promise<PickedProfileImage | null> => {
    try {
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        cropping: true,
        width: 800,
        height: 800,
        cropperCircleOverlay: false,
        freeStyleCropEnabled: false,
        compressImageQuality: 0.9,
        hideBottomControls: true,
        // 앱 프리뷰 화면(검정 배경)과 톤을 맞춤. 안드로이드 UCrop 툴바는 아이콘 색을
        // 개별 지정할 수 없어(뒤로가기/체크 아이콘이 같은 색을 공유) 전부 흰색으로 통일
        cropperToolbarTitle: '프로필 수정',
        cropperToolbarColor: '#050509',
        cropperToolbarWidgetColor: '#FFFFFF',
        cropperStatusBarLight: true,
        cropperActiveWidgetColor: '#FFFD6D',
      });

      const type = image.mime ?? 'image/jpeg';
      const extension = type.split('/')[1] ?? 'jpg';

      return {
        uri: image.path,
        fileName: image.filename ?? `profile_${Date.now()}.${extension}`,
        type,
      };
    } catch (error: any) {
      // 사용자가 취소한 경우는 에러가 아님
      if (error?.code === 'E_PICKER_CANCELLED') {
        return null;
      }

      console.log('프로필 이미지 선택/크롭 실패:', error);
      return null;
    }
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