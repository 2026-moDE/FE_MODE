import React, {useRef, useState, useEffect} from 'react';
import {View, Text, Pressable, Animated, StyleSheet, Modal, TextInput, Platform, NativeModules, Easing} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import BlurOverlay from '../common/BlurOverlay';
import {typography} from '../../constants/typography';
import {colors} from '../../constants/colors';

const chatIcon = require('../../assets/image/placeDeail_comment.png'); // 파일명에 오타 있음(Detail -> Deail)
const emojiIcon = require('../../assets/image/placeDetail_emoji.png');       // 타인 리뷰 - 반응 남기기
const emojiIconFill = require('../../assets/image/placeDetail_emojiFill.png'); // 본인 리뷰 - 반응 조회
const EMOJIS = ['😍', '👀', '❤️', '👍'];

// 입력값이 이모지만으로 이뤄졌는지 검사. 스킨톤/변이 선택자/ZWJ 결합 이모지(👨‍👩‍👧 등)까지 통과시킴
const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Emoji_Component}|‍|️)+$/u;

// 이모지 키보드를 뜻하는 UIKeyboardType 값. 공개 상수가 없어서 실기기(iOS 26)에서 확인한 값을 씀.
// 문서화된 값이 아니라 iOS 버전에 따라 안 먹을 수 있는데, 그 경우 평소 키보드가 뜰 뿐이라 앱은 정상 동작함
const EMOJI_KEYBOARD_TYPE = 124;

// 포커스된 입력창의 키보드를 이모지로 전환 (iOS 전용 네이티브 모듈).
// 모듈이 없거나 실패해도 그냥 기본 키보드가 뜰 뿐이라 앱 동작에는 지장 없음
function openEmojiKeyboard() {
    if (Platform.OS !== 'ios') return;
    // 실패해도 평소 키보드가 뜰 뿐이라 조용히 무시
    NativeModules.EmojiKeyboard?.showEmojiKeyboard?.(EMOJI_KEYBOARD_TYPE)?.catch(() => {});
}

// 안드로이드는 시스템 키보드를 이모지 탭으로 강제 전환하는 공개 API가 없어서,
// 구글 공식 Jetpack Emoji Picker(EmojiPickerView)를 다이얼로그로 띄우는 네이티브 모듈을 씀.
// 선택하면 이모지 문자열, 그냥 닫으면 null을 resolve함
async function openAndroidEmojiPicker(): Promise<string | null> {
    if (Platform.OS !== 'android') return null;
    try {
        return await NativeModules.EmojiKeyboard?.showEmojiPicker?.();
    } catch {
        return null;
    }
}

// 선택된 이모지 자체는 리뷰별로 달라야 해서 ReviewPhoto에서 관리
// 이 훅은 애니메이션 재생만 담당함
export function useReviewPhotoReactions() {
    const [showPicker, setShowPicker] = useState<boolean>(false);
    // 선택 이모지 등장 애니메이션 값 (취소 시 사라지는 애니메이션은 이제 피커 안에서 재생하므로
    // 여기선 등장(선택) 쪽만 다룸 - emojiBurst/isExiting은 그 퇴장 애니메이션 전용이라 같이 제거함)
    const emojiPop = useRef(new Animated.Value(0)).current;

    const togglePicker = () => setShowPicker(prev => !prev);
    const closePicker = () => setShowPicker(false);

    // 새로 선택했을 때 등장 애니메이션 재생
    const playSelectAnimation = () => {
        setShowPicker(false);      // 피커 닫기

        emojiPop.setValue(0);
        Animated.spring(emojiPop, {
            toValue: 1,                     // 제자리로
            friction: 5,                    // 반동 세기
            tension: 80,                    // 속도
            useNativeDriver: true,
        }).start();
    };

    // 다른 리뷰로 넘어갔을 때(취소 포함) 애니메이션 없이 그 리뷰의 선택 상태로 즉시 맞춤
    const syncEmoji = (hasEmoji: boolean) => {
        emojiPop.setValue(hasEmoji ? 1 : 0);
    };

    return {showPicker, emojiPop, togglePicker, closePicker, playSelectAnimation, syncEmoji};
}

