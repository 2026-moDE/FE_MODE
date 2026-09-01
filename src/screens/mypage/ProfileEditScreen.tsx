import React, {useState} from 'react';
import {View, Text, StyleSheet, StatusBar, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Image} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';

import {fontFamily, typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {updateMyProfile} from '../../api/mypage';

import ProfileImageEditor from '../../components/mypage/ProfileImageEditor';
import {useProfileImageUpload, PickedProfileImage} from '../../hooks/useProfileImageUpload';

const checkYellowIcon = require('../../assets/image/check_yellow.png');

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

  const NICKNAME_MAX_LENGTH = 8;

  const trimmedNickname = nickname.trim();
  const isOverLimit = nickname.length > NICKNAME_MAX_LENGTH;
  const isNicknameValid = trimmedNickname.length > 0 && !isOverLimit;
  const displayError = nicknameError || (isOverLimit ? '사용이 불가능한 닉네임이에요' : '');
  const hasError = displayError.length > 0;

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

    if (isOverLimit) {
      setNicknameError('사용이 불가능한 닉네임이에요');
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
          <IconArrowLeft size={24} color={colors.icon.inverse} />
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
              <Image source={checkYellowIcon} style={styles.previewCheckIcon} />
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.white} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerButton}
            onPress={() => navigation.goBack()}>
            <IconArrowLeft size={20} color={colors.icon.basic} />
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
            {displayError || '닉네임을 입력해주세요'}
          </Text>

          <Text
            style={[
              styles.nicknameCount,
              hasError && styles.errorText,
            ]}>
            {nickname.length} / {NICKNAME_MAX_LENGTH}
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
            <ActivityIndicator size="small" color={colors.icon.inverse} />
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
    backgroundColor: colors.background.white,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },

  headerButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.text.basic,
  },

  profileArea: {
    alignItems: 'center',
    paddingTop: 15,
  },

  inputArea: {
    marginTop: 25,
    paddingHorizontal: 23,
  },

  nicknameInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
    ...typography.b1,
    color: colors.text.basic,
  },

  inputError: {
    borderColor: '#FF0000',
  },

  inputInfoRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  nicknameGuide: {
    marginLeft: spacing.md,
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.text.subtle,
  },

  nicknameCount: {
    marginRight: spacing.md,
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.text.subtle,
  },

  errorText: {
    color: '#FF0000',
  },

  submitButton: {
    position: 'absolute',
    left: spacing['2xl'],
    right: spacing['2xl'],
    bottom: spacing['3xl'],
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledButton: {
    backgroundColor: '#C9CDD2',
  },

  submitText: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
  },

  previewContainer: {
    flex: 1,
    backgroundColor: '#050509',
  },

  previewHeader: {
    height: 64,
    backgroundColor: '#050509',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },

  previewBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 2,
  },

  previewTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
  },

  previewConfirmButton: {
    width: 125,
    height: 37,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.s,
    zIndex: 2,
  },

  previewCheckIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  previewConfirmText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
  },

  previewImageWrapper: {
    flex: 1,
    backgroundColor: '#050509',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: 5,
  },

  previewImage: {
    width: '100%',
    height: '96%',
  },
  
});