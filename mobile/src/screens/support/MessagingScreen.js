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
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  MessageSquare,
  Search,
  Check,
  CheckCheck
} from 'lucide-react-native';

import {
  getConversations,
  sendMessage,
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

const MessagingScreen = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
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

  const handleSendNewMessage = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast('Subject and message are required');
      return;
    }

    try {
      setLoading(true);
      await sendMessage(subject, message);
      setSubject('');
      setMessage('');
      setShowNewMessage(false);
      await loadConversations();
      showToast('Message sent');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;

    try {
      const conversationId = selectedConversation.messages?.[selectedConversation.messages.length - 1]?._id;
      await replyToMessage(conversationId, replyText);
      setReplyText('');
      await loadConversations();
      
      // Update selected conversation with new data
      const updatedConv = conversations.find(c => c.partnerId === selectedConversation.partnerId);
      if (updatedConv) setSelectedConversation(updatedConv);
      else setSelectedConversation(null);
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
      setSelectedConversation(null); // Simple way to refresh
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
      'Are you sure you want to delete this chat history? This cannot be undone.',
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
              await loadConversations();
            }
          }
        }
      ]
    );
  };

  const handleMarkAsRead = async (conversation) => {
    if (conversation.messages?.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      if (!lastMessage.read && lastMessage.senderId !== user.id) {
        try {
          await markAsRead(lastMessage._id);
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
        <View style={styles.convAvatar}>
          <Text style={styles.convAvatarText}>{item.partnerName?.[0] || '?'}</Text>
        </View>
        <View style={styles.convInfo}>
          <View style={styles.convHeader}>
            <Text style={[styles.partnerName, isUnread && styles.unreadText]}>
              {item.partnerName}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(item.lastMessageTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.convFooter}>
            <Text style={styles.convPreview} numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
        <Pressable 
          onPress={() => handleDeleteConversation(item.partnerId)}
          style={styles.convDeleteBtn}
        >
          <Trash2 size={18} color={COLORS.error} />
        </Pressable>
      </Pressable>
    );
  };

  const renderMessageBubble = ({ item }) => {
    const isFromMe = (item.senderId?._id === user?.id) || (item.senderId === user?.id);
    const isEditing = editingMessageId === item._id;

    return (
      <View style={[styles.bubbleContainer, isFromMe ? styles.bubbleContainerMe : styles.bubbleContainerThem]}>
        {!isFromMe && (
          <View style={styles.smallAvatar}>
            <Text style={styles.smallAvatarText}>S</Text>
          </View>
        )}
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
              />
              <View style={styles.editActions}>
                <Pressable onPress={() => setEditingMessageId('')}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleUpdateMessage} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <Text style={[styles.messageText, isFromMe ? styles.messageTextMe : styles.messageTextThem]}>
                {item.content}
              </Text>
              <View style={styles.bubbleFooter}>
                <Text style={[styles.messageTime, isFromMe ? styles.messageTimeMe : styles.messageTimeThem]}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {isFromMe && (
                  <View style={styles.readStatus}>
                    {item.read ? <CheckCheck size={12} color={COLORS.white} /> : <Check size={12} color={COLORS.white} />}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
        
        {isFromMe && !isEditing && (
          <View style={styles.msgActionRow}>
            <Pressable onPress={() => handleStartEdit(item)} style={styles.msgAction}>
              <Edit3 size={14} color={COLORS.textLight} />
            </Pressable>
            <Pressable onPress={() => handleDeleteMessage(item._id)} style={styles.msgAction}>
              <Trash2 size={14} color={COLORS.error} />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // New Message Layout
  if (showNewMessage) {
    return (
      <View style={styles.container}>
        <View style={styles.appHeader}>
          <Pressable onPress={() => setShowNewMessage(false)} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.appHeaderTitle}>New Conversation</Text>
        </View>

        <View style={styles.formPadding}>
          <CustomInput
            label="Subject"
            placeholder="e.g., Question about my prescription"
            value={subject}
            onChangeText={setSubject}
            icon={Search}
          />
          <CustomInput
            label="Your Message"
            placeholder="Type your message here..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            style={{ height: 150 }}
          />
          <CustomButton 
            title="Send Message" 
            onPress={handleSendNewMessage} 
            icon={Send}
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </View>
    );
  }

  // Chat Thread Layout
  if (selectedConversation) {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.appHeader}>
          <Pressable onPress={() => setSelectedConversation(null)} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.text} />
          </Pressable>
          <View style={styles.headerPartnerInfo}>
            <View style={styles.smallAvatar}>
              <Text style={styles.smallAvatarText}>{selectedConversation.partnerName?.[0]}</Text>
            </View>
            <Text style={styles.appHeaderTitle}>{selectedConversation.partnerName}</Text>
          </View>
          <Pressable style={styles.moreBtn}>
            <MoreVertical size={20} color={COLORS.text} />
          </Pressable>
        </View>

        <FlatList
          data={selectedConversation.messages || []}
          renderItem={renderMessageBubble}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.chatScroll}
          inverted={false} // Match typical ordering
        />

        <View style={styles.replyContainer}>
          <View style={styles.replyInputWrapper}>
            <CustomInput
              placeholder="Type a message..."
              value={replyText}
              onChangeText={setReplyText}
              multiline
              style={styles.replyInput}
              noMargin
            />
            <Pressable 
              onPress={handleReply} 
              style={[styles.replySendBtn, !replyText.trim() && styles.replySendBtnDisabled]}
              disabled={!replyText.trim()}
            >
              <Send size={20} color={COLORS.white} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Conversation List Layout
  return (
    <View style={styles.container}>
      <View style={styles.appHeader}>
        <Text style={styles.appHeaderTitle}>Inbox</Text>
        <Pressable 
          style={styles.newBtn}
          onPress={() => setShowNewMessage(true)}
        >
          <Plus size={20} color={COLORS.primary} />
        </Pressable>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <MessageSquare size={40} color={COLORS.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No Messages</Text>
          <Text style={styles.emptySubtitle}>Start a conversation with our medical support team.</Text>
          <CustomButton 
            title="Start Chatting" 
            onPress={() => setShowNewMessage(true)}
            style={styles.emptyBtn}
          />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    ...SHADOWS.light,
    zIndex: 10,
  },
  appHeaderTitle: {
    ...TYPOGRAPHY.h3,
    flex: 1,
  },
  backBtn: {
    marginRight: SPACING.md,
  },
  headerPartnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  newBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreBtn: {
    padding: SPACING.xs,
  },
  formPadding: {
    padding: SPACING.lg,
  },
  listPadding: {
    padding: SPACING.md,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  unreadConvCard: {
    backgroundColor: COLORS.primaryLight + '40', // Very light tint
  },
  convAvatar: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convAvatarText: {
    color: COLORS.white,
    fontSize: 20,
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
    marginBottom: 4,
  },
  partnerName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
  },
  unreadText: {
    color: COLORS.primary,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  convFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convPreview: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    flex: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  convDeleteBtn: {
    padding: SPACING.sm,
  },
  chatScroll: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  bubbleContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  bubbleContainerMe: {
    justifyContent: 'flex-end',
  },
  bubbleContainerThem: {
    justifyContent: 'flex-start',
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  smallAvatarText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  bubbleThem: {
    backgroundColor: '#E5E7EB',
    borderBottomLeftRadius: 2,
  },
  bubbleEditing: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: '100%',
    maxWidth: '100%',
  },
  messageText: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
  },
  messageTextMe: {
    color: COLORS.white,
  },
  messageTextThem: {
    color: COLORS.text,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeMe: {
    color: COLORS.white + 'CC',
  },
  messageTimeThem: {
    color: COLORS.textLight,
  },
  readStatus: {
    marginLeft: 2,
  },
  editingWrapper: {
    width: '100%',
  },
  editInput: {
    backgroundColor: COLORS.background,
    minHeight: 60,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  cancelText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  msgActionRow: {
    flexDirection: 'row',
    marginLeft: 8,
    gap: 8,
  },
  msgAction: {
    padding: 4,
  },
  replyContainer: {
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 24 : SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  replyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  replyInput: {
    flex: 1,
    minHeight: 45,
    maxHeight: 120,
    backgroundColor: COLORS.background,
    paddingTop: 12,
  },
  replySendBtn: {
    width: 45,
    height: 45,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  replySendBtnDisabled: {
    backgroundColor: COLORS.textLight + '50',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
  },
  emptyBtn: {
    width: '100%',
  },
});

export default MessagingScreen;

