import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import {onboardingApi} from '../../api/onboardingApi';
import {useProfileImageUpload, PickedProfileImage} from '../../hooks/useProfileImageUpload';
import type {AuthStackParamList} from '../../types/navigation';

import {fontFamily, fontSize} from '../../constants/typography';
import {colors} from '../../constants/colors';

const pencilIcon = require('../../assets/image/pencil.png');

const appliedFontFamily = fontFamily ?? {
  bold: 'Pretendard-Bold',
  regular: 'Pretendard-Regular',
};

type Props = NativeStackScreenProps<AuthStackParamList, 'ProfileSetup'>;
type ProfileSetupRouteProp = RouteProp<AuthStackParamList, 'ProfileSetup'>;

const ProfileSetupScreen = ({navigation}: Props) => {
  const route = useRoute<ProfileSetupRouteProp>();
  const [nickname, setNickname] = useState('');
  const [pickedImage, setPickedImage] = useState<PickedProfileImage | null>(null);
  const {pickProfileImage, uploadProfileImage, uploading} = useProfileImageUpload();

  const isActive = nickname.trim().length > 0 && !uploading;

  const handlePickImage = async () => {
    const image = await pickProfileImage();
    if (image) {
      setPickedImage(image);
    }
  };

  const handleNext = async () => {
    if (!isActive) {
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
        nickname: nickname.trim(),
        terms_agreed: route.params.terms_agreed,
        location_terms_agreed: route.params.location_terms_agreed,
        privacy_agreed: route.params.privacy_agreed,
        marketing_agreed: route.params.marketing_agreed,
        ...(profileImageUrl && { profile_image_url: profileImageUrl }),
      };

      console.log('온보딩 요청 body:', body);

      const result = await onboardingApi(body);

      console.log('온보딩 성공:', result);

      navigation.navigate('SignupComplete');
    } catch (error: any) {
      console.log('온보딩 실패:', error.message);
    }
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필설정</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        bounces={false}>
        <View style={styles.profileSection}>
          <View style={styles.imageBox}>
            {pickedImage ? (
              <Image source={{uri: pickedImage.uri}} style={styles.profileImage} />
            ) : (
              <View style={styles.checkPattern} />
            )}
          </View>

          <Pressable style={styles.editButton} onPress={handlePickImage}>
            <Image source={pencilIcon} style={styles.pencilIcon} />
          </Pressable>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>닉네임</Text>

          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력해주세요."
            placeholderTextColor="#A3A3AA"
            maxLength={8}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <Pressable
          style={[
            styles.nextButton,
            !isActive && styles.nextButtonInactive,
          ]}
          onPress={handleNext}>
          <Text style={styles.nextButtonText}>다음</Text>
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
  },
  contentContainer: {
    paddingHorizontal: 27,
    flexGrow: 1,
  },
  profileSection: {
    width: 178,
    height: 178,
    alignSelf: 'center',
    marginTop: 116,
  },
  imageBox: {
    width: 162,
    height: 162,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D2D5DA',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  checkPattern: {
    flex: 1,
    backgroundColor: '#F3F3F3',
    opacity: 0.65,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
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
  inputSection: {
    marginTop: 48,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    fontFamily: 'Pretendard',
    color: '#111114',
    marginBottom: 14,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C9CDD3',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    fontFamily: 'Pretendard',
    color: '#111114',
  },
  bottomArea: {
    paddingHorizontal: 27,
    paddingBottom: 34,
  },
  nextButton: {
    height: 60,
    borderRadius: 11,
    backgroundColor: '#1D232C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonInactive: {
    backgroundColor: '#1D232C',
  },
  nextButtonText: {
    fontSize: fontSize.xl,
    fontFamily: appliedFontFamily.bold,
    color: '#FFFFFF',
  },
});