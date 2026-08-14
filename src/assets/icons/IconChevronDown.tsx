import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import {Svg, Path} from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export default function IconChevronDown({size = 24, color = '#000000', style}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d="M6 9L12 15L18 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
