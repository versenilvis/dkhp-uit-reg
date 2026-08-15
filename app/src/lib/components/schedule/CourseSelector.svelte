<script lang="ts">
	import { onMount } from 'svelte';
	import { XCircle, RotateCcw, AlertTriangle, Ban, Info } from 'lucide-svelte';
	import coursesData from '$lib/data/courses.json';
	import CourseDetailModal from '$lib/components/courses/CourseDetailModal.svelte';
	import type { CourseInfo } from '$lib/components/courses/CourseDetailModal.svelte';

	export type Course = {
		id: string;
		courseName: string;
		classCode: string;
		day: number;
		startTime: string;
		endTime: string;
		rawTiet?: string;
		room: string;
		instructor: string;
		credits: number;
		startDate?: string;
		endDate?: string;
		type?: string;
	};

	interface Props {
		courses: Course[];
		selectedIds: string[];
		onToggle: (courseId: string) => void;
		onDeselectAll?: () => void;
		onRestoreSelection?: (ids: string[]) => void;
	}

	let { courses, selectedIds, onToggle, onDeselectAll, onRestoreSelection }: Props = $props();

	let detailedCourse = $state<CourseInfo | null>(null);

	function openCourseDetails(course: Course) {
		const baseCode = course.classCode.split('.')[0].toUpperCase();
		const found = (coursesData.courses as CourseInfo[]).find(
			(c) =>
				c.id.toUpperCase() === baseCode ||
				c.name.toLowerCase().trim() === course.courseName.toLowerCase().trim()
		);

		if (found) {
			detailedCourse = found;
		} else {
			detailedCourse = {
				id: baseCode,
				name: course.courseName,
				description: `Môn học ${course.courseName} (${baseCode})${course.credits ? ' - ' + course.credits + ' tín chỉ' : ''}`,
				faculty: baseCode.replace(/[^A-Za-z]/g, '')
			};
		}
	}

	let backupSelectedIds = $state<string[] | null>(null);

	let canRestore = $derived(backupSelectedIds !== null && selectedIds.length === 0);

	function handleToggleDeselect() {
		if (canRestore && backupSelectedIds) {
			if (onRestoreSelection) {
				onRestoreSelection(backupSelectedIds);
			}
			backupSelectedIds = null;
		} else if (selectedIds.length > 0) {
			backupSelectedIds = [...selectedIds];
			if (onDeselectAll) {
				onDeselectAll();
			}
		}
	}

	$effect(() => {
		if (backupSelectedIds !== null && selectedIds.length > 0) {
			backupSelectedIds = null;
		}
	});

	let tooltip = $state<{ text: string; type: 'error' | 'warning'; x: number; y: number } | null>(
		null
	);

	function showTooltip(e: MouseEvent, text: string, type: 'error' | 'warning') {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		tooltip = { text, type, x: rect.left, y: rect.top - 28 };
	}

	function hideTooltip() {
		tooltip = null;
	}

	let filterCourseName = $state('');
	let filterClassCode = $state('');
	let selectedDays = $state<Set<number>>(new Set());
	let filterInstructor = $state('');
	let filterTiet = $state('');
	let showCourseDropdown = $state(false);
	let showDayDropdown = $state(false);
	let selectedCourseNames = $state<Set<string>>(new Set());
	let backupCourseNames = $state<Set<string> | null>(null);
	let backupDays = $state<Set<number> | null>(null);

	let canRestoreCourseNames = $derived(
		backupCourseNames !== null && selectedCourseNames.size === 0
	);
	let canRestoreDays = $derived(backupDays !== null && selectedDays.size === 0);

	function toggleDeselectCourseNames() {
		if (canRestoreCourseNames && backupCourseNames) {
			selectedCourseNames = new Set(backupCourseNames);
			backupCourseNames = null;
		} else if (selectedCourseNames.size > 0) {
			backupCourseNames = new Set(selectedCourseNames);
			selectedCourseNames = new Set();
		}
	}

	function toggleDeselectDays() {
		if (canRestoreDays && backupDays) {
			selectedDays = new Set(backupDays);
			backupDays = null;
		} else if (selectedDays.size > 0) {
			backupDays = new Set(selectedDays);
			selectedDays = new Set();
		}
	}

	function toggleDayFilter(day: number) {
		if (selectedDays.has(day)) {
			selectedDays.delete(day);
		} else {
			selectedDays.add(day);
		}
		selectedDays = new Set(selectedDays);
		backupDays = null;
	}

	let uniqueCourseNames = $derived.by(() => {
		const names = new Set<string>();
		courses.forEach((c) => names.add(c.classCode.split('.')[0]));
		return Array.from(names).sort();
	});

	function toggleCourseNameFilter(name: string) {
		if (selectedCourseNames.has(name)) {
			selectedCourseNames.delete(name);
		} else {
			selectedCourseNames.add(name);
		}
		selectedCourseNames = new Set(selectedCourseNames);
		backupCourseNames = null;
	}

	function resetFilters() {
		filterCourseName = '';
		filterClassCode = '';
		selectedDays = new Set();
		filterInstructor = '';
		filterTiet = '';
		selectedCourseNames = new Set();
		backupCourseNames = null;
		backupDays = null;
	}

	let dropdownRef: HTMLDivElement;
	let dayDropdownRef: HTMLDivElement;
	let searchInputRef = $state<HTMLInputElement>();

	$effect(() => {
		if (showCourseDropdown && searchInputRef) {
			searchInputRef.focus();
		}
	});

	function handleClickOutside(e: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
			showCourseDropdown = false;
		}
		if (dayDropdownRef && !dayDropdownRef.contains(e.target as Node)) {
			showDayDropdown = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			showCourseDropdown = false;
			showDayDropdown = false;
		}
	}

	$effect(() => {
		if (showCourseDropdown || showDayDropdown) {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
		}
		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	let filteredCourses = $derived.by(() => {
		let result = courses;

		if (selectedCourseNames.size > 0) {
			result = result.filter((c) => selectedCourseNames.has(c.classCode.split('.')[0]));
		}

		if (filterClassCode.trim()) {
			const search = filterClassCode.toLowerCase();
			result = result.filter((c) => c.classCode.toLowerCase().includes(search));
		}

		if (selectedDays.size > 0) {
			result = result.filter((c) => selectedDays.has(c.day));
		}

		if (filterInstructor.trim()) {
			const search = filterInstructor.toLowerCase();
			result = result.filter((c) => c.instructor.toLowerCase().includes(search));
		}

		if (filterTiet.trim()) {
			const search = filterTiet.toLowerCase();
			result = result.filter((c) => (c.rawTiet || '').toLowerCase().includes(search));
		}

		return result;
	});

	let selectedIdSet = $derived(new Set(selectedIds));

	function isSelected(courseId: string): boolean {
		return selectedIdSet.has(courseId);
	}

	let totalCredits = $derived.by(() => {
		return courses
			.filter((course) => selectedIdSet.has(course.id))
			.reduce((sum, course) => sum + course.credits, 0);
	});

	let selectedCourses = $derived(courses.filter((c) => selectedIdSet.has(c.id)));

	const toMin = (t: string) => {
		if (!t) return 0;
		const [h, m] = t.split(':').map(Number);
		return h * 60 + m;
	};

	function getBaseCode(classCode: string): string {
		const parts = (classCode || '').split('.');

		if (parts.length >= 3) {
			return parts.slice(0, 2).join('.');
		}
		return classCode;
	}

	function isPractice(classCode: string): boolean {
		const parts = (classCode || '').split('.');
		return parts.length >= 3;
	}
	function getCoursePrefix(classCode: string): string {
		return (classCode || '').split('.')[0];
	}

	let duplicateCourseSet = $state(new Map<string, 'course' | 'practice'>());
	let conflictSet = $state(new Set<string>());
	let calcTimeout: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		const _selectedIds = selectedIdSet;
		const _selectedCourses = selectedCourses;

		if (calcTimeout) clearTimeout(calcTimeout);

		calcTimeout = setTimeout(() => {
			const duplicates = new Map<string, 'course' | 'practice'>();
			if (_selectedCourses.length > 0) {
				const selectedSectionByPrefix = new Map<string, string>();
				const selectedPracticeByBase = new Set<string>();
				const selectedTheoryByBase = new Set<string>();

				for (const c of _selectedCourses) {
					const prefix = getCoursePrefix(c.classCode);
					const base = getBaseCode(c.classCode);
					selectedSectionByPrefix.set(prefix, base);
					if (isPractice(c.classCode)) {
						selectedPracticeByBase.add(base);
					} else {
						selectedTheoryByBase.add(base);
					}
				}

				for (const course of courses) {
					if (_selectedIds.has(course.id)) continue;

					const prefix = getCoursePrefix(course.classCode);
					const base = getBaseCode(course.classCode);
					const practice = isPractice(course.classCode);

					if (selectedSectionByPrefix.has(prefix)) {
						const selectedBase = selectedSectionByPrefix.get(prefix);
						if (base !== selectedBase) {
							duplicates.set(course.id, 'course');
						} else {
							if (practice && selectedPracticeByBase.has(base)) {
								duplicates.set(course.id, 'practice');
							} else if (!practice && selectedTheoryByBase.has(base)) {
								duplicates.set(course.id, 'course');
							}
						}
					}
				}
			}
			duplicateCourseSet = duplicates;

			const conflicts = new Set<string>();
			if (_selectedCourses.length > 0) {
				const selectedByDay = new Map<number, { start: number; end: number }[]>();
				for (const selected of _selectedCourses) {
					const dayList = selectedByDay.get(selected.day) || [];
					dayList.push({ start: toMin(selected.startTime), end: toMin(selected.endTime) });
					selectedByDay.set(selected.day, dayList);
				}

				for (const course of courses) {
					if (_selectedIds.has(course.id)) continue;

					const daySlots = selectedByDay.get(course.day);
					if (!daySlots) continue;

					const cStart = toMin(course.startTime);
					const cEnd = toMin(course.endTime);

					for (const slot of daySlots) {
						if (cStart < slot.end && cEnd > slot.start) {
							conflicts.add(course.id);
							break;
						}
					}
				}
			}
			conflictSet = conflicts;
		}, 100);
	});

	// Simple virtualization
	const ROW_HEIGHT = 32;
	const BUFFER = 10;
	let scrollContainer: HTMLDivElement;
	let scrollTop = $state(0);
	let containerHeight = $state(600);

	let visibleRange = $derived.by(() => {
		const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
		const endIndex = Math.min(
			filteredCourses.length,
			Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER
		);
		return { startIndex, endIndex };
	});

	let visibleCourses = $derived(
		filteredCourses.slice(visibleRange.startIndex, visibleRange.endIndex)
	);

	let totalHeight = $derived(filteredCourses.length * ROW_HEIGHT);
	let offsetY = $derived(visibleRange.startIndex * ROW_HEIGHT);

	function handleScroll(e: Event) {
		const target = e.target as HTMLDivElement;
		scrollTop = target.scrollTop;
	}

	onMount(() => {
		if (scrollContainer) {
			containerHeight = scrollContainer.clientHeight;
		}
	});
