import React from 'react';
import {View, StyleSheet} from 'react-native';
import {radius} from '../../constants/radius';

// 지도 버블 공통 치수 - LiveBubble(장소)과 ClusterBubble(묶음)이 같은 모양이어야 해서 여기서 같이 쓴다
export const BUBBLE_SIZE = 60;
export const TAIL_HEIGHT = 16;
export const TAIL_WIDTH = 12;
export const TOTAL_HEIGHT = BUBBLE_SIZE + TAIL_HEIGHT;

// 그림자가 번져 나갈 거리와 아래로 떨어지는 양
const SHADOW_SPREAD = 9;
const SHADOW_DY = 2;

// 마커는 선언한 width/height 크기의 비트맵으로 잘려서 그 밖은 사라짐 - 버블 둘레에 그림자 여백을 확보한다
export const MARKER_PAD = SHADOW_SPREAD + SHADOW_DY;
export const MARKER_WIDTH = BUBBLE_SIZE + MARKER_PAD * 2;
export const MARKER_HEIGHT = TOTAL_HEIGHT + MARKER_PAD * 2;

// 여백이 생겨도 꼬리 끝이 좌표를 가리키게 앵커를 보정 (안 하면 버블이 여백만큼 위로 밀림)
export const MARKER_ANCHOR = {x: 0.5, y: (TOTAL_HEIGHT + MARKER_PAD) / MARKER_HEIGHT};

// 바깥으로 갈수록 겹치는 장수가 줄어서 자연스럽게 연해진다 (테두리 옆 0.40 → 가장자리 0.08)
// 간격은 1.5px 고정 - SHADOW_SPREAD를 넓힐 때 간격까지 벌어지면 그림자에 띠가 보인다
//
// 장수를 줄이면(간격 ↑) 마커를 구울 때 합성할 View가 줄어서 조금 빨라지긴 한다.
// 실제로 3px(3장)까지 줄여봤는데 실기기에서 띠가 눈에 띄게 보였다 - 농도를 맞춰도(장당 알파를 올려도)
// 경계가 또렷해져서 안 된다. 아낀 비용도 미미했으니 다시 시도하지 말 것.
const SHADOW_GAP = 1.5;
const SHADOW_STEPS = Array.from(
    {length: Math.round(SHADOW_SPREAD / SHADOW_GAP)},
    (_, i) => (i + 1) * SHADOW_GAP,
);
// 레이어 한 장의 불투명도 - #RRGGBBAA로 붙이려고 16진수로 둔다 (0x15 / 255 ≒ 0.08)
// 장수가 겹쳐 누적되므로(1-(1-0.08)^6 ≒ 0.40) SHADOW_SPREAD를 바꾸면 여기도 같이 봐야 한다 -
// 안 그러면 범위가 넓어지는 게 아니라 그림자가 진해진다
const SHADOW_ALPHA = '15';

/**
 * 버블 뒤에 깔리는 그림자. 색은 버블 테두리(혼잡도 색)와 같게 맞춘다.
 *
 * color가 null이면 아무것도 안 그린다 - 테두리가 흰색인 버블(혼잡도 없는 장소, 묶음)은
 * 그림자도 흰색이 되어 밝은 지도에선 어차피 안 보이기 때문.
 *
 * elevation(안드)·boxShadow(iOS)를 쓰지 않는 이유: 마커는 자식 View를 네이티브가 비트맵으로 구워서
 * 지도에 올리는데, 안드는 소프트웨어 canvas로 draw해서 elevation 그림자가 안 찍히고, iOS의 boxShadow는
 * CAShapeLayer 마스크로 구현돼 있어서 layer.renderInContext가 건너뛴다.
 * 그래서 실제로 그려지는 배경색 레이어를 겹쳐 그림자를 만든다 - 두 플랫폼 다 비트맵에 그대로 남는다.
 */
export function BubbleShadow({color}: {color: string | null}) {
    if (!color) return null;

    // 테두리 색은 전부 #RRGGBB 형태 - 알파를 붙여 #RRGGBBAA로 쓴다
    const layerColor = `${color}${SHADOW_ALPHA}`;

    return (
        <>
            {SHADOW_STEPS.map(spread => (
                <View
                    key={spread}
                    collapsable={false}
                    style={[
                        styles.layer,
                        {
                            top: MARKER_PAD - spread + SHADOW_DY,
                            left: MARKER_PAD - spread,
                            width: BUBBLE_SIZE + spread * 2,
                            height: BUBBLE_SIZE + spread * 2,
                            borderRadius: radius.md + spread,
                            backgroundColor: layerColor,
                        },
                    ]}
                />
            ))}
        </>
    );
}

const styles = StyleSheet.create({
    layer: {
        position: 'absolute',
    },
});
