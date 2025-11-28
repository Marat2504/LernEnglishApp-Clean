// src/screens/DialogsListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Dialog } from '../types';
import { getDialogs, deleteDialog } from '../services/chatService';

type DialogsListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DialogsList'>;

export default function DialogsListScreen() {
  const navigation = useNavigation<DialogsListScreenNavigationProp>();
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDialogs = async () => {
    try {
      const response = await getDialogs();
      setDialogs(response.dialogs);
    } catch (error) {
      console.error('Error loading dialogs:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список диалогов');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDialogs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDialogs();
  };

  const handleCreateDialog = () => {
    navigation.navigate('CreateDialog');
  };

  const handleOpenDialog = (dialog: Dialog) => {
    navigation.navigate('Chat', { dialogId: dialog.id });
  };

  const handleDialogSettings = (dialog: Dialog) => {
    navigation.navigate('DialogSettings', { dialogId: dialog.id });
  };

  const handleDeleteDialog = (dialog: Dialog) => {
    Alert.alert(
      'Удалить диалог',
      'Вы уверены, что хотите удалить этот диалог? Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDialog(dialog.id);
              setDialogs(prev => prev.filter(d => d.id !== dialog.id));
            } catch (error) {
              console.error('Error deleting dialog:', error);
              Alert.alert('Ошибка', 'Не удалось удалить диалог');
            }
          },
        },
      ]
    );
  };

  const renderDialog = ({ item }: { item: Dialog }) => (
    <TouchableOpacity
      style={styles.dialogItem}
      onPress={() => handleOpenDialog(item)}
      onLongPress={() => handleDialogSettings(item)}
    >
      <View style={styles.dialogContent}>
        <View style={styles.dialogHeader}>
          <Text style={styles.dialogTopic} numberOfLines={1}>
            {item.topic || 'Без темы'}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteDialog(item)}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dialogMeta}>
          <Text style={styles.dialogDifficulty}>
            Уровень: {item.difficulty || 'Не указан'}
          </Text>
          <Text style={styles.dialogMessages}>
            Сообщений: {item.messageCount || 0}
          </Text>
        </View>

        <Text style={styles.dialogDate}>
          Обновлено: {new Date(item.updatedAt).toLocaleDateString('ru-RU')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>У вас пока нет диалогов</Text>
      <Text style={styles.emptySubtext}>
        Создайте новый диалог, чтобы начать общение с ИИ
      </Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={styles.container}>
          <Text style={styles.title}>Мои диалоги</Text>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Загрузка...</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Мои диалоги</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateDialog}>
            <Text style={styles.createButtonText}>+ Новый</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={dialogs}
          keyExtractor={(item) => item.id}
          renderItem={renderDialog}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  dialogItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dialogContent: {
    padding: 15,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dialogTopic: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  dialogMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dialogDifficulty: {
    fontSize: 14,
    color: '#666',
  },
  dialogMessages: {
    fontSize: 14,
    color: '#666',
  },
  dialogDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
  },
});
