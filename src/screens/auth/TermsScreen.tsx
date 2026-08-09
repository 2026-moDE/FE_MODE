import React, {useState} from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {AuthStackParamList} from '../../types/navigation';
import {colors} from '../../constants/colors';
import {fontFamily} from '../../constants/typography';
import IconChevronDown from '../../assets/icons/IconChevronDown';
import TermsBodyText from '../../components/terms/TermsBodyText';

// api 연결시 삭제
// const [terms, setTerms] = useState<TermItem[]>([]); 얘로 수정
import {termsMock} from '../../mocks/termsMock';

const appliedFontFamily = fontFamily ?? {
  bold: 'Pretendard-Bold',
  regular: 'Pretendard-Regular',
};

const logo = require('../../assets/image/logo_navy.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type Props = NativeStackScreenProps<AuthStackParamList, 'Terms'>;

export default function TermsScreen({navigation}: Props) {
  const [checkedTerms, setCheckedTerms] = useState<number[]>([]);
  const [openTermId, setOpenTermId] = useState<number | null>(null);

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

  const handleTermToggle = (id: number) => {
    setOpenTermId(prev => (prev === id ? null : id));
  };

  const handleNext = () => {
    if (!requiredChecked) {
      return;
    }

    navigation.navigate('ProfileSetup', {
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
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />

          <Text style={styles.title}>
            서비스 이용을 위한{'\n'}약관동의가 필요해요.
          </Text>

          <View style={styles.agreementArea}>
            <Pressable style={styles.allAgreeBox} onPress={handleAllCheck}>
              <Text
                style={[
                  styles.checkIcon,
                  allChecked && styles.checkIconActive,
                ]}>
                ✓
              </Text>

              <Text style={styles.allAgreeText}>전체 동의하기</Text>
            </Pressable>

            <View style={styles.termList}>
              {termsMock.map(term => (
                <TermRow
                  key={term.id}
                  text={`(${term.required ? '필수' : '선택'}) ${term.title}`}
                  body={term.body}
                  checked={checkedTerms.includes(term.id)}
                  isOpen={openTermId === term.id}
                  onCheckPress={() => handleTermCheck(term.id)}
                  onTogglePress={() => handleTermToggle(term.id)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

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
            동의하기
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type TermRowProps = {
  text: string;
  body: string;
  checked: boolean;
  isOpen: boolean;
  onCheckPress: () => void;
  onTogglePress: () => void;
};

function TermRow({
  text,
  body,
  checked,
  isOpen,
  onCheckPress,
  onTogglePress,
}: TermRowProps) {
  return (
    <View>
      <View style={styles.termRow}>
        <Pressable style={styles.termLeft} onPress={onCheckPress}>
          <Text style={[styles.termCheck, checked && styles.termCheckActive]}>
            ✓
          </Text>

          <Text style={styles.termText}>{text}</Text>
        </Pressable>

        <Pressable onPress={onTogglePress}>
          <View style={isOpen && styles.chevronOpen}>
            <IconChevronDown size={px(20)} color={colors.gray[300]} />
          </View>
        </Pressable>
      </View>

      {isOpen && (
        <View style={styles.termBody}>
          <TermsBodyText text={body} />
        </View>
      )}
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
    paddingHorizontal: px(16),
    paddingBottom: px(16),
    backgroundColor: colors.white,
  },

  // 버튼이 바로 뒤에 80 간격으로 붙고, 내용이 길어지면 남는 공간만큼만
  // 줄어들며 스크롤되어 버튼 바로 위까지 빈틈없이 내용이 보이게 됨
  scrollArea: {
    flex:1,
  },

  scrollContent: {
    paddingHorizontal: px(16),
    paddingTop: px(100),
    paddingBottom: 0,
    alignItems: 'center',
  },

  logo: {
    width: px(94),
    height: px(50),
    marginBottom: px(40),
  },

  title: {
    color: colors.gray[900],
    fontSize: px(24),
    fontWeight: '700',
    lineHeight: px(28),
    letterSpacing: px(-0.48),
    textAlign: 'center',
    fontFamily: appliedFontFamily.bold,
    includeFontPadding: false,
  },

  agreementArea: {
    width: '100%',
    marginTop: px(102),
    alignItems: 'center',
  },

  allAgreeBox: {
    width: '100%',
    height: px(52),
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: px(12),
    paddingHorizontal: px(16),
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkIcon: {
    width: px(18),
    height: px(18),
    color: colors.gray[300],
    fontSize: px(14),
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: appliedFontFamily.bold,
  },

  checkIconActive: {
    color: colors.navy[900],
  },

  allAgreeText: {
    marginLeft: px(10),
    color: colors.gray[400],
    fontSize: px(14),
    fontWeight: '600',
    fontFamily: appliedFontFamily.bold,
  },
  termList: {
    width: '100%',
    marginTop: px(40),
    gap: px(6),
  },

  termRow: {
    paddingVertical: px(6),
    paddingHorizontal: px(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  termLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  termCheck: {
    width: px(18),
    height: px(18),
    color: colors.gray[300],
    fontSize: px(14),
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: appliedFontFamily.bold,
  },

  termCheckActive: {
    color: colors.navy[900],
  },

  termText: {
    marginLeft: px(10),
    color: colors.gray[500],
    fontSize: px(14),
    fontWeight: '400',
    lineHeight: px(18),
    letterSpacing: px(-0.28),
    fontFamily: appliedFontFamily.regular,
  },
  chevronOpen: {
    transform: [{rotate: '180deg'}],
  },

  termBody: {
    marginTop: px(8),
    paddingHorizontal: px(16),
    paddingBottom: px(10),
  },

  bottomButton: {
    marginTop: 0,
    flexShrink: 0,
    height: px(52),
    borderRadius: px(12),
    backgroundColor: colors.navy[900],
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomButtonDisabled: {
    backgroundColor: colors.gray[200],
  },

  bottomButtonText: {
    color: colors.white,
    fontSize: px(16),
    fontWeight: '700',
    fontFamily: appliedFontFamily.bold,
  },

  bottomButtonTextDisabled: {
    color: colors.gray[500],
  },
});
