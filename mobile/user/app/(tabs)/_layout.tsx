import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMarket } from '../../context/MarketContext';

export default function TabLayout() {
  const { conversations } = useMarket();
  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#173F83',
        tabBarInactiveTintColor: '#98A3B3',
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: { paddingVertical: 3 },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EDF1F6',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 66,
          paddingBottom: Platform.OS === 'ios' ? 28 : 9,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.15,
        },
      }}
    >
      {/* 1. Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />

      {/* 2. Catalog / Marketplace Tab */}
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bag-handle' : 'bag-handle-outline'} size={22} color={color} />
          ),
        }}
      />

      {/* 3. Center Sell Action Button */}
      <Tabs.Screen
        name="create-listing"
        options={{
          title: 'Sell',
          tabBarIcon: ({ focused }) => (
            <View style={styles.sellButtonContainer}>
              <View style={styles.sellButton}>
                <Ionicons name="add" size={26} color="#FFFFFF" />
              </View>
            </View>
          ),
        }}
      />

      {/* 4. Flash Market Tab */}
      <Tabs.Screen
        name="wanted"
        options={{
          title: 'Flash',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flash' : 'flash-outline'} size={22} color={color} />
          ),
        }}
      />

      {/* 5. Messages Tab */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons
                name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
                size={22}
                color={color}
              />
              {unreadTotal > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadTotal > 99 ? '99+' : unreadTotal}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  sellButtonContainer: {
    top: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#002B7F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#002B7F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
