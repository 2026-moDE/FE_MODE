import React from 'react';
import {StyleSheet, Image, View} from 'react-native';
import {
  Canvas,
  Fill,
  ImageShader,
  Shader,
  Skia,
  useImage,
} from '@shopify/react-native-skia';

import {colors} from '../../constants/colors';

// 시안(아카이빙-01) 인식 성공 화면.
// - 사진 전체는 60% 불투명도로 어둡게 깔고, 피사체 영역만 원래 밝기로 둔다 (Skia 셰이더 + 마스크)
// - 그 위에 네이티브가 만든 윤곽선 이미지를 흰색으로 겹친다.
//   (시안은 점선이지만, 마스크에서 경계 방향을 알 수 없어 우선 실선으로 둔다)
// 마스크·윤곽선 모두 원본 사진과 같은 크기라 같은 cover 배치로 겹치면 정확히 맞는다.
const source = Skia.RuntimeEffect.Make(`
uniform shader photo;
uniform shader mask;

const float DIM_OPACITY = 0.6;

half4 main(float2 xy) {
  half4 color = photo.eval(xy);

  if (mask.eval(xy).r < 0.5) {
    return color * DIM_OPACITY;
  }

  return color;
}
`);

type Props = {
  uri: string;
  maskUri?: string;
  outlineUri?: string;
  width: number;
  height: number;
  borderRadius: number;
};

export default function SubjectHighlightPhoto({
  uri,
  maskUri,
  outlineUri,
  width,
  height,
  borderRadius,
}: Props) {
  const photo = useImage(uri);
  const mask = useImage(maskUri ?? null);

  const rect = {x: 0, y: 0, width, height};
  const frameStyle = {width, height, borderRadius};

  // 마스크가 없거나(네이티브 실패) Skia가 아직 못 읽었으면 어둡게 깔지 않고 사진만 보여준다
  const canDim = photo != null && mask != null && source != null;

  return (
    <View style={[styles.frame, frameStyle]}>
      {canDim ? (
        <Canvas style={{width, height}}>
          <Fill>
            <Shader source={source}>
              <ImageShader image={photo} fit="cover" rect={rect} />
              <ImageShader image={mask} fit="cover" rect={rect} />
            </Shader>
          </Fill>
        </Canvas>
      ) : (
        <Image source={{uri}} style={styles.fill} />
      )}

      {outlineUri != null && (
        <Image source={{uri: outlineUri}} style={[styles.fill, styles.outline]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },

  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
  },

  outline: {
    tintColor: colors.icon.inverse,
  },
});
