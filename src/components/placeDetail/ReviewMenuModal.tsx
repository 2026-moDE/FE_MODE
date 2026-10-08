import React, {useState, useEffect} from 'react';
import {Modal, View, Text, Pressable, StyleSheet, Dimensions, Image} from 'react-native';
import {colors} from '../../constants/colors';
import {fontFamily, typography} from '../../constants/typography';
import {padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';

const cautionIcon = require('../../assets/image/caution_yellow.png');
const sirenIcon = require('../../assets/image/siren.png');
const editIcon = require('../../assets/image/edit.png');
const trashIcon = require('../../assets/image/trash.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type Props = {
    visible: boolean;
    isOwner: boolean;
    onClose: () => void;
    onDelete: () => void;
    onReport: () => void;
    onEdit?: () => void;   // 코멘트 입력창에 포커스 + 커서 끝으로 이동
};

export default function ReviewMenuModal({visible, isOwner, onClose, onDelete, onReport, onEdit}: Props) {
    const [step, setStep] = useState<'menu' | 'confirm'>('menu');

    // 수정하기/삭제하기/신고하기 버튼
    useEffect(() => {
        if (!visible) setStep('menu');
    }, [visible]);

    // 리뷰를 신고/삭제하시겠습니까? 모달
    const handleConfirm = () => {
        onClose();
        if (isOwner) onDelete();
        else onReport();
    };

    if (step === 'menu') {
        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <Pressable style={styles.overlay} onPress={onClose}>
                    <View style={styles.menuBar} onStartShouldSetResponder={() => true}>
                        {isOwner ? (
                            <>
                                <Pressable
                                    style={styles.menuItem}
                                    onPress={() => {
                                        onClose();
                                        onEdit?.();
                                    }}>
                                    <Image source={editIcon} style={styles.menuIcon} resizeMode="contain" />
                                    <Text style={styles.menuText}>수정하기</Text>
                                </Pressable>
                                <View style={styles.divider} />
                                <Pressable
                                    style={styles.menuItem}
                                    onPress={() => setStep('confirm')}>
                                    <Image source={trashIcon} style={styles.menuIcon} resizeMode="contain" />
                                    <Text style={styles.menuText}>삭제하기</Text>
                                </Pressable>
                            </>
                        ) : (
                            <Pressable
                                style={styles.menuItem}
                                hitSlop={12}
                                onPress={() => setStep('confirm')}>
                                <Image source={sirenIcon} style={styles.menuIcon} resizeMode="contain" />
                                <Text style={styles.menuText}>신고하기</Text>
                            </Pressable>
                        )}
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
                    <Text allowFontScaling={false} style={styles.title}>
                        {isOwner ? '리뷰를 삭제하시겠어요?' : '리뷰를 신고하시겠어요?'}
                    </Text>
                    <Text allowFontScaling={false} style={styles.description}>
                        {isOwner ? '작성했던 리뷰는 복구할 수 없어요.' : '신고하신 리뷰는 검토 후 삭제돼요.'}
                    </Text>
                    <View style={styles.buttonRow}>
                        <Pressable style={styles.cancelButton} onPress={onClose}>
                            <Text allowFontScaling={false} style={styles.cancelButtonText}>취소</Text>
                        </Pressable>
                        <Pressable style={styles.confirmButton} onPress={handleConfirm}>
                            <Text allowFontScaling={false} style={styles.confirmButtonText}>
                                {isOwner ? '삭제' : '신고'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    // ── 메뉴 ──
    // 시안대로 블러 없이 딤만 - 뒤 사진이 그대로 보여야 함 (다른 시트/오버레이와 같은 값)
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: colors.background.dimDarker,
    },
    menuBar: {
        backgroundColor: colors.surface.subtleDarker,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        paddingVertical: padding.md,   // 12 (아이템 자체 padding이랑 합쳐서 lg 정도로 보이게)
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: gap.md,                   // 12
        paddingVertical: padding.s,    // 8
    },
    divider: {
        borderTopWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.15)',
        marginHorizontal: padding.lg,  // 16
    },
    menuIcon: {
        width: 20,
        height: 20,
    },
    menuText: {
        ...typography.b4,
        color: colors.text.inverse,
    },

    // ── 확인 모달 ──
    confirmOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.dimDarker,
    },
    modalBox: {
        width: px(320),
        backgroundColor: '#FFFFFF',
        borderRadius: radius.xl,     // 16
        paddingVertical: px(20),
        paddingHorizontal: px(20),
        alignItems: 'center',
    },
    cautionIcon: {
        width: px(60),
        height: px(60),
        marginBottom: px(8),
    },
    title: {
        fontSize: px(22),
        fontFamily: fontFamily.bold,
        color: '#111114',
        lineHeight: px(26),
        letterSpacing: -0.3,
        includeFontPadding: false,
        marginBottom: px(8),
    },
    description: {
        fontSize: px(14),
        fontFamily: fontFamily.medium,
        color: '#4B566D',
        textAlign: 'center',
        lineHeight: px(17),
        includeFontPadding: false,
        marginBottom: px(20),
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: px(12),
    },
    cancelButton: {
        flex: 1,                            // W 100%
        height: px(42),
        paddingVertical: padding.sm,        // 10
        paddingHorizontal: padding['3xl'],  // 32
        borderRadius: radius.lg,            // 12
        borderWidth: 1,
        borderColor: '#E0E0E4',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: px(14),
        fontFamily: fontFamily.bold,
        color: '#111114',
        lineHeight: px(17),
        includeFontPadding: false,
    },
    confirmButton: {
        width: px(101),                     // W Fixed 101dp
        height: px(42),
        paddingVertical: padding.sm,        // 10
        paddingHorizontal: padding['3xl'],  // 32
        borderRadius: radius.lg,            // 12
        backgroundColor: '#2C343F',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        fontSize: px(14),
        fontFamily: fontFamily.bold,
        color: '#FFFFFF',
        lineHeight: px(17),
        includeFontPadding: false,
    },
});
