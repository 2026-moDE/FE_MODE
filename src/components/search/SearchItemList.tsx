import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Suggestion } from '../../types/autocomplete';
import IconSearch from '../../assets/icons/IconSearch';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';

type Props = {
    suggestions: Suggestion[];
    onSelect: (keyword: string) => void;
};

export default function SearchItemList({ suggestions, onSelect }: Props) {

    if (!suggestions || suggestions.length === 0) return null;

    return (
        <View>
            {suggestions.map((item, index) => (
                <TouchableOpacity
                    key={item.id != null ? String(item.id) : `suggestion-${index}`}
                    style={styles.item}
                    onPress={() => onSelect(item.name)}
                >
                    {/* 돋보기 아이콘 */}
                    <IconSearch size={16} color={colors.icon.tertiary} />

                    {/* 자동완성 텍스트 */}
                    <Text style={styles.text}>{item.name}</Text>

                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing['3xl'],  // 32
        paddingVertical: spacing.lg,        // 16
        gap: spacing.md,                    // 12
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    text: {
        ...typography.b4,
        color: colors.text.basic,
    },
});
