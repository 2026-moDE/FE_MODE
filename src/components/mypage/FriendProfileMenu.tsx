import React, {useEffect, useState} from 'react';
import {Modal, View, Text, Pressable, StyleSheet, Image} from 'react-native';
import {colors} from '../../constants/colors';
import {fontFamily} from '../../constants/typography';
import {padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';

const sirenIcon = require('../../assets/image/siren.png');
const xIcon = require('../../assets/image/x.png');
const cautionIcon = require('../../assets/image/caution_yellow.png');

const DROPDOWN_GAP = 4;

type Props = {
    visible: boolean;
    // ⋮ 버튼을 measureInWindow로 잰 실제 화면 좌표 (ProfileHeaderCard가 눌렀을 때 넘겨줌)
    anchor: {top: number; right: number} | null;
    onClose: () => void;
    // 유저 신고 api/화면이 아직 없어서 일단 자리만 잡아둠 - 연결은 나중에
    onPressReport: () => void;
    onPressUnfriend: () => void;
};

// 친구 마이페이지 헤더 ⋮ 버튼 드롭다운 (신고하기 / 친구 끊기)
export default function FriendProfileMenu({visible, anchor, onClose, onPressReport, onPressUnfriend}: Props) {
    const [step, setStep] = useState<'menu' | 'confirm'>('menu');

    useEffect(() => {
        if (!visible) setStep('menu');
    }, [visible]);

    if (step === 'menu') {
        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <Pressable
                    style={[
                        styles.overlay,
                        {
                            paddingTop: (anchor?.top ?? 0) + DROPDOWN_GAP,
                            paddingRight: anchor?.right ?? 0,
                        },
                    ]}
                    onPress={onClose}>
                    <View style={styles.dropdown} onStartShouldSetResponder={() => true}>
                        <Pressable
                            style={styles.menuItem}
                            onPress={() => {
                                onClose();
                                onPressReport();
                            }}>
                            <Image source={sirenIcon} style={styles.menuIcon} resizeMode="contain" />
                            <Text allowFontScaling={false} style={styles.menuText}>신고하기</Text>
                        </Pressable>
                        <View style={styles.divider} />
                        <Pressable style={styles.menuItem} onPress={() => setStep('confirm')}>
                            <Image source={xIcon} style={styles.menuIcon} resizeMode="contain" />
                            <Text allowFontScaling={false} style={styles.menuText}>친구 끊기</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.confirmOverlay}>
                <View style={styles.modalBox}>
                    <Image source={cautionIcon} style={styles.cautionIcon} resizeMode="contain" />
                    <Text allowFontScaling={false} style={styles.title}>친구를 끊으시겠어요?</Text>
                    <Text allowFontScaling={false} style={styles.description}>
                        서로의 친구 공개 리뷰를 볼 수 없게 돼요.
                    </Text>
                    <View style={styles.buttonRow}>
                        <Pressable style={styles.cancelButton} onPress={onClose}>
                            <Text allowFontScaling={false} style={styles.cancelButtonText}>취소</Text>
                        </Pressable>
                        <Pressable
                            style={styles.confirmButton}
                            onPress={() => {
                                onClose();
                                onPressUnfriend();
                            }}>
                            <Text allowFontScaling={false} style={styles.confirmButtonText}>끊기</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        alignItems: 'flex-end',
    },
    dropdown: {
        backgroundColor: colors.button.secondaryFill,
        borderRadius: radius.lg,
        paddingVertical: padding.xs,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.sm,
        paddingVertical: padding.s,
        paddingHorizontal: padding.md,
    },
    divider: {
        borderTopWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.15)',
        marginHorizontal: padding.md,
    },
    menuIcon: {
        width: 18,
        height: 18,
    },
    menuText: {
        fontFamily: fontFamily.medium,
        fontSize: 12,
        lineHeight: 14,
        letterSpacing: -0.06,
        color: colors.text.inverse,
    },

    confirmOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.dimDarker,
    },
    modalBox: {
        width: 320,
        backgroundColor: '#FFFFFF',
        borderRadius: radius.xl,
        paddingVertical: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    cautionIcon: {
        width: 60,
        height: 60,
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontFamily: fontFamily.bold,
        color: '#111114',
        lineHeight: 26,
        letterSpacing: -0.3,
        includeFontPadding: false,
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        fontFamily: fontFamily.medium,
        color: '#4B566D',
        textAlign: 'center',
        lineHeight: 17,
        includeFontPadding: false,
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        height: 42,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: '#E0E0E4',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontFamily: fontFamily.bold,
        color: '#111114',
        lineHeight: 17,
        includeFontPadding: false,
    },
    confirmButton: {
        width: 101,
        height: 42,
        borderRadius: radius.lg,
        backgroundColor: '#2C343F',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        fontSize: 14,
        fontFamily: fontFamily.bold,
        color: '#FFFFFF',
        lineHeight: 17,
        includeFontPadding: false,
    },
});
