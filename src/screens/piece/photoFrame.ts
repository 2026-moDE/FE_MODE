import {Dimensions} from 'react-native';
import {initialWindowMetrics} from 'react-native-safe-area-context';

// 조각 촬영/인식 화면이 쓰는 사진 프레임 크기.
// 두 화면의 비율이 어긋나면 미리보기에서 잡은 화각과 결과 화각이 달라지므로
// (카메라 프리뷰도, 인식 화면 사진도 cover로 잘려 들어간다) 반드시 같은 값을 쓴다.

// 시안 393x852 기준
const DESIGN_WIDTH = 393;
// 시안 높이에서 상단(상태바, 헤더 시작 50)과 하단(홈 바 34)을 뺀 콘텐츠 높이.
// 기기 쪽도 safe area를 뺀 높이와 비교해야, 상태바·내비게이션 바가 큰 안드로이드에서
// 사진이 과하게 줄어들지 않는다
const DESIGN_CONTENT_HEIGHT = 852 - 50 - 34;

const window = Dimensions.get('window');
const frame = initialWindowMetrics?.frame;
const insets = initialWindowMetrics?.insets;

const SCREEN_WIDTH = frame?.width ?? window.width;
const CONTENT_HEIGHT =
  (frame?.height ?? window.height) - (insets?.top ?? 0) - (insets?.bottom ?? 0);

// 시안보다 세로로 짧은 기기(SE 등)에서 헤더/하단 컨트롤에 먹히지 않게
// 가로·세로 중 더 빡빡한 쪽에 맞춰 줄인다. 대부분 기기는 가로 기준 환산과 같다
const SCALE = Math.min(
  SCREEN_WIDTH / DESIGN_WIDTH,
  CONTENT_HEIGHT / DESIGN_CONTENT_HEIGHT,
);

export const px = (value: number) => value * SCALE;

export const PHOTO_WIDTH = px(329);
export const PHOTO_HEIGHT = px(585);
