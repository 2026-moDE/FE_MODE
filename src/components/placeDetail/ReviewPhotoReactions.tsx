import React, {useRef, useState} from 'react';
import {View, Text, Pressable, Animated, StyleSheet, Modal, TextInput, Platform, NativeModules} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import BlurOverlay from '../common/BlurOverlay';

const chatIcon = require('../../assets/image/comment.png');
const emojiIcon = require('../../assets/image/emoji.png');
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

// 선택된 이모지 자체는 리뷰별로 달라야 해서 ReviewPhoto에서 관리
// 이 훅은 애니메이션 재생만 담당함
export function useReviewPhotoReactions() {
    const [showPicker, setShowPicker] = useState<boolean>(false);
    const [isExiting, setIsExiting] = useState(false);
    // 선택 이모지 등장 애니메이션 값
    const emojiPop = useRef(new Animated.Value(0)).current;
    // 선택 이모지 취소 시 애니메이션 값
    const emojiBurst = useRef(new Animated.Value(0)).current;

    const togglePicker = () => setShowPicker(prev => !prev);
    const closePicker = () => setShowPicker(false);

    // 새로 선택했을 때 등장 애니메이션 재생
    const playSelectAnimation = () => {
        setIsExiting(false);
        setShowPicker(false);      // 피커 닫기

        emojiPop.setValue(0);
        emojiBurst.setValue(0);
        Animated.spring(emojiPop, {
            toValue: 1,                     // 제자리로
            friction: 5,                    // 반동 세기
            tension: 80,                    // 속도
            useNativeDriver: true,
        }).start();
    };

    // 취소했을 때 퇴장 애니메이션 재생, 끝나면 onDone 호출 (실제 선택 상태 제거는 호출부에서)
    const playCancelAnimation = (onDone: () => void) => {
        setIsExiting(true);
        Animated.timing(emojiBurst, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
        }).start(() => {
            setIsExiting(false);
            emojiPop.setValue(0);
            emojiBurst.setValue(0);
            onDone();
        });
    };

    // 다른 리뷰로 넘어갔을 때 애니메이션 없이 그 리뷰의 선택 상태로 즉시 맞춤
    const syncEmoji = (hasEmoji: boolean) => {
        setIsExiting(false);
        emojiBurst.setValue(0);
        emojiPop.setValue(hasEmoji ? 1 : 0);
    };

    return {showPicker, emojiPop, emojiBurst, isExiting, togglePicker, closePicker, playSelectAnimation, playCancelAnimation, syncEmoji};
}

type ButtonsProps = {
    onOpenChat: () => void;
    selectedEmoji: string | null;
    emojiPop: Animated.Value;
    emojiBurst: Animated.Value;
    isExiting: boolean;
    onPressEmojiButton: () => void;
    onCancelEmoji: () => void;
};

// 리뷰 풀스크린 뷰어 우하단: 채팅 / 이모지 반응 버튼
export function ReviewPhotoReactionButtons({onOpenChat, selectedEmoji, emojiPop, emojiBurst, isExiting, onPressEmojiButton, onCancelEmoji}: ButtonsProps) {
    return (
        <View style={styles.reactionButtons}>
            <Pressable style={styles.reactionBtn} hitSlop={10} onPress={onOpenChat}>
                <FastImage source={chatIcon} style={styles.chatIcon} resizeMode={FastImage.resizeMode.contain} />
            </Pressable>
            <Pressable style={styles.reactionBtn} hitSlop={10} onPress={selectedEmoji ? onCancelEmoji : onPressEmojiButton}>
                {selectedEmoji
                    ? <Animated.Text
                        style={[
                            styles.selectedEmoji,
                            {
                                opacity: isExiting
                                    // 사라질 때: 투명해지고, scale은 남은 시간 동안 계속 커짐
                                    ? emojiBurst.interpolate({inputRange: [0, 0.3, 1], outputRange: [1, 0, 0]})
                                    // 나타날 때: 투명 → 불투명
                                    : emojiPop,
                                transform: [
                                    {translateY: isExiting
                                        ? 0   // 사라질 땐 제자리 유지
                                        // 나타날 땐 아래(40px)에서 제자리(0)로 올라옴
                                        : emojiPop.interpolate({inputRange: [0, 1], outputRange: [40, 0]})},
                                    {scale: isExiting
                                        // 사라질 때: 커지면서 퍼짐
                                        ? emojiBurst.interpolate({inputRange: [0, 1], outputRange: [1, 1.8]})
                                        // 나타날 때: 작게 → 크게
                                        : emojiPop},
                                ],
                            },
                        ]}>
                        {selectedEmoji}
                      </Animated.Text>
                    : <FastImage source={emojiIcon} style={styles.emojiIcon} resizeMode={FastImage.resizeMode.contain} />
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
    // 없으면 부모를 화면 전체로 보고 그대로 그림 (사진 뷰어)
    // 있으면 Modal로 띄워서 화면 어디를 눌러도 닫히게 하고, 프리셋 줄은 이 좌표에 맞춰 배치 (리스트 카드)
    anchor?: PickerAnchor;
};

// 이모지 선택 화면
export function ReviewPhotoEmojiPicker({visible, onClose, onSelect, anchor}: EmojiPickerProps) {
    // 맨 오른쪽 버튼을 누르면 OS 키보드를 띄움. 커스텀 피커가 아니라 애플이 그리는 진짜 이모지 키보드라
    // 검색/최근사용/스킨톤이 전부 시스템 기능 그대로 동작함.
    // 다만 이모지 탭으로 강제로 여는 공개 API는 없어서, 직전에 쓰던 키보드가 먼저 뜰 수 있음(지구본 키로 전환)
    const inputRef = useRef<TextInput>(null);

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
                {EMOJIS.map(emoji => (
                    <Pressable key={emoji} onPress={() => onSelect(emoji)}>
                        <Text style={styles.emojiText}>{emoji}</Text>
                    </Pressable>
                ))}
                <Pressable onPress={() => inputRef.current?.focus()}>
                    <FastImage source={emojiIcon} style={styles.moreIcon} resizeMode={FastImage.resizeMode.contain} />
                </Pressable>
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
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    chatIcon: {
        width: 32,
        height: 32,
    },
    emojiIcon: {
        width: 32,
        height: 32,
    },
    // 선택된 이모지 (emoji.png 대신 표시)
    selectedEmoji: {
        fontSize: 23,
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
    moreIcon: {
        width: 40,
        height: 40,
    },
});
