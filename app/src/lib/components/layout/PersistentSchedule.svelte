<script lang="ts">
	import Background from '$lib/components/common/Background.svelte';
	import Schedule from '$lib/components/schedule/Schedule.svelte';
	import ScheduleGrid from '$lib/components/schedule/ScheduleGrid.svelte';
	import CourseSelector from '$lib/components/schedule/CourseSelector.svelte';
	import type { ScheduleItem } from '$lib/components/schedule/Schedule.svelte';
	import type { Course } from '$lib/components/schedule/CourseSelector.svelte';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import { get } from 'svelte/store';
	import { courseData, selectedCourseIds as selectedStore } from '$lib/stores';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let availableCourses = $state<Course[]>(get(courseData));
	let selectedCourseIds = $state<string[]>(get(selectedStore));
	let showPreview = $state(true);
	let isMobile = $state(false);

	let isActive = $derived(page.url.pathname === '/tao-tkb');

	onMount(() => {
		const unsubCourse = courseData.subscribe((value) => {
			availableCourses = value;
		});

		const unsubSelected = selectedStore.subscribe((value) => {
			selectedCourseIds = value;
		});

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

	function isPractice(course: Course): boolean {
		if (course.type === 'TH') return true;
		if (course.type === 'LT') return false;
		if (course.id && course.id.startsWith('TH-')) return true;
		if (course.id && course.id.startsWith('LT-')) return false;
		const parts = (course.classCode || '').trim().split('.');
		return parts.length >= 3 && /^\d+$/.test(parts[parts.length - 1]);
	}

	function toggleCourse(courseId: string) {
		const course = availableCourses.find((c) => c.id === courseId);
		if (!course) return;

		selectedStore.update((currentIds) => {
			if (currentIds.includes(courseId)) {
				if (isPractice(course)) {
					// Xóa / bỏ chọn lớp TH: chỉ bỏ chọn lớp TH đó, lớp LT vẫn giữ nguyên
					const thIds = availableCourses
						.filter((c) => c.classCode === course.classCode)
						.map((c) => c.id);
					return currentIds.filter((id) => !thIds.includes(id));
				} else {
					// Xóa / bỏ chọn lớp LT: bỏ chọn lớp LT VÀ tất cả các lớp TH tương ứng
					const ltAndThIds = availableCourses
						.filter(
							(c) =>
								c.classCode === course.classCode || c.classCode.startsWith(course.classCode + '.')
						)
						.map((c) => c.id);
					return currentIds.filter((id) => !ltAndThIds.includes(id));
				}
			} else {
				const linkedIds = availableCourses
					.filter((c) => c.classCode === course.classCode)
					.map((c) => c.id);
				return [...new Set([...currentIds, ...linkedIds])];
			}
		});
	}

	function handleDeselectAll() {
		selectedStore.set([]);
	}

	function handleRestoreSelection(ids: string[]) {
		selectedStore.set(ids);
	}

	function handleRemoveCourse(id: string) {
		const course = availableCourses.find((c) => c.id === id);
		if (!course) return;

		if (isPractice(course)) {
			// Xóa lớp TH: chỉ xóa lớp TH đó, lớp LT giữ lại
			const thIds = availableCourses
				.filter((c) => c.classCode === course.classCode)
				.map((c) => c.id);
			selectedStore.update((currentIds) => currentIds.filter((cid) => !thIds.includes(cid)));
		} else {
			// Xóa lớp LT: xóa lớp LT VÀ tất cả lớp TH tương ứng
			const ltAndThIds = availableCourses
				.filter(
					(c) => c.classCode === course.classCode || c.classCode.startsWith(course.classCode + '.')
				)
				.map((c) => c.id);
			selectedStore.update((currentIds) => currentIds.filter((cid) => !ltAndThIds.includes(cid)));
		}
	}

	function getSwitchInfo(id: string): { nextCode: string; tooltip: string } | null {
		const course = availableCourses.find((c) => c.id === id);
		if (!course || !isPractice(course)) return null;

		const parts = (course.classCode || '').trim().split('.');
		const baseCode = parts.length >= 3 ? parts.slice(0, 2).join('.') : course.classCode;

		const siblingThCodes = [
			...new Set(
				availableCourses
					.filter(
						(c) =>
							isPractice(c) &&
							(c.classCode.startsWith(baseCode + '.') ||
								c.classCode.split('.').slice(0, 2).join('.') === baseCode)
					)
					.map((c) => c.classCode)
			)
		].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));

		if (siblingThCodes.length <= 1) return null;

		const currentIndex = siblingThCodes.indexOf(course.classCode);
		const nextIndex = (currentIndex + 1) % siblingThCodes.length;
		const nextClassCode = siblingThCodes[nextIndex];
		const nextSuffix = nextClassCode.split('.').slice(2).join('.');

		return {
			nextCode: nextClassCode,
			tooltip: `Đổi sang lớp thực hành .${nextSuffix || nextClassCode}`
		};
	}

	function handleSwitchCourse(id: string) {
		const switchInfo = getSwitchInfo(id);
		if (!switchInfo) return;

		const course = availableCourses.find((c) => c.id === id);
		if (!course) return;

		const nextClassCode = switchInfo.nextCode;
		const oldThIds = availableCourses
			.filter((c) => c.classCode === course.classCode)
			.map((c) => c.id);
		const newThIds = availableCourses.filter((c) => c.classCode === nextClassCode).map((c) => c.id);

		selectedStore.update((currentIds) => {
			const withoutOld = currentIds.filter((cid) => !oldThIds.includes(cid));
			return [...new Set([...withoutOld, ...newThIds])];
		});
	}
