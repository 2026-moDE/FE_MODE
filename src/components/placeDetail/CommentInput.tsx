import React, {useEffect, useRef} from 'react';
import {Text, Image, Pressable, StyleSheet, Keyboard} from 'react-native';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import {LiquidGlassView} from 'react-native-liquid-glassmorphism';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';

const sendIcon = require('../../assets/image/send.png');
const checkboxFillIcon = require('../../assets/image/checkbox_fill.png');
const checkboxLineIcon = require('../../assets/image/checkbox_line.png');

type Props = {
    onSubmit: (text: string) => void;
    placeholder?: string;
    // 전체 공개 / 친구 공개에서의 textinput
    variant?: 'default' | 'compact';
    // 친구 공개의 비밀 댓글 체크 박스
    showSecretCheckbox?: boolean;
    isSecret?: boolean;
    onToggleSecret?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
};

// 댓글/답글 공용 입력창 (친구공개 체크박스 + 텍스트인풋 + 전송 버튼)
// 비제어(uncontrolled) TextInput - value를 매 글자마다 강제로 넣으면 안드로이드 한글 깨지는 오류
export default function CommentInput({
    onSubmit,
    placeholder = '내용을 입력하세요',
    variant = 'default',
    showSecretCheckbox,
    isSecret,
    onToggleSecret,
    onFocus,
    onBlur,
}: Props) {
    const isCompact = variant === 'compact';
    const inputRef = useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);
    const textRef = useRef('');

    // 시트를 드래그해서 닫거나 뒤로가기로 키보드를 내리면 TextInput의 onBlur가 안 불릴 수 있어서 직접 감지
    // 단, .blur()를 직접 호출하면 BottomSheetTextInput의 내부 키보드 추적과 어긋나서 시트가 덜 재정렬되는 문제가 있어 포커스 상태만 읽고 콜백만 호출
    useEffect(() => {
        const sub = Keyboard.addListener('keyboardDidHide', () => {
            if (inputRef.current?.isFocused?.()) {
                onBlur?.();
            }
        });
        return () => sub.remove();
    }, [onBlur]);

    const handleSubmit = () => {
        const trimmed = textRef.current.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
        textRef.current = '';
        inputRef.current?.clear();
    };

    return (
        <LiquidGlassView variant="regular" borderRadius={radius.lg} dim={0.35} style={styles.row}>
            {showSecretCheckbox && (
                <Pressable style={styles.secretToggle} onPress={onToggleSecret} hitSlop={8}>
                    <Image
                        source={isSecret ? checkboxFillIcon : checkboxLineIcon}
                        style={styles.checkbox}
                        resizeMode="contain"
                    />
                    <Text style={styles.secretToggleText}>친구 공개</Text>
                </Pressable>
            )}
            <BottomSheetTextInput
                ref={inputRef}
                style={[styles.input, isCompact && styles.inputCompact]}
                defaultValue=""
                onChangeText={text => {
                    textRef.current = text;
                }}
                placeholder={placeholder}
                placeholderTextColor={colors.text.disabled}
                onFocus={onFocus}
                onBlur={onBlur}
                multiline
            />
            <Pressable hitSlop={10} onPress={handleSubmit}>
                <Image
                    source={sendIcon}
                    style={isCompact ? styles.sendIconCompact : styles.sendIcon}
                    resizeMode="contain"
                />
            </Pressable>
        </LiquidGlassView>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.sm,
        paddingHorizontal: padding.md,     // 12
    },
    input: {
        ...typography.b6,
        flex: 1,
        color: colors.text.inverse,
        paddingVertical: padding.sm,       // 10
        maxHeight: 100,
    },
    inputCompact: {
        ...typography.c2,
    },
    secretToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.xs,
    },
    checkbox: {
        width: 16,
        height: 16,
    },
    secretToggleText: {
        ...typography.c3,
        color: colors.text.inverse,
    },
    sendIcon: {
        width: 20,
        height: 20,
    },
    sendIconCompact: {
        width: 12,
        height: 12,
    },
});
