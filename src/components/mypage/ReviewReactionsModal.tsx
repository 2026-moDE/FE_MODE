import React, {forwardRef, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, Dimensions, ActivityIndicator} from 'react-native';
import {BottomSheetModal, BottomSheetFlatList, BottomSheetBackdrop, BottomSheetBackdropProps} from '@gorhom/bottom-sheet';
import FastImage from '@d11/react-native-fast-image';

import {fontFamily, fontSize} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import {EmojiReaction} from '../../api/review';

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type Props = {
  reactions: EmojiReaction[];
  isLoading?: boolean;
};

const ReviewReactionsModal = forwardRef<BottomSheetModal, Props>(function ReviewReactionsModal(
  {reactions, isLoading},
  ref,
) {
  const snapPoints = useMemo(() => ['45%', '75%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.icon.inverse} style={styles.loadingIndicator} />
      ) : (
        <BottomSheetFlatList
          data={reactions}
          keyExtractor={(item, index) => `${item.user.nickname}-${item.emoji}-${index}`}
          contentContainerStyle={styles.content}
          ListEmptyComponent={<Text style={styles.emptyText}>아직 반응이 없어요</Text>}
          renderItem={({item}) => (
            <View style={styles.row}>
              {item.user.profile_url ?? item.user.profile_image_url ? (
                <FastImage
                  source={{uri: item.user.profile_url ?? item.user.profile_image_url ?? undefined}}
                  style={styles.avatar}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : (
                <View style={styles.avatar} />
              )}

              <Text style={styles.nickname} numberOfLines={1}>
                {item.user.nickname}
              </Text>

              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
          )}
        />
      )}
    </BottomSheetModal>
  );
});

export default ReviewReactionsModal;

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.background.dimDarkest,
    borderTopLeftRadius: px(radius.xl),
    borderTopRightRadius: px(radius.xl),
  },
  handle: {
    backgroundColor: colors.gray[600],
    width: px(40),
  },
  loadingIndicator: {
    marginTop: px(spacing['2xl']),
  },
  content: {
    paddingHorizontal: px(spacing.xl),
    paddingBottom: px(spacing['2xl']),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: px(spacing.md),
  },
  avatar: {
    width: px(28),
    height: px(28),
    borderRadius: px(radius.md),
    backgroundColor: colors.surface.muted,
    marginRight: px(spacing.md),
  },
  nickname: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: px(fontSize.c1),
    color: colors.text.inverse,
  },
  emoji: {
    fontSize: px(24),
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
