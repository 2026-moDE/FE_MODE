import {NativeModules} from 'react-native';

// ios/moing/SubjectExtractorModule.m
// android/app/src/main/java/com/moing/subjectextractor/SubjectExtractorModule.kt
type SubjectExtractorNativeModule = {
  isAvailable(): Promise<boolean>;
  extract(imagePath: string): Promise<ExtractedSubject>;
};

const nativeModule: SubjectExtractorNativeModule | undefined =
  NativeModules.SubjectExtractor;

export type ExtractedSubject = {
  // 배경이 투명하게 날아간 조각 PNG (피사체 경계로 잘려 있음)
  uri: string;
  // 원본 사진 크기 그대로인 흰색 윤곽선 PNG. 네이티브에서 실패하면 안 올 수 있음
  outlineUri?: string;
  width: number;
  height: number;
  // 원본 사진 크기 (윤곽선을 원본 위에 겹칠 때 비율 계산용)
  sourceWidth: number;
  sourceHeight: number;
  // 사진에서 찾은 피사체 개수 (실제로 뽑는 건 가운데에 있는 하나)
  instanceCount: number;
};

export type SubjectExtractionErrorCode =
  | 'UNSUPPORTED_OS'
  | 'LOAD_FAILED'
  | 'ANALYZE_FAILED'
  | 'NO_SUBJECT'
  | 'EXTRACT_FAILED'
  | 'WRITE_FAILED'
  // 안드로이드 전용. ML Kit 모델을 Play 서비스가 아직 안 내려준 상태
  | 'MODEL_NOT_READY'
  | 'UNAVAILABLE';

export const getSubjectExtractionErrorCode = (
  error: unknown,
): SubjectExtractionErrorCode => {
  const code = (error as {code?: string} | undefined)?.code;

  switch (code) {
    case 'UNSUPPORTED_OS':
    case 'LOAD_FAILED':
    case 'ANALYZE_FAILED':
    case 'NO_SUBJECT':
    case 'EXTRACT_FAILED':
    case 'WRITE_FAILED':
    case 'MODEL_NOT_READY':
      return code;

    default:
      return 'UNAVAILABLE';
  }
};

// iOS 17 미만은 Vision API가 없고, 안드로이드는 Play 서비스가 없는 기기(ML Kit 모델을
// 못 받음)에서 못 쓴다. 판단은 각 네이티브의 isAvailable에 맡기고,
// 진입점(조각 모으기 버튼)에서 이걸로 먼저 걸러야 함.
export const isSubjectExtractionAvailable = async (): Promise<boolean> => {
  if (nativeModule == null) {
    return false;
  }

  try {
    return await nativeModule.isAvailable();
  } catch {
    return false;
  }
};

export const extractSubject = async (
  imageUri: string,
): Promise<ExtractedSubject> => {
  if (nativeModule == null) {
    const error = new Error('SubjectExtractor 네이티브 모듈이 없어요.');
    (error as Error & {code: string}).code = 'UNAVAILABLE';
    throw error;
  }

  return nativeModule.extract(imageUri);
};
