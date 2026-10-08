import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../types/navigation';
import Header from '../../components/common/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReportReasonItem from '../../components/reviewReport/ReportReasonItem';
import { useState, useRef } from 'react';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {spacing} from '../../constants/spacing';
import { TextInput } from 'react-native';
import {radius} from '../../constants/radius';
import ReportButton from '../../components/reviewReport/ReportButton';
import ReportToast from '../../components/reviewReport/ReportToast';
import {reportReview} from '../../api/review';

type Props = NativeStackScreenProps<AppStackParamList, 'ReviewReport'>;
const REASONS = [
    '욕설 · 비방이 포함되어 있어요',
    '허위 또는 거짓 리뷰예요',
    '광고 · 홍보 목적의 글이에요',
    '개인정보가 포함되어 있어요',
    '부적절한 표현이 포함되어 있어요',
    '기타',
];

export default function ReviewReportScreen({navigation, route}: Props) {
    const {reviewId} = route.params;
    const insets = useSafeAreaInsets();
    const [selected, setSelected]= useState<string | null>(null);
    const [comment,setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const commentInputRef = useRef<TextInput>(null);

    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            <Header title="리뷰 신고" onBack={() => navigation.goBack()} />
            <View style={styles.content}>
                <Text style={styles.title}>신고 사유를 작성해주세요.</Text>
                {REASONS.map(reason => (
                    <ReportReasonItem
                        key={reason}
                        label={reason}
                        selected={selected === reason}
                        onPress={() => {
                            setSelected(reason);

                            // '기타' 라디오 자체를 누른 거면 코멘트를 건드릴 필요 없음
                            if (reason === '기타') return;

                            // 다른 사유로 바꾼 거면, 기타에 적어뒀던 코멘트는 의미 없어지므로 초기화
                            setComment('');
                            // 텍스트 인풋의 포커스도 강제로 풀어줘야
                            // 나중에 인풋을 다시 눌렀을 때 onFocus가 다시 발생
                            commentInputRef.current?.blur();
                        }}
                    />
                ))}
                <Pressable style={styles.inputBox} onPress={() => setSelected('기타')}>
                    <TextInput
                        ref={commentInputRef}
                        style={styles.input}
                        multiline
                        maxLength={100}
                        placeholder='상세한 신고 사유를 작성해주세요.'
                        placeholderTextColor={colors.text.disabled}
                        onChangeText={text => {
                            setComment(text);
                            setSelected('기타');
                        }}
                        onFocus={() => setSelected('기타')}
                        value={comment}
                    />
                    <Text style={styles.counter}>
                        <Text style={styles.counterNum}>{comment.length}</Text>
                        {' / 100'}
                    </Text>
                </Pressable>
            </View>
            <View style={[styles.buttonWrapper, {paddingBottom: insets.bottom + spacing.md}]}>
                {showToast && <ReportToast />}
                <ReportButton
                    onPress={async () => {
                        if (!selected) return;
                        try {
                            await reportReview(reviewId, {reason: selected, detail:comment||undefined});
                            setSubmitted(true);
                            setShowToast(true);
                            setTimeout(() => {
                                setShowToast(false);
                                navigation.goBack();
                            }, 1000);
                        } catch (error) {
                            console.error('신고 실패:', error);
                        }
                    }}
                    disabled={selected === null || submitted}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface.white,
    },
    content: {
        flex: 1,
    },
    title: {
        ...typography.b3,
        color: colors.text.basic,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    inputBox: {
        borderWidth: 1,
        borderColor: colors.border.default,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
    },
    input: {
        height: 120,
        textAlignVertical: 'top',
        ...typography.c2,
        color: colors.text.basic,
        padding: 0,
    },
    counter: {
        ...typography.c1,
        color: colors.border.default,
        textAlign: 'right',
        marginTop: spacing.xs,
    },
    counterNum: {
        ...typography.c1,
        color: colors.text.subtle,
    },
    buttonWrapper: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        gap: spacing.md,
        alignItems: 'center',
    },
});
