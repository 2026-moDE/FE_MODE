import React, {useCallback, useEffect, useRef, useState} from 'react';
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
import {useFocusEffect} from '@react-navigation/native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import type {AppStackParamList} from '../../types/navigation';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {
  MAX_SCALE,
  MIN_SCALE,
  getMyPieces,
  updatePiece,
  updatePiecePositions,
  type Piece,
} from '../../api/piece';
import {getMyProfile} from '../../api/mypage';
import {getPinnedPieceIds} from '../../storage/pinnedPieces';
import PieceCollection from '../../components/mypage/PieceCollection';
import BubbleChip from '../../components/common/BubbleChip';
import DashedDivider from '../../components/common/DashedDivider';
import {typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';

type Props = NativeStackScreenProps<AppStackParamList, 'PieceEdit'>;

const timerIcon = require('../../assets/icons/ic_round-timer.png');

const MAX_LABEL_LENGTH = 10;

// 시안(node 3210:6996) 361x307 카드 기준: 조각 113x128, 중심은 카드 위에서 158
const CUTOUT_SIZE = 128;
const CUTOUT_CENTER_Y = 158;
const HINT_TOP = 31;
// 시안 도감에서 지금 보고 있는 조각의 불투명도 50%
const SELECTED_OPACITY = 0.5;

const TOGGLE_TRACK_WIDTH = 44;
const TOGGLE_TRACK_HEIGHT = 24;
const TOGGLE_PADDING = 3;
const TOGGLE_THUMB_SIZE = 18;
const TOGGLE_TRAVEL =
  TOGGLE_TRACK_WIDTH - TOGGLE_PADDING * 2 - TOGGLE_THUMB_SIZE;

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
    <Pressable
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel="나만 보기"
      accessibilityState={{checked: value}}
    >
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <Animated.View
          style={[styles.toggleThumb, {transform: [{translateX}]}]}
        />
      </View>
    </Pressable>
  );
}

