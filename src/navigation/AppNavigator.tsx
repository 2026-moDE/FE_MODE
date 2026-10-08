import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppStackParamList, TabParamList } from '../types/navigation';
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import PlaceDetailScreen from '../screens/placeDetail/PlaceDetailScreen';
import MyPageScreen from '../screens/mypage/MyPageScreen';
import CustomTabBar from '../components/map/CustomTabBar';
import ReviewStack from './ReviewStack';
import PieceStack from './PieceStack';
import ProfileEditScreen from '../screens/mypage/ProfileEditScreen';
import PieceEditScreen from '../screens/mypage/PieceEditScreen';
import NotificationScreen from '../screens/notification/NotificationScreen';
import ReviewReportScreen from '../screens/reviewReport/ReviewReportScreen';
import MyMapScreen from '../screens/mypage/MyMapScreen';
import MonthlyReviewScreen from '../screens/mypage/MonthlyReviewScreen';
import SettingScreen from '../screens/mypage/SettingScreen';
import TermsOfServiceScreen from '../screens/mypage/TermsOfServiceScreen';
import TermsScreen from '../screens/auth/TermsScreen';
import FollowListScreen from '../screens/mypage/FollowListScreen';
import FriendSearchScreen from '../screens/mypage/FriendSearchScreen';
import UserMyPageScreen from '../screens/mypage/UserMyPageScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();


// 하단 탭 네비게이션 (리뷰 쓰기 / 홈 / 마이페이지)
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{headerShown: false}}
      initialRouteName="Home"
      backBehavior="initialRoute">
      {/* 리뷰 작성은 탭바에 버튼이 없고(CustomTabBar의 TAB_ORDER) 전부 루트 스택의
          'ReviewStack'으로 진입하므로, 여기 탭 화면으로는 등록하지 않음 */}
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Mypage" component={MyPageScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tab" component={TabNavigator} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
      <Stack.Screen name="ReviewStack" component={ReviewStack} />
      <Stack.Screen name="PieceStack" component={PieceStack} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="PieceEdit" component={PieceEditScreen} />
      <Stack.Screen name='Notification' component={NotificationScreen}/>
      <Stack.Screen name='ReviewReport' component={ReviewReportScreen}/>
      <Stack.Screen name='MyMap' component={MyMapScreen} options={{animation: 'fade'}} />
      <Stack.Screen name='MonthlyReview' component={MonthlyReviewScreen} options={{animation: 'fade'}} />
      <Stack.Screen name='Setting' component={SettingScreen} />
      <Stack.Screen name='TermsOfService' component={TermsOfServiceScreen} />
      <Stack.Screen name='TermsAgreement' component={TermsScreen} />
      <Stack.Screen name='FollowList' component={FollowListScreen} />
      <Stack.Screen name='FriendSearch' component={FriendSearchScreen} />
      <Stack.Screen name='UserMyPage' component={UserMyPageScreen} />
    </Stack.Navigator>
  );
}
