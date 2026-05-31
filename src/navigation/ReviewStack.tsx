import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ReviewStackParamList } from '../types/navigation';
import ReviewScreen from '../screens/review/ReviewScreen';
import ReviewPhotoConfirmScreen from '../screens/review/ReviewPhotoConfirmScreen';
import ReviewWriteScreen from '../screens/review/ReviewWriteScreen';
import ReviewPlaceSearchScreen from '../screens/review/ReviewPlaceSearchScreen';
import ReviewLocationSelectScreen from '../screens/review/ReviewLocationSelectScreen';
import ReviewLocationConfirmScreen from '../screens/review/ReviewLocationConfirmScreen';
import ReviewCompleteScreen from '../screens/review/ReviewCompleteScreen';

const Stack = createNativeStackNavigator<ReviewStackParamList>();

export default function ReviewStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReviewCamera" component={ReviewScreen} />
      <Stack.Screen name="ReviewPhotoConfirm" component={ReviewPhotoConfirmScreen} />
      <Stack.Screen name="ReviewWrite" component={ReviewWriteScreen} />
      <Stack.Screen name="ReviewPlaceSearch" component={ReviewPlaceSearchScreen} />
      <Stack.Screen name="ReviewLocationSelect" component={ReviewLocationSelectScreen} />
      <Stack.Screen name="ReviewLocationConfirm" component={ReviewLocationConfirmScreen} />
      <Stack.Screen name="ReviewComplete" component={ReviewCompleteScreen} />
    </Stack.Navigator>
  );
}