type ButtonsProps = {
    onOpenChat: () => void;
    selectedEmoji: string | null;
    emojiPop: Animated.Value;
    onPressEmojiButton: () => void;
    // 본인 리뷰면 "반응 조회", 남의 리뷰면 "반응 남기기" 텍스트 표시
    isOwner: boolean;
};

// 리뷰 풀스크린 뷰어 우하단: 채팅 / 이모지 반응 버튼
export function ReviewPhotoReactionButtons({onOpenChat, selectedEmoji, emojiPop, onPressEmojiButton, isOwner}: ButtonsProps) {
    return (
        <View style={styles.reactionButtons}>
            <Pressable style={styles.reactionBtn} hitSlop={10} onPress={onOpenChat}>
                <FastImage source={chatIcon} style={styles.chatIcon} resizeMode={FastImage.resizeMode.contain} />
            </Pressable>
            {/* 이미 반응을 남겼어도 여기선 바로 취소하지 않고 피커를 열어서, 취소/재선택을 피커 안에서만 하게 함.
                취소 시 사라지는 애니메이션은 피커 안에서 이미 재생되므로 여기선 등장(선택)만 애니메이션함 */}
            <Pressable style={styles.reactionBtn} hitSlop={10} onPress={onPressEmojiButton}>
                {selectedEmoji
                    ? <Animated.Text
                        style={[
                            styles.selectedEmoji,
                            {
                                opacity: emojiPop,
                                transform: [
                                    {translateY: emojiPop.interpolate({inputRange: [0, 1], outputRange: [40, 0]})}, // 아래에서 제자리로
                                    {scale: emojiPop},
                                ],
                            },
                        ]}>
                        {selectedEmoji}
                      </Animated.Text>
                    : <>
                        <FastImage source={isOwner ? emojiIconFill : emojiIcon} style={styles.emojiIcon} resizeMode={FastImage.resizeMode.contain} />
                        <Text style={styles.reactionLabel}>{isOwner ? '반응 조회' : '반응 남기기'}</Text>
                      </>
                }
            </Pressable>
        </View>
    );
}

// 피커를 띄운 카드의 화면상 위치. 리스트 안 카드처럼 부모가 화면 전체가 아닐 때 넘김
export type PickerAnchor = {x: number; y: number; width: number; height: number};

type EmojiPickerProps = {
    visible: boolean;
    onClose: () => void;
    onSelect: (emoji: string) => void;
    // 이미 남긴 반응이 있으면 그 이모지만 원래 색으로 보이고 나머지는 회색으로 비활성화됨.
    // 없으면(null) 전부 선택 가능
    selectedEmoji?: string | null;
    // 이미 선택된 이모지를 다시 누르면 취소 (다른 이모지로 바로 바꾸는 건 불가 - 먼저 취소해야 함)
    onCancel?: () => void;
    // 없으면 부모를 화면 전체로 보고 그대로 그림 (사진 뷰어)
    // 있으면 Modal로 띄워서 화면 어디를 눌러도 닫히게 하고, 프리셋 줄은 이 좌표에 맞춰 배치 (리스트 카드)
    anchor?: PickerAnchor;
};

