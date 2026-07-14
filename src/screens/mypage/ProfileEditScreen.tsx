import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';

import {fontFamily} from '../../constants/typography';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {updateMyProfile} from '../../api/mypage';

import ProfileImageEditor from '../../components/mypage/ProfileImageEditor';
import {useProfileImageUpload, PickedProfileImage} from '../../hooks/useProfileImageUpload';

const checkBlueIcon = require('../../assets/image/check_blue.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

export default function ProfileEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const initialNickname = route.params?.nickname ?? '';
  const profileImageUrl = route.params?.profileImageUrl ?? null;

  const [selectedProfileImageUrl, setSelectedProfileImageUrl] =
    useState<string | null>(profileImageUrl);

  const [previewImage, setPreviewImage] = useState<PickedProfileImage | null>(
    null,
  );

  const {
    uploading: imageUploading,
    pickProfileImage,
    uploadProfileImage,
  } = useProfileImageUpload();

  const [nickname, setNickname] = useState(initialNickname);
  const [nicknameError, setNicknameError] = useState('');
  const [loading, setLoading] = useState(false);

  const trimmedNickname = nickname.trim();
  const isNicknameValid = trimmedNickname.length > 0;
  const hasError = nicknameError.length > 0;

  const handlePressImageEdit = async () => {
    const image = await pickProfileImage();

    if (image) {
      setPreviewImage(image);
    }
  };

  const handleConfirmProfileImage = async () => {
    if (!previewImage) {
      return;
    }

    const imageUrl = await uploadProfileImage(previewImage);

    if (imageUrl) {
      setSelectedProfileImageUrl(imageUrl);
      setPreviewImage(null);
    }
  };

  const handleCancelProfileImagePreview = () => {
    setPreviewImage(null);
  };

  const handleSubmit = async () => {
    if (!trimmedNickname) {
      setNicknameError('닉네임을 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setNicknameError('');

      await updateMyProfile({
        nickname: trimmedNickname,
        profile_image_url: selectedProfileImageUrl,
      });

      navigation.goBack();
    } catch (error: any) {
      console.log('프로필 수정 실패:', error);

      const status = error?.response?.status;

      if (status === 409) {
        setNicknameError('이미 사용 중인 닉네임이에요');
        return;
      }

      if (status === 400) {
        setNicknameError('사용할 수 없는 닉네임이에요');
        return;
      }

      setNicknameError('프로필 수정에 실패했어요');
    } finally {
      setLoading(false);
    }
  };

if (previewImage) {
  return (
    <SafeAreaView style={styles.previewContainer} edges={['top']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#050509"
        translucent={false}
      />

      <View style={styles.previewHeader}>
        <TouchableOpacity
          style={styles.previewBackButton}
          activeOpacity={0.8}
          onPress={handleCancelProfileImagePreview}>
          <IconArrowLeft size={px(24)} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.previewTitle}>프로필 수정</Text>

        <TouchableOpacity
          style={styles.previewConfirmButton}
          activeOpacity={0.8}
          onPress={handleConfirmProfileImage}
          disabled={imageUploading}>
          {imageUploading ? (
            <Text style={styles.previewConfirmText}>업로드 중...</Text>
          ) : (
            <>
              <Image source={checkBlueIcon} style={styles.previewCheckIcon} />
              <Text style={styles.previewConfirmText}>확인</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.previewImageWrapper}>
        <FastImage
          source={{uri: previewImage.uri}}
          style={styles.previewImage}
          resizeMode={FastImage.resizeMode.contain}
        />
      </View>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerButton}
            onPress={() => navigation.goBack()}>
            <IconArrowLeft size={px(20)} color="#2C343F" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>프로필 수정</Text>

          <View style={styles.headerButton} />
        </View>

        <View style={styles.profileArea}>
          <ProfileImageEditor
            imageUrl={selectedProfileImageUrl}
            uploading={imageUploading}
            onPressEdit={handlePressImageEdit}
          />
        </View>

        <View style={styles.inputArea}>
          <TextInput
            value={nickname}
            onChangeText={text => {
              setNickname(text);
              setNicknameError('');
            }}
            style={[
              styles.nicknameInput,
              hasError && styles.inputError,
            ]}
            placeholder="닉네임"
            placeholderTextColor="#999999"
          />

         <View style={styles.inputInfoRow}>
          <Text
            style={[
              styles.nicknameGuide,
              hasError && styles.errorText,
            ]}>
            {nicknameError || '닉네임을 입력해주세요'}
          </Text>
        </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.submitButton,
            (!isNicknameValid || loading) && styles.disabledButton,
          ]}
          disabled={!isNicknameValid || loading}
          onPress={handleSubmit}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>완료</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: px(54),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: px(16),
  },

  headerButton: {
    width: px(34),
    height: px(34),
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: px(18),
    color: '#111114',
  },

  profileArea: {
    alignItems: 'center',
    paddingTop: px(15),
  },

  inputArea: {
    marginTop: px(25),
    paddingHorizontal: px(23),
  },

  nicknameInput: {
    height: px(44),
    borderWidth: 1,
    borderColor: '#E0E0E4',
    borderRadius: px(12),
    paddingHorizontal: px(20),
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: px(18),
    fontSize: px(18),
    fontFamily: fontFamily.bold,
    color: '#111114',
  },

  inputError: {
    borderColor: '#FF0000',
  },

  inputInfoRow: {
    marginTop: px(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  nicknameGuide: {
    fontSize: px(12),
    fontFamily: fontFamily.medium,
    color: '#6489F2',
  },

  errorText: {
    color: '#FF0000',
  },

  submitButton: {
    position: 'absolute',
    left: px(24),
    right: px(24),
    bottom: px(32),
    height: px(48),
    borderRadius: px(12),
    backgroundColor: '#2C343F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledButton: {
    backgroundColor: '#C9CDD2',
  },

  submitText: {
    fontSize: px(15),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },

  previewContainer: {
    flex: 1,
    backgroundColor: '#050509',
  },

  previewHeader: {
    height: px(64),
    backgroundColor: '#050509',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: px(20),
  },

  previewBackButton: {
    width: px(40),
    height: px(40),
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 2,
  },

  previewTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: px(17),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },

  previewConfirmButton: {
    width: px(125),
    height: px(37),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: px(8),
    zIndex: 2,
  },

  previewCheckIcon: {
    width: px(18),
    height: px(18),
    resizeMode: 'contain',
  },

  previewConfirmText: {
    fontSize: px(16),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },

  previewImageWrapper: {
    flex: 1,
    backgroundColor: '#050509',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: px(20),
    paddingTop: px(5),
  },

  previewImage: {
    width: '100%',
    height: '96%',
  },
  
});