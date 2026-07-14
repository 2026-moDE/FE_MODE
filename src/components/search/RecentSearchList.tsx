import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SearchHistory } from '../../types/search';

type Props = {
    history: SearchHistory[];
    onSelect: (keyword: string) => void;
    onDelete: (id: number) => void;
};

export default function RecentSearchList({ history, onSelect, onDelete }: Props) {

    if (!history || history.length === 0) return null;

    return (
        <View style={styles.container}>

            {/* 제목 */}
            <Text style={styles.title}>최근 검색어</Text>

            {/* 칩 목록 → 가로로 나열하다가 넘치면 다음 줄로 */}
            <View style={styles.chipList}>
                {history.slice(0, 5).map(item => (
                    <View key={String(item.id)} style={styles.chip}>

                        {/* 검색어 텍스트 → 누르면 검색 실행 */}
                        <TouchableOpacity onPress={() => onSelect(item.keyword)}>
                            <Text style={styles.chipText}>{item.keyword}</Text>
                        </TouchableOpacity>

                        {/* X 버튼 → 누르면 삭제 */}
                        <TouchableOpacity
                            onPress={() => onDelete(item.id)}
                            style={styles.deleteButton}
                        >
                            <Text style={styles.deleteText}>✕</Text>
                        </TouchableOpacity>

                    </View>
                ))}
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 20,
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
        gap: 8,                 // 칩 사이 간격
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    chipText: {
        fontSize: 14,
        color: '#222',
    },
    deleteButton: {
        marginLeft: 6,
    },
    deleteText: {
        fontSize: 12,
        color: '#999',
    },
});
