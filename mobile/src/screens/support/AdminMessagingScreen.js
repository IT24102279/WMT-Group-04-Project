import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react-native';

import {
  getConversations,
  replyToMessage,
  markAsRead,
  updateMessage,
  deleteMessage,
  deleteConversation
} from '../../services/messageService';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';

const AdminMessagingScreen = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState('');
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await getConversations();
      setConversations(response.data.data || []);
    } catch (error) {
      showToast('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      const messageId = selectedConversation.messages?.[selectedConversation.messages.length - 1]?._id;
      if (!messageId) return;
      
      await replyToMessage(messageId, replyText);
      setReplyText('');
      await loadConversations();
      
      // Refresh current view
      const updatedConv = conversations.find(c => c.partnerId === selectedConversation.partnerId);
      if (updatedConv) setSelectedConversation(updatedConv);
      else setSelectedConversation(null);
      
      showToast('Reply sent');
    } catch (error) {
      showToast('Failed to send reply');
    }
  };

  const handleStartEdit = (item) => {
    setEditingMessageId(item._id);
    setEditText(item.content || '');
  };

  const handleUpdateMessage = async () => {
    if (!editingMessageId || !editText.trim()) return;

    try {
      await updateMessage(editingMessageId, { content: editText.trim() });
      setEditingMessageId('');
      setEditText('');
      await loadConversations();
      setSelectedConversation(null);
      showToast('Message updated');
    } catch (error) {
      showToast('Update failed');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      await loadConversations();
      setSelectedConversation(null);
      showToast('Message deleted');
    } catch (error) {
      showToast('Delete failed');
    }
  };

  const handleDeleteConversation = async (partnerId) => {
    const idString = String(partnerId);
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this entire chat history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic update
              setConversations(prev => prev.filter(c => String(c.partnerId) !== idString));
              if (selectedConversation?.partnerId === partnerId) {
                setSelectedConversation(null);
              }
              
              const response = await deleteConversation(idString);
              console.log('Delete response:', response.data);
              
              showToast('Chat deleted');
              await loadConversations();
            } catch (error) {
              console.log('Delete error:', error?.response?.data || error.message);
              showToast('Delete failed');
              await loadConversations(); // Revert on failure
            }
          }
        }
      ]
    );
  };

  const handleMarkAsRead = async (conversation) => {
    if (conversation.messages?.length > 0) {
      const unreadMessages = conversation.messages.filter((msg) => !msg.read && msg.senderId !== user.id);
      for (const msg of unreadMessages) {
        try {
          await markAsRead(msg._id);
        } catch (error) {
          console.log('Mark read failed', error.message);
        }
      }
    }
  };

  const renderConversationItem = ({ item }) => {
    const isUnread = item.unreadCount > 0;
    return (
      <Pressable
        style={[styles.convCard, isUnread && styles.unreadConvCard]}
        onPress={() => {
          handleMarkAsRead(item);
          setSelectedConversation(item);
        }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.partnerName?.[0]}</Text>
        </View>
        <View style={styles.convInfo}>
          <View style={styles.convHeader}>
            <Text style={[styles.partnerName, isUnread && styles.unreadText]}>
              {item.partnerName}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(item.lastMessageTime).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.convFooter}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{item.partnerRole?.toUpperCase()}</Text>
            </View>
            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.preview} numberOfLines={1}>{item.lastMessage}</Text>
        </View>
        <Pressable onPress={() => handleDeleteConversation(item.partnerId)} style={styles.deleteBtn}>
          <Trash2 size={18} color={COLORS.error} />
        </Pressable>
      </Pressable>
    );
  };

  const renderMessageBubble = ({ item }) => {
    const isFromMe = item.senderId._id === user.id || item.senderId === user.id;
    const isEditing = editingMessageId === item._id;

    return (
      <View style={[styles.bubbleWrapper, isFromMe ? styles.bubbleWrapperMe : styles.bubbleWrapperThem]}>
        <View style={[
          styles.bubble, 
          isFromMe ? styles.bubbleMe : styles.bubbleThem,
          isEditing && styles.bubbleEditing
        ]}>
          {isEditing ? (
            <View style={styles.editingWrapper}>
              <CustomInput
                value={editText}
                onChangeText={setEditText}
                multiline
                style={styles.editInput}
                noMargin
              />
              <View style={styles.editActions}>
                <Pressable onPress={() => setEditingMessageId('')} style={styles.cancelAction}>
                  <Text style={styles.cancelActionText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleUpdateMessage} style={styles.saveAction}>
                  <Text style={styles.saveActionText}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.bubbleHeader}>
                <Text style={[styles.senderName, isFromMe ? styles.senderNameMe : styles.senderNameThem]}>
                  {isFromMe ? 'Me (Support)' : item.senderId.name}
                </Text>
              </View>
              <Text style={[styles.messageText, isFromMe ? styles.messageTextMe : styles.messageTextThem]}>
                {item.content}
              </Text>
              <Text style={[styles.messageTime, isFromMe ? styles.messageTimeMe : styles.messageTimeThem]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </>
          )}
        </View>
        {isFromMe && !isEditing && (
          <View style={styles.bubbleActions}>
            <Pressable onPress={() => handleStartEdit(item)}>
              <Edit3 size={14} color={COLORS.textLight} />
            </Pressable>
            <Pressable onPress={() => handleDeleteMessage(item._id)}>
              <Trash2 size={14} color={COLORS.error} />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Chat View
  if (selectedConversation) {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Pressable onPress={() => setSelectedConversation(null)} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.text} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{selectedConversation.partnerName}</Text>
            <View style={styles.headerStatus}>
              <ShieldCheck size={12} color={COLORS.primary} />
              <Text style={styles.headerSubtitle}>{selectedConversation.partnerRole}</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={selectedConversation.messages || []}
          renderItem={renderMessageBubble}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.chatPadding}
        />

        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <CustomInput
              placeholder="Type your response..."
              value={replyText}
              onChangeText={setReplyText}
              multiline
              style={styles.replyInput}
              noMargin
            />
            <Pressable 
              style={[styles.sendBtn, !replyText.trim() && styles.sendBtnDisabled]} 
              onPress={handleSendReply}
              disabled={!replyText.trim()}
            >
              <Send size={20} color={COLORS.white} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // List View
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Support Inquiries</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{conversations.length}</Text>
          </View>
        </View>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <MessageSquare size={48} color={COLORS.textLight} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>No active support requests</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.partnerId}
          onRefresh={loadConversations}
          refreshing={loading}
          contentContainerStyle={styles.listPadding}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.light,
    zIndex: 10,
  },
  backBtn: {
    marginRight: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    textTransform: 'capitalize',
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  listPadding: {
    padding: SPACING.md,
  },
  convCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
    alignItems: 'center',
  },
  unreadConvCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  convInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
  },
  unreadText: {
    color: '#D97706',
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  convFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  roleBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  roleText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textLight,
  },
  unreadBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCountText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  preview: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 4,
  },
  deleteBtn: {
    padding: SPACING.sm,
  },
  chatPadding: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  bubbleWrapper: {
    marginBottom: SPACING.md,
    maxWidth: '85%',
  },
  bubbleWrapperMe: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bubbleWrapperThem: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: RADIUS.lg,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  bubbleThem: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 2,
  },
  bubbleEditing: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: '100%',
  },
  bubbleHeader: {
    marginBottom: 4,
  },
  senderName: {
    fontSize: 10,
    fontWeight: '800',
  },
  senderNameMe: {
    color: COLORS.white + '99',
    textAlign: 'right',
  },
  senderNameThem: {
    color: COLORS.textLight,
  },
  messageText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
  },
  messageTextMe: {
    color: COLORS.white,
  },
  messageTextThem: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
  },
  messageTimeMe: {
    color: COLORS.white + '99',
    textAlign: 'right',
  },
  messageTimeThem: {
    color: COLORS.textLight,
  },
  bubbleActions: {
    marginLeft: 8,
    gap: 8,
  },
  editingWrapper: {
    width: '100%',
  },
  editInput: {
    backgroundColor: COLORS.background,
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelActionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  saveAction: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  saveActionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  inputBar: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : SPACING.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  replyInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    minHeight: 44,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.textLight + '50',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
  },
});

export default AdminMessagingScreen;
