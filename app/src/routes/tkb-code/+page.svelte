<script lang="ts">
	import Background from '$lib/components/common/Background.svelte';
	import SchedulePreview from '$lib/components/schedule/SchedulePreview.svelte';
	import ScriptPanel from '$lib/components/script/ScriptPanel.svelte';
	import type { Course } from '$lib/components/schedule/CourseSelector.svelte';
	import type { ScheduleItem } from '$lib/components/schedule/Schedule.svelte';
	import { get } from 'svelte/store';
	import { courseData, selectedCourseIds as selectedStore } from '$lib/stores';
	import { onMount } from 'svelte';
	import { generateRegistrationScript } from '$lib/utils/script-generator';
	import { highlightJS } from '$lib/utils/syntax-highlighter';

	let availableCourses = $state<Course[]>(get(courseData));
	let selectedCourseIds = $state<string[]>(get(selectedStore));

	onMount(() => {
		const unsubCourse = courseData.subscribe((value) => {
			availableCourses = value;
		});

		const unsubSelected = selectedStore.subscribe((value) => {
			selectedCourseIds = value;
		});

		return () => {
			unsubCourse();
			unsubSelected();
		};
	});

	let scheduleItems = $derived.by(() => {
		return selectedCourseIds
			.map((id) => availableCourses.find((c) => c.id === id))
			.filter((course): course is Course => !!course)
			.map(
				(course): ScheduleItem => ({
					id: course.id,
					courseName: course.courseName,
					classCode: course.classCode,
					day: course.day,
					startTime: course.startTime,
					endTime: course.endTime,
					rawTiet: course.rawTiet || '',
					room: course.room,
					instructor: course.instructor,
					startDate: course.startDate,
					endDate: course.endDate
				})
			);
	});

	let classCodes = $derived(scheduleItems.map((item) => item.classCode));
	let uniqueCodes = $derived([...new Set(classCodes)]);

	let generatedScript = $derived(generateRegistrationScript(uniqueCodes));
	let highlightedScript = $derived(highlightJS(generatedScript));
</script>

<div class="fixed inset-0 z-[40] bg-primary flex flex-col">
	<Background />

	<main class="flex-1 flex flex-col overflow-hidden pt-4 pb-8">
		<div class="flex-1 overflow-hidden flex flex-col items-center justify-center px-4">
			<div class="w-full max-w-[1600px] h-full flex gap-4 relative">
				<SchedulePreview {scheduleItems} />

				<ScriptPanel classCodes={uniqueCodes} {generatedScript} {highlightedScript} />
			</div>
		</div>
	</main>
</div>
