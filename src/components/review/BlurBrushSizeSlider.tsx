import React, {useRef} from 'react';
import {View, StyleSheet, type GestureResponderEvent} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';

// 시안(node 1799:3353)의 blur-volume 컴포넌트.
// 5개 상태(00/25/50/75/100)가 전부 같은 쐐기 위에서 흰 원만 20씩 움직이는 거라,
// 에셋 5장 대신 원의 y만 바꾼다
// 시안 1px = viewBox 1. 쐐기(17 x 90.75)를 기준으로 위아래·좌우에 노브가 넘칠 여백을 둔 크기
export const VIEW_WIDTH = 28;
export const VIEW_HEIGHT = 108.252;
// 쐐기 아래 끝 ~ viewBox 아래 끝 여백 (시안 위치를 맞출 때 쓴다)
export const VIEW_BOTTOM_PADDING = VIEW_HEIGHT - 104.2515;

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

  // locationY는 손가락 아래에 있는 뷰 기준이라, 손가락이 슬라이더 밖으로 나가면 엉뚱한 값이 된다.
  // 누른 순간의 locationY/pageY를 기억해 두고 이후엔 pageY 이동량으로만 계산한다
  const touchStartRef = useRef({locationY: 0, pageY: 0});

  const applyY = (y: number) => {
    const ratio =
      (y / height - TRAVEL_TOP_RATIO) / (TRAVEL_BOTTOM_RATIO - TRAVEL_TOP_RATIO);

    // 위로 갈수록 큰 단계
    const next = Math.round((1 - ratio) * (BRUSH_LEVEL_COUNT - 1));
    const clamped = Math.min(Math.max(next, 0), BRUSH_LEVEL_COUNT - 1);

    if (clamped !== level) {
      onChangeLevel(clamped);
    }
  };

  const handleGrant = (event: GestureResponderEvent) => {
    const {locationY, pageY} = event.nativeEvent;
    touchStartRef.current = {locationY, pageY};
    applyY(locationY);
  };

  const handleMove = (event: GestureResponderEvent) => {
    const start = touchStartRef.current;
    applyY(start.locationY + (event.nativeEvent.pageY - start.pageY));
  };

  return (
    <View
      style={[styles.touchArea, {width: Math.max(width, MIN_TOUCH_WIDTH), height}]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      // 드래그 중에 다른 뷰가 터치를 가져가지 못하게 한다
      onResponderTerminationRequest={() => false}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}>
      {/* Svg가 터치 대상이 되면 locationY 기준이 바뀌므로 터치는 바깥 View만 받는다 */}
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        pointerEvents="none">
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
