import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { Campus } from '../types';
import { TradeLinkLogo } from './TradeLinkLogo';

const CAMPUSES: Campus[] = [
  'All',
  'UC Main',
  'UC Banilad',
  'UC LM',
  'UC METC',
  'UC PRI',
  'UC South Campus',
  'UC Pardo-Talisay',
  'UC Medical Center',
];

export const Header: React.FC = () => {
  const { searchQuery, setSearchQuery, selectedCampus, setSelectedCampus, favorites } = useMarket();
  const { currentUser, openAuthModal } = useAuth();
  const [campusModalVisible, setCampusModalVisible] = useState(false);

  const handleProfilePress = () => {
    if (currentUser) {
      router.push('/profile');
    } else {
      openAuthModal();
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Top Main Row: Logo Icon | SearchBar | Actions */}
      <View style={styles.topRow}>
        {/* 1. Official Platform Representation Logo */}
        <TouchableOpacity
          style={styles.logoButton}
          onPress={() => setCampusModalVisible(true)}
          activeOpacity={0.8}
        >
          <TradeLinkLogo size={34} borderRadius={9} />
          <View style={styles.campusIndicator}>
            <Text style={styles.campusIndicatorLabel} numberOfLines={1}>
              {selectedCampus === 'All' || selectedCampus === 'ALL' ? 'All UC' : selectedCampus}
            </Text>
            <Ionicons name="chevron-down" size={10} color="#FFC72C" />
          </View>
        </TouchableOpacity>

        {/* 2. Integrated SearchBar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, uniforms, tech..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Action Buttons (Favorites & Profile) */}
        <View style={styles.actionsRow}>
          {/* Saved Items */}
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => router.push('/favorites')}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
            {favorites.length > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeText}>{favorites.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile / Login */}
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
            {currentUser ? (
              <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.guestAvatar}>
                <Ionicons name="person" size={15} color="#002B7F" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Campus Selector Modal */}
      <Modal
        visible={campusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCampusModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCampusModalVisible(false)}
        >
          <View style={styles.campusModal}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="school" size={20} color="#002B7F" />
                <Text style={styles.modalTitle}>Select UC Campus</Text>
              </View>
              <TouchableOpacity onPress={() => setCampusModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {CAMPUSES.map((c) => {
                const isSelected = selectedCampus === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.campusItem, isSelected && styles.campusItemSelected]}
                    onPress={() => {
                      setSelectedCampus(c);
                      setCampusModalVisible(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons
                        name={c === 'All' || c === 'ALL' ? 'globe-outline' : 'location'}
                        size={18}
                        color={isSelected ? '#002B7F' : '#64748B'}
                      />
                      <Text
                        style={[styles.campusItemText, isSelected && styles.campusItemTextSelected]}
                      >
                        {c === 'All' || c === 'ALL' ? 'All Campuses Network' : c}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color="#002B7F" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#002B7F',
    paddingTop: Platform.OS === 'ios' ? 48 : 38,
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#001D59',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFC72C',
  },
  campusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  campusIndicatorLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFC72C',
    maxWidth: 48,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: 38,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  clearButton: {
    padding: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FFC72C',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#002B7F',
  },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFC72C',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  guestAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFC72C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  campusModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002B7F',
  },
  campusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  campusItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  campusItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  campusItemTextSelected: {
    color: '#002B7F',
    fontWeight: '800',
  },
});
