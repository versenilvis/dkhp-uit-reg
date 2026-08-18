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
				// Ghi nhớ đúng chuỗi vừa đọc để lần subscribe đầu tiên (Svelte luôn
				// phát ngay giá trị hiện tại) không ghi đè lại y hệt những gì vừa đọc.
				lastSerialized = stored;
			} catch (e) {
				console.error(`Error parsing localStorage for ${key}:`, e);
			}
		}
	}

	const store = writable<T>(startValue);

	if (browser) {
		/*
		 * `dkhp_parsedCourses` có thể lên tới hàng trăm KB (toàn bộ lớp học từ file
		 * Excel). Trước đây mỗi lần tải trang đều JSON.stringify + ghi lại nguyên
		 * khối đó một cách đồng bộ, dù dữ liệu không hề đổi -> chặn main thread vô
		 * ích ngay lúc khởi động. Chỉ ghi khi nội dung thực sự khác đi.
		 */
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
