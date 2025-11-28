// src/screens/ChatBotScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Alert,
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
  const { dialogId } = route.params || {};

  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, hasNext: false });

  // Загрузка диалога и начальных сообщений
  useEffect(() => {
    loadDialog();
  }, [dialogId]);

  const loadDialog = async () => {
    try {
      console.log('Загрузка диалога с ID:', dialogId);
      const response = await getDialog(dialogId);
      console.log('Ответ от API:', response);
      setDialog(response);
      setMessages(response.messages);
      setPagination(response.pagination);
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

    try {
      const response = correctionMode
        ? await sendMessageWithCorrection(dialog.id, textToSend)
        : await sendMessage(dialog.id, textToSend);

      // Добавляем сообщение пользователя и ответ ИИ
      setMessages(prev => [...prev, response.userMessage, response.aiMessage]);
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
      // Возвращаем текст обратно в поле ввода
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    // Имитация голосового ввода
    if (!isVoiceMode) {
      setTimeout(() => {
        setInputText('Hello, how are you?');
        setIsVoiceMode(false);
      }, 2000);
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
        <Text style={styles.messageText}>{item.text}</Text>
        {item.correction && <Text style={styles.correctionText}>{item.correction}</Text>}
        {item.explanation && <Text style={styles.explanationText}>{item.explanation}</Text>}
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

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          inverted={true}
        />

        {/* Поле ввода сообщений */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              onPress={() => setCorrectionMode(!correctionMode)}
              style={[styles.correctionButton, correctionMode && styles.correctionButtonActive]}
            >
              <Text style={[styles.correctionButtonText, correctionMode && styles.correctionButtonTextActive]}>
                ✏️
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleVoiceMode} style={styles.voiceButton}>
              <Text style={styles.voiceButtonText}>{isVoiceMode ? '🎤' : '🎙️'}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={isVoiceMode ? "Говорите..." : "Введите сообщение..."}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
              editable={!isVoiceMode && !sending}
            />
            <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton} disabled={sending}>
              <Text style={styles.sendButtonText}>{sending ? '...' : '➤'}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 10,
    fontSize: 16,
    backgroundColor: 'white',
    marginRight: 10,
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
    position: 'absolute',
    bottom: 30, // Поднимаем от низа экрана на 20 пикселей
    left: 20,
    right: 20,
  },
});
