/* global jest */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
    getItemAsync: jest.fn((key) => Promise.resolve(store.has(key) ? store.get(key) : null)),
    setItemAsync: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key) => {
      store.delete(key);
      return Promise.resolve();
    }),
    __store: store,
  };
});

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve(true)) }));

jest.mock('expo-device', () => ({ isDevice: true, modelName: 'Test Phone' }));

jest.mock('expo-notifications', () => {
  const listeners = { received: [], response: [] };
  return {
    __listeners: listeners,
    AndroidImportance: { HIGH: 4, DEFAULT: 3 },
    IosAuthorizationStatus: { PROVISIONAL: 3 },
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true })),
    getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[testtesttesttest]', type: 'expo' })),
    addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
    addNotificationReceivedListener: jest.fn((listener) => {
      listeners.received.push(listener);
      return { remove: jest.fn() };
    }),
    addNotificationResponseReceivedListener: jest.fn((listener) => {
      listeners.response.push(listener);
      return { remove: jest.fn() };
    }),
    getLastNotificationResponse: jest.fn(() => null),
    clearLastNotificationResponse: jest.fn(),
    setBadgeCountAsync: jest.fn(() => Promise.resolve(true)),
  };
});
