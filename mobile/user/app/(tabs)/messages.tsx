import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMarket } from '../../context/MarketContext';
import { Conversation } from '../../types';
import { VerifiedBadge } from '../../components/VerifiedBadge';

export default function MessagesScreen() {
  const { conversations, addMessageToConversation } = useMarket();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: 'me' | 'other'; text: string; time: string }[]>([
    { id: '1', sender: 'other', text: 'Hi! Is this still available for meetup?', time: '10:45 AM' },
    { id: '2', sender: 'me', text: 'Yes, it is in like-new condition! What time works for you?', time: '10:48 AM' },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleOpenChat = (conv: Conversation) => {
    setSelectedConv(conv);
    setChatMessages([
      { id: '1', sender: 'other', text: conv.lastMessage, time: conv.lastMessageTimestamp || conv.lastMessageAt || 'Today' },
    ]);
  };

  const handleSendMessage = () => {
    if (!inputMsg.trim() || !selectedConv) return;
    const newMsg = {
      id: String(Date.now()),
      sender: 'me' as const,
      text: inputMsg.trim(),
      time: 'Just now',
    };
    setChatMessages((prev) => [...prev, newMsg]);
    addMessageToConversation(selectedConv.id, inputMsg.trim());
    setInputMsg('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Verified Student Chat & Trade Coordination</Text>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const participant = item.otherParticipant || {
            name: item.participantName || 'Student',
            avatar: item.participantAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            isVerified: true,
            campus: item.participantCampus || 'UC Main',
          };
          return (
            <TouchableOpacity
              style={styles.convCard}
              onPress={() => handleOpenChat(item)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: participant.avatar }} style={styles.avatar} />

              <View style={styles.convCenter}>
                <View style={styles.nameRow}>
                  <Text style={styles.nameText}>{participant.name}</Text>
                  {participant.isVerified && <VerifiedBadge size="sm" />}
                  <Text style={styles.timeText}>{item.lastMessageTimestamp || item.lastMessageAt || 'Today'}</Text>
                </View>

                <Text style={styles.itemTitleText} numberOfLines={1}>
                  {item.listingTitle}
                </Text>

                <Text style={styles.lastMsgText} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>

              {(item.unreadCount || 0) > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Interactive Chat Modal */}
      <Modal visible={!!selectedConv} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Chat Top Bar */}
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={() => setSelectedConv(null)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color="#002B7F" />
              </TouchableOpacity>

              {selectedConv && (
                <View style={styles.chatHeaderUser}>
                  <Image
                    source={{
                      uri:
                        selectedConv.otherParticipant?.avatar ||
                        selectedConv.participantAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                    }}
                    style={styles.headerAvatar}
                  />
                  <View>
                    <Text style={styles.headerName}>
                      {selectedConv.otherParticipant?.name || selectedConv.participantName || 'Student'}
                    </Text>
                    <Text style={styles.headerSub}>
                      {selectedConv.otherParticipant?.campus || selectedConv.participantCampus || 'UC Main'} • Verified
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.actionIcon}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
              </TouchableOpacity>
            </View>

            {/* Listing Context Banner */}
            {selectedConv && (
              <View style={styles.listingBanner}>
                <Image source={{ uri: selectedConv.listingImage }} style={styles.bannerImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle} numberOfLines={1}>
                    {selectedConv.listingTitle}
                  </Text>
                  <Text style={styles.bannerSub}>Safe Guarded Campus Meetup Protected</Text>
                </View>
              </View>
            )}

            {/* Messages Thread */}
            <FlatList
              data={chatMessages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              renderItem={({ item }) => {
                const isMe = item.sender === 'me';
                return (
                  <View style={[styles.bubbleContainer, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                      <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
                        {item.text}
                      </Text>
                      <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther]}>
                        {item.time}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message or meetup spot..."
                placeholderTextColor="#94A3B8"
                value={inputMsg}
                onChangeText={setInputMsg}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
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
  listContent: {
    padding: 16,
    gap: 8,
    backgroundColor: '#F8FAFC',
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  convCenter: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 'auto',
  },
  itemTitleText: {
    fontSize: 11,
    color: '#002B7F',
    fontWeight: '700',
  },
  lastMsgText: {
    fontSize: 12,
    color: '#64748B',
  },
  unreadBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  chatHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 10,
    color: '#64748B',
  },
  actionIcon: {
    padding: 4,
  },
  listingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EBF1FC',
    borderBottomWidth: 1,
    borderBottomColor: '#BCD1F7',
    gap: 8,
  },
  bannerImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002B7F',
  },
  bannerSub: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    gap: 10,
  },
  bubbleContainer: {
    width: '100%',
    flexDirection: 'row',
  },
  bubbleLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 14,
    gap: 4,
  },
  bubbleMe: {
    backgroundColor: '#002B7F',
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 2,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bubbleTextMe: {
    color: '#FFFFFF',
  },
  bubbleTextOther: {
    color: '#0F172A',
  },
  bubbleTime: {
    fontSize: 9,
    alignSelf: 'flex-end',
  },
  bubbleTimeMe: {
    color: '#CBD5E1',
  },
  bubbleTimeOther: {
    color: '#94A3B8',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  sendBtn: {
    backgroundColor: '#002B7F',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
