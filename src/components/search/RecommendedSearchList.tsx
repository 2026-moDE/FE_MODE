import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// 추천 검색어 // 근데 아직 api 없긴 해
type RecommendedItem = {
    id: number;
    keyword: string;
    type: 'hot' | 'normal'; // hot → 주황 핀, normal → 파란 핀
};

type Props = {
    items: RecommendedItem[];
    onSelect: (keyword: string) => void;
};

export default function RecommendedSearchList({ items, onSelect }: Props) {

    if (items.length === 0) return null;

    return (
        <View style={styles.container}>

            {/* 섹션 제목 */}
            <Text style={styles.title}>추천 검색어</Text>

            {/* 칩 목록 */}
            <View style={styles.chipList}>
                {items.map(item => (
                    <TouchableOpacity
                        key={String(item.id)}
                        style={styles.chip}
                        onPress={() => onSelect(item.keyword)}
                    >
                        {/* 핀 아이콘 → hot이면 주황, normal이면 파란색 */}
                        <Text style={styles.pinIcon}>
                            {item.type === 'hot' ? '🔥' : '📍'}
                        </Text>

                        <Text style={styles.chipText}>{item.keyword}</Text>

                    </TouchableOpacity>
                ))}
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222',
        marginBottom: 12,
    },
    chipList: {
        flexDirection: 'row',   // 가로로 나열
        flexWrap: 'wrap',       // 넘치면 다음 줄로
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',  // 연한 파란색 배경
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 4,
    },
    pinIcon: {
        fontSize: 12,
    },
    chipText: {
        fontSize: 14,
        color: '#222',
    },
});
