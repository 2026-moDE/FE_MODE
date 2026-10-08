import React from 'react';
import {View, StyleSheet, type GestureResponderEvent} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';

// 시안(node 1799:3353)의 blur-volume 컴포넌트.
// 5개 상태(00/25/50/75/100)가 전부 같은 쐐기 위에서 흰 원만 20씩 움직이는 거라,
// 에셋 5장 대신 원의 y만 바꾼다
const VIEW_WIDTH = 28;
const VIEW_HEIGHT = 108.252;

// 아래로 갈수록 가늘어지는 반투명 쐐기 (위가 큰 브러쉬)
const WEDGE_PATH =
  'M15.9945 102.401C15.8095 104.869 12.1907 104.869 12.0057 102.401L5.50101 15.6499C5.41401 14.4897 6.33192 13.5004 7.49541 13.5004L20.5048 13.5004C21.6683 13.5004 22.5862 14.4897 22.4992 15.6499L15.9945 102.401Z';

const KNOB_RADIUS = 10;
const KNOB_CX = VIEW_WIDTH / 2;
// 가장 작은 단계(아래)에서 가장 큰 단계(위)까지 한 칸에 20씩
const KNOB_CY_MIN_LEVEL = 94;
const KNOB_CY_STEP = 20;

export const BRUSH_LEVEL_COUNT = 5;

// 손가락 위치를 단계로 바꿀 때 쓰는 노브 이동 구간 (전체 높이 대비 비율)
const TRAVEL_TOP_RATIO = (KNOB_CY_MIN_LEVEL - (BRUSH_LEVEL_COUNT - 1) * KNOB_CY_STEP) / VIEW_HEIGHT;
const TRAVEL_BOTTOM_RATIO = KNOB_CY_MIN_LEVEL / VIEW_HEIGHT;

// 가로로는 쐐기가 얇아서 그대로 두면 누르기 어렵다 - 터치 영역만 넓힌다
const MIN_TOUCH_WIDTH = 44;

type Props = {
  // 0 = 가장 작은 브러쉬, 4 = 가장 큰 브러쉬
  level: number;
  onChangeLevel: (level: number) => void;
  width: number;
  height: number;
};

export default function BlurBrushSizeSlider({
  level,
  onChangeLevel,
  width,
  height,
}: Props) {
  const knobCy = KNOB_CY_MIN_LEVEL - level * KNOB_CY_STEP;

  const handleTouch = (event: GestureResponderEvent) => {
    const ratio =
      (event.nativeEvent.locationY / height - TRAVEL_TOP_RATIO) /
      (TRAVEL_BOTTOM_RATIO - TRAVEL_TOP_RATIO);

    // 위로 갈수록 큰 단계
    const next = Math.round((1 - ratio) * (BRUSH_LEVEL_COUNT - 1));
    const clamped = Math.min(Math.max(next, 0), BRUSH_LEVEL_COUNT - 1);

    if (clamped !== level) {
      onChangeLevel(clamped);
    }
  };

  return (
    <View
      style={[styles.touchArea, {width: Math.max(width, MIN_TOUCH_WIDTH), height}]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}>
      <Svg width={width} height={height} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
        <Path d={WEDGE_PATH} fill="white" fillOpacity={0.5} />
        <Circle cx={KNOB_CX} cy={knobCy} r={KNOB_RADIUS} fill="white" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
