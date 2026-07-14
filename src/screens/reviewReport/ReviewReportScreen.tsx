import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../types/navigation';
import PlaceDetailHeader from '../../components/placeDetail/PlaceDetailHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReportReasonItem from '../../components/reviewReport/ReportReasonItem';
import { useState } from 'react';
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

    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            <PlaceDetailHeader title="리뷰 신고" onBack={() => navigation.goBack()} />
            <View style={styles.content}>
                <Text style={styles.title}>신고 사유를 작성해주세요.</Text>
                {REASONS.map(reason => (
                    <ReportReasonItem
                        key={reason}
                        label={reason}
                        selected={selected === reason}
                        onPress={() => setSelected(reason)}
                    />
                ))}
                <View style={styles.inputBox}>
                    <TextInput
                        style={styles.input}
                        multiline
                        maxLength={100}
                        placeholder='상세한 신고 사유를 작성해주세요.'
                        placeholderTextColor={colors.text.disabled}
                        onChangeText={setComment}
                        value={comment}
                    />
                    <Text style={styles.counter}>
                        <Text style={styles.counterNum}>{comment.length}</Text>
                        {' / 100'}
                    </Text>
                </View>
            </View>
            <View style={[styles.buttonWrapper, {paddingBottom: insets.bottom + spacing.md}]}>
                {showToast && <ReportToast />}
                <ReportButton
                    onPress={async () => {
                        if (!selected) return;
                        try {
                            await reportReview(reviewId, selected);
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
        ...typography.b2,
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
        ...typography.caption2,
        color: colors.text.basic,
        padding: 0,
    },
    counter: {
        ...typography.caption1,
        color: colors.border.default,
        textAlign: 'right',
        marginTop: spacing.xs,
    },
    counterNum: {
        ...typography.caption1,
        color: colors.text.subtle,
    },
    buttonWrapper: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        gap: spacing.md,
        alignItems: 'center',
    },
});
