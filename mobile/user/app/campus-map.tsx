import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GUARDED_HUBS = [
  {
    campus: 'UC Main Campus',
    spots: [
      { name: 'Sanciangko Main Entrance / Security Desk', description: '24/7 security guard post with bright LED lighting and CCTV coverage.' },
      { name: 'University Library 3rd Floor Reception', description: 'Quiet, monitored area during academic library hours (7:30 AM - 6:00 PM).' },
      { name: 'Main Gym Mezzanine & Student Lounge', description: 'High foot-traffic student activity center.' },
    ],
  },
  {
    campus: 'UC Banilad Campus',
    spots: [
      { name: 'Gate 1 Turnstiles & Guard Post', description: 'Primary monitored entrance along Gov. Cuenco Avenue.' },
      { name: 'Banilad Student Center Canteen', description: 'Central student hub with security personnel on duty.' },
    ],
  },
  {
    campus: 'UC Lapu-Lapu and Mandaue (LM)',
    spots: [
      { name: 'LM Engineering Lobby / Innovation Hall', description: 'Well-lit monitored lobby with reception security.' },
      { name: 'LM Student Pavilion', description: 'Open-air guarded seating zone.' },
    ],
  },
  {
    campus: 'UC Maritime Education and Training Center (METC)',
    spots: [
      { name: 'METC Mambaling Main Gate & Muster Area', description: 'Official campus entry with officer checkpoints.' },
    ],
  },
  {
    campus: 'UC Pardo-Talisay (PRI)',
    spots: [
      { name: 'UC PRI Main Gate Checkpoint', description: 'Guarded gate entrance for Junior & Senior High students.' },
      { name: 'UC PRI Covered Court Bleachers', description: 'Daytime student activity zone.' },
    ],
  },
];

export default function CampusMapScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Safety Header Banner */}
        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark" size={24} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>Official Guarded Meetup Zones</Text>
            <Text style={styles.safetySub}>
              For your safety, always conduct exchanges and handshakes in these designated campus locations.
            </Text>
          </View>
        </View>

        {/* Campus List */}
        {GUARDED_HUBS.map((camp, idx) => (
          <View key={idx} style={styles.campusCard}>
            <View style={styles.campusHeader}>
              <Ionicons name="business" size={18} color="#002B7F" />
              <Text style={styles.campusName}>{camp.campus}</Text>
            </View>

            <View style={{ gap: 10, marginTop: 6 }}>
              {camp.spots.map((spot, sIdx) => (
                <View key={sIdx} style={styles.spotItem}>
                  <View style={styles.spotDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.spotName}>{spot.name}</Text>
                    <Text style={styles.spotDesc}>{spot.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 16,
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
  },
  safetySub: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 16,
  },
  campusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  campusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  campusName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002B7F',
  },
  spotItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  spotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginTop: 6,
  },
  spotName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  spotDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
});
