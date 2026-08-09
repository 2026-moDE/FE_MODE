import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Svg, Path} from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

export default function IconFlashOn({size = 24, color = '#ffffff'}: Props) {
    return (
        <View style={[styles.container, {width: size, height: size}]}>
            <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                <Path
                    d="M24.5664 14.1519C24.977 13.6592 24.6267 12.9113 23.9854 12.9113H17.9841C17.5167 12.9113 17.1612 12.4916 17.238 12.0306L19.8145 2.63601C19.9413 1.87507 18.9812 1.43482 18.4874 2.02745L5.83422 17.3434C5.42369 17.8361 5.774 18.584 6.41527 18.584H12.4166C12.884 18.584 13.2395 19.0037 13.1627 19.4647L10.7328 29.3646C10.6059 30.1255 11.566 30.5658 12.0599 29.9732L24.5664 14.1519Z"
                    fill={color}
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
