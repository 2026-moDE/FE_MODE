import React, {useRef, useState} from 'react';
import {View, Text, Pressable, Animated, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import BlurOverlay from '../common/BlurOverlay';

const chatIcon = require('../../assets/image/comment.png');
const emojiIcon = require('../../assets/image/emoji.png');
const EMOJIS = ['😍', '👀', '❤️', '👍', '😑'];

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

type EmojiPickerProps = {
    visible: boolean;
    onClose: () => void;
    onSelect: (emoji: string) => void;
};

// 이모지 선택 화면
export function ReviewPhotoEmojiPicker({visible, onClose, onSelect}: EmojiPickerProps) {
    if (!visible) return null;
    return (
        <>
            <Pressable style={styles.overlay} onPress={onClose}>
                <BlurOverlay />
            </Pressable>
            <View style={styles.picker}>
                {EMOJIS.map(emoji => (
                    <Pressable key={emoji} onPress={() => onSelect(emoji)}>
                        <Text style={styles.emojiText}>{emoji}</Text>
                    </Pressable>
                ))}
            </View>
        </>
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
});
