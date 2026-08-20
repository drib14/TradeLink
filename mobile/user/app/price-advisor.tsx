import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConditionGrade } from '../types';

const CONDITIONS: ConditionGrade[] = [
  'Brand New',
  'Like New',
  'Gently Used',
  'Fair / Academic Usable',
];

export default function PriceAdvisorScreen() {
  const [srp, setSrp] = useState('');
  const [condition, setCondition] = useState<ConditionGrade>('Like New');
  const [estimatedPrice, setEstimatedPrice] = useState<{ min: number; max: number; fair: number } | null>(null);

  const calculateEstimate = () => {
    const srpNum = Number(srp);
    if (!srp || isNaN(srpNum) || srpNum <= 0) return;

    let multiplier = 0.65;
    if (condition === 'Brand New') multiplier = 0.85;
    if (condition === 'Like New') multiplier = 0.70;
    if (condition === 'Gently Used') multiplier = 0.50;
    if (condition === 'Fair / Academic Usable') multiplier = 0.35;

    const fair = Math.round(srpNum * multiplier);
    const min = Math.round(fair * 0.85);
    const max = Math.round(fair * 1.15);

    setEstimatedPrice({ min, max, fair });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Intro Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.iconBox}>
              <Ionicons name="calculator" size={20} color="#002B7F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Campus Fair Price Advisor</Text>
              <Text style={styles.cardSub}>
                Prevent price gouging & find standard UC student resale values
              </Text>
            </View>
          </View>
        </View>

        {/* Input Form */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Original Brand SRP (₱)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 18990 for iPad or 1250 for Calculator"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={srp}
            onChangeText={(text) => {
              setSrp(text);
              setEstimatedPrice(null);
            }}
          />

          <Text style={styles.inputLabel}>Condition Grade</Text>
          <View style={styles.conditionRow}>
            {CONDITIONS.map((cond) => {
              const isSelected = condition === cond;
              return (
                <TouchableOpacity
                  key={cond}
                  style={[styles.condPill, isSelected && styles.condPillActive]}
                  onPress={() => {
                    setCondition(cond);
                    setEstimatedPrice(null);
                  }}
                >
                  <Text style={[styles.condText, isSelected && styles.condTextActive]}>
                    {cond}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.calcBtn} onPress={calculateEstimate}>
            <Ionicons name="sparkles" size={16} color="#002B7F" />
            <Text style={styles.calcBtnText}>Calculate Campus Fair Valuation</Text>
          </TouchableOpacity>
        </View>

        {/* Result Card */}
        {estimatedPrice && (
          <View style={styles.resultCard}>
            <Text style={styles.resultHeader}>Recommended UC Fair Listing Range</Text>
            <Text style={styles.resultFair}>₱{estimatedPrice.fair.toLocaleString()}</Text>
            <Text style={styles.resultRange}>
              Suggested Range: ₱{estimatedPrice.min.toLocaleString()} — ₱{estimatedPrice.max.toLocaleString()}
            </Text>

            <View style={styles.tipBox}>
              <Ionicons name="information-circle" size={16} color="#059669" />
              <Text style={styles.tipText}>
                Items priced within this range sell 3x faster on UC TradeLink and maintain student community trust.
              </Text>
            </View>
          </View>
        )}
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
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EBF1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11,
    color: '#64748B',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  condPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  condPillActive: {
    backgroundColor: '#002B7F',
    borderColor: '#002B7F',
  },
  condText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  condTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calcBtn: {
    backgroundColor: '#FFC72C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  calcBtnText: {
    color: '#002B7F',
    fontWeight: '800',
    fontSize: 13,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BCD1F7',
    gap: 6,
  },
  resultHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  resultFair: {
    fontSize: 32,
    fontWeight: '900',
    color: '#002B7F',
  },
  resultRange: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 16,
  },
});
