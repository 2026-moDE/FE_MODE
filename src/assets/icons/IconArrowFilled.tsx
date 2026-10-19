import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import {Svg, Path} from 'react-native-svg';

type Props = {
  width?: number;
  height?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

// 시안 weui:arrow-filled - 약관 목록 오른쪽 화살표
export default function IconArrowFilled({width = 8, height = 16, color = '#4B566D', style}: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 8 16" fill="none" style={style}>
      <Path
        d="M6.77133 8.474L3 12.2453L2.05733 11.3027L5.35733 8.00267L2.05733 4.70267L3 3.76L6.77133 7.53133C6.89631 7.65635 6.96652 7.82589 6.96652 8.00267C6.96652 8.17944 6.89631 8.34898 6.77133 8.474Z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill={color}
      />
    </Svg>
  );
}
