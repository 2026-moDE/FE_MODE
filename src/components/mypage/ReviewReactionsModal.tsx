import React, {forwardRef, useMemo} from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {BottomSheetModal, BottomSheetFlatList} from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';

import {fontFamily, fontSize} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

export type ReviewReaction = {
  id: number;
  nickname: string;
  profileImageUrl?: string | null;
  emoji: string;
};

type Props = {
  reactions: ReviewReaction[];
};

const ReviewReactionsModal = forwardRef<BottomSheetModal, Props>(function ReviewReactionsModal(
  {reactions},
  ref,
) {
  const snapPoints = useMemo(() => ['45%', '75%'], []);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}>
      <BottomSheetFlatList
        data={reactions}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Text style={styles.emptyText}>아직 반응이 없어요</Text>}
        renderItem={({item}) => (
          <View style={styles.row}>
            {item.profileImageUrl ? (
              <FastImage
                source={{uri: item.profileImageUrl}}
                style={styles.avatar}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <View style={styles.avatar} />
            )}

            <Text style={styles.nickname} numberOfLines={1}>
              {item.nickname}
            </Text>

            <Text style={styles.emoji}>{item.emoji}</Text>
          </View>
        )}
      />
    </BottomSheetModal>
  );
});

export default ReviewReactionsModal;

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.background.dark,
    borderTopLeftRadius: px(radius.xl),
    borderTopRightRadius: px(radius.xl),
  },
  handle: {
    backgroundColor: colors.gray[600],
    width: px(40),
  },
  content: {
    paddingHorizontal: px(spacing.xl),
    paddingTop: px(spacing.lg),
    paddingBottom: px(spacing['2xl']),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: px(spacing.md),
  },
  avatar: {
    width: px(36),
    height: px(36),
    borderRadius: px(radius.md),
    backgroundColor: colors.surface.muted,
    marginRight: px(spacing.md),
  },
  nickname: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: px(fontSize.b5),
    color: colors.text.inverse,
  },
  emoji: {
    fontSize: px(20),
    marginLeft: px(spacing.md),
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: px(fontSize.b5),
    color: colors.text.disabled,
    textAlign: 'center',
    paddingTop: px(spacing['2xl']),
  },
});