// 이모지 선택 화면
export function ReviewPhotoEmojiPicker({visible, onClose, onSelect, selectedEmoji = null, onCancel, anchor}: EmojiPickerProps) {
    // 이미 남긴 반응이 있으면, 그 이모지 외엔 전부 비활성화 - 취소 없이 바로 다른 이모지로 못 바꾸게 함
    const hasSelection = selectedEmoji != null;
    // 프리셋 4개에 없는 이모지(키보드로 직접 고른 것)를 선택 중인지 - 5번째 슬롯에 표시해야 함
    const isCustomSelected = hasSelection && !(EMOJIS as string[]).includes(selectedEmoji);
    // 맨 오른쪽 버튼을 누르면 OS 키보드를 띄움. 커스텀 피커가 아니라 애플이 그리는 진짜 이모지 키보드라
    // 검색/최근사용/스킨톤이 전부 시스템 기능 그대로 동작함.
    // 다만 이모지 탭으로 강제로 여는 공개 API는 없어서, 직전에 쓰던 키보드가 먼저 뜰 수 있음(지구본 키로 전환)
    const inputRef = useRef<TextInput>(null);

    // 취소 시 피커 자체는 안 닫고, 선택된 이모지가 그 자리에서 사라지는 애니메이션만 재생 -
    // 끝난 뒤에 실제 취소 처리(onCancel)를 해서 다른 이모지를 바로 이어서 고를 수 있게 함
    const cancelAnim = useRef(new Animated.Value(0)).current;
    const [isCanceling, setIsCanceling] = useState(false);
    const handleCancelPress = () => {
        if (isCanceling) return; // 애니메이션 중 중복 실행 방지
        setIsCanceling(true);
        Animated.timing(cancelAnim, {
            toValue: 1,
            duration: 210,
            easing: Easing.out(Easing.ease), // 처음엔 빠르게, 끝으로 갈수록 느려짐
            useNativeDriver: true,
        }).start(() => {
            setIsCanceling(false);
            onCancel?.();
        });
    };
    // cancelAnim 리셋은 완료 콜백이 아니라 selectedEmoji가 실제로 바뀐 시점에 맞춤 -
    // 완료 콜백에서 바로 리셋하면 부모 상태(selectedEmoji)가 아직 안 바뀐 채로 퉅명도가
    // 먼저 1로 튀어버려서 사라졌다 다시 보이는 깜빡임이 생김
    useEffect(() => {
        cancelAnim.setValue(0);
    }, [selectedEmoji, cancelAnim]);

    if (!visible) return null;

    const handleChangeText = (text: string) => {
        if (!text) return;
        // 이모지가 아니면(한글/영문 등) 무시하고 입력만 비움 - 반응은 이모지만 허용
        if (EMOJI_ONLY.test(text)) {
            inputRef.current?.blur();
            onSelect(text);
        }
        inputRef.current?.clear();
    };

    // anchor가 있으면 카드 안이 아니라 화면 좌표계(Modal)에 그림. 세로 위치는 사진의 스크롤된
    // 위치를 쫓아가면 화면 밖으로 나갈 수 있어서 안 씀 - 항상 현재 보이는 화면 기준 40%(styles.picker
    // 기본값)에 고정하고, 가로 위치(카드 폭)만 anchor에 맞춤
    const pickerPosition = anchor
        ? {left: anchor.x, width: anchor.width, right: undefined}
        : null;

    const content = (
        <>
            {/* 약한 블러만 - 딤까지 겹치면 과해짐.
                pointerEvents="none" 필수 - 없으면 BlurView가 탭을 흡수해서 바깥을 눌러도 안 닫힘 */}
            <Pressable style={styles.overlay} onPress={onClose}>
                <BlurOverlay blurAmount={2} iosBlurType="ultraThinMaterial" pointerEvents="none" />
            </Pressable>
            <View style={[styles.picker, pickerPosition]}>
                {EMOJIS.map(emoji => {
                    const isSelected = emoji === selectedEmoji;
                    // 이미 다른 이모지가 선택돼있으면(취소 안 하고) 이 이모지는 못 고름
                    const disabled = hasSelection && !isSelected;
                    return (
                        <Pressable
                            key={emoji}
                            disabled={disabled || (isSelected && isCanceling)}
                            onPress={() => {
                                if (isSelected) {
                                    handleCancelPress();
                                } else {
                                    onSelect(emoji);
                                }
                            }}>
                            <Animated.Text
                                style={[
                                    styles.emojiText,
                                    disabled && styles.emojiTextDisabled,
                                    isSelected && {
                                        opacity: cancelAnim.interpolate({inputRange: [0, 1], outputRange: [1, 0]}),
                                        transform: [{scale: cancelAnim.interpolate({inputRange: [0, 1], outputRange: [1, 1.35]})}],
                                    },
                                ]}>
                                {emoji}
                            </Animated.Text>
                        </Pressable>
                    );
                })}
                {/* 5번째 슬롯: 프리셋 4개에 없는 이모지(키보드로 직접 고른 것)를 선택 중이면, 아이콘 대신
                    그 이모지를 보여주고 눌러서 취소할 수 있게 함. 선택된 게 없으면 원래 "더보기" 아이콘 */}
                {isCustomSelected ? (
                    <Pressable disabled={isCanceling} onPress={handleCancelPress}>
                        <Animated.Text
                            style={[
                                styles.emojiText,
                                {
                                    opacity: cancelAnim.interpolate({inputRange: [0, 1], outputRange: [1, 0]}),
                                    transform: [{scale: cancelAnim.interpolate({inputRange: [0, 1], outputRange: [1, 1.35]})}],
                                },
                            ]}>
                            {selectedEmoji}
                        </Animated.Text>
                    </Pressable>
                ) : (
                    <Pressable
                        disabled={hasSelection}
                        onPress={async () => {
                            // 안드로이드는 구글 공식 이모지 피커를 다이얼로그로 띄움 (시스템 키보드 전환 API가 없음)
                            if (Platform.OS === 'android') {
                                const emoji = await openAndroidEmojiPicker();
                                if (emoji) onSelect(emoji);
                                return;
                            }
                            // iOS는 숨겨진 입력창에 포커스를 줘서 시스템 이모지 키보드를 띄움
                            inputRef.current?.focus();
                        }}>
                        <FastImage source={emojiIcon} style={[styles.moreIcon, hasSelection && styles.moreIconDisabled]} resizeMode={FastImage.resizeMode.contain} />
                    </Pressable>
                )}
            </View>
            {/* OS 키보드를 띄우기 위한 입력창 - 화면에는 보이지 않음 */}
            <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                onChangeText={handleChangeText}
                // focus() 직후엔 아직 first responder가 아니라서, 실제로 포커스된 뒤에 키보드를 전환해야 함
                onFocus={openEmojiKeyboard}
                autoCorrect={false}
                autoCapitalize="none"
                caretHidden
            />
        </>
    );

    // 부모(카드)보다 바깥을 눌러도 닫히려면 화면 전체를 덮어야 해서 Modal로 올림
    if (!anchor) return content;
    return (
        <Modal visible transparent animationType="none" onRequestClose={onClose}>
            {content}
        </Modal>
    );
}