const PieceEditScreen = ({navigation, route}: Props) => {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [isPiecesLoading, setIsPiecesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(route.params?.pieceId);
  const [nickname, setNickname] = useState<string>();
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [showOnlyMe, setShowOnlyMe] = useState(
    route.params?.visibility === 'PRIVATE',
  );
  const [label, setLabel] = useState(route.params?.name ?? '');
  const [isHintVisible, setIsHintVisible] = useState(true);

  const scrollRef = useRef<ScrollView>(null);
  const formTopRef = useRef(0);
  const selectedIdRef = useRef(selectedId);
  const savedNameRef = useRef(route.params?.name ?? '');

  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);

  // 목록을 받기 전에는 진입할 때 넘겨받은 값으로 먼저 그린다
  const selected = pieces.find(piece => piece.id === selectedId);
  const imageUrl = selected?.image_url ?? route.params?.imageUrl;
  const placeName = selected?.place.name ?? route.params?.placeName;
  const createdAt = selected?.created_at ?? route.params?.createdAt;
  const rotation = selected?.rotation ?? 0;

  const updateLocalPiece = (pieceId: number, changes: Partial<Piece>) => {
    setPieces(prev =>
      prev.map(piece =>
        piece.id === pieceId ? {...piece, ...changes} : piece,
      ),
    );
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsPiecesLoading(true);
      getMyPieces('all')
        .then(data => {
          if (!isActive) return;
          setPieces(data.pieces);
          setPinnedIds(getPinnedPieceIds(data.pieces));

          // 상단 버튼은 최신 조각, 보드에서 진입하면 눌렀던 조각을 선택한다.
          // API는 created_at 최신순으로 내려준다.
          const availablePieces = data.pieces;
          const current =
            selectedIdRef.current == null
              ? availablePieces[0]
              : availablePieces.find(
                  piece => piece.id === selectedIdRef.current,
                );

          if (current) {
            selectedIdRef.current = current.id;
            savedNameRef.current = current.name ?? '';
            setSelectedId(current.id);
            setLabel(current.name ?? '');
            setShowOnlyMe(current.visibility === 'PRIVATE');
            scale.value = current.scale;
          }
        })
        .catch(error => console.log('[조각 목록 조회 실패]', error))
        .finally(() => {
          if (isActive) setIsPiecesLoading(false);
        });

      getMyProfile()
        .then(profile => {
          if (isActive) setNickname(profile.nickname);
        })
        .catch(error => console.log('[프로필 조회 실패]', error));
      return () => {
        isActive = false;
      };
    }, [scale]),
  );

  // 삭제 등으로 선택한 조각이 목록에서 빠지면 다음 조각 또는 빈 도감을 보여준다.
  useEffect(() => {
    if (isPiecesLoading || pieces.some(piece => piece.id === selectedId))
      return;
    const next = pieces[0];
    if (selectedId === next?.id) return;

    selectedIdRef.current = next?.id;
    savedNameRef.current = next?.name ?? '';
    setSelectedId(next?.id);
    setLabel(next?.name ?? '');
    setShowOnlyMe(next?.visibility === 'PRIVATE');
    scale.value = next?.scale ?? 1;
  }, [isPiecesLoading, pieces, selectedId, scale]);

  // 시안에 완료 버튼이 없어서 이름은 입력을 마칠 때 저장한다.
  // 비우면 저장하지 않고 원래 이름으로 되돌린다
  const saveName = async () => {
    const pieceId = selectedIdRef.current;
    const previousName = savedNameRef.current;
    const trimmedLabel = label.trim();

    if (pieceId == null || !pieces.some(piece => piece.id === pieceId)) {
      return;
    }

    if (!trimmedLabel || trimmedLabel === previousName) {
      setLabel(previousName);
      return;
    }

    savedNameRef.current = trimmedLabel;

    try {
      await updatePiece(pieceId, {name: trimmedLabel});
      updateLocalPiece(pieceId, {name: trimmedLabel});
    } catch (error) {
      console.log('[조각 이름 수정 실패]', error);
      Alert.alert('오류', '조각 이름을 수정하지 못했어요.');

      // 그 사이 다른 조각을 골랐으면 입력칸은 이미 그 조각의 이름이다
      if (selectedIdRef.current === pieceId) {
        savedNameRef.current = previousName;
        setLabel(previousName);
      }
    }
  };

  // 뒤로가기 제스처나 안드로이드 뒤로 버튼으로 나가도 입력하던 이름을 잃지 않게 한다
  const saveNameRef = useRef(saveName);
  saveNameRef.current = saveName;

  useEffect(
    () => () => {
      saveNameRef.current();
    },
    [],
  );

  const handleChangeVisibility = async (next: boolean) => {
    const pieceId = selectedId;
    if (pieceId == null) return;
    const visibility = next ? 'PRIVATE' : 'PUBLIC';

    setShowOnlyMe(next);

    try {
      await updatePiece(pieceId, {visibility});
      updateLocalPiece(pieceId, {visibility});
    } catch (error) {
      console.log('[조각 공개 범위 수정 실패]', error);
      Alert.alert('오류', '조각을 수정하지 못했어요.');

      if (selectedIdRef.current === pieceId) {
        setShowOnlyMe(!next);
      }
    }
  };

  const saveScale = async (nextScale: number) => {
    // 미배치 조각도 null 좌표를 유지한 채 배율을 저장할 수 있다.
    if (!selected) return;

    const roundedScale = Math.round(nextScale * 100) / 100;

    try {
      await updatePiecePositions([
        {
          piece_id: selected.id,
          position_x: selected.position_x,
          position_y: selected.position_y,
          rotation: selected.rotation,
          scale: roundedScale,
        },
      ]);
      updateLocalPiece(selected.id, {scale: roundedScale});
    } catch (error) {
      console.log('[조각 크기 수정 실패]', error);
      Alert.alert('오류', '조각 크기를 수정하지 못했어요.');

      if (selectedIdRef.current === selected.id) {
        scale.value = selected.scale;
      }
    }
  };

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
      runOnJS(setIsHintVisible)(false);
    })
    .onChange(event => {
      scale.value = Math.min(
        Math.max(startScale.value * event.scale, MIN_SCALE),
        MAX_SCALE,
      );
    })
    .onEnd(() => {
      runOnJS(saveScale)(scale.value);
    });

  const cutoutStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}, {rotate: `${rotation}deg`}],
  }));

  const handleSelectPiece = (piece: Piece) => {
    if (piece.id === selectedId) {
      return;
    }

    saveName();

    selectedIdRef.current = piece.id;
    savedNameRef.current = piece.name ?? '';
    scale.value = piece.scale;

    setSelectedId(piece.id);
    setLabel(piece.name ?? '');
    setShowOnlyMe(piece.visibility === 'PRIVATE');
    scrollRef.current?.scrollTo({y: 0, animated: true});
  };

  const handleBack = async () => {
    await saveName();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack} hitSlop={10}>
          <IconArrowLeft size={24} color={colors.icon.basic} />
        </Pressable>

        <Text style={styles.headerTitle}>조각 도감</Text>
      </View>

      <KeyboardAvoidingView style={styles.keyboardArea} behavior="padding">
        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {selectedId != null && (
            <View style={styles.form}>
              <GestureDetector gesture={pinch}>
                <View style={styles.card}>
                  <View style={styles.cutoutArea} pointerEvents="none">
                    <Reanimated.View style={cutoutStyle}>
                      <Image
                        source={imageUrl ? {uri: imageUrl} : undefined}
                        style={styles.cutout}
                      />
                    </Reanimated.View>
                  </View>

                  {isHintVisible && (
                    <View style={styles.hint} pointerEvents="none">
                      <BubbleChip text="조각의 크기를 조절할 수 있어요" />
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.cardPlace} numberOfLines={1}>
                      {placeName}
                    </Text>

                    <View style={styles.cardDateRow}>
                      <Image source={timerIcon} style={styles.cardDateIcon} />
                      <Text style={styles.cardDate}>
                        {createdAt ? formatCapturedAt(createdAt) : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </GestureDetector>

              <View
                style={styles.profileRow}
                onLayout={event => {
                  formTopRef.current = event.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.sectionLabel}>나만 보기</Text>
                <ToggleSwitch
                  value={showOnlyMe}
                  onValueChange={handleChangeVisibility}
                />
              </View>

              <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
                어떤 조각인가요?
              </Text>

              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={label}
                  onChangeText={setLabel}
                  onBlur={saveName}
                  placeholder="조각 이름을 적어주세요"
                  placeholderTextColor={colors.text.disabled}
                  maxLength={MAX_LABEL_LENGTH}
                  returnKeyType="done"
                  // 아래에 도감이 이어지므로 끝까지 내리지 않고 입력칸이 보이는 만큼만 올린다
                  onFocus={() =>
                    requestAnimationFrame(() =>
                      scrollRef.current?.scrollTo({
                        y: formTopRef.current,
                        animated: true,
                      }),
                    )
                  }
                />

                <View style={styles.counterRow}>
                  <Text style={styles.counterCurrent}>{label.length}</Text>
                  <Text style={styles.counterTotal}>/ {MAX_LABEL_LENGTH}</Text>
                </View>
              </View>

              <DashedDivider style={styles.divider} />
            </View>
          )}

          <PieceCollection
            nickname={nickname}
            pieces={pieces}
            pinnedIds={pinnedIds}
            dimmedIds={selectedId == null ? [] : [selectedId]}
            dimOpacity={SELECTED_OPACITY}
            onPressPiece={handleSelectPiece}
            onPressPinnedSlot={() =>
              navigation.navigate('PiecePin', {
                pieces,
                nickname,
                // 삭제된 조각의 id가 칸을 차지하지 않게 걸러서 넘긴다
                pinnedIds: pinnedIds.filter(id =>
                  pieces.some(piece => piece.id === id),
                ),
              })
            }
          />
        </ScrollView>
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

  keyboardArea: {
    flex: 1,
  },

  body: {
    flex: 1,
  },

  bodyContent: {
    paddingBottom: gap.xl,
  },

  form: {
    paddingHorizontal: padding.lg,
  },

  // 조각 등록 화면(PieceInfoScreen)과 같은 카드 - 시안 361x307
  card: {
    height: 307,
    marginTop: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.surface.inverse,
    overflow: 'hidden',
  },

  cutoutArea: {
    position: 'absolute',
    top: CUTOUT_CENTER_Y - CUTOUT_SIZE / 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  cutout: {
    width: CUTOUT_SIZE,
    height: CUTOUT_SIZE,
    resizeMode: 'contain',
  },

  hint: {
    position: 'absolute',
    top: HINT_TOP,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  cardFooter: {
    position: 'absolute',
    left: padding.lg,
    right: padding.lg,
    bottom: padding.lg,
    gap: gap.xs,
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
    marginTop: gap.lg,
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
    marginTop: gap.lg,
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

  divider: {
    marginVertical: gap.xl,
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
