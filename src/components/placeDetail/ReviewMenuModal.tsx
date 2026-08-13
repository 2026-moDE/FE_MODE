import React, {useState, useEffect} from 'react';
import {Modal, View, Text, Pressable, StyleSheet, Dimensions, Image, BackHandler} from 'react-native';
import BlurOverlay from '../common/BlurOverlay';
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

    // menu 단계는 RN Modal아니라 뒤로가기 버튼을 직접
    useEffect(() => {
        if (!visible || step !== 'menu') return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            onClose();
            return true;
        });
        return () => sub.remove();
    }, [visible, step, onClose]);

    // 리뷰를 신고/삭제하시겠습니까? 모달
    const handleConfirm = () => {
        onClose();
        if (isOwner) onDelete();
        else onReport();
    };

    if (step === 'menu') {
        if (!visible) return null;
        return (
            <Pressable style={styles.overlay} onPress={onClose}>
                <BlurOverlay />
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
        );
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.confirmOverlay}>
                <BlurOverlay fallbackColor="rgba(0,0,0,0.5)" />
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
    // ── 메뉴 ── (Modal 없이 화면 전체를 덮는 오버레이라 절대위치로 직접 채움)
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'flex-end',
        // ReviewPhoto.tsx의 backdrop(사진 배경)이 zIndex/elevation 100이라, 그 위로 올라오려면 그보다 커야 함
        zIndex: 200,
        elevation: 200,
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
