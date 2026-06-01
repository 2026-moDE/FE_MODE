import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppStackParamList, TabParamList } from '../types/navigation';
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ReviewScreen from '../screens/review/ReviewScreen';
import PlaceDetailScreen from '../screens/placeDetail/PlaceDetailScreen';
// import MyPageScreen from '../screens/mypage/MyPageScreen';   // 마이페이지 임시 비활성화
import CustomTabBar from '../components/map/CustomTabBar';

const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// 하단 탭 네비게이터 (리뷰 쓰기 / 홈 / 마이페이지)
function TabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
            initialRouteName="Home"
        >
            <Tab.Screen name="Review" component={ReviewScreen} />
            <Tab.Screen name="Home" component={HomeScreen} />
            {/* 마이페이지 임시 비활 */}
            {/* <Tab.Screen name="Mypage" component={MyPageScreen} /> */}
        </Tab.Navigator>
    );
}

// 스택 네비게이터 (탭 위에 쌓이는 화면)
export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tab" component={TabNavigator} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
        </Stack.Navigator>
    );
}
