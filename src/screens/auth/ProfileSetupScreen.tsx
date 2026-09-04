import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  StatusBar,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import {onboardingApi} from '../../api/onboardingApi';
import {useProfileImageUpload, PickedProfileImage} from '../../hooks/useProfileImageUpload';
import type {AuthStackParamList} from '../../types/navigation';
import {useAuth} from '../../context/AuthContext';

import {fontFamily, fontSize, typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';

const pencilIcon = require('../../assets/image/pencil.png');
const defaultProfileImage = require('../../assets/image/empty_profile.png');

const appliedFontFamily = fontFamily ?? {
  bold: 'Pretendard-Bold',
  regular: 'Pretendard-Regular',
};

type Props = NativeStackScreenProps<AuthStackParamList, 'ProfileSetup'>;
type ProfileSetupRouteProp = RouteProp<AuthStackParamList, 'ProfileSetup'>;

const NICKNAME_PATTERN = /^[가-힣ㄱ-ㅎa-zA-Z0-9]+$/;

const ProfileSetupScreen = (_props: Props) => {
  const route = useRoute<ProfileSetupRouteProp>();
  const {setIsLoggedIn} = useAuth();
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [pickedImage, setPickedImage] = useState<PickedProfileImage | null>(null);
  const {pickProfileImage, uploadProfileImage, uploading} = useProfileImageUpload();

  const isActive = nickname.trim().length > 0 && !uploading;

  const handlePickImage = async () => {
    const image = await pickProfileImage();
    if (image) {
      setPickedImage(image);
    }
  };

  const handleNicknameChange = (text: string) => {
    setNickname(text);
    setNicknameError('');
  };

  const handleNext = async () => {
    if (!isActive) {
      return;
    }

    const trimmedNickname = nickname.trim();

    if (trimmedNickname.length < 2 || trimmedNickname.length > 10) {
      setNicknameError('닉네임은 2자 이상, 10자 이하만 사용 가능해요.');
      return;
    }

    if (!NICKNAME_PATTERN.test(trimmedNickname)) {
      setNicknameError('특수기호를 제외한 한글, 영문, 숫자만 사용 가능해요.');
      return;
    }

    try {
      let profileImageUrl: string | undefined;

      if (pickedImage) {
        const url = await uploadProfileImage(pickedImage);
        if (url) {
          profileImageUrl = url;
        }
      }

      const body = {
        nickname: trimmedNickname,
        terms_agreed: route.params.terms_agreed,
        location_terms_agreed: route.params.location_terms_agreed,
        privacy_agreed: route.params.privacy_agreed,
        marketing_agreed: route.params.marketing_agreed,
        // 사진 선택 안 하면 명시적으로 null을 보내서, 탈퇴 전 계정에 남아있던 예전 사진이
        // PATCH의 "필드 생략 = 값 유지" 특성 때문에 그대로 남는 걸 막음
        profile_image_url: profileImageUrl ?? null,
      };

      console.log('온보딩 요청 body:', body);

      const result = await onboardingApi(body);

      console.log('온보딩 성공:', result);

      setIsLoggedIn(true);
    } catch (error: any) {
      if (error?.status === 409) {
        setNicknameError('이미 사용 중인 닉네임이에요.');
        return;
      }

      console.log('온보딩 실패:', error.message);
    }
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필설정</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topSpacer} />

        <View style={styles.profileSection}>
          <View style={styles.imageBox}>
            <Image
              source={pickedImage ? {uri: pickedImage.uri} : defaultProfileImage}
              style={styles.profileImage}
            />
          </View>

          <Pressable style={styles.editButton} onPress={handlePickImage}>
            <Image source={pencilIcon} style={styles.pencilIcon} />
          </Pressable>
        </View>

        <View style={styles.midSpacer} />

        <View style={styles.inputSection}>
          <Text style={styles.label}>닉네임</Text>

          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={handleNicknameChange}
            placeholder="닉네임을 입력해주세요."
            placeholderTextColor={colors.text.disabled}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text
            style={[styles.caution, !nicknameError && styles.cautionHidden]}>
            {nicknameError || ' '}
          </Text>
        </View>

        <View style={styles.bottomSpacer} />

        <Pressable
          style={[
            styles.nextButton,
            !isActive && styles.nextButtonInactive,
          ]}
          onPress={handleNext}
          disabled={!isActive}>
          <Text
            style={[
              styles.nextButtonText,
              !isActive && styles.nextButtonTextInactive,
            ]}>
            완료
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default ProfileSetupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: fontSize.xs,
    fontFamily: appliedFontFamily.regular,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // 안전영역(노치 아래) 기준 프로필 박스까지 89(헤더 30 포함, 피그마 실측) - 화면이 작으면
  // 줄어들어서 완료 버튼이 항상 보이게 하되, 화면이 넉넉하면 딱 59만큼만 차지함
  topSpacer: {
    height: 59,
    flexShrink: 1,
  },

  // 사진~닉네임 라벨 사이 51 - 화면이 작으면 이것도 같이 줄어들어서 완료 버튼(및 296 간격)이
  // 항상 보이게 함
  midSpacer: {
    height: 51,
    flexShrink: 1,
  },
  profileSection: {
    width: 178,
    height: 178,
    alignSelf: 'center',
  },
  imageBox: {
    width: 160,
    height: 160,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.surface.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 146,
    height: 146,
    borderRadius: radius['2xl'],
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#C8CCD2',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pencilIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  inputSection: {},

  // 닉네임 인풋~완료 버튼 사이 296 - 다른 spacer들과 같은 비율로 화면에 맞게 줄어듦
  bottomSpacer: {
    height: 296,
    flexShrink: 1,
  },
  label: {
    ...typography.b1,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  input: {
    ...typography.b6,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[0],
    paddingHorizontal: 16,
    color: colors.gray[900],
  },
  caution: {
    ...typography.c2,
    color: '#EA0000',
    marginTop: spacing.xs,
  },
  cautionHidden: {
    opacity: 0,
  },
  nextButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.button.secondaryFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonInactive: {
    backgroundColor: colors.button.disabledFill,
  },
  nextButtonText: {
    ...typography.b1,
    color: colors.text.inverse,
  },
  nextButtonTextInactive: {
    color: colors.gray[500],
  },
});