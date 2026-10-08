import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Svg, Polygon} from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
    filled?: boolean;
};

export default function IconStar({size = 16, color = '#4B566D', filled = true}: Props) {
    return (
        <View style={[styles.container, {width: size, height: size}]}>
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <Polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                    fill={filled ? color : 'none'}
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
