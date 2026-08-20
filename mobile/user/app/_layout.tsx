import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { MarketProvider } from '../context/MarketContext';
import { SplashScreen as AppSplashScreen } from '../components/SplashScreen';
import { AuthModal } from '../components/AuthModal';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MarketProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#002B7F' },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: '800' },
              contentStyle: { backgroundColor: '#F8FAFC' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="item/[id]"
              options={{
                title: 'Item Details',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="profile"
              options={{
                title: 'Student Profile',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="favorites"
              options={{
                title: 'Saved Items',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="price-advisor"
              options={{
                title: 'Campus Price Advisor',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="campus-map"
              options={{
                title: 'Guarded Meetup Hubs',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                title: 'Information',
              }}
            />
          </Stack>

          {/* Global Auth Modal */}
          <AuthModal />

          {/* Animated App Splash Screen */}
          {showSplash && <AppSplashScreen onFinish={() => setShowSplash(false)} />}
        </MarketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
