import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import IconClock from '../../assets/icons/IconClock';
import { SearchHistory } from '../../types/search';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontSize } from '../../constants/typography';

type Props = {
    history: SearchHistory[];
    onSelect: (keyword: string) => void;
    onDelete: (keyword: string) => void;
    onDeleteAll: () => void;
};

export default function RecentSearchList({ history, onSelect, onDelete, onDeleteAll }: Props) {

    if (!history || history.length === 0) return null;

    return (
        <View style={styles.container}>

            {/* 제목 + 전체 삭제 */}
            <View style={styles.header}>
                <Text style={styles.title}>최근 검색</Text>
                <TouchableOpacity onPress={onDeleteAll} hitSlop={10}>
                    <Text style={styles.clearAll}>전체 삭제</Text>
                </TouchableOpacity>
            </View>

            {/* 목록 → 한 줄에 클럭 아이콘 + 검색어 + X버튼 (터치 요소 중첩 방지를 위해 형제로 배치) */}
            {history.slice(0, 5).map(item => (
                <View key={String(item.id)} style={styles.row}>
                    <TouchableOpacity
                        style={styles.rowLeft}
                        activeOpacity={0.7}
                        onPress={() => onSelect(item.keyword)}
                    >
                        <IconClock size={20} color={colors.icon.tertiary} />
                        <Text style={styles.keyword} numberOfLines={1}>{item.keyword}</Text>
                    </TouchableOpacity>

                    {/* X 버튼 → 누르면 이 검색어만 삭제 */}
                    <TouchableOpacity onPress={() => onDelete(item.keyword)} hitSlop={10}>
                        <Text style={styles.deleteText}>✕</Text>
                    </TouchableOpacity>
                </View>
            ))}

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.s,
    },
    title: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.b6,
        color: colors.text.basic,
    },
    clearAll: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.b6,
        color: colors.text.tertiary,
    },
    row: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
        marginRight: spacing.sm,
    },
    keyword: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.b4,
        color: colors.text.basic,
        flexShrink: 1,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    deleteText: {
        fontSize: 20,
        lineHeight: 20,
        color: colors.icon.tertiary,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
});
