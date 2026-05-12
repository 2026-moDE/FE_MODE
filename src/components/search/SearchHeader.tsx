import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import SearchBar from './SearchBar';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

type Props = {
    value: string;
    onChangeText: (text: string) => void;
    onBack: () => void;
    onSubmit?: () => void;
    onClear?: () => void;
};

export default function SearchHeader({
    value,
    onChangeText,
    onBack,
    onSubmit,
    onClear,
}: Props) {
    return (
        <View style={styles.container}>

            {/* 뒤로가기 버튼 */}
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <IconArrowLeft size={21} color={colors.icon.basic} />
            </TouchableOpacity>

            {/* 검색창 */}
            <View style={styles.searchBarContainer}>
                <SearchBar
                    value={value}
                    onChangeText={onChangeText}
                    onSubmit={onSubmit}
                    onClear={onClear}
                    autoFocus={true}
                />
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface.white,    // #FFFFFF
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default, // #E0E0E4
        padding: spacing.lg,                      // 16
        gap: spacing.md,                          // 12
    },
    backButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBarContainer: {
        flex: 1,
    },
});
