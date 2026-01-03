<script lang="ts">
	import Background from '$lib/components/Background.svelte';
	import Schedule from '$lib/components/schedule/Schedule.svelte';
	import ScheduleGrid from '$lib/components/schedule/ScheduleGrid.svelte';
	import CourseSelector from '$lib/components/schedule/CourseSelector.svelte';
	import type { ScheduleItem } from '$lib/components/schedule/Schedule.svelte';
	import type { Course } from '$lib/components/schedule/CourseSelector.svelte';
	import { Eye, EyeOff } from 'lucide-svelte';
	import { courseData, selectedCourseIds as selectedStore } from '$lib/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let availableCourses = $state<Course[]>([]);
	let selectedCourseIds = $state<string[]>([]);
	let showPreview = $state(true);
	let isMobile = $state(false);

	let isActive = $derived($page.url.pathname === '/tao-tkb');

	onMount(() => {
		const unsubCourse = courseData.subscribe((value) => {
			availableCourses = value;
		});

		const unsubSelected = selectedStore.subscribe((value) => {
			selectedCourseIds = value;
		});

		if (browser) {
			const savedCourses = localStorage.getItem('dkhp_parsedCourses');
			if (savedCourses && availableCourses.length === 0) {
				const parsed = JSON.parse(savedCourses);
				availableCourses = parsed;
				courseData.set(parsed);
			}

			const savedIds = localStorage.getItem('dkhp_selectedIds');
			if (savedIds && selectedCourseIds.length === 0) {
				const parsed = JSON.parse(savedIds);
				selectedCourseIds = parsed;
				selectedStore.set(parsed);
			}
		}

		const mql = window.matchMedia('(max-width: 768px)');
		isMobile = mql.matches;
		const handler = (e: MediaQueryListEvent) => (isMobile = e.matches);
		mql.addEventListener('change', handler);

		return () => {
			unsubCourse();
			unsubSelected();
			mql.removeEventListener('change', handler);
		};
	});

	$effect(() => {
		if (browser && (selectedCourseIds.length > 0 || availableCourses.length > 0)) {
			localStorage.setItem('dkhp_selectedIds', JSON.stringify(selectedCourseIds));
			selectedStore.set(selectedCourseIds);
		}
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

	function toggleCourse(courseId: string) {
		if (selectedCourseIds.includes(courseId)) {
			selectedCourseIds = selectedCourseIds.filter((id) => id !== courseId);
		} else {
			selectedCourseIds = [...selectedCourseIds, courseId];
		}
	}

	function handleDeselectAll() {
		selectedCourseIds = [];
	}

	function handleRestoreSelection(ids: string[]) {
		selectedCourseIds = ids;
	}

	function handleRemoveCourse(id: string) {
		selectedCourseIds = selectedCourseIds.filter((cid) => cid !== id);
	}
</script>

<div
	class="fixed inset-0 z-[40] bg-primary flex flex-col transition-opacity duration-200"
	class:pointer-events-none={!isActive}
	class:opacity-0={!isActive}
	class:invisible={!isActive}
>
	<Background />

	<main class="flex-1 flex flex-col overflow-hidden pt-4">
		<div class="flex-1 overflow-hidden flex flex-col items-center justify-center">
			<div class="w-full max-w-[1600px] mx-auto px-3 md:px-4 h-full flex items-center relative">
				{#if availableCourses.length === 0}
					<!-- FULL SKELETON UI -->
					<div class="flex gap-2 w-full h-full">
						<div
							class="flex-1 flex flex-col bg-white/95 backdrop-blur-sm border-2 border-black rounded-xl overflow-hidden relative"
							style="max-height: calc(100vh - 60px); height: calc(100vh - 60px);"
						>
							<!-- Table Header -->
							<div class="bg-gray-100 border-b-2 border-black shrink-0">
								<div class="flex bg-gray-50 text-[11px]">
									<div class="p-1.5 font-bold border-r border-gray-300 w-8 shrink-0"></div>
									<div class="p-1.5 font-bold border-r border-gray-300 uppercase w-[20%] shrink-0">
										Môn học
									</div>
									<div class="p-1.5 font-bold border-r border-gray-300 uppercase w-28 shrink-0">
										Mã lớp
									</div>
									<div
										class="p-1.5 font-bold border-r border-gray-300 uppercase w-8 shrink-0 text-center"
									>
										Thứ
									</div>
									<div class="p-1.5 font-bold border-r border-gray-300 uppercase w-48 shrink-0">
										Giảng viên
									</div>
									<div
										class="p-1.5 font-bold border-r border-gray-300 uppercase w-12 shrink-0 text-center"
									>
										Tiết
									</div>
									<div
										class="p-1.5 font-bold border-r border-gray-300 uppercase w-24 shrink-0 text-center"
									>
										Thời gian
									</div>
									<div
										class="p-1.5 font-bold border-r border-gray-300 uppercase w-8 shrink-0 text-center"
									>
										TC
									</div>
									<div class="p-1.5 font-bold flex-1 uppercase">PHÒNG</div>
								</div>
							</div>
							<!-- Skeleton rows -->
							<div class="flex-1 overflow-hidden animate-pulse">
								{#each Array(20) as _}
									<div class="flex items-center border-b border-gray-200 h-8">
										<div class="p-1.5 border-r border-gray-300 w-8 shrink-0">
											<div class="h-3 bg-gray-200 rounded"></div>
										</div>
										<div class="p-1.5 border-r border-gray-300 w-[20%] shrink-0">
											<div class="h-3 bg-gray-200 rounded w-3/4"></div>
										</div>
										<div class="p-1.5 border-r border-gray-300 w-28 shrink-0">
											<div class="h-3 bg-gray-200 rounded w-1/2"></div>
										</div>
										<div class="p-1.5 border-r border-gray-300 w-8 shrink-0">
											<div class="h-3 bg-gray-200 rounded w-full"></div>
										</div>
										<div class="p-1.5 border-r border-gray-300 w-48 shrink-0">
											<div class="h-3 bg-gray-200 rounded w-2/3"></div>
										</div>
										<div class="p-1.5 border-r border-gray-300 w-12 shrink-0">
											<div class="h-3 bg-gray-200 rounded w-full"></div>
										</div>
										<div class="p-1.5 border-r border-gray-300 w-24 shrink-0">
											<div class="h-3 bg-gray-200 rounded w-full"></div>
										</div>
										<div class="p-1.5 border-r border-gray-300 w-8 shrink-0">
											<div class="h-3 bg-gray-200 rounded w-full"></div>
										</div>
										<div class="p-1.5 flex-1">
											<div class="h-3 bg-gray-200 rounded w-1/2"></div>
										</div>
									</div>
								{/each}
							</div>
							<!-- Skeleton Preview - Overlay on right side of table -->
							<div
								class="absolute top-0 right-0 bottom-0 bg-white border-l-2 border-black overflow-hidden z-10"
								style="width: 650px;"
							>
								<div class="p-4 h-full flex flex-col gap-4 animate-pulse">
									<div class="h-8 bg-gray-100 rounded w-full mb-4"></div>
									<div class="grid grid-cols-6 gap-2 flex-1">
										{#each Array(48) as _}
											<div class="bg-gray-50 border border-gray-100 rounded h-12"></div>
										{/each}
									</div>
								</div>
							</div>
						</div>
						<!-- Toggle Button Placeholder -->
						<div
							class="shrink-0 w-10 h-10 bg-white border-2 border-black rounded-lg shadow-lg flex items-center justify-center self-start mt-4"
						>
							<div class="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
						</div>
					</div>
				{:else if isMobile}
					<div
						class="w-full space-y-4 py-4 overflow-y-auto"
						style="max-height: calc(100vh - 120px);"
					>
						<div
							class="bg-white/95 backdrop-blur-sm rounded-lg border-2 border-black shadow-lg p-4"
						>
							<h2 class="text-lg font-bold mb-3">Danh sách môn học ({availableCourses.length})</h2>
							<CourseSelector
								courses={availableCourses}
								selectedIds={selectedCourseIds}
								onToggle={toggleCourse}
								onDeselectAll={handleDeselectAll}
								onRestoreSelection={handleRestoreSelection}
							/>
						</div>
						{#if scheduleItems.length > 0}
							<div
								class="bg-white/95 backdrop-blur-sm rounded-lg border-2 border-black shadow-lg p-4"
							>
								<h2 class="text-lg font-bold mb-3">Preview Thời Khóa Biểu</h2>
								<Schedule items={scheduleItems} />
							</div>
						{/if}
					</div>
				{:else}
					<div class="flex gap-2 w-full h-full">
						<div
							class="flex-1 flex flex-col bg-white/95 backdrop-blur-sm border-2 border-black rounded-xl overflow-hidden relative"
							style="max-height: calc(100vh - 60px); height: calc(100vh - 60px);"
						>
							<div class="flex-1 overflow-hidden min-h-0 h-full">
								<CourseSelector
									courses={availableCourses}
									selectedIds={selectedCourseIds}
									onToggle={toggleCourse}
									onDeselectAll={handleDeselectAll}
									onRestoreSelection={handleRestoreSelection}
								/>
							</div>
							{#if showPreview}
								<div
									class="absolute top-0 right-0 bottom-0 bg-white border-l-2 border-black overflow-auto z-10"
									style="width: 600px;"
								>
									<ScheduleGrid items={scheduleItems} onRemove={handleRemoveCourse} />
								</div>
							{/if}
						</div>
						<button
							type="button"
							onclick={() => (showPreview = !showPreview)}
							class="shrink-0 w-10 h-10 bg-white border-2 border-black rounded-lg shadow-lg hover:bg-yellow-400 transition-colors flex items-center justify-center self-start mt-4"
							title={showPreview ? 'Ẩn TKB' : 'Xem TKB'}
						>
							{#if showPreview}
								<EyeOff size={20} />
							{:else}
								<Eye size={20} />
							{/if}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</main>
</div>

<style>
	:global(body) {
		background-color: #ffd100;
	}
</style>
