import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Svg, Circle, Line, Path} from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

export default function IconGlobe({size = 16, color = '#4B566D'}: Props) {
    return (
        <View style={[styles.container, {width: size, height: size}]}>
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
                <Line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2" />
                <Path
                    d="M12 2C14.5 4.5 15.8 8.1 15.8 12C15.8 15.9 14.5 19.5 12 22C9.5 19.5 8.2 15.9 8.2 12C8.2 8.1 9.5 4.5 12 2Z"
                    stroke={color}
                    strokeWidth="2"
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
