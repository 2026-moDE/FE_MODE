import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {AppStackParamList} from '../../types/navigation';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconCheck from '../../assets/icons/IconCheck';
import PieceCollection from '../../components/mypage/PieceCollection';
import {useToast} from '../../components/common/Toast';
import {MAX_PINNED_PIECES, savePinnedPieceIds} from '../../storage/pinnedPieces';
import {typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {padding, gap} from '../../constants/spacing';

type Props = NativeStackScreenProps<AppStackParamList, 'PiecePin'>;

// 시안(node 3119:11145) 선택된 카드 불투명도 40%
const SELECTED_OPACITY = 0.4;

const PiecePinScreen = ({navigation, route}: Props) => {
  const {pieces, nickname} = route.params;

  const [pinnedIds, setPinnedIds] = useState(route.params.pinnedIds);
  const {showToast} = useToast();

  // 같은 카드를 다시 누르면 선택 취소 (시안 주석)
  const togglePiece = (pieceId: number) => {
    if (pinnedIds.includes(pieceId)) {
      setPinnedIds(pinnedIds.filter(id => id !== pieceId));
      return;
    }

    if (pinnedIds.length >= MAX_PINNED_PIECES) {
      showToast(`최대 ${MAX_PINNED_PIECES}개까지 고정할 수 있어요`);
      return;
    }

    setPinnedIds([...pinnedIds, pieceId]);
  };

  const handleConfirm = async () => {
    try {
      await savePinnedPieceIds(pinnedIds);
      navigation.goBack();
    } catch (error) {
      console.log('[조각 고정 실패]', error);
      Alert.alert('오류', '조각을 고정하지 못했어요.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={navigation.goBack} hitSlop={10}>
          <IconArrowLeft size={24} color={colors.icon.basic} />
        </Pressable>

        <Text style={styles.headerTitle}>조각 고정하기</Text>

        <Pressable style={styles.confirmButton} onPress={handleConfirm} hitSlop={10}>
          <IconCheck size={24} color={colors.icon.subtle} />
          <Text style={styles.confirmText}>확인</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <PieceCollection
          nickname={nickname}
          pieces={pieces}
          pinnedIds={pinnedIds}
          dimmedIds={pinnedIds}
          dimOpacity={SELECTED_OPACITY}
          onPressPiece={piece => togglePiece(piece.id)}
          // 위쪽 고정 칸을 눌러도 선택 취소. 빈 칸은 아래 목록에서 고르면 되니 할 일이 없다
          onPressPinnedSlot={piece => piece && togglePiece(piece.id)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PiecePinScreen;

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

  confirmButton: {
    position: 'absolute',
    right: padding.lg,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.sm,
  },

  confirmText: {
    ...typography.b3,
    color: colors.text.basic,
    includeFontPadding: false,
  },
});
