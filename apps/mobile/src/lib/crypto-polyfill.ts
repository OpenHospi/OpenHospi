import { install } from 'react-native-quick-crypto';

// Polyfill global.crypto and global.Buffer with high-performance C++ JSI bindings.
// This must be imported before any code that uses crypto.subtle (E2EE).
install();
