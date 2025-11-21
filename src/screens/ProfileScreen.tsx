// src/screens/ProfileScreen.tsx (экран статистики и достижений)
import React, { useContext, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import useStats from '../hooks/useStats';
import LoadingIndicator from '../components/LoadingIndicator';

export default function ProfileScreen() {
  const { logout: contextLogout } = useContext(AuthContext)!;

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

  const xpForLevel = (level: number): number => {
    if (level === 1) return 0;
    return 100 * (level * level - 2 * level + 3);
  };

  const levelProgress = (stats: any): number => {
    const currentLevel = stats?.currentLevel || 1;
    const totalXp = stats?.totalXp || 0;
    const currentLevelXp = xpForLevel(currentLevel);
    const nextLevelXp = xpForLevel(currentLevel + 1);
    const progress = (totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp);
    return Math.min(Math.max(progress, 0), 1);
  };

  const getNextEnglishLevel = (currentLevel: number): string => {
    if (currentLevel < 5) return 'A1';
    if (currentLevel < 10) return 'A2';
    if (currentLevel < 15) return 'B1';
    if (currentLevel < 20) return 'B2';
    if (currentLevel < 25) return 'C1';
    if (currentLevel < 30) return 'C2';
    return 'C2'; // Максимальный уровень
  };

  const englishLevelProgress = (stats: any): { progress: number; startXP: number; endXP: number } => {
    const currentLevel = stats?.currentLevel || 1;
    const currentXP = stats?.totalXp || 0;
    if (currentLevel >= 30) return { progress: 1, startXP: 0, endXP: 0 }; // Максимальный уровень достигнут

    let startLevel = 1;
    let endLevel = 5;

    if (currentLevel >= 5) { startLevel = 5; endLevel = 10; }
    if (currentLevel >= 10) { startLevel = 10; endLevel = 15; }
    if (currentLevel >= 15) { startLevel = 15; endLevel = 20; }
    if (currentLevel >= 20) { startLevel = 20; endLevel = 25; }
    if (currentLevel >= 25) { startLevel = 25; endLevel = 30; }

    const startXP = xpForLevel(startLevel);
    const endXP = xpForLevel(endLevel);
    const progress = (currentXP - startXP) / (endXP - startXP);
    return { progress: Math.min(Math.max(progress, 0), 1), startXP, endXP };
  };

  if (statsLoading) {
    return <LoadingIndicator text="Загрузка статистики..." />;
  }

  if (statsError) {
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
              <Text style={styles.statLabel}>Время обучения (мин):</Text>
              <Text style={styles.statValue}>{Math.floor((stats?.timeSpentSec || 0) / 60)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Время обучения сегодня (мин):</Text>
              <Text style={styles.statValue}>{Math.floor((stats?.timeSpentTodaySec || 0) / 60)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Уровень английского:</Text>
              <Text style={styles.statValue}>{stats?.currentLanguageLevel || 'Не определен'}</Text>
            </View>
          </View>

          {/* Прогресс к следующему уровню */}
          <View style={styles.levelProgressSection}>
            <Text style={styles.sectionTitle}>⬆️ Следующий уровень: {(stats?.currentLevel || 1) + 1}</Text>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>
                XP: {stats?.totalXp || 0} / {xpForLevel((stats?.currentLevel || 1) + 1)}
              </Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${levelProgress(stats) * 100}%` }]}
                />
                <Text style={styles.progressText}>{Math.round(levelProgress(stats) * 100)}%</Text>
              </View>
            </View>
          </View>

          {/* Прогресс к следующему уровню английского */}
          <View style={styles.levelProgressSection}>
            <Text style={styles.sectionTitle}>🌍 Следующий уровень английского: {getNextEnglishLevel(stats?.currentLevel || 1)}</Text>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>
                XP: {stats?.totalXp || 0} / {englishLevelProgress(stats).endXP}
              </Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${englishLevelProgress(stats).progress * 100}%` }]}
                />
                <Text style={styles.progressText}>{Math.round(englishLevelProgress(stats).progress * 100)}%</Text>
              </View>
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
  levelProgressSection: {
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
    height: 20,
    backgroundColor: '#e0e4ff',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
    position: 'absolute',
    textAlign: 'center',
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
