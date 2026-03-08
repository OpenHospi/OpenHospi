// Type augmentation for react-native-reusables components that use `placeholderClassName`.
// Uniwind declares `placeholderTextColorClassName` but the registry components expect `placeholderClassName`.
import 'react-native';

declare module 'react-native' {
  interface TextInputProps {
    placeholderClassName?: string;
  }
}