</script>

<div class="h-full flex flex-col">
	<div class="bg-gray-100 border-b-2 border-black shrink-0">
		<div class="flex bg-gray-50 text-[11px] relative">
			<div
				class="p-1.5 font-bold border-r border-gray-300 w-8 shrink-0 flex items-center justify-center"
			>
				{#if selectedIds.length > 0 || canRestore}
					<button
						type="button"
						onclick={handleToggleDeselect}
						class="w-5 h-5 rounded hover:bg-gray-200 cursor-pointer flex items-center justify-center transition-colors {canRestore
							? 'text-green-600'
							: 'text-red-500'}"
						title={canRestore ? 'Khôi phục selection' : `Bỏ chọn tất cả (${selectedIds.length})`}
					>
						{#if canRestore}
							<RotateCcw size={14} />
						{:else}
							<XCircle size={14} />
						{/if}
					</button>
				{/if}
			</div>
			<div class="p-1.5 font-bold border-r border-gray-300 uppercase w-[20%] shrink-0">Môn học</div>
			<div class="p-1.5 font-bold border-r border-gray-300 uppercase w-28 shrink-0">Mã lớp</div>
			<div class="p-1.5 font-bold border-r border-gray-300 uppercase w-11 shrink-0 text-center">
				Thứ
			</div>
			<div class="p-1.5 font-bold border-r border-gray-300 uppercase w-48 shrink-0">Giảng viên</div>
			<div class="p-1.5 font-bold border-r border-gray-300 uppercase w-12 shrink-0 text-center">
				Tiết
			</div>
			<div class="p-1.5 font-bold border-r border-gray-300 uppercase w-24 shrink-0 text-center">
				Thời gian
			</div>
			<div class="p-1.5 font-bold border-r border-gray-300 uppercase w-8 shrink-0 text-center">
				TC
			</div>
			<div class="p-1.5 font-bold uppercase flex-1">PHÒNG</div>
		</div>
		<!-- Filter Row -->
		<div class="flex bg-white text-[11px] border-t border-gray-200">
			<div class="p-1 border-r border-gray-300 w-8 shrink-0"></div>
			<div bind:this={dropdownRef} class="p-1 border-r border-gray-300 w-[20%] shrink-0 relative">
				<button
					type="button"
					class="w-full h-6 px-1 border border-gray-300 rounded text-left text-[10px] bg-white hover:bg-gray-50 truncate flex items-center justify-between cursor-pointer"
					onclick={() => (showCourseDropdown = !showCourseDropdown)}
				>
					<span class="truncate"
						>{selectedCourseNames.size > 0
							? `${selectedCourseNames.size} môn`
							: 'Chọn môn...'}</span
					>
				</button>
				{#if showCourseDropdown}
					<div
						class="absolute top-full left-0 mt-1 w-full max-h-120 overflow-y-auto bg-white border border-gray-300 rounded shadow-lg z-50"
					>
						<div class="p-2 border-b border-gray-200 sticky top-0 bg-white">
							<input
								type="text"
								bind:this={searchInputRef}
								bind:value={filterCourseName}
								placeholder="Tìm môn..."
								class="w-full h-6 px-2 border border-gray-300 rounded text-[10px]"
							/>
							<div class="flex items-center gap-2 mt-1">
								{#if selectedCourseNames.size > 0 || canRestoreCourseNames}
									<button
										type="button"
										class="cursor-pointer text-[10px] {canRestoreCourseNames
											? 'text-green-600'
											: 'text-red-500'} hover:underline"
										onclick={toggleDeselectCourseNames}
									>
										{canRestoreCourseNames ? 'Khôi phục' : `Bỏ chọn (${selectedCourseNames.size})`}
									</button>
								{/if}
							</div>
						</div>
						<div class="p-1">
							{#each uniqueCourseNames.filter((n) => n
									.toLowerCase()
									.includes(filterCourseName.toLowerCase())) as name}
								<label
									class="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer text-[10px]"
								>
									<input
										type="checkbox"
										checked={selectedCourseNames.has(name)}
										onchange={() => toggleCourseNameFilter(name)}
										class="w-3 h-3"
									/>
									{name}
								</label>
							{/each}
						</div>
					</div>
				{/if}
			</div>
			<div class="p-1 border-r border-gray-300 w-28 shrink-0">
				<input
					type="text"
					bind:value={filterClassCode}
					placeholder="Tìm mã lớp..."
					class="w-full h-6 px-1 border border-gray-300 rounded text-[10px]"
				/>
			</div>
			<div bind:this={dayDropdownRef} class="p-1 border-r border-gray-300 w-11 shrink-0 relative">
				<button
					type="button"
					class="w-full h-6 px-1 border border-gray-300 rounded text-[10px] bg-white hover:bg-gray-50 cursor-pointer truncate"
					onclick={() => (showDayDropdown = !showDayDropdown)}
				>
					--
				</button>
				{#if showDayDropdown}
					<div
						class="absolute top-full left-0 mt-1 pb-1 w-14 bg-white border border-gray-300 rounded shadow-lg z-50"
					>
						<div class="p-1 border-b border-gray-200">
							{#if selectedDays.size > 0 || canRestoreDays}
								<button
									type="button"
									class="cursor-pointer text-[10px] {canRestoreDays
										? 'text-green-600'
										: 'text-red-500'} hover:underline"
									onclick={toggleDeselectDays}
								>
									{canRestoreDays ? 'Khôi phục' : 'Bỏ chọn'}
								</button>
							{/if}
						</div>
						{#each [[0, 'T2'], [1, 'T3'], [2, 'T4'], [3, 'T5'], [4, 'T6'], [5, 'T7']] as [day, label]}
							<label
								class="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer text-[10px]"
							>
								<input
									type="checkbox"
									checked={selectedDays.has(day as number)}
									onchange={() => toggleDayFilter(day as number)}
									class="w-3 h-3"
								/>
								{label}
							</label>
						{/each}
					</div>
				{/if}
			</div>
			<div class="p-1 border-r border-gray-300 w-48 shrink-0">
				<input
					type="text"
					bind:value={filterInstructor}
					placeholder="Tìm giảng viên..."
					class="w-full h-6 px-1 border border-gray-300 rounded text-[10px]"
				/>
			</div>
			<div class="p-1 border-r border-gray-300 w-12 shrink-0">
				<input
					type="text"
					bind:value={filterTiet}
					class="w-full h-6 px-1 border border-gray-300 rounded text-[10px]"
				/>
			</div>
			<div class="p-1 border-r border-gray-300 w-24 shrink-0"></div>
			<div class="p-1 border-r border-gray-300 w-8 shrink-0"></div>
		</div>
	</div>

	<!-- Virtualized Body -->
	<div bind:this={scrollContainer} class="flex-1 overflow-y-auto" onscroll={handleScroll}>
		{#if filteredCourses.length === 0}
			<div class="p-8 text-center text-gray-500">Không tìm thấy môn học nào</div>
		{:else}
			<div style="height: {totalHeight}px; position: relative;">
				<div style="transform: translateY({offsetY}px);">
					{#each visibleCourses as course (course.id)}
						{@const selected = isSelected(course.id)}
						{@const conflicting = conflictSet.has(course.id)}
						{@const duplicate = duplicateCourseSet.has(course.id)}
						{@const isBlocked = conflicting || duplicate}
						<div
							class="group flex items-center border-b border-gray-200 text-xs {selected
								? 'bg-yellow-100'
								: 'hover:bg-gray-50'} {isBlocked
								? 'text-gray-400 cursor-not-allowed'
								: 'cursor-pointer'}"
							style="height: {ROW_HEIGHT}px;"
							onclick={() => !isBlocked && onToggle(course.id)}
							onkeydown={(e) => e.key === 'Enter' && !isBlocked && onToggle(course.id)}
							role="row"
							tabindex="0"
						>
							<div
								class="p-1.5 border-r border-gray-300 w-8 shrink-0 flex items-center justify-center"
							>
								<input
									type="checkbox"
									checked={selected}
									disabled={isBlocked}
									onchange={() => !isBlocked && onToggle(course.id)}
									onclick={(e) => e.stopPropagation()}
									class="w-3.5 h-3.5"
								/>
							</div>
							<div
								class="p-1.5 border-r border-gray-300 w-[20%] shrink-0 font-semibold truncate flex items-center justify-between gap-1"
							>
								<button
									type="button"
									class="truncate text-left hover:underline hover:text-blue-600 focus:outline-none cursor-pointer flex-1"
									onclick={(e) => {
										e.stopPropagation();
										openCourseDetails(course);
									}}
									title="Bấm để xem tóm tắt thông tin môn học"
								>
									{course.classCode.split('.')[0]} - {course.courseName}
									{#if course.type}
										<span class="text-[10px] text-gray-400 font-normal">({course.type})</span>
									{/if}
								</button>
								<button
									type="button"
									class="shrink-0 p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-black cursor-pointer transition-colors"
									onclick={(e) => {
										e.stopPropagation();
										openCourseDetails(course);
									}}
									title="Xem chi tiết môn học"
								>
									<Info size={13} />
								</button>
								{#if duplicate}
									{@const reason = duplicateCourseSet.get(course.id)}
									<span
										class="shrink-0"
										role="img"
										aria-label="Trùng lớp"
										onmouseenter={(e) =>
											showTooltip(
												e,
												reason === 'practice' ? 'Trùng lớp thực hành' : 'Trùng môn học đã chọn',
												'error'
											)}
										onmouseleave={hideTooltip}
									>
										<Ban size={14} class="text-red-500" />
									</span>
								{:else if conflicting}
									<span
										class="shrink-0"
										role="img"
										aria-label="Trùng lịch"
										onmouseenter={(e) => showTooltip(e, 'Trùng lịch với môn đã chọn', 'warning')}
										onmouseleave={hideTooltip}
									>
										<AlertTriangle size={14} class="text-amber-500" />
									</span>
								{/if}
							</div>
							<div
								class="p-1.5 border-r border-gray-300 w-28 shrink-0 truncate"
								title={course.classCode}
							>
								{course.classCode}
							</div>
							<div class="p-1.5 border-r border-gray-300 w-11 shrink-0 text-center">
								{#if course.day === -1}
									-
								{:else if course.day === 6}
									CN
								{:else}
									{course.day + 2}
								{/if}
							</div>
							<div
								class="p-1.5 border-r border-gray-300 w-48 shrink-0 truncate"
								title={course.instructor}
							>
								{course.instructor}
							</div>
							<div class="p-1.5 border-r border-gray-300 w-12 shrink-0 text-center">
								{course.rawTiet || ''}
							</div>
							<div class="p-1.5 border-r border-gray-300 w-24 shrink-0 text-center">
								{course.startTime} - {course.endTime}
							</div>
							<div class="p-1.5 border-r border-gray-300 w-8 shrink-0 text-center font-medium">
								{course.credits}
							</div>
							<div class="p-1.5 flex-1 truncate">{course.room}</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Footer Info -->
	<div
		class="flex items-center gap-4 text-xs text-gray-600 p-2 shrink-0 border-t border-gray-200 bg-gray-50"
	>
		<p>
			Đã chọn: <span class="font-bold text-yellow-600">{selectedIds.length} lớp</span>
		</p>
		<p>
			Hiển thị: <span class="font-bold">{filteredCourses.length} lớp</span>
		</p>
		<p>
			{#if totalCredits < 14}
				<span class="font-bold text-red-600">Số tín chỉ: {totalCredits}</span>
				(<a
					href="https://oep.uit.edu.vn/sites/oep/files/uploads/files/202210/790_qd-dhcntt_28-9-2022_.pdf"
					target="_blank"
					rel="noopener noreferrer"
					class="text-red-600 underline hover:text-red-800">Trang 13 - Quy chế đào tạo</a
				>)
			{:else if totalCredits <= 24}
				<span class="font-bold text-green-600">Số tín chỉ: {totalCredits}</span>
			{:else if totalCredits <= 30}
				<span class="font-bold text-orange-600">Số tín chỉ: {totalCredits}</span>
				<span class="text-orange-600">(ĐTBC ≥ 8.0)</span>
			{:else}
				<span class="font-bold text-red-600">Số tín chỉ: {totalCredits}</span>
				<span class="text-red-600">(Max 30 TC!)</span>
			{/if}
		</p>
	</div>
</div>

<!-- Fixed Tooltip Portal -->
{#if tooltip}
	<div
		class="fixed px-3 py-1.5 text-sm font-medium rounded shadow-lg z-[99999] pointer-events-none {tooltip.type ===
		'error'
			? 'bg-red-500 text-white'
			: 'bg-amber-500 text-white'}"
		style="left: {tooltip.x}px; top: {tooltip.y}px;"
	>
		{tooltip.text}
	</div>
{/if}

<CourseDetailModal course={detailedCourse} onClose={() => (detailedCourse = null)} />
