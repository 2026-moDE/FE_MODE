import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

export default function IconArrowLeft({ size = 24, color = '#ffffff' }: Props) {
    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
                <Path
                    d="M10.3333 19.6665L1 10.3332M1 10.3332L10.3333 0.999838M1 10.3332L19.6667 10.3332"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
