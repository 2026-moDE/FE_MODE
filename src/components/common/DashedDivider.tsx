import React, {useState} from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import Svg, {Line} from 'react-native-svg';

import {colors} from '../../constants/colors';

// 시안(node 3119:10920) 361 너비에 3.008 칠하고 3.008 비움
const DASH_PERIOD = 6;

type Props = {
  style?: StyleProp<ViewStyle>;
};

// 시안 점선은 양 끝이 반 칸짜리 선으로 끝나서 좌우가 대칭이다.
// 화면 너비가 달라도 그렇게 끝나도록 칸 수를 정수로 맞추고 반 칸만큼 밀어서 그린다
export default function DashedDivider({style}: Props) {
  const [width, setWidth] = useState(0);

  const period = width / Math.max(Math.round(width / DASH_PERIOD), 1);

  return (
    <View
      style={[styles.container, style]}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={1}>
          <Line
            x1={0}
            y1={0.5}
            x2={width}
            y2={0.5}
            stroke={colors.divider.strong}
            strokeWidth={1}
            strokeDasharray={[period / 2, period / 2]}
            strokeDashoffset={period / 4}
          />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 1,
  },
});
