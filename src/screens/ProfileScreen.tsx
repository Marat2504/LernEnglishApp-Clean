// src/screens/ProfileScreen.tsx (экран статистики и достижений)
import React, { useContext, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import { AuthContext } from '../context/AuthContext';
import { useCards } from '../hooks/useCards';
import useStats from '../hooks/useStats';
import LoadingIndicator from '../components/LoadingIndicator';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { logout: contextLogout } = useContext(AuthContext)!;

  const { data: cards, isLoading: cardsLoading, error: cardsError } = useCards();
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useStats();

  useFocusEffect(
    useCallback(() => {
      refetchStats();
    }, [refetchStats])
  );

  const handleLogout = async () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await contextLogout();
        },
      },
    ]);
  };

  // Calculate dynamic stats from server data
  const weeklyTarget = 50;
  const weeklyProgress = Math.min(stats?.learnedWords || 0, weeklyTarget);

  if (statsLoading || cardsLoading) {
    return <LoadingIndicator text="Загрузка статистики..." />;
  }

  if (statsError || cardsError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ошибка загрузки данных</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Профиль и Статистика</Text>
          <Text style={styles.subtitle}>Ваш прогресс в изучении английского</Text>

          {/* Статистика */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>📊 Общая статистика</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Общий XP:</Text>
              <Text style={styles.statValue}>{stats?.totalXp || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Текущий уровень:</Text>
              <Text style={styles.statValue}>{stats?.currentLevel || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Всего слов:</Text>
              <Text style={styles.statValue}>{stats?.totalWords || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Изучено слов:</Text>
              <Text style={styles.statValue}>{stats?.learnedWords || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Слов просмотрено сегодня:</Text>
              <Text style={styles.statValue}>{stats?.wordsViewedToday || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Слов выучено сегодня:</Text>
              <Text style={styles.statValue}>{stats?.wordsLearnedToday || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Карточек добавлено сегодня:</Text>
              <Text style={styles.statValue}>{stats?.cardsAddedToday || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Время обучения (сек):</Text>
              <Text style={styles.statValue}>{stats?.timeSpentSec || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Время обучения сегодня (сек):</Text>
              <Text style={styles.statValue}>{stats?.timeSpentTodaySec || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Уровень английского:</Text>
              <Text style={styles.statValue}>{stats?.currentLanguageLevel || 'Не определен'}</Text>
            </View>
          </View>

          {/* Прогресс-бары */}
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>📈 Прогресс</Text>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Слова на этой неделе: {weeklyProgress}/{weeklyTarget}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(weeklyProgress / weeklyTarget) * 100}%` }]} />
              </View>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Время обучения сегодня: {Math.floor((stats?.timeSpentTodaySec || 0) / 60)}/{60} мин</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(((stats?.timeSpentTodaySec || 0) / 60 / 60) * 100, 100)}%` }]} />
              </View>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Карточек добавлено сегодня: {stats?.cardsAddedToday || 0}/10</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(((stats?.cardsAddedToday || 0) / 10) * 100, 100)}%` }]} />
              </View>
            </View>
          </View>

          {/* Достижения */}
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>🏆 Достижения</Text>
            <View style={styles.achievementRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>🔥</Text>
                <Text style={styles.badgeText}>Стрик 7 дней</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>📚</Text>
                <Text style={styles.badgeText}>100 слов</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>⚡</Text>
                <Text style={styles.badgeText}>Молния</Text>
              </View>
            </View>
            <View style={styles.achievementRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>🎯</Text>
                <Text style={styles.badgeText}>Точность 90%</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>🗣️</Text>
                <Text style={styles.badgeText}>Разговорчик</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>🌟</Text>
                <Text style={styles.badgeText}>Мастер</Text>
              </View>
            </View>
          </View>

          {/* Задания */}
          <View style={styles.tasksSection}>
            <Text style={styles.sectionTitle}>✅ Выполненные задания</Text>
            <View style={styles.taskItem}>
              <Text style={styles.taskText}>✅ Изучить 5 новых слов</Text>
            </View>
            <View style={styles.taskItem}>
              <Text style={styles.taskText}>✅ Пройти 1 тест</Text>
            </View>
            <View style={styles.taskItem}>
              <Text style={styles.taskText}>✅ Поговорить с ИИ 10 минут</Text>
            </View>
            <View style={styles.taskItem}>
              <Text style={styles.taskText}>⏳ Добавить 3 новых слова (осталось 3)</Text>
            </View>
          </View>

          {/* Кнопка выхода */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Выйти</Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 375,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressItem: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e4ff',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  badge: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 80,
  },
  badgeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  tasksSection: {
    marginBottom: 24,
  },
  taskItem: {
    marginBottom: 8,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
