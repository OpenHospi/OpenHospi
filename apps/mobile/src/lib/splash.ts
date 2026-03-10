import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export function hideSplash() {
  SplashScreen.hideAsync();
}
