import React, { useRef } from 'react';
import {
  Pressable,
  Animated,
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';

import { MuscleGroupBadge } from './muscle-group-badge';

import type { Exercise } from '@/types/workout';
import { DarkTheme } from '@/constants/theme';
import { haptic } from '@/lib/haptics';

interface Props {
  exercise: Exercise;
  onPress?: () => void;
}

export function ExerciseListItem({ exercise, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    haptic.light();
    onPress?.();
  };

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.container}>
        {exercise.imageUrl ? (
          <Image
            source={{ uri: exercise.imageUrl }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>
              {exercise.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.name}>{exercise.name}</Text>
          {exercise.equipment ? (
            <Text style={styles.equipment}>{exercise.equipment}</Text>
          ) : null}
          {exercise.muscleGroups.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.badges}>
              {exercise.muscleGroups.map((mg) => (
                <View key={mg.id} style={{ marginRight: 4 }}>
                  <MuscleGroupBadge muscleGroup={mg} size="sm" />
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: DarkTheme.bgSurface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  placeholder: {
    backgroundColor: DarkTheme.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: DarkTheme.textTertiary,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  name: {
    color: DarkTheme.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  equipment: {
    color: DarkTheme.textTertiary,
    fontSize: 12,
  },
  badges: {
    marginTop: 4,
  },
});
