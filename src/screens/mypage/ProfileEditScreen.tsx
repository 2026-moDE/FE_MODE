import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';

import {fontFamily} from '../../constants/typography';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {updateMyProfile} from '../../api/mypage';

const pencilIcon = require('../../assets/image/pencil.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

export default function ProfileEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const initialNickname = route.params?.nickname ?? '';
  const profileImageUrl = route.params?.profileImageUrl ?? null;

  const [nickname, setNickname] = useState(initialNickname);
  const [loading, setLoading] = useState(false);

  const nicknameLength = nickname.length;
  const isNicknameValid = nicknameLength > 0 && nicknameLength <= 8;

  const handleSubmit = async () => {
    if (!isNicknameValid) {
      Alert.alert('알림', '닉네임은 1자 이상 8자 이하로 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      await updateMyProfile({
        nickname,
        profile_image_url: profileImageUrl,
      });

      navigation.goBack();
    } catch (error: any) {
      console.log('프로필 수정 실패:', error);

      const status = error?.response?.status;

      if (status === 409) {
        Alert.alert('알림', '이미 사용 중인 닉네임이에요.');
        return;
      }

      if (status === 400) {
        Alert.alert('알림', '사용할 수 없는 닉네임이에요.');
        return;
      }

      Alert.alert('알림', '프로필 수정에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

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
          <View style={styles.profileImageBox}>
            {profileImageUrl ? (
              <Image
                source={{uri: profileImageUrl}}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : null}

            <View style={styles.imageEditBadge}>
              <Image
                source={pencilIcon}
                style={styles.imageEditIcon}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        <View style={styles.inputArea}>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            style={[
              styles.nicknameInput,
              !isNicknameValid && nicknameLength > 0 && styles.inputError,
            ]}
            placeholder="닉네임"
            placeholderTextColor="#999999"
          />

          <View style={styles.inputInfoRow}>
            <Text
              style={[
                styles.nicknameGuide,
                !isNicknameValid && nicknameLength > 0 && styles.errorText,
              ]}>
              {isNicknameValid
                ? '사용 가능한 닉네임이에요'
                : '사용 불가능한 닉네임이에요'}
            </Text>

            <Text
              style={[
                styles.nicknameCount,
                !isNicknameValid && nicknameLength > 0 && styles.errorText,
              ]}>
              {nicknameLength} / 8
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

  profileImageBox: {
    width: px(88),
    height: px(88),
    borderRadius: px(12),
    backgroundColor: '#F3F3F3',
    borderWidth: 1,
    borderColor: '#E0E0E4',
    overflow: 'hidden',
  },

  profileImage: {
    width: '100%',
    height: '100%',
  },

  imageEditBadge: {
    position: 'absolute',
    right: px(4),
    bottom: px(4),
    width: px(22),
    height: px(22),
    borderRadius: px(9),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageEditIcon: {
    width: px(16),
    height: px(16),
    tintColor: '#A3A3AA',
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

  nicknameCount: {
    fontSize: px(12),
    fontFamily: fontFamily.bold,
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
});