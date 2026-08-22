import { BottomSheetModal, BottomSheetFlatList, BottomSheetFooter, BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../../constants/colors";
import { spacing, gap, padding } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { radius } from "../../constants/radius";
import BlurBackdrop from "../common/BlurBackdrop";
import ReviewCommentItem from "./ReviewCommentItem";
import CommentInput from "./CommentInput";
import { ReviewComment, createComment, createReply, deleteComment, fetchComments } from "../../api/review";
import type { AppStackParamList } from "../../types/navigation";

const checkWhiteIcon = require("../../assets/image/check_white.png");

type Props = {
    reviewId?: number;   // 어떤 리뷰의 채팅인지
    // 전체 공개 / 친구 공개
    reviewVisibility?: 'PUBLIC' | 'FRIENDS';
    // true면 조회만 가능 - 입력창(댓글/답글) 자체가 필요없으니까 마이페이지에서 사용하면 됨!!
    readOnly?: boolean;
    ref?: React.Ref<BottomSheetModal>;
};

// 리뷰 사진 댓글/채팅 바텀시트
// ref로 present()/dismiss()를 ReviewPhoto에 노출
export default function ReviewChatModal({reviewId, reviewVisibility, readOnly, ref}: Props) {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const snapPoints = useMemo(() => ['50%', '85%'], []);

    const sheetRef = useRef<BottomSheetModal>(null);
    useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal);

    const [comments, setComments] = useState<ReviewComment[]>([]);

    // 댓글 목록 조회는 커서 페이지네이션(기본 20개씩)이라, 커서가 끝날 때까지 이어서 다 불러옴
    const loadComments = useCallback(async () => {
        if (!reviewId) return;
        try {
            let cursor: number | undefined;
            let all: ReviewComment[] = [];
            do {
                const res = await fetchComments(reviewId, cursor !== undefined ? {cursor} : undefined);
                all = all.concat(res.comments);
                cursor = res.next_cursor ?? undefined;
            } while (cursor !== undefined); // 커서 남아있는 동안 계속 실행
            setComments(all);
        } catch (err: any) {
            console.warn('댓글 목록 조회 실패:', err?.message);
        }
    }, [reviewId]);

    // 리뷰 바뀔 때마다(or 처음 열릴 때) 댓글 목록 불러오기
    useEffect(() => {
        loadComments();
    }, [loadComments]);

    // 댓글 작성하면 댓글 작성한 곳으로 애니메이션 이동
    // 방금 작성한 댓글 실제 id로 새로고침된 목록에서 위치를 찾아 그쪽으로 스크롤
    const listRef = useRef<React.ComponentRef<typeof BottomSheetFlatList>>(null);
    const scrollToCommentIdRef = useRef<number | null>(null);
    useEffect(() => {
        if (scrollToCommentIdRef.current === null) return;
        const commentId = scrollToCommentIdRef.current; // handleSubmitComment에서 id준 거 가져옴
        scrollToCommentIdRef.current = null;
        const index = comments.findIndex(c => c.id === commentId);
        if (index >= 0) {
            requestAnimationFrame(() => {
                listRef.current?.scrollToIndex({index, animated: true, viewPosition: 1});
            });
        }
    }, [comments]);

    const renderBackdrop = useCallback(
        (props: React.ComponentProps<typeof BlurBackdrop>) => (
            <BlurBackdrop {...props} onPress={() => sheetRef.current?.dismiss()} />
        ),
        [],
    );

    // 답글 펼친 댓글 id 목록
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const toggleReplies = useCallback((id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // 답글 입력창 포커스 중이면(답글 쓰는 중) 댓글 입력창 숨김
    const [isReplyFocused, setIsReplyFocused] = useState(false);

    // 새 댓글 작성 - 서버에 저장 후 목록 다시 조회해서 반영
    const [isSecret, setIsSecret] = useState(false);
    const handleSubmitComment = useCallback((text: string) => {
        if (!reviewId) return;
        setIsSecret(false);
        createComment(reviewId, {content: text, is_secret: isSecret})
            .then(res => {
                scrollToCommentIdRef.current = res.id; // id넘겨서 나중에 찾을 수 있도록
                loadComments();
            })
            .catch(err => console.warn('댓글 작성 실패:', err?.message));
    }, [reviewId, isSecret, loadComments]);

    // 답글 작성 - 댓글 아이템 안의 입력창
    const handleSubmitReply = useCallback((commentId: number, text: string) => {
        if (!reviewId) return;
        createReply(reviewId, commentId, {content: text})
            .then(loadComments)
            .catch(err => console.warn('답글 작성 실패:', err?.message));
    }, [reviewId, loadComments]);

    // 댓글 삭제 - 누르자마자 로컬에서 바로 "삭제된 댓글입니다"로 바꾸고, 실제 삭제는 백그라운드로
    const [showDeleteToast, setShowDeleteToast] = useState(false);
    const deleteToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            if (deleteToastTimerRef.current) clearTimeout(deleteToastTimerRef.current);
        };
    }, []);
    // 답글엔 아직 ⋮ 메뉴가 없어서 항상 최상위 댓글만 삭제됨
    const handleDeleteComment = useCallback((commentId: number) => {
        if (!reviewId) return;
        setComments(prev => {
            const target = prev.find(c => c.id === commentId);
            // 답글이 없으면 목록에서 바로 제거, 있으면 "삭제된 댓글입니다"로 표시
            return target && target.replies.length === 0
                ? prev.filter(c => c.id !== commentId)
                : prev.map(c => c.id === commentId ? {...c, is_deleted: true} : c);
        });
        deleteComment(reviewId, commentId)
            .catch(err => console.warn('댓글 삭제 실패:', err?.message));

        // "댓글이 삭제되었어요" 토스트 3초간 노출
        if (deleteToastTimerRef.current) clearTimeout(deleteToastTimerRef.current);
        setShowDeleteToast(true);
        deleteToastTimerRef.current = setTimeout(() => setShowDeleteToast(false), 3000);
    }, [reviewId]);

    // 댓글 신고 - 신고 페이지로 넘어감 (API는 아직 리뷰 신고용이라 미연결 - commentId만 같이 넘겨둠)
    const handleReportComment = useCallback((commentId: number) => {
        if (!reviewId) return;
        navigation.navigate('ReviewReport', {reviewId, commentId});
    }, [reviewId, navigation]);

    // 댓글/답글 작성자 프로필 사진·닉네임 탭 - 다른 유저 마이페이지로 이동
    const handlePressUser = useCallback((userId: number) => {
        navigation.navigate('UserMyPage', {userId});
    }, [navigation]);

    // 입력창을 시트 전용 footer로 렌더링
    const renderFooter = useCallback(
        (props: BottomSheetFooterProps) => (
            <BottomSheetFooter {...props} bottomInset={43}>
                <View style={styles.inputWrapper}>
                    {showDeleteToast && (
                        <View style={styles.deleteToast}>
                            <Image source={checkWhiteIcon} style={styles.deleteToastIcon} resizeMode="contain" />
                            <Text style={styles.deleteToastText}>댓글이 삭제되었어요</Text>
                        </View>
                    )}
                    <CommentInput
                        onSubmit={handleSubmitComment}
                        showSecretCheckbox={reviewVisibility === 'FRIENDS'}
                        isSecret={isSecret}
                        onToggleSecret={() => setIsSecret(prev => !prev)}
                    />
                </View>
            </BottomSheetFooter>
        ),
        [handleSubmitComment, reviewVisibility, isSecret, showDeleteToast],
    );

    return (
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            keyboardBlurBehavior="restore"
            backgroundStyle={styles.sheetBackground}
            handleIndicatorStyle={styles.handle}
            backdropComponent={renderBackdrop}
            footerComponent={readOnly || isReplyFocused ? undefined : renderFooter}
            onDismiss={() => setExpandedIds(new Set())}>
            <BottomSheetFlatList
                ref={listRef}
                contentContainerStyle={[styles.listContent, readOnly && styles.listContentReadOnly]}
                data={comments}
                keyExtractor={item => String(item.id)}
                keyboardShouldPersistTaps="handled"
                onScrollToIndexFailed={info => {
                    setTimeout(() => {
                        listRef.current?.scrollToIndex({index: info.index, animated: true, viewPosition: 1});
                    }, 100);
                }}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({item}) => (
                    <ReviewCommentItem
                        comment={item}
                        repliesExpanded={expandedIds.has(item.id)}
                        onPressReplyToggle={() => toggleReplies(item.id)}
                        onSubmitReply={text => handleSubmitReply(item.id, text)}
                        onReplyFocusChange={setIsReplyFocused}
                        onDeleteComment={() => handleDeleteComment(item.id)}
                        onReportComment={() => handleReportComment(item.id)}
                        onPressUser={handlePressUser}
                        readOnly={readOnly}
                    />
                )}
            />
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    sheetBackground: {
        backgroundColor: colors.background.dimDarkest,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    handle: {
        backgroundColor: colors.surface.white,
        width: 75,
    },
    listContent: {
        paddingHorizontal: spacing.xl,     // 20
        paddingTop: gap.md,        // 12 - 핸들 ↔ 첫 댓글
        paddingBottom: 110,   // 하단 고정 입력창에 안 가리게
    },
    listContentReadOnly: {
        paddingBottom: gap.md,   // 입력창이 없으니 여유 공간도 필요 없음
    },
    separator: {
        height: gap.md,   // 12
    },
    inputWrapper: {
        paddingHorizontal: spacing.xl,     // 20 - footer는 content 밖이라 패딩 따로 필요
        paddingTop: gap.lg,                // 16 - 키보드/리스트 ↔ 입력창
        position: 'relative',              // 토스트를 얹을 기준점 (레이아웃 흐름엔 안 끼게)
    },
    deleteToast: {
        position: 'absolute',
        bottom: '100%',
        left: spacing.xl,
        right: spacing.xl,
        marginBottom: gap.lg,              // 16 - 토스트 ↔ 입력창
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: gap.sm,                       // 8
        paddingVertical: padding.sm,        // 10
        paddingHorizontal: padding.lg,      // 16
        backgroundColor: colors.background.dimDarker,
        borderRadius: radius.md,            // 8
    },
    deleteToastIcon: {
        width: 16,
        height: 16,
    },
    deleteToastText: {
        ...typography.b5,
        color: colors.text.inverse,
    },
});
