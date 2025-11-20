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
import { TagChip } from '../components/TagChip';
import { useTags, useCreateTag, useDeleteTag } from '../hooks/useTags';
import { useCreateCard, useAttachTag } from '../hooks/useCards';
import { CreateCardDto } from '../types';
import { translateEnglishToRussian } from '../services/translationService';
import { generateAudio } from '../services/textToSpeechService';
import { updateCard } from '../services/cardsService';
import LoadingIndicator from '../components/LoadingIndicator';

export default function AddCardScreen({ navigation }: any) {
  const [englishWord, setEnglishWord] = useState('');
  const [russianTranslation, setRussianTranslation] = useState('');
  const [notes, setNotes] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('A1');
  const [isTranslating, setIsTranslating] = useState(false);

  const { data: tags, isLoading: tagsLoading } = useTags();
  const createTagMutation = useCreateTag();
  const deleteTagMutation = useDeleteTag();
  const createCardMutation = useCreateCard();
  const attachTagMutation = useAttachTag();

  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }

    if (englishWord.trim()) {
      translationTimeoutRef.current = setTimeout(async () => {
        setIsTranslating(true);
        const translation = await translateEnglishToRussian(englishWord);
        if (translation) {
          setRussianTranslation(translation);
        }
        setIsTranslating(false);
      }, 1000);
    }
  }, [englishWord]);

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

  const resetForm = () => {
    setEnglishWord('');
    setRussianTranslation('');
    setNotes('');
    setDifficultyLevel('A1');
    setSelectedTagIds([]);
    setSearchTag('');
  };

  const onSaveCard = async () => {
    if (!englishWord.trim() || !russianTranslation.trim()) {
      Alert.alert('Ошибка', 'Заполните английское слово и перевод');
      return;
    }

    // Создание новой карточки
    const cardData: CreateCardDto = {
      englishWord: englishWord.trim(),
      russianTranslation: russianTranslation.trim(),
      notes: notes.trim() || undefined,
      difficultyLevel,
      // isLearned не отправляем при создании, по умолчанию false
    };

    createCardMutation.mutate(cardData, {
      onSuccess: async (createdCard) => {
        // Прикрепляем выбранные теги
        if (selectedTagIds.length > 0) {
          const attachPromises = selectedTagIds.map(tagId =>
            attachTagMutation.mutateAsync({ cardId: createdCard.id, tagId })
          );
          try {
            await Promise.all(attachPromises);
          } catch (error) {
            console.error('Ошибка прикрепления тегов:', error);
            Alert.alert('Предупреждение', 'Карточка сохранена, но некоторые теги не прикреплены');
          }
        }

        // Генерируем аудио для английского слова
        try {
          const audioUrl = await generateAudio(englishWord.trim());
          await updateCard(createdCard.id, { audioUrl });
          console.log('Audio generated and updated for card:', createdCard.id);
        } catch (error) {
          console.error('Ошибка генерации аудио:', error);
          Alert.alert('Предупреждение', 'Карточка сохранена, но аудио не сгенерировано');
        }

        // Сбрасываем форму и переходим обратно
        resetForm();
        navigation.goBack();
      },
      onError: (error: any) => {
        console.error('Ошибка создания карточки:', error);
        Alert.alert('Ошибка', 'Не удалось сохранить карточку');
      },
    });
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
        <Button title="Сохранить карточку" onPress={onSaveCard} />
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
