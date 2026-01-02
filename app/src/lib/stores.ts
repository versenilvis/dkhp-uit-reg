import { writable } from 'svelte/store';
import type { Course } from './components/schedule/CourseSelector.svelte';

export const courseData = writable<Course[]>([]);
export const selectedCourseIds = writable<string[]>([]);
