import React, {useEffect} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {AuthStackParamList} from '../../types/navigation';
import BrandSplash from '../../components/common/BrandSplash';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({navigation}: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 1600);

    return () => clearTimeout(timer);
  }, [navigation]);

  // 화면 자체는 네이티브 런치스크린 / 토큰 확인 중 화면과 같은 BrandSplash를 쓴다
  return <BrandSplash />;
}
