import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system/legacy';
import { TagChip } from '../components/TagChip';
import { useTags, useCreateTag, useDeleteTag } from '../hooks/useTags';
import { useAttachTag, useDetachTag, useCards, useDeleteCard, useToggleLearned } from '../hooks/useCards';
import { CreateCardDto } from '../types';
import { translateEnglishToRussian } from '../services/translationService';
import { generateAudio } from '../services/textToSpeechService';
import { updateCard } from '../services/cardsService';
import LoadingIndicator from '../components/LoadingIndicator';

export default function EditCardScreen({ navigation, route }: any) {
  const [englishWord, setEnglishWord] = useState('');
  const [russianTranslation, setRussianTranslation] = useState('');
  const [notes, setNotes] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('A1');
  const [isLearned, setIsLearned] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const { data: tags, isLoading: tagsLoading } = useTags();
  const createTagMutation = useCreateTag();
  const deleteTagMutation = useDeleteTag();
  const attachTagMutation = useAttachTag();
  const detachTagMutation = useDetachTag();
  const { data: cards } = useCards();
  const deleteCardMutation = useDeleteCard();
  const toggleLearnedMutation = useToggleLearned();

  const cardId = route.params?.cardId;

  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (cardId && cards) {
      const cardToEdit = cards.find((c) => c.id === cardId);
      if (cardToEdit) {
        setEnglishWord(cardToEdit.englishWord);
        setRussianTranslation(cardToEdit.russianTranslation);
        setNotes(cardToEdit.notes || '');
        setDifficultyLevel(cardToEdit.difficultyLevel || 'A1');
        setIsLearned(cardToEdit.isLearned || false);
        setSelectedTagIds(cardToEdit.cardTags ? cardToEdit.cardTags.map(ct => ct.tag.id) : []);
      }
    }
  }, [cardId, cards]);

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchTag, setSearchTag] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const filteredTags = (tags && Array.isArray(tags)) ? tags
    .filter((tag) =>
      tag.name.toLowerCase().includes(searchTag.toLowerCase())
    )
    .sort((a, b) => {
      // Собственные теги первыми
      if (!a.isPredefined && b.isPredefined) return -1;
      if (a.isPredefined && !b.isPredefined) return 1;
      // Затем по имени
      return a.name.localeCompare(b.name);
    }) : [];

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const onCreateNewTag = () => {
    if (!newTagName.trim()) {
      Alert.alert('Ошибка', 'Введите название тега');
      return;
    }
    createTagMutation.mutate(
      { name: newTagName.trim() },
      {
        onSuccess: (createdTag) => {
          setSelectedTagIds((prev) => [...prev, createdTag.id]);
          setNewTagName('');
          setModalVisible(false);
        },
        onError: () => Alert.alert('Ошибка', 'Не удалось создать тег'),
      }
    );
  };

  const onDeleteTag = async (tagName: string) => {
    const tagToDelete = tags?.find(t => t.name === tagName);
    if (!tagToDelete || tagToDelete.isPredefined) return;

    if (selectedTagIds.includes(tagToDelete.id)) {
      // Detach first
      await detachTagMutation.mutateAsync({ cardId, tagId: tagToDelete.id });
      // Remove from selected
      setSelectedTagIds(prev => prev.filter(id => id !== tagToDelete.id));
    }

    Alert.alert(
      'Удалить тег',
      `Вы уверены, что хотите удалить тег "${tagName}"? Это удалит тег из всех карточек.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            deleteTagMutation.mutate(tagToDelete.id, {
              onSuccess: () => {
                Alert.alert('Успех', 'Тег удален');
              },
              onError: (error: any) => {
                console.error('Delete tag error:', error);
                Alert.alert('Ошибка', error.message || 'Не удалось удалить тег. Возможно, он используется в других карточках.');
              }
            });
          },
        },
      ]
    );
  };

  const onDeleteCard = () => {
    Alert.alert(
      'Удалить карточку',
      'Вы уверены, что хотите удалить эту карточку?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const cardToDelete = cards?.find((c) => c.id === cardId);
              if (cardToDelete?.audioUrl) {
                try {
                  await FileSystem.deleteAsync(cardToDelete.audioUrl);
                } catch (error) {
                  console.error('Error deleting audio file:', error);
                }
              }
              await deleteCardMutation.mutateAsync(cardId);
              Alert.alert('Успех', 'Карточка удалена');
              navigation.goBack();
            } catch (error) {
              console.error('Ошибка удаления карточки:', error);
              Alert.alert('Ошибка', 'Не удалось удалить карточку');
            }
          },
        },
      ]
    );
  };

  const onSaveCard = async () => {
    if (!englishWord.trim() || !russianTranslation.trim()) {
      Alert.alert('Ошибка', 'Заполните английское слово и перевод');
      return;
    }

    const cardToEdit = cards?.find((c) => c.id === cardId);
    if (!cardToEdit) {
      Alert.alert('Ошибка', 'Карточка не найдена');
      return;
    }

    try {
      // Обновляем данные карточки
      await updateCard(cardId, {
        englishWord: englishWord.trim(),
        russianTranslation: russianTranslation.trim(),
        notes: notes.trim() || null,
        difficultyLevel,
      });

      // Обновляем статус выученности, если изменился
      if (cardToEdit.isLearned !== isLearned) {
        await toggleLearnedMutation.mutateAsync({ cardId, isLearned });
      }

      // Управляем тегами
      const currentTagIds = cardToEdit.cardTags ? cardToEdit.cardTags.map(ct => ct.tag.id) : [];
      const tagsToAttach = selectedTagIds.filter(id => !currentTagIds.includes(id));
      const tagsToDetach = currentTagIds.filter(id => !selectedTagIds.includes(id));

      // Открепляем старые теги
      if (tagsToDetach.length > 0) {
        const detachPromises = tagsToDetach.map(tagId =>
          detachTagMutation.mutateAsync({ cardId, tagId })
        );
        await Promise.all(detachPromises);
      }

      // Прикрепляем новые теги
      if (tagsToAttach.length > 0) {
        const attachPromises = tagsToAttach.map(tagId =>
          attachTagMutation.mutateAsync({ cardId, tagId })
        );
        await Promise.all(attachPromises);
      }

      Alert.alert('Успех', 'Карточка обновлена');
      navigation.goBack();
    } catch (error) {
      console.error('Ошибка обновления карточки:', error);
      Alert.alert('Ошибка', 'Не удалось обновить карточку');
    }
  };

  return (
    <View style={styles.container}>
      {/* Поля ввода */}
      <Text style={styles.label}>Английское слово *</Text>
      <TextInput
        style={styles.input}
        value={englishWord}
        onChangeText={setEnglishWord}
        placeholder="Введите английское слово"
      />

      <Text style={styles.label}>Русский перевод *</Text>
      <TextInput
        style={styles.input}
        value={russianTranslation}
        onChangeText={setRussianTranslation}
        placeholder="Введите перевод"
      />

      <Text style={styles.label}>Заметки</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Дополнительные заметки"
        multiline
      />

      <Text style={styles.label}>Уровень сложности</Text>
      <Picker
        selectedValue={difficultyLevel}
        onValueChange={(itemValue) => setDifficultyLevel(itemValue)}
        style={styles.picker}
      >
        {['A1', 'A2', 'B1', 'B2', 'C1'].map((level) => (
          <Picker.Item key={level} label={level} value={level} />
        ))}
      </Picker>

      <Text style={styles.label}>Статус выученности</Text>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setIsLearned(!isLearned)}
      >
        <Text style={styles.checkbox}>{isLearned ? '☑️' : '☐'}</Text>
        <Text style={styles.checkboxLabel}>Выучено</Text>
      </TouchableOpacity>

      {/* Теги */}
      <Text style={styles.label}>Теги</Text>
      <TextInput
        style={styles.input}
        placeholder="Поиск тегов"
        value={searchTag}
        onChangeText={setSearchTag}
      />

      {tagsLoading ? (
        <LoadingIndicator text="Загрузка тегов..." />
      ) : (
        <FlatList
          data={filteredTags}
          keyExtractor={(item) => item.id}
          horizontal
          renderItem={({ item }) => (
            <TagChip
              name={item.name}
              selected={selectedTagIds.includes(item.id)}
              onPress={() => toggleTagSelection(item.id)}
              onDelete={onDeleteTag}
              isPredefined={item.isPredefined}
            />
          )}
          style={{ maxHeight: 50, marginBottom: 10 }}
        />
      )}

      <Button title="Добавить новый тег" onPress={() => setModalVisible(true)} />

      <View style={{ marginTop: 20 }}>
        <Button title="Обновить карточку" onPress={onSaveCard} />
        <View style={{ marginTop: 10 }}>
          <Button title="Удалить карточку" onPress={onDeleteCard} color="red" />
        </View>
      </View>

      {/* Модальное окно для создания нового тега */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.label}>Название нового тега</Text>
            <TextInput
              style={styles.input}
              value={newTagName}
              onChangeText={setNewTagName}
              placeholder="Введите название тега"
            />
            <Button title="Создать тег" onPress={onCreateNewTag} />
            <Button title="Отмена" onPress={() => setModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  label: { fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  picker: {
    backgroundColor: 'white',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    fontSize: 20,
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
});
