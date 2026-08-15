import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Course } from './components/schedule/CourseSelector.svelte';

function createPersistentStore<T>(key: string, initialValue: T) {
	let startValue = initialValue;
	if (browser) {
		const stored = localStorage.getItem(key);
		if (stored) {
			try {
				startValue = JSON.parse(stored);
			} catch (e) {
				console.error(`Error parsing localStorage for ${key}:`, e);
			}
		}
	}

	const store = writable<T>(startValue);

	if (browser) {
		store.subscribe((value) => {
			if (value === undefined || value === null) {
				localStorage.removeItem(key);
			} else {
				localStorage.setItem(key, JSON.stringify(value));
			}
		});
	}

	return store;
}

export const courseData = createPersistentStore<Course[]>('dkhp_parsedCourses', []);
export const selectedCourseIds = createPersistentStore<string[]>('dkhp_selectedIds', []);
