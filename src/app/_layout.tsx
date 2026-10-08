import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import {
  SplineSans_400Regular,
  SplineSans_500Medium,
  SplineSans_600SemiBold,
  SplineSans_700Bold,
  useFonts as useGoogleFonts,
} from '@expo-google-fonts/spline-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, useColorScheme } from 'react-native';

import { QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== 'loading' && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [status, fontsLoaded]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="deck/[id]" />
        <Stack.Screen name="session" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="start" />
        <Stack.Screen name="prompt/[id]" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="design" />
        <Stack.Screen name="showcase" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useGoogleFonts({
    SplineSans_400Regular,
    SplineSans_500Medium,
    SplineSans_600SemiBold,
    SplineSans_700Bold,
    ArchivoBlack_400Regular,
  });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootNavigator fontsLoaded={fontsLoaded} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}