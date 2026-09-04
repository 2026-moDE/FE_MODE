#import "EmojiKeyboardModule.h"
#import <UIKit/UIKit.h>

// UIKeyboardType에 이모지 키보드를 뜻하는 공개 상수가 없어서 쓰는 값.
// 문서화되지 않았으므로 iOS 버전에 따라 동작하지 않을 수 있음 - 그 경우 그냥 평소 키보드가 뜸.
static const NSInteger kEmojiKeyboardType = 124;

#pragma mark - firstResponder 찾기

// UIApplication에 nil target으로 액션을 보내면 responder chain을 타고 first responder에게 전달됨.
// 이를 이용해 현재 포커스된 입력창을 찾음 (공개 API만 사용).
static __weak UIResponder *gCurrentFirstResponder = nil;

@interface UIResponder (MoingEmojiKeyboard)
- (void)moing_captureFirstResponder:(id)sender;
@end

@implementation UIResponder (MoingEmojiKeyboard)
- (void)moing_captureFirstResponder:(id)sender {
    gCurrentFirstResponder = self;
}
@end

static UIResponder *MoingFindFirstResponder(void) {
    gCurrentFirstResponder = nil;
    [[UIApplication sharedApplication] sendAction:@selector(moing_captureFirstResponder:)
                                               to:nil
                                             from:nil
                                         forEvent:nil];
    return gCurrentFirstResponder;
}

#pragma mark - 모듈

@implementation EmojiKeyboardModule

RCT_EXPORT_MODULE(EmojiKeyboard);

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

// 포커스된 입력창의 keyboardType을 바꾸고 키보드를 다시 그림.
// keyboardType 값을 JS에서 넘길 수 있게 해둠 - 이모지 키보드 값이 문서화되어 있지 않아 실측이 필요하기 때문.
// 0 이하를 넘기면 기본값(kEmojiKeyboardType)을 씀.
// 진단 결과를 JS로 돌려줌 - 기기 네이티브 로그를 뽑기 어려워서 Metro 콘솔로 확인하려는 목적
RCT_EXPORT_METHOD(showEmojiKeyboard:(NSInteger)keyboardType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        UIResponder *responder = MoingFindFirstResponder();
        if (responder == nil) {
            resolve(@{@"ok": @NO, @"reason": @"포커스된 입력창 없음"});
            return;
        }
        if (![responder conformsToProtocol:@protocol(UITextInputTraits)] ||
            ![responder isKindOfClass:[UIView class]]) {
            resolve(@{@"ok": @NO,
                      @"reason": @"텍스트 입력이 아님",
                      @"responder": NSStringFromClass([responder class])});
            return;
        }

        id<UITextInputTraits> input = (id<UITextInputTraits>)responder;
        if (![input respondsToSelector:@selector(setKeyboardType:)]) {
            resolve(@{@"ok": @NO, @"reason": @"setKeyboardType: 미지원"});
            return;
        }

        NSInteger type = keyboardType > 0 ? keyboardType : kEmojiKeyboardType;
        NSInteger before = (NSInteger)input.keyboardType;
        input.keyboardType = (UIKeyboardType)type;
        NSInteger applied = (NSInteger)input.keyboardType;
        [(UIView *)responder reloadInputViews];

        resolve(@{@"ok": @YES,
                  @"responder": NSStringFromClass([responder class]),
                  @"before": @(before),
                  @"requested": @(type),
                  @"applied": @(applied)});
    });
}

@end
