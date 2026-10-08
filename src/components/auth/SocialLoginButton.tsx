import React from 'react';
import {Pressable, View, Text, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import {fontFamily} from '../../constants/typography';
import {radius} from '../../constants/radius';
import {gap} from '../../constants/spacing';

type Props = {
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
    disabled?: boolean;
    backgroundColor: string;
    textColor: string;
    borderColor?: string;
    style?: StyleProp<ViewStyle>;
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
}: Props) {
    return (
        <Pressable
            style={({pressed}) => [
                styles.button,
                {backgroundColor},
                borderColor ? {borderColor, borderWidth: 1} : null,
                pressed && styles.pressed,
                disabled && styles.pressed,
                style,
            ]}
            onPress={onPress}
            disabled={disabled}>
            <View style={[styles.content]}>
                <View style={styles.iconWrapper}>{icon}</View>
                <Text
                    style={[styles.label, {color: textColor}]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {label}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        height: 54,
        borderRadius: radius.lg,
        paddingHorizontal: 14,
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
        marginRight: gap.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },

    label: {
        fontFamily: fontFamily.medium,
        fontSize: 16,
        letterSpacing: 0,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
});
