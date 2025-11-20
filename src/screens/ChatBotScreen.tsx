// src/screens/ChatBotScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  correction?: string;
  explanation?: string;
}

export default function ChatBotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Привет! Я твой интеллектуальный собеседник. Давай поговорим на английском! Скажи что-нибудь, и я помогу с исправлениями и объяснениями.',
      sender: 'bot',
    },
    {
      id: '2',
      text: 'Hello, I am learning English!',
      sender: 'user',
    },
    {
      id: '3',
      text: 'Ты сказал: "Hello, I am learning English!"',
      sender: 'bot',
      correction: 'Исправление: Всё правильно! "I am learning" - это Present Continuous для описания текущего действия.',
      explanation: 'Объяснение: "I am learning" означает "Я учусь" в настоящий момент. Отлично!',
    },
    {
      id: '4',
      text: 'What is your name?',
      sender: 'user',
    },
    {
      id: '5',
      text: 'Ты сказал: "What is your name?"',
      sender: 'bot',
      correction: 'Исправление: Всё правильно! Это вопрос в Present Simple.',
      explanation: 'Объяснение: "What is your name?" - стандартный вопрос. Мой "имя" - AI Assistant!',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Имитация ответа бота с исправлениями и объяснениями
    setTimeout(() => {
      let botMessage: Message;
      if (inputText.toLowerCase().includes('i am')) {
        botMessage = {
          id: (Date.now() + 1).toString(),
          text: 'Ты сказал: "' + inputText + '"',
          sender: 'bot',
          correction: 'Исправление: "I am" - правильно, но если это "я есть", то "I am".',
          explanation: 'Объяснение: "I am" используется для настоящего времени. Например, "I am happy" - "Я счастлив".',
        };
      } else if (inputText.toLowerCase().includes('go to')) {
        botMessage = {
          id: (Date.now() + 1).toString(),
          text: 'Ты сказал: "' + inputText + '"',
          sender: 'bot',
          correction: 'Исправление: "Go to" - правильно для команды, но для описания используй "went to".',
          explanation: 'Объяснение: "Go to" - инфинитив, "went to" - прошедшее время.',
        };
      } else {
        botMessage = {
          id: (Date.now() + 1).toString(),
          text: 'Ты сказал: "' + inputText + '". Это звучит хорошо! Продолжай.',
          sender: 'bot',
        };
      }
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
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
        item.sender === 'user' ? styles.userMessage : styles.botMessage,
      ]}
    >
      {item.sender === 'bot' && (
        <Image source={{ uri: 'https://via.placeholder.com/40x40?text=AI' }} style={styles.botAvatar} />
      )}
      <View style={styles.messageContent}>
        <Text style={styles.messageText}>{item.text}</Text>
        {item.correction && <Text style={styles.correctionText}>{item.correction}</Text>}
        {item.explanation && <Text style={styles.explanationText}>{item.explanation}</Text>}
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.title}>Интеллектуальный Собеседник</Text>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
        />

        {/* Поле ввода сообщений */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={toggleVoiceMode} style={styles.voiceButton}>
              <Text style={styles.voiceButtonText}>{isVoiceMode ? '🎤' : '🎙️'}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={isVoiceMode ? "Говорите..." : "Введите сообщение..."}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
              editable={!isVoiceMode}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>➤</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
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
