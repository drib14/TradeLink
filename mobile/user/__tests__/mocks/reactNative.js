const reactNativeMock = {
  Platform: {
    OS: 'android',
    select: (obj) => obj.android || obj.default
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 })
  },
  StyleSheet: {
    create: (styles) => styles
  },
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  SafeAreaView: 'SafeAreaView',
  Alert: {
    alert: jest.fn()
  }
};

module.exports = reactNativeMock;
