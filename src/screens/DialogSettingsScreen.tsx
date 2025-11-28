import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Dialog } from '../types';
import { getDialog, updateDialog, deleteDialog } from '../services/chatService';
import LoadingIndicator from '../components/LoadingIndicator';

type DialogSettingsScreenRouteProp = RouteProp<RootStackParamList, 'DialogSettings'>;
type DialogSettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DialogSettings'>;

export default function DialogSettingsScreen() {
  const navigation = useNavigation<DialogSettingsScreenNavigationProp>();
  const route = useRoute<DialogSettingsScreenRouteProp>();
  const { dialogId } = route.params;

  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [languageLevel, setLanguageLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const difficultyLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  useEffect(() => {
    loadDialog();
  }, [dialogId]);

  const loadDialog = async () => {
    try {
      const response = await getDialog(dialogId);
      setDialog(response);
      setTopic(response.topic || '');
      setDifficulty(response.difficulty || '');
      setLanguageLevel(response.languageLevel || '');
    } catch (error) {
      console.error('Ошибка загрузки диалога:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить настройки диалога');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!dialog) return;

    setUpdating(true);
    try {
      const updates = {
        topic: topic.trim() || undefined,
        difficulty: difficulty || undefined,
        languageLevel: languageLevel || undefined,
      };

      const updatedDialog = await updateDialog(dialog.id, updates);
      setDialog(updatedDialog);

      Alert.alert('Успешно', 'Настройки диалога обновлены', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Ошибка обновления диалога:', error);
      Alert.alert('Ошибка', 'Не удалось обновить настройки диалога');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    if (!dialog) return;

    Alert.alert(
      'Удалить диалог',
      'Вы уверены, что хотите удалить этот диалог? Это действие нельзя отменить. Все сообщения будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!dialog) return;

    setUpdating(true);
    try {
      await deleteDialog(dialog.id);
      Alert.alert('Успешно', 'Диалог удален', [
        {
          text: 'OK',
          onPress: () => navigation.replace('DialogsList'),
        },
      ]);
    } catch (error) {
      console.error('Ошибка удаления диалога:', error);
      Alert.alert('Ошибка', 'Не удалось удалить диалог');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={styles.container}>
          <LoadingIndicator text="Загрузка настроек..." />
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Настройки диалога</Text>

        <View style={styles.form}>
          {/* Информация о диалоге */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Информация о диалоге</Text>
            <Text style={styles.infoText}>
              Создан: {new Date(dialog.createdAt).toLocaleDateString('ru-RU')}
            </Text>
            <Text style={styles.infoText}>
              Обновлен: {new Date(dialog.updatedAt).toLocaleDateString('ru-RU')}
            </Text>
            <Text style={styles.infoText}>
              Сообщений: {dialog.messageCount || 0}
            </Text>
          </View>

          {/* Поле темы */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Тема диалога</Text>
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
            <Text style={styles.label}>Уровень сложности темы</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={difficulty}
                onValueChange={(itemValue) => setDifficulty(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Не указан" value="" />
                {difficultyLevels.map((level) => (
                  <Picker.Item key={level} label={level} value={level} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Выбор уровня языка */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Уровень языка</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={languageLevel}
                onValueChange={(itemValue) => setLanguageLevel(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Не указан" value="" />
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

          {/* Кнопка обновления */}
          <TouchableOpacity
            style={[styles.updateButton, updating && styles.updateButtonDisabled]}
            onPress={handleUpdate}
            disabled={updating}
          >
            {updating ? (
              <LoadingIndicator text="Обновление..." />
            ) : (
              <Text style={styles.updateButtonText}>Обновить настройки</Text>
            )}
          </TouchableOpacity>

          {/* Кнопка удаления */}
          <TouchableOpacity
            style={[styles.deleteButton, updating && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={updating}
          >
            <Text style={styles.deleteButtonText}>Удалить диалог</Text>
          </TouchableOpacity>

          {/* Кнопка отмены */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={updating}
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
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 5,
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
  updateButton: {
    backgroundColor: '#28a745',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  updateButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  deleteButtonText: {
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
  errorText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
});
