import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
// LegacyFlatList: react-native-gesture-handler가 감싼 FlatList - 바텀시트 안에 중첩된
// 가로 스크롤이라 제스처 인식기가 필요해서 이걸 씀(일반 ScrollView와 같은 이유로 여기서 가져옴).
// 예전엔 ScrollView + .map()으로 항목을 전부 한 번에 마운트해서, 친구 리뷰가 많을 때
// 화면에 안 보이는 것까지 다 그리느라 첫 렌더가 느려지는 문제가 있었음 - FlatList로 바꿔서
// 화면에 보이는 것 위주로만 먼저 그리게 함(가상화)
import {LegacyFlatList as FlatList} from 'react-native-gesture-handler';
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
            <FlatList
                data={items}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.list}
                keyExtractor={item => String(item.id)}
                renderItem={({item}) => <FriendReviewItem item={item} onPress={onPressItem} />}
                // 가로로 몇 개씩 겹쳐 보이는 작은 항목들이라, 처음엔 화면에 보일 만큼만 그리고
                // 나머지는 스크롤하면서 그때그때 그림
                initialNumToRender={6}
                maxToRenderPerBatch={6}
                windowSize={5}
            />
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
