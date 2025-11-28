import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Dialog, Message } from '../types';
import { getDialog, sendMessage, sendMessageWithCorrection } from '../services/chatService';
import LoadingIndicator from '../components/LoadingIndicator';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatBot'>;
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChatBot'>;

export default function ChatScreen() {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const route = useRoute<ChatScreenRouteProp>();
  const { dialogId } = route.params || {};

  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, hasNext: false });

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (dialogId) {
      loadDialog();
    }
  }, [dialogId]);

  const loadDialog = async (page = 1) => {
    try {
      const response = await getDialog(dialogId, page, 50);
      setDialog(response);

      if (page === 1) {
        setMessages(response.messages || []);
      } else {
        // Добавляем старые сообщения в начало
        setMessages(prev => [...response.messages, ...prev]);
      }

      setPagination({
        page: response.pagination.page,
        hasNext: response.pagination.hasNext,
      });
    } catch (error) {
      console.error('Ошибка загрузки диалога:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить диалог');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = () => {
    if (pagination.hasNext && !loading) {
      loadDialog(pagination.page + 1);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      let response;
      if (correctionMode) {
        response = await sendMessageWithCorrection(dialogId, textToSend);
      } else {
        response = await sendMessage(dialogId, textToSend);
      }

      // Добавляем сообщения в список
      setMessages(prev => [...prev, response.userMessage, response.aiMessage]);

      // Прокручиваем к последнему сообщению
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
      // Возвращаем текст в поле ввода
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const openSettings = () => {
    navigation.navigate('DialogSettings', { dialogId });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'USER' ? styles.userMessage : styles.botMessage,
      ]}
    >
      <View style={styles.messageContent}>
        <Text style={styles.messageText}>{item.text}</Text>
        {item.correction && (
          <Text style={styles.correctionText}>Исправление: {item.correction}</Text>
        )}
        {item.explanation && (
          <Text style={styles.explanationText}>Объяснение: {item.explanation}</Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={styles.container}>
          <LoadingIndicator text="Загрузка чата..." />
        </View>
      </LinearGradient>
    );
  }

  if (!dialog) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Диалог не найден</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Заголовок с настройками */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {dialog.topic || 'Диалог'}
          </Text>
          <TouchableOpacity onPress={openSettings} style={styles.settingsButton}>
            <Text style={styles.settingsButtonText}>⚙️ Настройки</Text>
          </TouchableOpacity>
        </View>

        {/* Список сообщений */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.1}
          inverted={false}
        />

        {/* Режим коррекции */}
        <View style={styles.modeContainer}>
          <TouchableOpacity
            onPress={() => setCorrectionMode(!correctionMode)}
            style={[styles.modeButton, correctionMode && styles.modeButtonActive]}
          >
            <Text style={[styles.modeButtonText, correctionMode && styles.modeButtonTextActive]}>
              {correctionMode ? '✅ Коррекция включена' : '🔍 Стандартный режим'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Поле ввода */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Введите сообщение..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
            editable={!sending}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            disabled={sending || !inputText.trim()}
          >
            {sending ? (
              <LoadingIndicator text="" />
            ) : (
              <Text style={styles.sendButtonText}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  settingsButton: {
    padding: 10,
  },
  settingsButtonText: {
    fontSize: 20,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContainer: {
    paddingBottom: 20,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#667eea',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    color: '#333',
    fontSize: 16,
    lineHeight: 20,
  },
  correctionText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  explanationText: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
    fontStyle: 'italic',
  },
  modeContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  modeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#28a745',
  },
  modeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  sendButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginTop: 50,
  },
});
