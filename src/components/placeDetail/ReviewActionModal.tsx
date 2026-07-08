import React, {useState, useEffect} from 'react';
import {Modal, View, Text, Pressable, StyleSheet, Dimensions, Image} from 'react-native';
import IconTrash from '../../assets/icons/IconTrash';
import IconReport from '../../assets/icons/IconReport';
import {colors} from '../../constants/colors';
import {fontFamily} from '../../constants/typography';

const cautionIcon = require('../../assets/image/caution.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type Props = {
    visible: boolean;
    isOwner: boolean;
    position: {top: number; right: number};
    onClose: () => void;
    onDelete: () => void;
    onReport: () => void;
};

export default function ReviewActionModal({visible, isOwner, position, onClose, onDelete, onReport}: Props) {
    const [step, setStep] = useState<'menu' | 'confirm'>('menu');

    useEffect(() => {
        if (!visible) setStep('menu');
    }, [visible]);

    const handleConfirm = () => {
        onClose();
        if (isOwner) onDelete();
        else onReport();
    };

    if (step === 'menu') {
        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <Pressable style={styles.overlay} onPress={onClose}>
                    <View style={[styles.menuContainer, {top: position.top, right: position.right}]}>
                        <View style={styles.triangle} />
                        <View style={styles.menu}>
                            <Pressable
                                style={styles.menuItem}
                                onPress={() => setStep('confirm')}>
                                {isOwner ? (
                                    <>
                                        <IconTrash size={16} color={colors.text.basic} />
                                        <Text style={styles.menuText}>삭제하기</Text>
                                    </>
                                ) : (
                                    <>
                                        <IconReport size={14} color={colors.text.basic} />
                                        <Text style={styles.menuText}>신고하기</Text>
                                    </>
                                )}
                            </Pressable>
                        </View>
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
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    menuContainer: {
        position: 'absolute',
        alignItems: 'flex-end',
    },
    triangle: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderBottomWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: colors.surface.white,
        marginRight: 10,
    },
    menu: {
        backgroundColor: colors.surface.white,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text.basic,
    },

    // ── 확인 모달 ──
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        width: px(320),
        backgroundColor: '#FFFFFF',
        borderRadius: px(20),
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
        width: px(120),
        height: px(37),
        borderRadius: px(12),
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
        width: px(120),
        height: px(37),
        borderRadius: px(12),
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
