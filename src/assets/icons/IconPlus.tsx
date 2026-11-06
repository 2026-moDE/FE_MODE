import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import {Svg, Path} from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export default function IconPlus({size = 20, color = '#A3A3AA', style}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Path
        d="M10 16.6667V10M10 10V3.33333M10 10H16.6667M10 10H3.33333"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
