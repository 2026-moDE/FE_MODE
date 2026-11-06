import React, {useMemo} from 'react';
import {Dimensions, View, Text, Image, Pressable, StyleSheet} from 'react-native';

import type {Piece} from '../../api/piece';
import {MAX_PINNED_PIECES} from '../../storage/pinnedPieces';
import {typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import IconPin from '../../assets/icons/IconPin';
import IconPlus from '../../assets/icons/IconPlus';
import DashedBorder from '../common/DashedBorder';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const COLUMN_COUNT = 3;
// 시안(node 3119:10921) 칸 크기. 넓은 화면에서도 이보다 커지지 않고, 좁은 화면에서만 줄어든다
const DESIGN_CELL_SIZE = 112;
const DESIGN_SLOT_WIDTH = 112.5;
const COLUMN_WIDTH =
  (SCREEN_WIDTH - padding.lg * 2 - gap.md * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
const CELL_SIZE = Math.min(Math.floor(COLUMN_WIDTH), DESIGN_CELL_SIZE);
const SLOT_WIDTH = Math.min(COLUMN_WIDTH, DESIGN_SLOT_WIDTH);
// 조각이 칸 가장자리에 닿지 않게 살짝 안쪽에 둔다
const CELL_INSET = 10;

type Props = {
  nickname?: string;
  pieces: Piece[];
  pinnedIds: number[];
  // 도감에서는 보고 있는 조각(50%), 고정 화면에서는 선택한 조각(40%)이 흐려진다
  dimmedIds: number[];
  dimOpacity: number;
  onPressPiece: (piece: Piece) => void;
  onPressPinnedSlot: (piece: Piece | null) => void;
};

// 서버가 최신순으로 내려주므로 순서를 유지한 채 월별로 묶기만 한다
const groupByMonth = (pieces: Piece[]) => {
  const groups = new Map<string, Piece[]>();

  pieces.forEach(piece => {
    const date = new Date(piece.created_at);
    const month = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

    groups.set(month, [...(groups.get(month) ?? []), piece]);
  });

  return [...groups.entries()];
};

function PieceImage({piece}: {piece: Piece}) {
  return (
    <Image
      source={{uri: piece.image_url}}
      style={[styles.cellImage, {transform: [{rotate: `${piece.rotation}deg`}]}]}
    />
  );
}

export default function PieceCollection({
  nickname,
  pieces,
  pinnedIds,
  dimmedIds,
  dimOpacity,
  onPressPiece,
  onPressPinnedSlot,
}: Props) {
  const months = useMemo(() => groupByMonth(pieces), [pieces]);
  const pinnedPieces = pinnedIds
    .map(id => pieces.find(piece => piece.id === id))
    .filter((piece): piece is Piece => piece != null);
  const emptySlotCount = MAX_PINNED_PIECES - pinnedPieces.length;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>
          {nickname ? `${nickname}님이 모은 조각들` : '모은 조각들'}
        </Text>
        <Text style={styles.count}>{pieces.length}개</Text>
      </View>

      <View style={styles.pinnedSection}>
        <View style={styles.pinnedHeader}>
          <Text style={styles.sectionTitle}>고정된 조각</Text>
          <Text style={styles.pinnedHelper}>
            최대 {MAX_PINNED_PIECES}개까지 고정할 수 있어요
          </Text>
        </View>

        <View style={styles.slotRow}>
          {pinnedPieces.map(piece => (
            <Pressable
              key={piece.id}
              style={styles.pinnedCell}
              onPress={() => onPressPinnedSlot(piece)}>
              <PieceImage piece={piece} />
              <IconPin
                size={20}
                color={colors.icon.basic}
                style={styles.pinIcon}
              />
            </Pressable>
          ))}

          {Array.from({length: emptySlotCount}, (_, index) => (
            <Pressable
              key={index}
              style={styles.emptyCell}
              onPress={() => onPressPinnedSlot(null)}>
              <IconPlus size={20} color={colors.icon.tertiary} />
              <DashedBorder
                radius={radius.xl}
                color={colors.border.strong}
                dash={[3, 3]}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.months}>
        {months.map(([month, monthPieces]) => (
          <View key={month} style={styles.month}>
            <Text style={styles.sectionTitle}>{month}</Text>

            <View style={styles.row}>
              {monthPieces.map(piece => (
                <Pressable
                  key={piece.id}
                  style={[
                    styles.cell,
                    dimmedIds.includes(piece.id) && {opacity: dimOpacity},
                  ]}
                  onPress={() => onPressPiece(piece)}>
                  <PieceImage piece={piece} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: padding.lg,
    gap: gap.md,
    backgroundColor: colors.surface.white,
  },

  titleRow: {
    paddingHorizontal: padding.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    ...typography.b3,
    lineHeight: 19,
    color: colors.text.basic,
    includeFontPadding: false,
  },

  count: {
    ...typography.b5,
    lineHeight: 17,
    color: colors.text.subtle,
    includeFontPadding: false,
  },

  pinnedSection: {
    padding: padding.lg,
    gap: gap.sm,
    backgroundColor: colors.surface.elevated,
  },

  pinnedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.sm,
  },

  sectionTitle: {
    ...typography.b5,
    lineHeight: 17,
    color: colors.text.basic,
    includeFontPadding: false,
  },

  pinnedHelper: {
    ...typography.c2,
    color: colors.text.subtle,
    includeFontPadding: false,
  },

  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gap.md,
  },

  slotRow: {
    flexDirection: 'row',
    gap: gap.md,
  },

  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.xl,
    backgroundColor: colors.surface.default,
  },

  pinnedCell: {
    width: SLOT_WIDTH,
    height: CELL_SIZE,
    borderWidth: 1,
    borderColor: colors.border.black,
    borderRadius: radius.xl,
    backgroundColor: colors.surface.default,
  },

  emptyCell: {
    width: SLOT_WIDTH,
    height: CELL_SIZE,
    borderRadius: radius.xl,
    backgroundColor: colors.surface.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cellImage: {
    position: 'absolute',
    top: CELL_INSET,
    left: CELL_INSET,
    right: CELL_INSET,
    bottom: CELL_INSET,
    resizeMode: 'contain',
  },

  // 시안은 카드 바깥 기준 위 10, 오른쪽 9.5. absolute는 테두리 안쪽 기준이라 1을 뺀다
  pinIcon: {
    position: 'absolute',
    top: 9,
    right: 8.5,
  },

  months: {
    padding: padding.lg,
    gap: gap.md,
  },

  month: {
    gap: gap.sm,
  },
});
