import {Dimensions} from 'react-native';

// 조각 촬영/인식 화면이 쓰는 사진 프레임 크기.
// 두 화면의 비율이 어긋나면 미리보기에서 잡은 화각과 결과 화각이 달라지므로
// (카메라 프리뷰도, 인식 화면 사진도 cover로 잘려 들어간다) 반드시 같은 값을 쓴다.

// 시안 393x852 기준
const DESIGN_WIDTH = 393;
const DESIGN_HEIGHT = 852;

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// 시안보다 세로로 짧은 기기(SE 등)에서 헤더/하단 컨트롤에 먹히지 않게
// 가로·세로 중 더 빡빡한 쪽에 맞춰 줄인다. 요즘 아이폰은 두 비율이 거의 같아서
// 사실상 가로 기준 환산과 동일하다
const SCALE = Math.min(SCREEN_WIDTH / DESIGN_WIDTH, SCREEN_HEIGHT / DESIGN_HEIGHT);

export const px = (value: number) => value * SCALE;

export const PHOTO_WIDTH = px(329);
export const PHOTO_HEIGHT = px(585);
