import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMarket } from '../../context/MarketContext';
import { useAuth } from '../../context/AuthContext';
import { Campus, College, ConditionGrade, TradeMode } from '../../types';
import { CATEGORIES } from '../../data/seedData';

const CONDITIONS: ConditionGrade[] = [
  'Brand New',
  'Like New',
  'Gently Used',
  'Fair / Academic Usable',
];

const CAMPUSES: Campus[] = [
  'UC Main',
  'UC Banilad',
  'UC LM',
  'UC METC',
  'UC PRI',
  'UC South Campus',
  'UC Pardo-Talisay',
  'UC Medical Center',
];

export default function CreateListingScreen() {
  const router = useRouter();
  const { addListing } = useMarket();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalSrp, setOriginalSrp] = useState('');
  const [tradeMode, setTradeMode] = useState<TradeMode>('buy_sell');
  const [swapPreference, setSwapPreference] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [condition, setCondition] = useState<ConditionGrade>('Like New');
  const [campus, setCampus] = useState<Campus>(currentUser?.campus || 'UC Main');
  const [meetupSpot, setMeetupSpot] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        const selectedUris = result.assets.map((a) => a.uri);
        setImages((prev) => [...prev, ...selectedUris].slice(0, 5));
      }
    } catch {
      Alert.alert('Image Picker', 'Failed to pick image. Please grant media permissions.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Camera permission is needed to take product photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImages((prev) => [...prev, result.assets[0].uri].slice(0, 5));
      }
    } catch {
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your listing.');
      return;
    }
    if (tradeMode !== 'free_donation' && (!price || isNaN(Number(price)))) {
      Alert.alert('Invalid Price', 'Please enter a valid price in Philippine Pesos.');
      return;
    }

    setIsSubmitting(true);

    const defaultImages = [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    ];

    const newListing = addListing({
      title: title.trim(),
      description: description.trim() || 'Listed on TradeLink mobile.',
      price: tradeMode === 'free_donation' ? 0 : Number(price),
      originalSrp: originalSrp ? Number(originalSrp) : Number(price) * 1.2,
      tradeMode,
      swapPreference: tradeMode === 'swap' ? swapPreference : undefined,
      category,
      condition,
      images: images.length > 0 ? images : defaultImages,
      sellerId: currentUser?.id || 'user-maria',
      sellerName: currentUser?.name || 'Maria Santos',
      sellerAvatar:
        currentUser?.avatar ||
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      sellerCampus: campus,
      sellerCollege: currentUser?.college || ('Nursing' as College),
      sellerIsVerified: currentUser?.isVerified ?? true,
      sellerTrustScore: currentUser?.trustScore || 98,
      preferredMeetupSpots: meetupSpot ? [meetupSpot] : ['Main Campus Entrance / Guard Desk'],
      customMeetupSpot: meetupSpot,
      isBoosted: false,
    });

    setIsSubmitting(false);

    Alert.alert('Success!', 'Your listing has been posted to TradeLink.', [
      {
        text: 'View Item',
        onPress: () => router.push(`/item/${newListing.id}` as any),
      },
    ]);

    // Reset Form
    setTitle('');
    setDescription('');
    setPrice('');
    setOriginalSrp('');
    setImages([]);
    setMeetupSpot('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Post New Item</Text>
        <Text style={styles.headerSubtitle}>Verified UC Student Marketplace</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Photo Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Photos (Up to 5)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
            {images.map((uri, idx) => (
              <View key={idx} style={styles.imagePreviewContainer}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => handleRemoveImage(idx)}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 5 && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="images-outline" size={24} color="#002B7F" />
                  <Text style={styles.uploadText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera-outline" size={24} color="#002B7F" />
                  <Text style={styles.uploadText}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>

        {/* 2. Trade Mode Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Trade Mode</Text>
          <View style={styles.tradeModeRow}>
            {[
              { id: 'buy_sell', label: '💰 Sell for Cash' },
              { id: 'swap', label: '🔄 Propose Swap' },
              { id: 'free_donation', label: '🎁 Free Donation' },
            ].map((m) => {
              const isActive = tradeMode === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.modeTab, isActive && styles.modeTabActive]}
                  onPress={() => setTradeMode(m.id as TradeMode)}
                >
                  <Text style={[styles.modeTabText, isActive && styles.modeTabTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Title & Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Item Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Casio fx-991ES Plus PRC Calculator"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the condition, semester used, inclusions..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* 4. Price & SRP (if not free) */}
        {tradeMode !== 'free_donation' && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Selling Price (₱) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 650"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Original Brand SRP (₱)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1200"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={originalSrp}
                  onChangeText={setOriginalSrp}
                />
              </View>
            </View>
          </View>
        )}

        {/* Swap Preference Field */}
        {tradeMode === 'swap' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What would you like to swap for? *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Keychron keyboard or Casio calculator + cash"
              placeholderTextColor="#94A3B8"
              value={swapPreference}
              onChangeText={setSwapPreference}
            />
          </View>
        )}

        {/* 5. Condition Grade */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Condition Grade</Text>
          <View style={styles.chipRow}>
            {CONDITIONS.map((cond) => {
              const isSelected = condition === cond;
              return (
                <TouchableOpacity
                  key={cond}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setCondition(cond)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {cond}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 6. Campus & Meetup Spot */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Campus Location</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {CAMPUSES.map((c) => {
                const isSelected = campus === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setCampus(c)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <Text style={styles.sectionLabel}>Preferred Meetup Zone / Landmark</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Main Library 3rd floor / Gate 1 Guard Post"
            placeholderTextColor="#94A3B8"
            value={meetupSpot}
            onChangeText={setMeetupSpot}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Publishing...' : 'Publish Listing'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#002B7F',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 8,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBox: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#BCD1F7',
    borderStyle: 'dashed',
    backgroundColor: '#EBF1FC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  uploadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#002B7F',
  },
  tradeModeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#002B7F',
    borderColor: '#002B7F',
  },
  modeTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#002B7F',
    borderColor: '#002B7F',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#002B7F',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#002B7F',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
