import React, {createContext, useContext, useState, useEffect} from 'react';
import {getAccessToken} from '../storage/tokenStorage';

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  setIsLoggedIn: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: true,
  setIsLoggedIn: () => {},
});

// apiClient(axios 인터셉터)처럼 React 트리 밖에 있는 코드가 로그인 상태를 끌 수 있도록 하는 브릿지.
// AuthProvider가 마운트되면 자신의 setIsLoggedIn을 등록해두고, 세션 만료 시 이 함수를 호출한다.
let notifySessionExpiredListener: (() => void) | null = null;

export function notifySessionExpired() {
  notifySessionExpiredListener?.();
}

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAccessToken()
      .then(token => setIsLoggedIn(!!token))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    notifySessionExpiredListener = () => setIsLoggedIn(false);
    return () => {
      notifySessionExpiredListener = null;
    };
  }, []);

  return (
    <AuthContext.Provider value={{isLoggedIn, isLoading, setIsLoggedIn}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
