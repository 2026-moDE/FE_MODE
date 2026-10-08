import React, {useState} from 'react';
import {Image, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps, NativeStackNavigationProp} from '@react-navigation/native-stack';

import type {AuthStackParamList, AppStackParamList} from '../../types/navigation';
import {colors} from '../../constants/colors';
import {fontFamily, typography} from '../../constants/typography';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import IconChevronDown from '../../assets/icons/IconChevronDown';
import IconCheck from '../../assets/icons/IconCheck';

// api 연결시 삭제
// const [terms, setTerms] = useState<TermItem[]>([]); 얘로 수정
import {termsMock} from '../../mocks/termsMock';

const appliedFontFamily = fontFamily ?? {
  bold: 'Pretendard-Bold',
  regular: 'Pretendard-Regular',
};

const logo = require('../../assets/image/logo_new.png');

// AuthStack('Terms')과 AppStack('TermsAgreement') 양쪽에서 재사용됨
type Props =
  | NativeStackScreenProps<AuthStackParamList, 'Terms'>
  | NativeStackScreenProps<AppStackParamList, 'TermsAgreement'>;

export default function TermsScreen({navigation, route}: Props) {
  // AppStack에서 열렸을 때(viewOnly)는 "다음"이 아니라 뒤로가기만 함
  const viewOnly = route.params?.viewOnly ?? false;
  const [checkedTerms, setCheckedTerms] = useState<number[]>([]);

  // termsMock 쓰던 부분은 api 연결 후 terms로 수정
  const requiredChecked = termsMock
    .filter(term => term.required)
    .every(term => checkedTerms.includes(term.id));

  const allChecked = checkedTerms.length === termsMock.length;

  const handleAllCheck = () => {
    if (allChecked) {
      setCheckedTerms([]);
    } else {
      setCheckedTerms(termsMock.map(term => term.id));
    }
  };

  const handleTermCheck = (id: number) => {
    setCheckedTerms(prev =>
      prev.includes(id)
        ? prev.filter(termId => termId !== id)
        : [...prev, id],
    );
  };

  const handleNext = () => {
    if (!requiredChecked) {
      return;
    }

    // 이미 로그인된 상태에서 약관만 다시 보러 온 경우(viewOnly) - 가입 플로우로 안 이어감
    if (viewOnly) {
      navigation.goBack();
      return;
    }

    // 여기까지 왔다면 회원가입 중(AuthStack)이라는 뜻 - ProfileSetup은 AuthStack에만 있음
    (navigation as NativeStackNavigationProp<AuthStackParamList, 'Terms'>).navigate('ProfileSetup', {
      terms_agreed: checkedTerms.includes(1),
      location_terms_agreed: checkedTerms.includes(2),
      privacy_agreed: checkedTerms.includes(3),
      marketing_agreed: checkedTerms.includes(4),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.container}>
        <View style={styles.topSection}>
          <Image
            source={logo}
            tintColor={colors.brand.secondary}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            서비스 이용을 위한{'\n'}약관동의가 필요해요.
          </Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.agreementArea}>
          <Pressable style={styles.allAgreeBox} onPress={handleAllCheck}>
            <IconCheck
              size={18}
              color={allChecked ? colors.navy[900] : colors.icon.tertiary}
            />

            <Text
              style={[
                styles.allAgreeText,
                allChecked && styles.allAgreeTextActive,
              ]}>
              전체 동의하기
            </Text>
          </Pressable>

          <View style={styles.termList}>
            {termsMock.map(term => (
              <TermRow
                key={term.id}
                text={`(${term.required ? '필수' : '선택'}) ${term.title}`}
                checked={checkedTerms.includes(term.id)}
                onCheckPress={() => handleTermCheck(term.id)}
                onDetailPress={() =>
                  (
                    navigation as NativeStackNavigationProp<
                      AuthStackParamList,
                      'Terms'
                    >
                  ).navigate('TermsOfService', {initialOpenId: term.id})
                }
              />
            ))}
          </View>
        </View>

        <Pressable
          style={[
            styles.bottomButton,
            !requiredChecked && styles.bottomButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!requiredChecked}>
          <Text
            style={[
              styles.bottomButtonText,
              !requiredChecked && styles.bottomButtonTextDisabled,
            ]}>
            완료
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type TermRowProps = {
  text: string;
  checked: boolean;
  onCheckPress: () => void;
  onDetailPress: () => void;
};

function TermRow({text, checked, onCheckPress, onDetailPress}: TermRowProps) {
  return (
    <View style={styles.termRow}>
      <Pressable style={styles.termLeft} onPress={onCheckPress}>
        <IconCheck
          size={18}
          color={checked ? colors.icon.subtle : colors.gray[300]}
        />

        <Text style={styles.termText}>{text}</Text>
      </Pressable>

      <Pressable onPress={onDetailPress}>
        <IconChevronDown
          size={20}
          color={colors.icon.tertiary}
          style={styles.chevronRight}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.white,
  },

  topSection: {
    paddingTop: 139,
    alignItems: 'center',
  },

  // 타이틀~전체동의 박스 사이 남는 공간을 유동적으로 채워서, 화면 크기와 무관하게
  // 약관 4개 + 버튼이 스크롤 없이 한 화면에 항상 들어오게 함
  spacer: {
    flex: 1,
  },

  logo: {
    width: 94,
    height: 50,
    marginBottom: spacing['2xl'],
  },

  title: {
    ...typography.b3,
    color: colors.gray[900],
    textAlign: 'center',
    includeFontPadding: false,
  },

  agreementArea: {
    width: '100%',
    alignItems: 'center',
  },

  allAgreeBox: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  allAgreeText: {
    marginLeft: 10,
    color: colors.text.disabled,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: appliedFontFamily.bold,
  },

  allAgreeTextActive: {
    color: colors.navy[900],
  },

  termList: {
    width: '100%',
    marginTop: spacing['3xl'],
    gap: 20,
  },

  termRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  termLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  termText: {
    ...typography.b6,
    marginLeft: 10,
    color: colors.text.subtle,
  },
  chevronRight: {
    transform: [{rotate: '-90deg'}],
  },

  bottomButton: {
    marginTop: spacing['4xl'],
    flexShrink: 0,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomButtonDisabled: {
    backgroundColor: colors.button.disabledFill,
  },

  bottomButtonText: {
    ...typography.b1,
    color: colors.text.inverse,
  },

  bottomButtonTextDisabled: {
    color: colors.gray[500],
  },
});
