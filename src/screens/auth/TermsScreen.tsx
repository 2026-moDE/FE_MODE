import React, {useState} from 'react';
import {
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {AuthStackParamList} from '../../types/navigation';
import {colors} from '../../constants/colors';
import {fontFamily, fontSize} from '../../constants/typography';

// api 연결시 삭제
// const [terms, setTerms] = useState<TermItem[]>([]); 얘로 수정
import {termsMock} from '../../mocks/termsMock';

const appliedFontFamily = fontFamily ?? {
  bold: 'Pretendard-Bold',
  regular: 'Pretendard-Regular',
};

const logo = require('../../assets/image/logo_navy.png');

type Props = NativeStackScreenProps<AuthStackParamList, 'Terms'>;

export default function TermsScreen({navigation}: Props) {
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

    navigation.navigate('ProfileSetup');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.container}>
        <View style={styles.content}>
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
                  text={`[${term.required ? '필수' : '선택'}] ${term.title}`}
                  checked={checkedTerms.includes(term.id)}
                  onPress={() => handleTermCheck(term.id)}
                />
              ))}
            </View>
            </View>
          </View>
        </View>

        <Pressable
          style={[
            styles.bottomButton,
            !requiredChecked && styles.bottomButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!requiredChecked}>
          <Text style={styles.bottomButtonText}>동의하기</Text>
        </Pressable>
    </SafeAreaView>
  );
}

type TermRowProps = {
  text: string;
  checked: boolean;
  onPress: () => void;
};

function TermRow({text, checked, onPress}: TermRowProps) {
  return (
    <Pressable style={styles.termRow} onPress={onPress}>
      <View style={styles.termLeft}>
        <Text style={[styles.termCheck, checked && styles.termCheckActive]}>
          ✓
        </Text>

        <Text style={styles.termText}>{text}</Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'space-between',
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.white,
  },

  content: {
    alignItems: 'center',
    paddingTop: 160,
  },


  logo: {
    width: 94,
    height: 50,
    marginBottom: 16,
  },

  title: {
    color: colors.gray[900],
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.48,
    textAlign: 'center',
    fontFamily: appliedFontFamily.bold,
    includeFontPadding: false,
  },

  agreementArea: {
    width: '100%',
    marginTop: 102,
    alignItems: 'center',
  },

  allAgreeBox: {
    width: 360,
    height: 52,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkIcon: {
    width: 18,
    height: 18,
    color: colors.gray[300],
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: appliedFontFamily.bold,
  },

  checkIconActive: {
    color: colors.navy[900],
  },

  allAgreeText: {
    marginLeft: 10,
    color: colors.gray[500],
    fontSize: 14,
    fontWeight: '600',
    fontFamily: appliedFontFamily.bold,
  },
  termList: {
    width: 360,
    marginTop: 40,
  },

  termRow: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  termLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  termCheck: {
    width: 18,
    height: 18,
    color: colors.gray[300],
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: appliedFontFamily.bold,
  },


  termCheckActive: {
    color: colors.navy[900],
  },

  termText: {
    marginLeft: 10,
    color: colors.gray[600],
    fontSize: 13,
    fontWeight: '500',
    fontFamily: appliedFontFamily.regular,
  },
  arrow: {
    color: colors.gray[300],
    fontSize: 20,
    fontWeight: '300',
  },

  bottomButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.navy[900],
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomButtonDisabled: {
    backgroundColor: colors.gray[200],
  },

  bottomButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: appliedFontFamily.bold,
  },
});