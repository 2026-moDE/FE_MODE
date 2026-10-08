#import "EmojiKeyboardModule.h"
#import <UIKit/UIKit.h>
#import <React/RCTUIManager.h>
#import <React/RCTBridge.h>

// UIKeyboardType에 이모지 키보드를 뜻하는 공개 상수가 없어서 쓰는 값.
// 문서화되지 않았으므로 iOS 버전에 따라 동작하지 않을 수 있음 - 그 경우 그냥 평소 키보드가 뜸.
static const NSInteger kEmojiKeyboardType = 124;

// RN의 <TextInput>이 reactTag로 등록하는 뷰는 실제 UITextField가 아니라 그걸 감싸는 컨테이너 뷰
// (RCTBaseTextInputView 계열)라서, keyboardType을 가진 진짜 입력 뷰는 그 컨테이너의
// backedTextInputView 하위 뷰임. 컨테이너가 이 프로토콜을 "선언"하고 있다는 보장이 없어서
// conformsToProtocol이 아니라 respondsToSelector로 구조적으로만 확인함 (아래 참고).
@interface NSObject (MoingBackedTextInputHost)
- (UIView *)backedTextInputView;
@end

#pragma mark - 모듈

@implementation EmojiKeyboardModule

RCT_EXPORT_MODULE(EmojiKeyboard);

// bridge에 접근해서 reactTag로 정확한 뷰를 찾기 위해 필요 (RCTBridgeModule 프로토콜의 프로퍼티를 실제로 저장할 곳)
@synthesize bridge = _bridge;

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

// reactTag로 지정된 "그 입력창"의 keyboardType만 바꾸고 키보드를 다시 그림.
// (예전엔 앱 전체에서 "지금 포커스된 아무 입력창"을 찾아서 바꿨는데, 타이밍이 어긋나면
// 엉뚱한 입력창을 붙잡아 그 키보드를 영구히 이모지로 고정시켜버리는 버그가 있었음 - reactTag로
// JS가 정확히 "이 입력창"이라고 짚어주는 방식으로 바꿔서, 엉뚱한 곳을 건드릴 수 없게 함)
// keyboardType 값을 JS에서 넘길 수 있게 해둠 - 이모지 키보드 값이 문서화되어 있지 않아 실측이 필요하기 때문.
// 0 이하를 넘기면 기본값(kEmojiKeyboardType)을 씀.
// 진단 결과를 JS로 돌려줌 - 기기 네이티브 로그를 뽑기 어려워서 Metro 콘솔로 확인하려는 목적
RCT_EXPORT_METHOD(showEmojiKeyboard:(nonnull NSNumber *)reactTag
                  keyboardType:(NSInteger)keyboardType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        UIView *view = [self.bridge.uiManager viewForReactTag:reactTag];
        if (view == nil) {
            resolve(@{@"ok": @NO, @"reason": @"reactTag에 해당하는 뷰 없음"});
            return;
        }
        // 컨테이너 뷰 자체는 UITextInputTraits가 아닐 수 있으니, 그 안의 진짜 입력 뷰를 대신 씀
        if (![view conformsToProtocol:@protocol(UITextInputTraits)] &&
            [view respondsToSelector:@selector(backedTextInputView)]) {
            UIView *backed = [view backedTextInputView];
            if (backed != nil) {
                view = backed;
            }
        }
        if (![view conformsToProtocol:@protocol(UITextInputTraits)]) {
            resolve(@{@"ok": @NO,
                      @"reason": @"텍스트 입력이 아님",
                      @"responder": NSStringFromClass([view class])});
            return;
        }

        id<UITextInputTraits> input = (id<UITextInputTraits>)view;
        if (![input respondsToSelector:@selector(setKeyboardType:)]) {
            resolve(@{@"ok": @NO, @"reason": @"setKeyboardType: 미지원"});
            return;
        }

        NSInteger type = keyboardType > 0 ? keyboardType : kEmojiKeyboardType;
        NSInteger before = (NSInteger)input.keyboardType;
        input.keyboardType = (UIKeyboardType)type;
        NSInteger applied = (NSInteger)input.keyboardType;
        [view reloadInputViews];

        resolve(@{@"ok": @YES,
                  @"responder": NSStringFromClass([view class]),
                  @"before": @(before),
                  @"requested": @(type),
                  @"applied": @(applied)});
    });
}

@end