</script>

<div
	class="fixed inset-0 z-40 bg-primary flex flex-col transition-opacity duration-200"
	class:pointer-events-none={!isActive}
	class:opacity-0={!isActive}
	class:invisible={!isActive}
	style={isActive ? '' : 'content-visibility: hidden;'}
>
	<Background />

	<main class="flex-1 flex flex-col overflow-hidden pt-2.5 pb-10">
		<div class="w-full max-w-400 mx-auto px-3 md:px-4 h-full flex items-stretch relative">
			{#if availableCourses.length === 0}
				<!-- FULL SKELETON UI -->
				<div
					class="flex-1 h-full flex flex-col bg-white/95 backdrop-blur-sm border-2 border-black rounded-xl overflow-hidden relative"
				>
					<!-- Table Header -->
					<div class="bg-gray-100 border-b-2 border-black shrink-0">
						<div class="flex bg-gray-50 text-[11px] relative">
							<div
								class="p-1.5 font-bold border-r border-gray-300 w-8 shrink-0 flex items-center justify-center"
							></div>
							<div class="p-1.5 font-bold border-r border-gray-300 uppercase w-[20%] shrink-0">
								Môn học
							</div>
							<div class="p-1.5 font-bold border-r border-gray-300 uppercase w-28 shrink-0">
								Mã lớp
							</div>
							<div
								class="p-1.5 font-bold border-r border-gray-300 uppercase w-11 shrink-0 text-center"
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
						<!-- Filter Row Skeleton -->
						<div class="flex bg-white text-[11px] border-t border-gray-200 animate-pulse">
							<div class="p-1 border-r border-gray-300 w-8 shrink-0"></div>
							<div class="p-1 border-r border-gray-300 w-[20%] shrink-0">
								<div class="h-6 bg-gray-100 rounded w-full"></div>
							</div>
							<div class="p-1 border-r border-gray-300 w-28 shrink-0">
								<div class="h-6 bg-gray-100 rounded w-full"></div>
							</div>
							<div class="p-1 border-r border-gray-300 w-11 shrink-0">
								<div class="h-6 bg-gray-100 rounded w-full"></div>
							</div>
							<div class="p-1 border-r border-gray-300 w-48 shrink-0">
								<div class="h-6 bg-gray-100 rounded w-full"></div>
							</div>
							<div class="p-1 border-r border-gray-300 w-12 shrink-0">
								<div class="h-6 bg-gray-100 rounded w-full"></div>
							</div>
							<div class="p-1 border-r border-gray-300 w-24 shrink-0"></div>
							<div class="p-1 border-r border-gray-300 w-8 shrink-0"></div>
						</div>
					</div>
					<!-- Skeleton rows -->
					<div class="flex-1 overflow-hidden animate-pulse">
						{#each Array(20) as _}
							<div class="flex items-center border-b border-gray-200 h-8">
								<div class="p-1.5 border-r border-gray-300 w-8 shrink-0">
									<div class="h-3 bg-gray-100 rounded"></div>
								</div>
								<div class="p-1.5 border-r border-gray-300 w-[20%] shrink-0">
									<div class="h-3 bg-gray-100 rounded w-3/4"></div>
								</div>
								<div class="p-1.5 border-r border-gray-300 w-28 shrink-0">
									<div class="h-3 bg-gray-100 rounded w-1/2"></div>
								</div>
								<div class="p-1.5 border-r border-gray-300 w-11 shrink-0">
									<div class="h-3 bg-gray-100 rounded w-full"></div>
								</div>
								<div class="p-1.5 border-r border-gray-300 w-48 shrink-0">
									<div class="h-3 bg-gray-100 rounded w-2/3"></div>
								</div>
								<div class="p-1.5 border-r border-gray-300 w-12 shrink-0">
									<div class="h-3 bg-gray-100 rounded w-full"></div>
								</div>
								<div class="p-1.5 border-r border-gray-300 w-24 shrink-0">
									<div class="h-3 bg-gray-100 rounded w-full"></div>
								</div>
								<div class="p-1.5 border-r border-gray-300 w-8 shrink-0 text-center">
									<div class="h-3 bg-gray-100 rounded w-full"></div>
								</div>
								<div class="p-1.5 flex-1">
									<div class="h-3 bg-gray-100 rounded w-1/2"></div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Skeleton Preview - Overlay on right side of table -->
					<div
						class="absolute top-0 right-0 bottom-0 bg-white border-l-2 border-black overflow-hidden z-10 flex flex-col"
						style="width: 640px;"
					>
						<div
							class="px-3 py-1.5 bg-gray-50 border-b-2 border-black flex items-center justify-between shrink-0"
						>
							<div class="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
							<div class="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
						</div>
						<div class="p-4 flex-1 flex flex-col gap-4 animate-pulse overflow-hidden">
							<div class="grid grid-cols-6 gap-2 flex-1">
								{#each Array(48) as _}
									<div class="bg-gray-50 border border-gray-100 rounded h-12"></div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{:else if isMobile}
				<div class="w-full space-y-4 py-4 overflow-y-auto" style="max-height: calc(100vh - 120px);">
					<div class="bg-white/95 backdrop-blur-sm rounded-lg border-2 border-black shadow-lg p-4">
						<h2 class="text-lg font-bold mb-3">Danh sách môn học ({availableCourses.length})</h2>
						<CourseSelector
							courses={availableCourses}
							selectedIds={selectedCourseIds}
							onToggle={toggleCourse}
							onDeselectAll={handleDeselectAll}
							onRestoreSelection={handleRestoreSelection}
							active={isActive}
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
				<div
					class="flex-1 h-full flex flex-col bg-white/95 backdrop-blur-sm border-2 border-black rounded-xl overflow-hidden relative"
				>
					<div class="flex-1 overflow-hidden min-h-0 h-full">
						<CourseSelector
							courses={availableCourses}
							selectedIds={selectedCourseIds}
							onToggle={toggleCourse}
							onDeselectAll={handleDeselectAll}
							onRestoreSelection={handleRestoreSelection}
							active={isActive}
						/>
					</div>

					{#if !showPreview}
						<button
							type="button"
							onclick={() => (showPreview = true)}
							class="cursor-pointer absolute top-3 right-4 z-20 px-3 py-1.5 bg-yellow-400 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 active:translate-x-px active:translate-y-px transition-all flex items-center gap-1.5 font-black text-xs uppercase"
							title="Mở xem thời khóa biểu"
						>
							<Eye size={14} />
							<span>Xem TKB ({scheduleItems.length})</span>
						</button>
					{/if}

					{#if showPreview}
						<div
							class="absolute top-0 right-0 bottom-0 bg-white border-l-2 border-black overflow-hidden z-10 flex flex-col"
							style="width: 640px;"
						>
							<!-- Header Toolbar (zero obstruction over schedule cells) -->
							<div
								class="px-3 py-1.5 bg-gray-50 border-b-2 border-black flex items-center justify-between gap-2 shrink-0 select-none"
							>
								<div class="flex items-center gap-2">
									<span class="font-black uppercase text-xs tracking-wider text-black"
										>Thời khóa biểu</span
									>
									<span
										class="text-[10px] font-bold px-2 py-0.5 bg-yellow-300 border border-black rounded-full text-black"
									>
										{scheduleItems.length} môn
									</span>
								</div>

								<button
									type="button"
									onclick={() => (showPreview = false)}
									class="px-2.5 py-1 bg-white border-2 border-black rounded-lg hover:bg-red-50 text-black hover:text-red-600 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px transition-all shrink-0"
									title="Ẩn khung TKB"
								>
									<EyeOff size={13} />
									<span>Ẩn TKB</span>
								</button>
							</div>

							<div class="flex-1 overflow-auto min-h-0">
								<ScheduleGrid
									items={scheduleItems}
									onRemove={handleRemoveCourse}
									onSwitch={handleSwitchCourse}
									{getSwitchInfo}
									compact={true}
								/>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	:global(body) {
		background-color: #ffd100;
	}
</style>
