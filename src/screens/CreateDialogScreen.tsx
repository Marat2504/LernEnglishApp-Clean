import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { createDialog } from '../services/chatService';
import { CreateDialogRequest } from '../types';
import LoadingIndicator from '../components/LoadingIndicator';

export default function CreateDialogScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(false);

  const difficultyLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const handleCreate = async () => {
    if (!difficulty) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите уровень сложности');
      return;
    }

    setLoading(true);
    try {
      const requestData: CreateDialogRequest = {
        topic: topic.trim() || undefined,
        difficulty,
      };

      const newDialog = await createDialog(requestData);

      // Переход в чат с новым диалогом (заменяем экран создания на чат)
      navigation.replace('ChatBot', { dialogId: newDialog.id });
    } catch (error) {
      console.error('Ошибка создания диалога:', error);
      Alert.alert('Ошибка', 'Не удалось создать диалог. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Создать новый диалог</Text>

        <View style={styles.form}>
          {/* Поле темы */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Тема диалога (опционально)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Например: Путешествия, Работа, Хобби..."
              value={topic}
              onChangeText={setTopic}
              maxLength={100}
            />
          </View>

          {/* Выбор уровня сложности темы */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Уровень сложности темы *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={difficulty}
                onValueChange={(itemValue) => setDifficulty(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Выберите уровень темы" value="" />
                {difficultyLevels.map((level) => (
                  <Picker.Item key={level} label={level} value={level} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Описание уровней тем */}
          <View style={styles.levelsInfo}>
            <Text style={styles.levelsTitle}>Уровни сложности тем:</Text>
            <Text style={styles.levelText}>A1-A2: Простые темы (повседневная жизнь, базовые ситуации)</Text>
            <Text style={styles.levelText}>B1-B2: Средние темы (работа, путешествия, образование)</Text>
            <Text style={styles.levelText}>C1-C2: Сложные темы (профессиональные, академические, абстрактные)</Text>
          </View>

          {/* Кнопка создания */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <LoadingIndicator text="Создание..." />
            ) : (
              <Text style={styles.createButtonText}>Создать диалог</Text>
            )}
          </TouchableOpacity>

          {/* Кнопка отмены */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  levelsInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  levelsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  levelText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 5,
  },
  createButton: {
    backgroundColor: '#28a745',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  createButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
