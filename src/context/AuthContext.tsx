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

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAccessToken()
      .then(token => setIsLoggedIn(!!token))
      .finally(() => setIsLoading(false));
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
