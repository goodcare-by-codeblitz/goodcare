import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
				headerShown: true,
				tabBarButton: HapticTab,
			}}>
			<Tabs.Screen
				name='index'
				options={{
					title: 'Home',
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name='house.fill' color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name='explore'
				options={{
					title: 'Database',
					tabBarIcon: ({ color }) => (
						<Ionicons name='trash' size={28} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name='explorer'
				options={{
					title: 'Take a Photo',
					tabBarIcon: ({ color }) => (
						<Ionicons name='camera' size={28} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
