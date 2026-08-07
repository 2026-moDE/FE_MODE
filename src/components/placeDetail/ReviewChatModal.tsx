import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { spacing } from "../../constants/spacing";

type Props = {
    reviewId?: number;   // 어떤 리뷰의 채팅인지 (나중 API 연결용)
};

// 리뷰 사진 댓글/채팅 바텀시트
// ref로 present()/dismiss()를 부모(ReviewPhoto)에 노출
const ReviewChatModal = forwardRef<BottomSheetModal, Props>(function ReviewChatModal({reviewId}, ref) {
    const snapPoints = useMemo(() => ['60%', '85%'], []);

    return (
        <BottomSheetModal
            ref={ref}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            backgroundStyle={styles.sheetBackground}
            handleIndicatorStyle={styles.handle}>
            <BottomSheetView style={styles.content}>
                <Text style={styles.title}>댓글</Text>
                {/* TODO: 메시지 목록(BottomSheetFlatList) + 입력창(BottomSheetTextInput) */}
            </BottomSheetView>
        </BottomSheetModal>
    );
});

export default ReviewChatModal;

const styles = StyleSheet.create({
    sheetBackground: {
        backgroundColor: colors.surface.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    handle: {
        backgroundColor: '#E5E7EA',
        width: 60,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    title: {
        ...typography.b1,
        color: colors.text.basic,
        paddingVertical: spacing.md,
    },
});
