import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import {Svg, Path} from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export default function IconCheck({size = 20, color = '#A3A3AA', style}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Path
        d="M7.5 12.9915L3.925 9.4165L2.75 10.5915L6.91667 14.7582C7.08333 14.9248 7.29167 14.9998 7.50833 14.9998C7.725 14.9998 7.93333 14.9165 8.1 14.7582L17.2667 5.5915L16.0917 4.4165L7.51667 12.9915H7.5Z"
        fill={color}
      />
    </Svg>
  );
}
