import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconChevronDown from '../../assets/icons/IconChevronDown';
import TermsBodyText from '../../components/terms/TermsBodyText';
import {termsMock} from '../../mocks/termsMock';

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

export default function TermsOfServiceScreen() {
  const navigation = useNavigation<any>();
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleSection = (id: number) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.white} />

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <IconArrowLeft size={px(20)} color={colors.icon.basic} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>이용 약관</Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {termsMock.map(section => {
          const isOpen = openId === section.id;

          return (
            <View key={section.id} style={styles.sectionWrapper}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.sectionRow}
                onPress={() => toggleSection(section.id)}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={isOpen && styles.chevronOpen}>
                  <IconChevronDown size={px(24)} color={colors.icon.tertiary} />
                </View>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.sectionBody}>
                  <TermsBodyText text={section.body} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  header: {
    height: px(54),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: px(spacing.lg),
  },

  headerButton: {
    width: px(34),
    height: px(34),
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: px(18),
    color: colors.text.basic,
  },

  scrollContent: {
    paddingBottom: px(spacing['2xl']),
  },

  sectionWrapper: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: colors.border.default,
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: px(spacing.lg),
    paddingHorizontal: px(spacing['2xl']),
  },

  sectionTitle: {
    fontSize: px(18),
    fontFamily: fontFamily.bold,
    color: colors.text.basic,
  },

  chevronOpen: {
    transform: [{rotate: '180deg'}],
  },

  sectionBody: {
    paddingHorizontal: px(spacing['2xl']),
    paddingBottom: px(spacing.lg),
  },
});
