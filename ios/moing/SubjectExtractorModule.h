#import <React/RCTBridgeModule.h>

// 사진에서 피사체(조각)만 배경과 분리해 투명 PNG로 뽑아내는 모듈.
// iOS 17의 Vision VNGenerateForegroundInstanceMaskRequest를 쓰며, 그 이전 버전에서는
// isAvailable이 NO를 돌려주므로 JS에서 '조각 모으기' 진입 자체를 막아야 함.
@interface SubjectExtractorModule : NSObject <RCTBridgeModule>
@end
