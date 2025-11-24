// src/screens/HomeScreen.tsx (Упрощённая версия: только нижнее меню + FAB "Добавить слово")
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useDailyMissions } from '../hooks/useMissions';
import LoadingIndicator from '../components/LoadingIndicator';
import { checkAchievements, CheckAchievementsResponse } from '../services/achievementsService';

export default function HomeScreen() {
    // Типизируем навигацию с помощью RootStackParamList
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { data: missions, isLoading: missionsLoading, refetch } = useDailyMissions();

  // Функция для вызова API проверки достижений
  const fetchAndCheckAchievements = async () => {
    try {
      const result: CheckAchievementsResponse = await checkAchievements();
      console.log('Результат проверки достижений:', result);
      // Пока обработка результата только логом, уведомление пользователю реализуем позже
      // При необходимости сюда можно добавить вызов модального окна
    } catch (error) {
      console.error('Ошибка при проверке достижений:', error);
    }
  };

  // Обновляем миссии и вызываем проверку достижений при фокусе на экране
  useFocusEffect(
    React.useCallback(() => {
      refetch();
      fetchAndCheckAchievements();
    }, [refetch])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Ежедневные миссии */}
      <View style={styles.missionsContainer}>
        <Text style={styles.missionsTitle}>Ежедневные миссии</Text>
        {missionsLoading ? (
          <LoadingIndicator text="Загрузка миссий..." />
        ) : (
          missions?.map((mission) => {
            const isCompleted = mission.progress >= mission.targetValue;
            return (
              <View key={mission.id} style={[styles.missionItem, isCompleted && styles.missionItemCompleted]}>
                <View style={styles.missionHeader}>
                  <Text style={[styles.missionName, isCompleted && styles.missionNameCompleted]}>{mission.name}</Text>
                  {isCompleted && <Text style={styles.completedIcon}>✅</Text>}
                </View>
                <Text style={[styles.missionDescription, isCompleted && styles.missionDescriptionCompleted]}>{mission.description}</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, isCompleted && styles.progressFillCompleted, { width: `${Math.min((mission.progress / mission.targetValue) * 100, 100)}%` }]} />
                  </View>
                  <Text style={[styles.progressText, isCompleted && styles.progressTextCompleted]}>
                    {isCompleted ? 'Пройдено' : `${mission.progress}/${mission.targetValue}`}
                  </Text>
                </View>
                <Text style={[styles.rewardText, isCompleted && styles.rewardTextCompleted]}>
                  {isCompleted ? 'Получено XP' : `Награда: ${mission.rewardXp} XP`}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Режимы изучения */}
      <View style={styles.content}>
        <Text style={styles.modesTitle}>Режимы изучения</Text>
        <View style={styles.modesContainer}>
          {/* Первый ряд */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate('SpeedMode')}
            >
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.tileGradient}>
                <Text style={styles.tileIcon}>🚀</Text>
                <Text style={styles.tileText}>Скоростной Режим</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate('QuizMode')}
            >
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.tileGradient}>
                <Text style={styles.tileIcon}>❓</Text>
                <Text style={styles.tileText}>Режим с Вариантами</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {/* Второй ряд */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate('MatchingMode')}
            >
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.tileGradient}>
                <Text style={styles.tileIcon}>🔗</Text>
                <Text style={styles.tileText}>Сопоставление Слов</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate('ListeningMode')}
            >
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.tileGradient}>
                <Text style={styles.tileIcon}>🎧</Text>
                <Text style={styles.tileText}>Режим Аудирования</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {/* Третий ряд */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate('LightningMode')}
            >
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.tileGradient}>
                <Text style={styles.tileIcon}>⚡</Text>
                <Text style={styles.tileText}>Режим «Молния»</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate('CardsList')}
            >
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.tileGradient}>
                <Text style={styles.tileIcon}>📚</Text>
                <Text style={styles.tileText}>Просмотреть все слова</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Интеллектуальный собеседник */}
        <Text style={styles.modesTitle}>Интеллектуальный собеседник</Text>
        <View style={styles.chatbotRow}>
          <TouchableOpacity
            style={styles.largeTile}
            onPress={() => navigation.navigate('ChatBot')}
          >
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.tileGradient}>
              <Text style={styles.largeTileIcon}>🤖</Text>
              <Text style={styles.largeTileText}>ИИ агент</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',  // Светлый фон
    padding: 20,
  },
  missionsContainer: {
    marginBottom:5,
  },
  missionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  missionItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  missionItemCompleted: {
    backgroundColor: '#f0f9ff',
    borderColor: '#28a745',
    borderWidth: 2,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  missionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  missionNameCompleted: {
    color: '#28a745',
    textDecorationLine: 'line-through',
  },
  completedIcon: {
    fontSize: 18,
  },
  missionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  missionDescriptionCompleted: {
    color: '#999',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
  },
  progressFillCompleted: {
    backgroundColor: '#28a745',
  },
  progressText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 10,
  },
  progressTextCompleted: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  rewardText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: 'bold',
  },
  rewardTextCompleted: {
    color: '#28a745',
    fontStyle: 'italic',
  },
  content: {
    alignItems: 'center',
    textAlign: 'center',
  },
  // Стили для режимов изучения
  modesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  modesContainer: {
    width: '100%',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  tile: {
    width: '45%',
    height: 100,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  tileGradient: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  tileIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  tileText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chatbotRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  largeTile: {
    width: '95%',
    height: 120,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  largeTileIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  largeTileText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  taskContainer: {
    width: '100%',
    marginBottom: 20,
  },
  taskGradient: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  taskText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
});
