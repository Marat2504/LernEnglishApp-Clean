// src/screens/ChatBotScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { DialogResponse, Message, Dialog } from '../types/index';
import { getDialog, sendMessage, sendMessageWithCorrection } from '../services/chatService';
import LoadingIndicator from '../components/LoadingIndicator';

type ChatBotScreenRouteProp = RouteProp<RootStackParamList, 'ChatBot'>;
type ChatBotScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChatBot'>;

export default function ChatBotScreen() {
  const navigation = useNavigation<ChatBotScreenNavigationProp>();
  const route = useRoute<ChatBotScreenRouteProp>();
  const { dialogId } = route.params || { dialogId: '' };
  const flatListRef = useRef<FlatList>(null);

  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [pagination, setPagination] = useState({ page: 1, hasNext: false });
  const [correctionMode, setCorrectionMode] = useState(false);
  const [typingDots, setTypingDots] = useState('');

  // Загрузка диалога и начальных сообщений
  useEffect(() => {
    loadDialog();
  }, [dialogId]);

  // Автопрокрутка к нижнему сообщению при изменении сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Анимация точек для индикатора печати
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingDots(prev => {
        if (prev === '') return '.';
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const loadDialog = async () => {
    try {
      console.log('Загрузка диалога с ID:', dialogId);
      const response = await getDialog(dialogId);
      console.log('Ответ от API:', response);
      setDialog(response);
      setMessages(response.messages.reverse());
      setPagination(response.pagination);
      // Прокрутка к нижнему сообщению после загрузки
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Ошибка загрузки диалога:', error);
      Alert.alert('Ошибка', `Не удалось загрузить диалог: ${(error as Error).message || 'Неизвестная ошибка'}`);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !dialog) return;

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    // Создаем сообщение пользователя
    const userMessage: Message = {
      id: `temp-user-${Date.now()}`,
      dialogId: dialog.id,
      sender: 'USER',
      text: textToSend,
      createdAt: new Date().toISOString(),
    };

    // Создаем временное сообщение ИИ с загрузкой
    const aiLoadingMessage: Message = {
      id: `temp-ai-${Date.now()}`,
      dialogId: dialog.id,
      sender: 'AI',
      text: '',
      createdAt: new Date().toISOString(),
      isLoading: true,
    };

    // Добавляем сообщения сразу
    setMessages(prev => [...prev, userMessage, aiLoadingMessage]);

    try {
      const response = correctionMode
        ? await sendMessageWithCorrection(dialog.id, textToSend)
        : await sendMessage(dialog.id, textToSend);

      // Заменяем временное сообщение ИИ на реальное
      setMessages(prev => prev.map(msg =>
        msg.id === aiLoadingMessage.id ? response.aiMessage : msg
      ));

      // Если режим коррекции, обновляем сообщение пользователя с коррекцией
      if (correctionMode && 'correction' in response) {
        const correctionResponse = response as any;
        setMessages(prev => prev.map(msg =>
          msg.id === userMessage.id
            ? { ...msg, correction: correctionResponse.correction.correctedText, explanation: correctionResponse.correction.explanation }
            : msg
        ));
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
      // Удаляем временные сообщения и возвращаем текст
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id && msg.id !== aiLoadingMessage.id));
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };



  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'USER' ? styles.userMessage : styles.botMessage,
      ]}
    >
      {item.sender === 'AI' && (
        <Image source={{ uri: 'https://via.placeholder.com/40x40?text=AI' }} style={styles.botAvatar} />
      )}
      <View style={styles.messageContent}>
        {item.isLoading ? (
          <Text style={styles.typingText}>Answers{typingDots}</Text>
        ) : (
          <>
            <Text style={styles.messageText}>{item.text}</Text>
            {item.correction && <Text style={styles.correctionText}>{item.correction}</Text>}
            {item.explanation && <Text style={styles.explanationText}>{item.explanation}</Text>}
          </>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={styles.container}>
          <LoadingIndicator text="Загрузка диалога..." />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{dialog?.topic || 'Диалог'}</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('DialogSettings', { dialogId })}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView style={styles.chatContainer} behavior="padding">
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
          />

          {/* Поле ввода сообщений */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[styles.correctionButton, correctionMode && styles.correctionButtonActive]}
                onPress={() => setCorrectionMode(!correctionMode)}
              >
                <Text style={[styles.correctionButtonText, correctionMode && styles.correctionButtonTextActive]}>
                  ✏️
                </Text>
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Введите сообщение..."
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSendMessage}
                onFocus={scrollToBottom}
                onBlur={scrollToBottom}
                editable={!sending}
                multiline={true}
              />
              <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton} disabled={sending}>
                <Text style={styles.sendButtonText}>{sending ? '...' : '➤'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  chatContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingsButton: {
    padding: 10,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#667eea',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa',
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    color: '#333',
    fontSize: 16,
  },
  typingText: {
    color: '#667eea',
    fontSize: 16,
    fontStyle: 'italic',
  },
  correctionText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  explanationText: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  correctionButton: {
    backgroundColor: '#667eea',
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  correctionButtonActive: {
    backgroundColor: '#ff6b6b',
  },
  correctionButtonText: {
    fontSize: 20,
  },
  correctionButtonTextActive: {
    color: 'white',
  },
  voiceButton: {
    backgroundColor: '#667eea',
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  voiceButtonText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e4ff',
    borderRadius: 20,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white',
    marginRight: 10,
    minHeight: 50,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#667eea',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputWrapper: {
    height: 80,
    justifyContent: 'center',
  },
});
