import { BottomSheetModal, BottomSheetFlatList, BottomSheetFooter, BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import { spacing, gap } from "../../constants/spacing";
import BlurBackdrop from "../common/BlurBackdrop";
import ReviewCommentItem from "./ReviewCommentItem";
import CommentInput from "./CommentInput";
import { ReviewComment, createComment, createReply, fetchComments } from "../../api/review";

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
    const snapPoints = useMemo(() => ['50%', '85%'], []);

    const sheetRef = useRef<BottomSheetModal>(null);
    useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal);

    const [comments, setComments] = useState<ReviewComment[]>([]);

    // 댓글 목록 조회는 커서 페이지네이션(기본 20개씩)이라, 커서가 끝날 때까지 이어서 다 불러옴
    // (지금은 무한스크롤 UI가 없어서 전체를 한 번에 로드 - 댓글이 아주 많아지면 요청 수가 늘어남)
    const loadComments = useCallback(async () => {
        if (!reviewId) return;
        try {
            let cursor: number | undefined;
            let all: ReviewComment[] = [];
            do {
                const res = await fetchComments(reviewId, cursor !== undefined ? {cursor} : undefined);
                all = all.concat(res.comments);
                cursor = res.next_cursor ?? undefined;
            } while (cursor !== undefined);
            setComments(all);
        } catch (err: any) {
            console.warn('댓글 목록 조회 실패:', err?.message);
        }
    }, [reviewId]);

    // 리뷰 바뀔 때마다(or 처음 열릴 때) 댓글 목록 불러오기
    useEffect(() => {
        loadComments();
    }, [loadComments]);

    // 댓글 목록 정렬 순서(최신순/오래된순)가 명세서에 없어서 순서를 가정하지 않음
    // 방금 작성한 댓글/답글의 실제 id로 새로고침된 목록에서 위치를 찾아 그쪽으로 스크롤
    const listRef = useRef<React.ComponentRef<typeof BottomSheetFlatList>>(null);
    const scrollToCommentIdRef = useRef<number | null>(null);
    useEffect(() => {
        if (scrollToCommentIdRef.current === null) return;
        const commentId = scrollToCommentIdRef.current;
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
                scrollToCommentIdRef.current = res.id;
                loadComments();
            })
            .catch(err => console.warn('댓글 작성 실패:', err?.message));
    }, [reviewId, isSecret, loadComments]);

    // 답글 작성 - 댓글 아이템 안의 입력창 (답글은 자동 스크롤 대상 아님)
    const handleSubmitReply = useCallback((commentId: number, text: string) => {
        if (!reviewId) return;
        createReply(reviewId, commentId, {content: text})
            .then(loadComments)
            .catch(err => console.warn('답글 작성 실패:', err?.message));
    }, [reviewId, loadComments]);

    // 입력창을 시트 전용 footer로 렌더링
    const renderFooter = useCallback(
        (props: BottomSheetFooterProps) => (
            <BottomSheetFooter {...props} bottomInset={43}>
                <View style={styles.inputWrapper}>
                    <CommentInput
                        onSubmit={handleSubmitComment}
                        showSecretCheckbox={reviewVisibility === 'FRIENDS'}
                        isSecret={isSecret}
                        onToggleSecret={() => setIsSecret(prev => !prev)}
                    />
                </View>
            </BottomSheetFooter>
        ),
        [handleSubmitComment, reviewVisibility, isSecret],
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
        backgroundColor: colors.background.dimDarkest,
    },
});
