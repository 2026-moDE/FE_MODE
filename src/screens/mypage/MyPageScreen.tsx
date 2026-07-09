import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NaverMapViewRef} from '@mj-studio/react-native-naver-map';

import {fontFamily} from '../../constants/typography';
import ProfileSection from '../../components/mypage/ProfileSection';
import ReviewSection from '../../components/mypage/ReviewSection';
import MapView from '../../components/map/MapView';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {logoutApi} from '../../api/auth';
import {useAuth} from '../../context/AuthContext';

const settingIcon = require('../../assets/image/setting.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type TabType = 'review' | 'mymap';

export default function MypageScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabType>('review');
  const mapRef = useRef<NaverMapViewRef>(null);
  const {setIsLoggedIn} = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await logoutApi();
      setIsLoggedIn(false);
    } catch (error) {
      console.log('[로그아웃 실패]', error);
      Alert.alert('로그아웃 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerButton}
            onPress={() => navigation.goBack()}>
            <IconArrowLeft size={px(20)} color="#2C343F" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>마이페이지</Text>

          <TouchableOpacity activeOpacity={0.7} style={styles.headerButton}>
            <Image
              source={settingIcon}
              style={styles.settingImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <ProfileSection />

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.logoutButton,
            isLoggingOut && styles.logoutButtonDisabled,
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}>
          <Text style={styles.logoutButtonText}>
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </Text>
        </TouchableOpacity>

        <View style={styles.tabRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.tabButton}
            onPress={() => setActiveTab('review')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'review' && styles.activeTabText,
              ]}>
              리뷰
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.tabButton}
            onPress={() => setActiveTab('mymap')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'mymap' && styles.activeTabText,
              ]}>
              마이맵
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabLine}>
          <View
            style={[
              styles.activeLine,
              activeTab === 'mymap' && styles.activeLineRight,
            ]}
          />
        </View>

        {activeTab === 'review' ? (
          <ReviewSection />
        ) : (
          <View style={styles.myMapContainer}>
            <MapView
              ref={mapRef}
              initialCamera={{
                latitude: 37.5665,
                longitude: 126.978,
                zoom: 6,
              }}
              isShowLocationButton={false}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: px(54),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: px(16),
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
    color: '#111114',
  },

  settingImage: {
    width: px(22),
    height: px(22),
    tintColor: '#2C343F',
  },

  logoutButton: {
    alignSelf: 'center',
    minWidth: px(96),
    height: px(34),
    paddingHorizontal: px(18),
    marginBottom: px(14),
    borderRadius: px(17),
    borderWidth: 1,
    borderColor: '#E0E0E4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  logoutButtonDisabled: {
    opacity: 0.5,
  },

  logoutButtonText: {
    fontSize: px(13),
    fontFamily: fontFamily.medium,
    color: '#5C5D68',
  },

  tabRow: {
    height: px(38),
    flexDirection: 'row',
    alignItems: 'center',
  },

  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabText: {
    fontSize: px(14),
    fontFamily: fontFamily.medium,
    color: '#5C5D68',
  },

  activeTabText: {
    fontFamily: fontFamily.bold,
    color: '#111114',
  },

  tabLine: {
    height: 1,
    backgroundColor: '#E0E0E4',
  },

  activeLine: {
    width: SCREEN_WIDTH / 2,
    height: px(2),
    backgroundColor: '#111114',
  },

  activeLineRight: {
    marginLeft: SCREEN_WIDTH / 2,
  },

  myMapContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
