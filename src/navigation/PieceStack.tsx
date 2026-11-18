import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {PieceStackParamList} from '../types/navigation';
import PieceCameraScreen from '../screens/piece/PieceCameraScreen';
import PieceDetectScreen from '../screens/piece/PieceDetectScreen';
import PieceInfoScreen from '../screens/piece/PieceInfoScreen';
import PieceCompleteScreen from '../screens/piece/PieceCompleteScreen';

const Stack = createNativeStackNavigator<PieceStackParamList>();

export default function PieceStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="PieceCamera" component={PieceCameraScreen} />
      <Stack.Screen name="PieceDetect" component={PieceDetectScreen} />
      <Stack.Screen name="PieceInfo" component={PieceInfoScreen} />
      <Stack.Screen name="PieceComplete" component={PieceCompleteScreen} />
    </Stack.Navigator>
  );
}
