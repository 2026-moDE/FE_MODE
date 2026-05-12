import React, { useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Text,
} from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import IconSearch from '../../assets/icons/IconSearch';

// SearchBar가 받을 props 타입 정의
type Props = {
    logoIcon?: React.ReactNode;       // 로고 아이콘
    value: string;                    // 현재 입력된 텍스트
    onChangeText: (text: string) => void; // 텍스트 바뀔 때 호출
    onSubmit?: () => void;            // 검색 버튼 누르거나 엔터 눌렀을 때
    onFocus?: () => void;             // 검색창 클릭했을 때
    onClear?: () => void;             // X 버튼 눌렀을 때
    placeholder?: string;             // 힌트 텍스트
    autoFocus?: boolean;              // 화면 열리자마자 키보드 올릴지
};

export default function SearchBar({
    logoIcon,
    value,
    onChangeText,
    onSubmit,
    onFocus,
    onClear,
    placeholder = '후기를 쓸 장소를 입력해주세요',
    autoFocus = false,
}: Props) {

    // TextInput을 직접 제어하기 위한 ref (포커스 등)
    const inputRef = useRef<TextInput>(null);

    // X 버튼 눌렀을 때 → 텍스트 비우고 onClear 호출
    const handleClear = () => {
        onChangeText('');
        onClear?.();
        inputRef.current?.focus(); // 지우고 나서도 키보드 유지
    };

    return (
        <View style={styles.container}>

            {/* 로고 아이콘 있으면 표시 */}
            {logoIcon && logoIcon}

            {/* 텍스트 입력창 */}
            <TextInput
                ref={inputRef}
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                onSubmitEditing={onSubmit}
                onFocus={onFocus}
                placeholder={placeholder}
                placeholderTextColor={colors.text.disabled}
                returnKeyType="search"
                autoFocus={autoFocus}
                autoCorrect={false}
                autoCapitalize="none"
            />

            {/* value 있으면 X버튼도 표시 */}
            {value.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.iconButton}>
                    <Text style={styles.clearText}>✕</Text>
                </TouchableOpacity>
            )}

            {/* 돋보기는 항상 표시 */}
            <IconSearch size={16} color={colors.icon.tertiary} />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface.default,  // #F1F1F4
        borderRadius: radius.lg,                  // 12
        paddingHorizontal: spacing.lg,            // 16
        paddingVertical: spacing.s,               // 8
        gap: spacing.sm,
        height: 40,
        width: 317,
        elevation: 4,                              // Android
        shadowColor: '#000000',                    // iOS
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    input: {
        flex: 1,
        ...typography.b3,          // fontFamily, fontSize: 12, lineHeight: 16
        color: colors.text.basic,  // #111114
        padding: 0,
    },
    iconButton: {
        padding: 4,
        marginLeft: 4,
    },
    clearText: {
        fontSize: 14,
        color: colors.text.tertiary,  // #5C5D68
    },
});
