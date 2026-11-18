import React, {useEffect} from 'react';
import {StyleSheet, Image, View} from 'react-native';
import {
  Canvas,
  Fill,
  ImageShader,
  Shader,
  Skia,
  useImage,
} from '@shopify/react-native-skia';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// 시안(Figma)의 Lens distortion 셰이더 이펙트를 그대로 옮긴 것.
// 원본 WGSL의 lensDistort()와 같은 식이며, aberrationStrength가 0이라
// 색수차 경로는 빠지고 순수 배럴 왜곡만 남는다.
// 샘플 위치가 이미지 밖으로 나가면 투명을 돌려줘서, 시안처럼 모서리가 안쪽으로 깎여 보인다.
//
// 원본의 Halton(2,3) 4-tap 지터도 같이 옮겼다 - 왜곡이 최대일 때 가장자리 계단이 심해서 필요함.
// 원본은 프리멀티플라이 알파를 풀었다 다시 곱하는데, 입력이 불투명한 사진이라 단순 평균으로 충분하다.
const source = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float2 u_size;
uniform float u_amount;

const float SPREAD = 1.4;

half4 sampleDistorted(float2 tapPos) {
  float2 center = u_size * 0.5;
  float radius = length(u_size) * 0.5;
  float2 centered = tapPos - center;
  float2 norm = centered / radius;
  float d2 = dot(norm, norm);
  float factor = 1.0 + u_amount * (d2 + d2 * d2);
  float2 p = centered * factor + center;

  if (p.x < 0.0 || p.x > u_size.x || p.y < 0.0 || p.y > u_size.y) {
    return half4(0.0);
  }

  return image.eval(p);
}

half4 main(float2 xy) {
  half4 acc = half4(0.0);
  acc += sampleDistorted(xy + float2( 0.0,   0.0     ) * SPREAD);
  acc += sampleDistorted(xy + float2( 0.5,  -0.333333) * SPREAD);
  acc += sampleDistorted(xy + float2(-0.25,  0.333333) * SPREAD);
  acc += sampleDistorted(xy + float2( 0.25, -0.111111) * SPREAD);

  return acc * 0.25;
}
`);

// 시안 키프레임: 0ms에서 0 → 996ms에서 1 → 1999ms에서 다시 0 (총 2000ms 루프).
// 각 구간의 easing은 그 구간이 시작되는 키프레임에 붙은 베지어를 쓴다.
const RISE_DURATION_MS = 996;
const FALL_DURATION_MS = 1004;
const RISE_EASING = Easing.bezier(0.5, 0, 0.5, 1);
const FALL_EASING = Easing.bezier(0.7, -0.4, 0.4, 1.4);

type Props = {
  uri: string;
  width: number;
  height: number;
  // false면 왜곡 없이 정지 상태로 둔다
  animating: boolean;
  // animating=false일 때 고정 왜곡 강도 (기본 0 = 왜곡 없음)
  staticAmount?: number;
};

export default function DistortedPhoto({uri, width, height, animating, staticAmount = 0}: Props) {
  const image = useImage(uri);
  const amount = useSharedValue(0);

  useEffect(() => {
    if (!animating) {
      amount.value = staticAmount;
      return;
    }

    amount.value = withRepeat(
      withSequence(
        withTiming(1, {duration: RISE_DURATION_MS, easing: RISE_EASING}),
        withTiming(0, {duration: FALL_DURATION_MS, easing: FALL_EASING}),
      ),
      -1,
    );
  }, [amount, animating]);

  const uniforms = useDerivedValue(
    () => ({
      u_size: [width, height],
      u_amount: amount.value,
    }),
    [width, height],
  );

  // Skia가 아직 파일을 못 읽었거나 셰이더 컴파일이 실패했을 때 화면이 비지 않도록
  // 평범한 Image로 받쳐둔다 (왜곡만 빠지고 플로우는 그대로 진행됨)
  if (image == null || source == null) {
    return (
      <View style={{width, height}}>
        <Image source={{uri}} style={styles.fallback} />
      </View>
    );
  }

  return (
    <Canvas style={{width, height}}>
      <Fill>
        <Shader source={source} uniforms={uniforms}>
          <ImageShader
            image={image}
            fit="cover"
            rect={{x: 0, y: 0, width, height}}
          />
        </Shader>
      </Fill>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  fallback: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
