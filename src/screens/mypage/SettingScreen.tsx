import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {logoutApi, withdrawApi} from '../../api/auth';
import {useAuth} from '../../context/AuthContext';
import WithdrawModal from '../../components/mypage/WithdrawModal';

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

const TOGGLE_TRACK_WIDTH = px(44);
const TOGGLE_TRACK_HEIGHT = px(24);
const TOGGLE_PADDING = px(3);
const TOGGLE_THUMB_SIZE = px(18);
const TOGGLE_TRAVEL = TOGGLE_TRACK_WIDTH - TOGGLE_PADDING * 2 - TOGGLE_THUMB_SIZE;

type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function ToggleSwitch({value, onValueChange}: ToggleSwitchProps) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [anim, value]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TOGGLE_TRAVEL],
  });

  return (
    <Pressable onPress={() => onValueChange(!value)}>
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <Animated.View
          style={[styles.toggleThumb, {transform: [{translateX}]}]}
        />
      </View>
    </Pressable>
  );
}

export default function SettingScreen() {
  const navigation = useNavigation<any>();
  const {setIsLoggedIn} = useAuth();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [commentAllowed, setCommentAllowed] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);

  const handleLogout = () => {
    if (isProcessing) {
      return;
    }

    Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
      {text: '취소', style: 'cancel'},
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsProcessing(true);
            await logoutApi();
            setIsLoggedIn(false);
          } catch (error) {
            console.log('[로그아웃 실패]', error);
            Alert.alert('로그아웃 실패', '잠시 후 다시 시도해주세요.');
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const handleWithdraw = async () => {
    if (isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      await withdrawApi();
      setIsLoggedIn(false);
    } catch (error) {
      console.log('[회원 탈퇴 실패]', error);
      setWithdrawModalVisible(false);
      Alert.alert('회원 탈퇴 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.white} />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerButton}
            onPress={() => navigation.goBack()}>
            <IconArrowLeft size={px(20)} color={colors.icon.basic} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>설정</Text>

          <View style={styles.headerButton} />
        </View>

        <View style={styles.sectionGap} />

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>알림 설정</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.rowText}>푸시 알림</Text>
            <ToggleSwitch value={pushEnabled} onValueChange={setPushEnabled} />
          </View>
        </View>

        <View style={styles.sectionGap} />

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>리뷰 설정</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.rowText}>리뷰 댓글 허용</Text>
            <ToggleSwitch value={commentAllowed} onValueChange={setCommentAllowed} />
          </View>
        </View>

        <View style={styles.sectionGap} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.linkRow}
          onPress={() => navigation.navigate('TermsOfService')}>
          <Text style={styles.rowText}>서비스 이용 약관</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.linkRow}
          disabled={isProcessing}
          onPress={handleLogout}>
          <Text style={styles.rowText}>로그아웃</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.linkRow}
          disabled={isProcessing}
          onPress={() => setWithdrawModalVisible(true)}>
          <Text style={styles.withdrawText}>회원 탈퇴</Text>
        </TouchableOpacity>

        <View style={styles.bottomFiller} />
      </View>

      <WithdrawModal
        visible={withdrawModalVisible}
        onClose={() => setWithdrawModalVisible(false)}
        onWithdraw={handleWithdraw}
      />
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
    height: px(54),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: px(spacing.lg),
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
    color: colors.text.basic,
  },

  card: {
    backgroundColor: colors.background.white,
    paddingVertical: px(spacing.lg),
    paddingHorizontal: px(spacing['2xl']),
  },

  sectionLabel: {
    marginBottom: px(spacing.md),
    fontSize: px(12),
    fontFamily: fontFamily.medium,
    color: colors.text.tertiary,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: px(spacing.lg),
    paddingHorizontal: px(spacing['2xl']),
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },

  rowText: {
    fontSize: px(14),
    fontFamily: fontFamily.medium,
    color: colors.text.basic,
  },

  chevron: {
    fontSize: px(18),
    color: colors.icon.tertiary,
  },

  withdrawText: {
    fontSize: px(15),
    fontFamily: fontFamily.medium,
    color: '#FF0000',
  },

  sectionGap: {
    height: px(spacing.md),
    backgroundColor: colors.border.subtle,
  },

  bottomFiller: {
    flex: 1,
    backgroundColor: colors.border.subtle,
  },

  toggleTrack: {
    width: TOGGLE_TRACK_WIDTH,
    height: TOGGLE_TRACK_HEIGHT,
    borderRadius: TOGGLE_TRACK_HEIGHT / 2,
    padding: TOGGLE_PADDING,
    justifyContent: 'center',
    backgroundColor: colors.border.strong,
  },

  toggleTrackOn: {
    backgroundColor: colors.brand.secondary,
  },

  toggleThumb: {
    width: TOGGLE_THUMB_SIZE,
    height: TOGGLE_THUMB_SIZE,
    borderRadius: TOGGLE_THUMB_SIZE / 2,
    backgroundColor: colors.button.tertiaryFill,
  },
});
