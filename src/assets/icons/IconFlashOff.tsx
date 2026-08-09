import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Svg, Path} from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

export default function IconFlashOff({size = 24, color = '#ffffff'}: Props) {
    return (
        <View style={[styles.container, {width: size, height: size}]}>
            <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                <Path
                    d="M17.9564 22.5135L12.0599 29.9734C11.5661 30.5658 10.6063 30.1257 10.7327 29.365L13.1624 19.4646C13.2391 19.0037 12.8836 18.5838 12.4163 18.5838H6.41534C5.77413 18.5838 5.42391 17.8362 5.83429 17.3435L8.97882 13.5359L17.9564 22.5135ZM5.07745 5.62381C5.44669 5.25484 6.04523 5.25467 6.41437 5.62381L25.3226 24.533C25.6918 24.9022 25.6918 25.5007 25.3226 25.8699C24.9533 26.2389 24.3548 26.239 23.9857 25.8699L5.07745 6.96072C4.70823 6.5915 4.70823 5.99303 5.07745 5.62381ZM18.4876 2.0281C18.9815 1.43547 19.9416 1.87556 19.8148 2.6365L17.2376 12.031C17.1611 12.4918 17.5166 12.9117 17.9837 12.9119H23.9857C24.6266 12.9122 24.977 13.6596 24.5667 14.1521L21.4974 18.034L12.6077 9.14334L18.4876 2.0281Z"
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
