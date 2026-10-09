import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  Animated,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {AppStackParamList} from '../../types/navigation';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {deletePiece, updatePiece} from '../../api/piece';
import {typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';

type Props = NativeStackScreenProps<AppStackParamList, 'PieceEdit'>;

const timerIcon = require('../../assets/icons/ic_round-timer.png');

const MAX_LABEL_LENGTH = 10;

const TOGGLE_TRACK_WIDTH = 44;
const TOGGLE_TRACK_HEIGHT = 24;
const TOGGLE_PADDING = 3;
const TOGGLE_THUMB_SIZE = 18;
const TOGGLE_TRAVEL = TOGGLE_TRACK_WIDTH - TOGGLE_PADDING * 2 - TOGGLE_THUMB_SIZE;

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const formatCapturedAt = (iso: string) => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} (${
    DAYS[date.getDay()]
  }) ${hours}:${minutes}`;
};

function ToggleSwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
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
    <Pressable onPress={() => onValueChange(!value)} hitSlop={8}>
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <Animated.View style={[styles.toggleThumb, {transform: [{translateX}]}]} />
      </View>
    </Pressable>
  );
}

const PieceEditScreen = ({navigation, route}: Props) => {
  const {pieceId, imageUrl, placeName, createdAt} = route.params;

  const [showOnProfile, setShowOnProfile] = useState(
    route.params.visibility === 'PUBLIC',
  );
  const [label, setLabel] = useState(route.params.name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const trimmedLabel = label.trim();
  const isSubmitActive = trimmedLabel.length > 0 && !isSaving;

  const handleSubmit = async () => {
    if (!isSubmitActive) {
      return;
    }

    setIsSaving(true);

    try {
      await updatePiece(pieceId, {
        name: trimmedLabel,
        visibility: showOnProfile ? 'PUBLIC' : 'PRIVATE',
      });

      navigation.goBack();
    } catch (error) {
      console.log('[조각 수정 실패]', error);
      Alert.alert('오류', '조각을 수정하지 못했어요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('조각 삭제', '이 조각을 삭제할까요?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePiece(pieceId);
            navigation.goBack();
          } catch (error) {
            console.log('[조각 삭제 실패]', error);
            Alert.alert('오류', '조각을 삭제하지 못했어요.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={navigation.goBack} hitSlop={10}>
          <IconArrowLeft size={24} color={colors.icon.basic} />
        </Pressable>

        <Text style={styles.headerTitle}>조각 수정</Text>

        <Pressable style={styles.deleteButton} onPress={handleDelete} hitSlop={10}>
          <Text style={styles.deleteText}>삭제</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior="padding">
        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Image source={{uri: imageUrl}} style={styles.cutout} />

          <View style={styles.cardFooter}>
            <Text style={styles.cardPlace} numberOfLines={1}>
              {placeName}
            </Text>

            <View style={styles.cardDateRow}>
              <Image source={timerIcon} style={styles.cardDateIcon} />
              <Text style={styles.cardDate}>{formatCapturedAt(createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileRow}>
          <Text style={styles.sectionLabel}>프로필에 표시하기</Text>
          <ToggleSwitch value={showOnProfile} onValueChange={setShowOnProfile} />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          어떤 조각인가요?
        </Text>

        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="조각 이름을 적어주세요"
            placeholderTextColor={colors.text.disabled}
            maxLength={MAX_LABEL_LENGTH}
            returnKeyType="done"
            // 입력창이 화면 아래쪽이라, 키보드가 올라오면 끝까지 스크롤해서 가려지지 않게 한다
            onFocus={() =>
              requestAnimationFrame(() => scrollRef.current?.scrollToEnd({animated: true}))
            }
          />

          <View style={styles.counterRow}>
            <Text style={styles.counterCurrent}>{label.length}</Text>
            <Text style={styles.counterTotal}>/ {MAX_LABEL_LENGTH}</Text>
          </View>
        </View>
      </ScrollView>

        <Pressable
          style={[styles.submitButton, !isSubmitActive && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isSubmitActive}>
          <Text
            style={[styles.submitText, !isSubmitActive && styles.submitTextDisabled]}>
            완료
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PieceEditScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButton: {
    position: 'absolute',
    left: padding.lg,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    ...typography.b1,
    color: colors.text.basic,
    includeFontPadding: false,
  },

  deleteButton: {
    position: 'absolute',
    right: padding.lg,
    height: 32,
    justifyContent: 'center',
  },

  deleteText: {
    ...typography.b5,
    color: colors.text.tertiary,
    includeFontPadding: false,
  },

  keyboardArea: {
    flex: 1,
  },

  body: {
    flex: 1,
    paddingHorizontal: padding.lg,
  },

  bodyContent: {
    paddingBottom: gap.xl,
  },

  // 조각 등록 화면(PieceInfoScreen)과 같은 카드 - 시안 361x307
  card: {
    height: 307,
    marginTop: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.surface.inverse,
    overflow: 'hidden',
  },

  cutout: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    right: '15%',
    height: '65%',
    resizeMode: 'contain',
  },

  cardFooter: {
    position: 'absolute',
    left: padding.lg,
    right: padding.lg,
    bottom: padding.lg,
    gap: 2,
  },

  cardPlace: {
    ...typography.b5,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.xs,
  },

  cardDateIcon: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
    tintColor: colors.text.disabled,
  },

  cardDate: {
    ...typography.c2,
    color: colors.text.disabled,
    includeFontPadding: false,
  },

  profileRow: {
    marginTop: gap.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionLabel: {
    ...typography.b1,
    color: colors.text.basic,
    includeFontPadding: false,
  },

  sectionLabelSpaced: {
    marginTop: gap.xl,
  },

  inputBox: {
    marginTop: gap.md,
    padding: padding.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: gap.sm,
  },

  input: {
    ...typography.c2,
    flex: 1,
    padding: 0,
    color: colors.text.basic,
    includeFontPadding: false,
  },

  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.xs,
  },

  counterCurrent: {
    ...typography.c1,
    color: colors.text.subtle,
    includeFontPadding: false,
  },

  counterTotal: {
    ...typography.c2,
    color: colors.text.disabled,
    includeFontPadding: false,
  },

  submitButton: {
    marginHorizontal: padding.lg,
    marginBottom: gap.sm,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonDisabled: {
    backgroundColor: colors.button.disabledFill,
  },

  submitText: {
    ...typography.b3,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  submitTextDisabled: {
    color: colors.text.disabled,
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
    backgroundColor: colors.white,
  },
});
