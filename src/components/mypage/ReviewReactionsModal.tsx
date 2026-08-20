import React, {forwardRef, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {BottomSheetModal, BottomSheetFlatList, BottomSheetBackdrop, BottomSheetBackdropProps} from '@gorhom/bottom-sheet';
import FastImage from '@d11/react-native-fast-image';

import {fontFamily, fontSize} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import {EmojiReaction} from '../../api/review';

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
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  handle: {
    backgroundColor: colors.gray[600],
    width: 40,
  },
  loadingIndicator: {
    marginTop: spacing['2xl'],
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    backgroundColor: colors.surface.muted,
    marginRight: spacing.md,
  },
  nickname: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.c1,
    color: colors.text.inverse,
  },
  emoji: {
    fontSize: 24,
    marginLeft: spacing.md,
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.b5,
    color: colors.text.disabled,
    textAlign: 'center',
    paddingTop: spacing['2xl'],
  },
});
