import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useCards, useDeleteCard } from '../hooks/useCards';
import { useTags } from '../hooks/useTags';
import { CardItem } from '../components/CardItem';
import { TagChip } from '../components/TagChip';
import LoadingIndicator from '../components/LoadingIndicator';


export default function CardsListScreen({ navigation }: any) {
  const { data: cards, isLoading, error } = useCards();
  const { data: tags } = useTags();
  const deleteCardMutation = useDeleteCard();


  const sortedTags = useMemo(() => {
    if (!tags) return [];
    return [...tags].sort((a, b) => {
      if (a.isPredefined === b.isPredefined) {
        return a.name.localeCompare(b.name);
      }
      return a.isPredefined ? 1 : -1; // Пользовательские теги (false) первыми
    });
  }, [tags]);

  const [searchText, setSearchText] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [learningFilter, setLearningFilter] = useState<'all' | 'learned' | 'unlearned'>('all');

  // Фильтрация и сортировка карточек по тексту, тегам и статусу изучения
  const filteredCards = useMemo(() => {
    if (!cards) return [];

    // Сначала фильтруем по тексту, тегам и статусу изучения
    const filtered = cards.filter((card) => {
      const matchesText =
        card.englishWord.toLowerCase().includes(searchText.toLowerCase()) ||
        card.russianTranslation.toLowerCase().includes(searchText.toLowerCase());

      const matchesTags =
        selectedTagIds.length === 0 ||
        (card.cardTags &&
          Array.isArray(card.cardTags) &&
          card.cardTags.some((ct) => selectedTagIds.includes(ct.tag.id)));

      const matchesLearning =
        learningFilter === 'all' ||
        (learningFilter === 'learned' && card.isLearned) ||
        (learningFilter === 'unlearned' && !card.isLearned);

      return matchesText && matchesTags && matchesLearning;
    });

    // Сортируем: при фильтре "Все" невыученные первыми, потом выученные, внутри групп - по алфавиту
    return filtered.sort((a, b) => {
      if (learningFilter === 'all') {
        // Сначала сравниваем по статусу изучения: невыученные первыми
        if (a.isLearned !== b.isLearned) {
          return a.isLearned ? 1 : -1; // false (невыученные) первыми
        }
      }
      // Затем по алфавиту английского слова
      return a.englishWord.localeCompare(b.englishWord);
    });
  }, [cards, searchText, selectedTagIds, learningFilter]);

  if (isLoading) {
    return <LoadingIndicator text="Загрузка карточек..." />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Ошибка загрузки карточек</Text>
      </View>
    );
  }

  // Обработчик выбора/снятия тега
  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // Обработчик нажатия на карточку
  const onCardPress = (cardId: string) => {
    if (isSelectionMode) {
      toggleCardSelection(cardId);
    } else {
      navigation.navigate('EditCard', { cardId });
    }
  };



  // Обработчик долгого нажатия для входа в режим выбора
  const onCardLongPress = (cardId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedCardIds([cardId]);
    }
  };

  // Переключение выбора карточки
  const toggleCardSelection = (cardId: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  // Выход из режима выбора
  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedCardIds([]);
  };



  // Удаление выбранных карточек
  const onDeleteSelected = () => {
    if (selectedCardIds.length === 0) return;
    Alert.alert(
      'Удалить карточки',
      `Вы уверены, что хотите удалить ${selectedCardIds.length} карточку(и)?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const deletePromises = selectedCardIds.map(id => deleteCardMutation.mutateAsync(id));
              await Promise.all(deletePromises);
              // Удаление аудиофайлов
              const audioDeletePromises = selectedCardIds.map(async (id) => {
                const card = cards?.find(c => c.id === id);
                if (card?.audioUrl) {
                  try {
                    await FileSystem.deleteAsync(card.audioUrl);
                  } catch (error) {
                    console.error('Error deleting audio file:', error);
                  }
                }
              });
              await Promise.all(audioDeletePromises);
              Alert.alert('Успех', 'Карточки и аудиофайлы удалены');
              exitSelectionMode();
            } catch (error) {
              console.error('Ошибка удаления карточек:', error);
              Alert.alert('Ошибка', 'Не удалось удалить некоторые карточки');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isSelectionMode ? `Выбрано: ${selectedCardIds.length}` : 'Мои слова'}
      </Text>
      {isSelectionMode && (
        <View style={styles.selectionActions}>
          <TouchableOpacity onPress={exitSelectionMode} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Отмена</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDeleteSelected} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Удалить</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Поиск по слову */}
      <TextInput
        style={styles.searchInput}
        placeholder="Поиск по слову"
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Фильтр по статусу изучения */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, learningFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setLearningFilter('all')}
        >
          <Text style={[styles.filterButtonText, learningFilter === 'all' && styles.filterButtonTextActive]}>
            Все
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, learningFilter === 'unlearned' && styles.filterButtonActive]}
          onPress={() => setLearningFilter('unlearned')}
        >
          <Text style={[styles.filterButtonText, learningFilter === 'unlearned' && styles.filterButtonTextActive]}>
            Невыученные
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, learningFilter === 'learned' && styles.filterButtonActive]}
          onPress={() => setLearningFilter('learned')}
        >
          <Text style={[styles.filterButtonText, learningFilter === 'learned' && styles.filterButtonTextActive]}>
            Выученные
          </Text>
        </TouchableOpacity>
      </View>

      {/* Список тегов для фильтрации */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsList}
        contentContainerStyle={{ paddingVertical: 5 }}
      >
        {sortedTags.map((item) => (
          <TagChip
            key={item.id}
            name={item.name}
            selected={selectedTagIds.includes(item.id)}
            isPredefined={item.isPredefined}
            onPress={() => toggleTagSelection(item.id)}
          />
        ))}
      </ScrollView>

      {/* Список карточек */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CardItem
              card={item}
              onPress={() => onCardPress(item.id)}
              onLongPress={() => onCardLongPress(item.id)}
              isSelected={selectedCardIds.includes(item.id)}
              isSelectionMode={isSelectionMode}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>Нет карточек</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
  },
  tagsList: {
    marginBottom: 12,
    maxHeight: 60,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  filterButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
});
