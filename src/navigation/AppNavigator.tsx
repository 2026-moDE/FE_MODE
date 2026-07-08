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
import ProfileEditScreen from '../screens/mypage/ProfileEditScreen';
import NotificationScreen from '../screens/notification/NotificationScreen';

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
      <Tab.Screen name="Review" component={ReviewStack} />
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
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name='Notification' component={NotificationScreen}/>
    </Stack.Navigator>
  );
}
