import React from 'react';
import {Pressable, View, Text, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import {fontFamily} from '../../constants/typography';

type Props = {
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
    disabled?: boolean;
    backgroundColor: string;
    textColor: string;
    borderColor?: string;
    style?: StyleProp<ViewStyle>;
    // 디자인 기준 프레임 너비(393) 대비 실기기 화면 너비 비율.
    // 목업 이미지에 적용하는 scale과 동일한 값을 넘겨받아 버튼 크기도 같은 비율로 맞춘다.
    scale?: number;
};

export default function SocialLoginButton({
    label,
    icon,
    onPress,
    disabled,
    backgroundColor,
    textColor,
    borderColor,
    style,
    scale = 1,
}: Props) {
    return (
        <Pressable
            style={({pressed}) => [
                styles.button,
                {
                    backgroundColor,
                    height: 45 * scale,
                    borderRadius: 6 * scale,
                    paddingHorizontal: 14 * scale,
                },
                borderColor ? {borderColor, borderWidth: 1} : null,
                pressed && styles.pressed,
                disabled && styles.pressed,
                style,
            ]}
            onPress={onPress}
            disabled={disabled}>
            <View style={[styles.content]}>
                <View style={[styles.iconWrapper, {marginRight: 6 * scale}]}>{icon}</View>
                <Text
                    style={[
                        styles.label,
                        {
                            color: textColor,
                            fontSize: 15 * scale,
                            lineHeight: 22 * scale,
                        },
                    ]}>
                    {label}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    pressed: {
        opacity: 0.75,
    },

    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    label: {
        fontFamily: fontFamily.bold,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
});
