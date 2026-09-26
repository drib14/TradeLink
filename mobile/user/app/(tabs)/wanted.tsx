import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMarket } from '../../context/MarketContext';
import { useAuth } from '../../context/AuthContext';
import { WantedRequest, Campus } from '../../types';
import { CATEGORIES, CAMPUSES } from '../../constants';

export default function FlashMarketScreen() {
  const { flashRequests, wantedRequests, addFlashRequest, addWantedRequest } = useMarket();
  const requests = flashRequests && flashRequests.length > 0 ? flashRequests : wantedRequests;
  const { currentUser, openAuthModal } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [targetBudget, setTargetBudget] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [urgency, setUrgency] = useState<'Immediate / Urgent' | 'This Week' | 'Flexible'>('Immediate / Urgent');
  const [description, setDescription] = useState('');
  const [preferredCampus, setPreferredCampus] = useState<Campus>(currentUser?.campus || 'UC Main');

  const handleCreateRequest = () => {
    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please log in with your verified student account to post a flash request.');
      openAuthModal();
      return;
    }

    if (!itemTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter the item you are looking for.');
      return;
    }
    if (!targetBudget || isNaN(Number(targetBudget))) {
      Alert.alert('Invalid Budget', 'Please specify your target budget in ₱.');
      return;
    }

    const postFn = addFlashRequest || addWantedRequest;
    postFn({
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterAvatar: currentUser.avatar || undefined,
      requesterCampus: preferredCampus,
      requesterCollege: currentUser.college || 'UC Campus',
      title: itemTitle.trim(),
      itemTitle: itemTitle.trim(),
      category,
      targetBudget: Number(targetBudget),
      budgetMax: Number(targetBudget),
      budgetMin: Number(targetBudget) * 0.8,
      tradeMode: 'BUY',
      urgency: urgency as any,
      description: description.trim() || 'Posted on UC Flash Market.',
    });

    setIsModalOpen(false);
    setItemTitle('');
    setTargetBudget('');
    setDescription('');
    Alert.alert('Request Posted', 'Your urgent flash request is now live for campus peers!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Campus Flash Market</Text>
          <Text style={styles.headerSubtitle}>Urgent Needs, Fast Barter & Peer Fulfillment</Text>
        </View>

        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => setIsModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="flash" size={15} color="#FFFFFF" />
          <Text style={styles.postBtnText}>Post Flash</Text>
        </TouchableOpacity>
      </View>

      {/* Requests List */}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isUrgent = item.urgency === 'Immediate / Urgent' || item.urgency === 'HIGH';
          const title = item.itemTitle || item.title || 'Wanted Item';
          const budget = item.targetBudget || item.budgetMax || item.budgetMin || 0;
          return (
            <View style={styles.card}>
              {/* Card Top Meta */}
              <View style={styles.cardTop}>
                <View style={styles.requesterInfo}>
                  <Image source={{ uri: item.requesterAvatar }} style={styles.avatar} />
                  <View>
                    <Text style={styles.requesterName}>{item.requesterName}</Text>
                    <Text style={styles.requesterMeta}>
                      {item.requesterCampus} • {item.requesterCollege}
                    </Text>
                  </View>
                </View>

                {/* Urgency Badge */}
                <View style={[styles.urgencyBadge, isUrgent && styles.urgencyBadgeRed]}>
                  <Text style={[styles.urgencyText, isUrgent && styles.urgencyTextRed]}>
                    {item.urgency}
                  </Text>
                </View>
              </View>

              {/* Item Title & Category */}
              <Text style={styles.itemTitle}>{title}</Text>
              <Text style={styles.itemCategory}>{item.category}</Text>
              <Text style={styles.itemDesc}>{item.description}</Text>

              {/* Card Bottom Row */}
              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.budgetLabel}>Target Budget</Text>
                  <Text style={styles.budgetValue}>₱{budget.toLocaleString()}</Text>
                </View>

                <TouchableOpacity
                  style={styles.offerBtn}
                  onPress={() =>
                    Alert.alert(
                      'Offer Item',
                      `Send offer or message ${item.requesterName} for "${title}"?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Open Chat',
                          onPress: () => Alert.alert('Chat initiated', `Conversation opened with ${item.requesterName}`),
                        },
                      ]
                    )
                  }
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color="#002B7F" />
                  <Text style={styles.offerBtnText}>Offer Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Post Wanted Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Urgent Flash Request</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>What item do you need? *</Text>
            <TextInput
              style={styles.input}
              placeholder="Item name"
              placeholderTextColor="#94A3B8"
              value={itemTitle}
              onChangeText={setItemTitle}
            />

            <Text style={styles.inputLabel}>Target Budget (₱) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={targetBudget}
              onChangeText={setTargetBudget}
            />

            <Text style={styles.inputLabel}>Urgency</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              {(['Immediate / Urgent', 'This Week', 'Flexible'] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.urgencyPill, urgency === u && styles.urgencyPillActive]}
                  onPress={() => setUrgency(u)}
                >
                  <Text style={[styles.urgencyPillText, urgency === u && styles.urgencyPillTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Campus Location</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {CAMPUSES.slice(0, 4).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.campusPill, preferredCampus === c && styles.campusPillActive]}
                  onPress={() => setPreferredCampus(c)}
                >
                  <Text style={[styles.campusPillText, preferredCampus === c && styles.campusPillTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Extra Details</Text>
            <TextInput
              style={[styles.input, { minHeight: 60 }]}
              placeholder="Any specific edition, brand, or condition needed..."
              placeholderTextColor="#94A3B8"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateRequest}>
              <Text style={styles.modalSubmitBtnText}>⚡ Publish to Flash Market</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#002B7F',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  postBtn: {
    backgroundColor: '#002B7F',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  postBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  requesterName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  requesterMeta: {
    fontSize: 10,
    color: '#64748B',
  },
  urgencyBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgencyBadgeRed: {
    backgroundColor: '#FEF2F2',
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  urgencyTextRed: {
    color: '#DC2626',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002B7F',
  },
  itemCategory: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  itemDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
  },
  budgetLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  offerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF1FC',
    borderWidth: 1,
    borderColor: '#BCD1F7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  offerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002B7F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#002B7F',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 10,
  },
  urgencyPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  urgencyPillActive: {
    backgroundColor: '#002B7F',
    borderColor: '#002B7F',
  },
  urgencyPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  urgencyPillTextActive: {
    color: '#FFFFFF',
  },
  campusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  campusPillActive: {
    backgroundColor: '#002B7F',
    borderColor: '#002B7F',
  },
  campusPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  campusPillTextActive: {
    color: '#FFFFFF',
  },
  modalSubmitBtn: {
    backgroundColor: '#002B7F',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
