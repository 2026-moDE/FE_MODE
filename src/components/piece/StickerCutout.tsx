import React, {useState} from 'react';
import {StyleSheet, Image as RNImage, View} from 'react-native';
import {
  Canvas,
  ColorMatrix,
  Image,
  Morphology,
  useImage,
} from '@shopify/react-native-skia';

// 배경이 투명한 조각 PNG에 시안처럼 흰색 스티커 테두리를 두른다.
// 조각을 흰색으로 칠해 테두리 두께만큼 부풀린(dilate) 걸 아래에 깔고, 그 위에 원본을 얹는다.
// 두께가 화면(dp) 기준이라 조각 원본 해상도와 상관없이 일정하다.

// 시안 조각 테두리 (Vector 75, 흰색 3px)
const DEFAULT_BORDER_WIDTH = 3;

// RGB는 전부 1(흰색)로, 알파는 그대로 두는 색 행렬
const WHITE_MATRIX = [
  0, 0, 0, 0, 1,
  0, 0, 0, 0, 1,
  0, 0, 0, 0, 1,
  0, 0, 0, 1, 0,
];

type Props = {
  uri: string;
  borderWidth?: number;
};

// 부모 영역을 꽉 채우고, 조각은 그 안에 contain으로 놓인다
export default function StickerCutout({
  uri,
  borderWidth = DEFAULT_BORDER_WIDTH,
}: Props) {
  const image = useImage(uri);
  const [size, setSize] = useState({width: 0, height: 0});

  // 테두리가 영역 밖으로 잘리지 않게 테두리 두께만큼 안쪽에 그린다
  const rect = {
    x: borderWidth,
    y: borderWidth,
    width: Math.max(0, size.width - borderWidth * 2),
    height: Math.max(0, size.height - borderWidth * 2),
  };

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={event => {
        const {width, height} = event.nativeEvent.layout;

        setSize({width, height});
      }}>
      {image == null ? (
        // Skia가 아직 파일을 못 읽었으면 테두리 없이 조각만 보여준다
        <RNImage source={{uri}} style={styles.fallback} />
      ) : (
        size.width > 0 &&
        size.height > 0 && (
          <Canvas style={StyleSheet.absoluteFill}>
            <Image image={image} fit="contain" {...rect}>
              <ColorMatrix matrix={WHITE_MATRIX} />
              <Morphology radius={borderWidth} operator="dilate" />
            </Image>
            <Image image={image} fit="contain" {...rect} />
          </Canvas>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    margin: DEFAULT_BORDER_WIDTH,
    resizeMode: 'contain',
  },
});
