#import <React/RCTBridgeModule.h>

// 현재 포커스된 입력창의 키보드를 이모지 키보드로 전환하는 모듈.
// iOS에는 이모지 키보드를 여는 공개 API가 없어서, UIKeyboardType에 문서화되지 않은 값을 지정함.
// 비공개 selector를 쓰지는 않지만 애플이 보장하는 동작은 아니므로, 실패해도 앱은 그대로 동작해야 함.
@interface EmojiKeyboardModule : NSObject <RCTBridgeModule>
@end
