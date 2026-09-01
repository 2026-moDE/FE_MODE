import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import FriendReviewItem from './FriendReviewItem';
import {FriendReview} from '../../api/friend';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {spacing, gap} from '../../constants/spacing';

type Props = {
    items: FriendReview[];
    onPressItem?: (item: FriendReview) => void;
};

// 친구도 없거나, 친구가 있어도 최근 리뷰가 없으면 섹션 자체를 숨김
export default function FriendReviewSection({items, onPressItem}: Props) {
    if (items.length === 0) return null;

    return (
        <View>
            <Text style={styles.title}>내 친구가 최근에 작성한 리뷰</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.list}>
                {items.map(item => (
                    <FriendReviewItem key={item.id} item={item} onPress={onPressItem} />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        ...typography.b3,
        color: colors.text.inverse,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,      // 16 - 제목 ↔ 목록
    },
    list: {
        paddingHorizontal: spacing.lg,
        gap: gap.sm,                   // 8 - 항목 사이
    },
});