const styles = StyleSheet.create({
    reactionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 5,
    },
    reactionBtn: {
        flexDirection: 'row',
        minWidth: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    reactionLabel: {
        ...typography.c2,
        color: colors.text.inverse,
    },

    chatIcon: {
        width: 24,
        height: 24,
    },
    emojiIcon: {
        width: 24,
        height: 24,
    },
    // 선택된 이모지 (emoji.png 대신 표시)
    selectedEmoji: {
        fontSize: 20,
    },

    // 키보드 호출 전용 - 크기 0으로 두면 iOS에서 포커스가 안 잡혀서 1px만 남기고 투명 처리
    hiddenInput: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
        bottom: 0,
    },

    // 피커 뜰 때 화면 전체(사진+썸네일)를 덮는 오버레이
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,                   // 이모지 목록(3)보다 아래
    },
    picker: {
        position: 'absolute',
        top: '40%',                      // 코멘트와 같은 중앙 높이
        left: 0,
        right: 0,
        flexDirection: 'row',            // 이모지 가로 배치
        justifyContent: 'space-evenly',  // 풀너비로 균등 배치
        alignItems: 'center',
        paddingHorizontal: 16,
        zIndex: 3,                       // 다른 오버레이보다 위
    },
    emojiText: {
        fontSize: 30,
    },
    // 이미 다른 이모지가 선택돼있을 때(취소 안 한 상태) 회색으로 표시
    emojiTextDisabled: {
        opacity: 0.4,
    },
    moreIcon: {
        width: 40,
        height: 40,
    },
    moreIconDisabled: {
        opacity: 0.4,
    },
});
