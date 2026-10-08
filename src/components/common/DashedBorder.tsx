import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Rect} from 'react-native-svg';

type Props = {
  // 감싸는 쪽의 borderRadius와 같은 값을 넣어야 모서리가 맞는다
  radius: number;
  color: string;
  strokeWidth?: number;
  // [선 길이, 빈 길이]
  dash?: [number, number];
};

// iOS는 borderRadius가 걸려 있으면 borderStyle: 'dashed'를 무시하고 실선으로 그린다.
// 그래서 둥근 점선 테두리는 SVG로 직접 그린다.
//
// 쓰는 쪽에서는 borderWidth/borderStyle/borderColor를 빼고 이 컴포넌트를 마지막 자식으로
// 얹으면 된다 (부모를 꽉 채우는 오버레이라 레이아웃에 영향을 주지 않음).
export default function DashedBorder({
  radius,
  color,
  strokeWidth = 1,
  dash = [4, 4],
}: Props) {
  const [size, setSize] = useState({width: 0, height: 0});

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={event => {
        const {width, height} = event.nativeEvent.layout;

        setSize({width, height});
      }}>
      {size.width > 0 && size.height > 0 && (
        <Svg width={size.width} height={size.height}>
          {/* 선 두께의 절반만큼 안쪽으로 넣어야 부모의 overflow:hidden에 안 잘린다 */}
          <Rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={size.width - strokeWidth}
            height={size.height - strokeWidth}
            rx={radius}
            ry={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={dash}
          />
        </Svg>
      )}
    </View>
  );
}
