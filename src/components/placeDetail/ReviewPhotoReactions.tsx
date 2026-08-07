import React, {useRef, useState} from 'react';
import {View, Text, Pressable, Animated, StyleSheet} from 'react-native';
import FastImage from 'react-native-fast-image';
import {colors} from '../../constants/colors';

const chatIcon = require('../../assets/image/chat.png');
const emojiIcon = require('../../assets/image/emoji.png');
const EMOJIS = ['😍', '👀', '❤️', '👍', '😑'];

// 채팅/이모지 버튼과 이모지 피커가 서로 다른 위치에
// 렌더링돼야 해서(버튼은 사진 박스 기준, 피커는 화면 전체 기준) 상태를 훅으로 공유
export function useReviewPhotoReactions() {
    const [showPicker, setShowPicker] = useState<boolean>(false);
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
    // 선택 이모지 등장 애니메이션 값
    const emojiPop = useRef(new Animated.Value(0)).current;

    const togglePicker = () => setShowPicker(prev => !prev);
    const closePicker = () => setShowPicker(false);

    const selectEmoji = (emoji: string) => {
        setSelectedEmoji(emoji);   // 화면에 선택 반영 (로컬)
        setShowPicker(false);      // 피커 닫기
        // 반응 API

        emojiPop.setValue(0);
        Animated.spring(emojiPop, {
            toValue: 1,                     // 제자리로
            friction: 5,                    // 반동 세기
            tension: 80,                    // 속도
            useNativeDriver: true,
        }).start();
    };

    return {showPicker, selectedEmoji, emojiPop, togglePicker, closePicker, selectEmoji};
}

type ButtonsProps = {
    onOpenChat: () => void;
    selectedEmoji: string | null;
    emojiPop: Animated.Value;
    onPressEmojiButton: () => void;
};

// 리뷰 풀스크린 뷰어 우하단: 채팅 / 이모지 반응 버튼
export function ReviewPhotoReactionButtons({onOpenChat, selectedEmoji, emojiPop, onPressEmojiButton}: ButtonsProps) {
    return (
        <View style={styles.reactionButtons}>
            <Pressable style={styles.reactionBtn} hitSlop={10} onPress={onOpenChat}>
                <FastImage source={chatIcon} style={styles.chatIcon} resizeMode={FastImage.resizeMode.contain} />
            </Pressable>
            <Pressable style={styles.reactionBtn} hitSlop={10} onPress={onPressEmojiButton}>
                {selectedEmoji
                    ? <Animated.Text
                        style={[
                            styles.selectedEmoji,
                            {
                                opacity: emojiPop,   // 투명 → 불투명
                                transform: [
                                    // 아래(40px)에서 제자리(0)로 올라옴
                                    {translateY: emojiPop.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [40, 0],
                                    })},
                                    {scale: emojiPop},   // 작게 → 크게
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

// 이모지 반응 피커: 화면 전체(사진+썸네일) 오버레이 + 이모지 목록
export function ReviewPhotoEmojiPicker({visible, onClose, onSelect}: EmojiPickerProps) {
    if (!visible) return null;
    return (
        <>
            <Pressable style={styles.overlay} onPress={onClose} />
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
        position: 'absolute',
        right: 16,
        bottom: 20,
        alignItems: 'center',
        gap: 5,
        zIndex: 2,
    },
    reactionBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // 두 png의 내부 여백이 달라 보이는 크기 보정
    chatIcon: {
        width: 30,
        height: 30,
    },
    emojiIcon: {
        width: 34,
        height: 34,
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
        backgroundColor: colors.background.dimDarker,  // rgba(0,0,0,0.5)
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
