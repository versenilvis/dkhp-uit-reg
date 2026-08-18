import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Course } from './components/schedule/CourseSelector.svelte';

function createPersistentStore<T>(key: string, initialValue: T) {
	let startValue = initialValue;
	let lastSerialized: string | null = null;

	if (browser) {
		const stored = localStorage.getItem(key);
		if (stored) {
			try {
				startValue = JSON.parse(stored);
				lastSerialized = stored;
			} catch (e) {
				console.error(`Error parsing localStorage for ${key}:`, e);
			}
		}
	}

	const store = writable<T>(startValue);

	if (browser) {
		store.subscribe((value) => {
			if (value === undefined || value === null) {
				if (lastSerialized !== null) {
					lastSerialized = null;
					localStorage.removeItem(key);
				}
				return;
			}

			const serialized = JSON.stringify(value);
			if (serialized === lastSerialized) return;

			lastSerialized = serialized;
			localStorage.setItem(key, serialized);
		});
	}

	return store;
}

export const courseData = createPersistentStore<Course[]>('dkhp_parsedCourses', []);
export const selectedCourseIds = createPersistentStore<string[]>('dkhp_selectedIds', []);
