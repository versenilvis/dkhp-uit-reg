<script lang="ts">
	import { onMount } from 'svelte';
	import { XCircle, RotateCcw, AlertTriangle, Ban, SlidersHorizontal } from 'lucide-svelte';
	import { fuzzyMatch, scoreCourseMatch, getMatchScore } from '$lib/utils/search';
	import coursesData from '$lib/data/courses.json';
	import CourseDetailModal from '$lib/components/courses/CourseDetailModal.svelte';
	import SmartFilterModal from '$lib/components/schedule/SmartFilterModal.svelte';
	import type { SmartFilterState } from '$lib/components/schedule/SmartFilterModal.svelte';
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
				fuzzyMatch(c.name, course.courseName) ||
				fuzzyMatch(course.courseName, c.name)
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
	let showSmartFilterModal = $state(false);
	let smartFilters = $state<SmartFilterState>({
		onlyAvailable: false,
		selectionState: 'ALL',
		session: 'ALL',
		classType: 'ALL',
		faculty: 'ALL',
		credits: 'ALL'
	});

	let activeSmartFilterCount = $derived.by(() => {
		let count = 0;
		if (smartFilters.onlyAvailable) count++;
		if (smartFilters.selectionState !== 'ALL') count++;
		if (smartFilters.session !== 'ALL') count++;
		if (smartFilters.classType !== 'ALL') count++;
		if (smartFilters.faculty !== 'ALL') count++;
		if (smartFilters.credits !== 'ALL') count++;
		return count;
	});

	const generalPrefixes = [
		'MA',
		'MATH',
		'PH',
		'PHYS',
		'ENG',
		'ENGL',
		'JAN',
		'SS',
		'PE',
		'ACCT',
		'FIN',
		'MKTG',
		'STAT',
		'SPCH',
		'ME',
		'IEM',
		'MSIS'
	];

	function matchesSession(
		tiet: string,
		startTime: string,
		session: 'ALL' | 'MORNING' | 'AFTERNOON'
	): boolean {
		if (session === 'ALL') return true;
		if (tiet) {
			const digits = tiet.replace(/\D/g, '');
			if (digits) {
				const hasMorning = /[1-5]/.test(digits);
				const hasAfternoon = /[6-9]|10/.test(digits) || digits.includes('0');
				if (session === 'MORNING') return hasMorning && !hasAfternoon;
				if (session === 'AFTERNOON') return hasAfternoon;
			}
		}
		if (startTime) {
			const hour = parseInt(startTime.split(':')[0], 10);
			if (!isNaN(hour)) {
				if (session === 'MORNING') return hour < 12;
				if (session === 'AFTERNOON') return hour >= 12;
			}
		}
		return true;
	}

	function matchesFaculty(classCode: string, faculty: string): boolean {
		if (faculty === 'ALL') return true;
		const prefix = classCode
			.split('.')[0]
			.replace(/[^A-Za-z]/g, '')
			.toUpperCase();
		if (faculty === 'GEN') {
			return generalPrefixes.includes(prefix);
		}
		return prefix.startsWith(faculty);
	}

	let showCourseDropdown = $state(false);
	let showDayDropdown = $state(false);
	// Set of base course codes that have at least one class currently selected in selectedIds
	let selectedSubjectCodes = $derived.by(() => {
		const set = new Set<string>();
		const selectedSet = new Set(selectedIds);
		courses.forEach((c) => {
			if (selectedSet.has(c.id)) {
				const baseCode = c.classCode.split('.')[0];
				set.add(baseCode);
			}
		});
		return set;
	});

	let uniqueCourses = $derived.by(() => {
		const map = new Map<string, string>();
		courses.forEach((c) => {
			const code = c.classCode.split('.')[0];
			if (!map.has(code)) {
				map.set(code, c.courseName);
			}
		});
		return Array.from(map.entries())
			.map(([code, name]) => ({
				code,
				name,
				displayName: `${code} - ${name}`
			}))
			.sort((a, b) => a.displayName.localeCompare(b.displayName, 'vi'));
	});

	let filteredUniqueCourses = $derived.by(() => {
		const query = filterCourseName.trim();
		let list = uniqueCourses;
		if (query) {
			list = uniqueCourses
				.map((c) => ({
					course: c,
					score: scoreCourseMatch({ code: c.code, name: c.name }, query)
				}))
				.filter((item) => item.score > 0)
				.sort((a, b) => b.score - a.score || a.course.code.localeCompare(b.course.code))
				.map((item) => item.course);
		}

		const selected = list.filter((c) => selectedSubjectCodes.has(c.code));
		const unselected = list.filter((c) => !selectedSubjectCodes.has(c.code));

		return { selected, unselected };
	});

	let backupDays = $state<Set<number> | null>(null);
	let canRestoreDays = $derived(backupDays !== null && selectedDays.size === 0);

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

	function toggleSubjectInSchedule(baseCode: string) {
		const isCurrentlySelected = selectedSubjectCodes.has(baseCode);

		if (isCurrentlySelected) {
			const idsToRemove = new Set(
				courses
					.filter((c) => c.classCode.split('.')[0] === baseCode && selectedIds.includes(c.id))
					.map((c) => c.id)
			);
			const newSelected = selectedIds.filter((id) => !idsToRemove.has(id));
			if (onRestoreSelection) {
				onRestoreSelection(newSelected);
			}
		} else {
			const subjectCourses = courses.filter((c) => c.classCode.split('.')[0] === baseCode);
			const availableClass =
				subjectCourses.find((c) => !conflictSet.has(c.id)) || subjectCourses[0];
			if (availableClass) {
				onToggle(availableClass.id);
			}
		}
	}

	function resetFilters() {
		filterCourseName = '';
		filterClassCode = '';
		selectedDays = new Set();
		filterInstructor = '';
		filterTiet = '';
		smartFilters = {
			onlyAvailable: false,
			selectionState: 'ALL',
			session: 'ALL',
			classType: 'ALL',
			faculty: 'ALL',
			credits: 'ALL'
		};
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

		if (filterCourseName.trim()) {
			const query = filterCourseName.trim();
			result = result
				.map((c) => ({
					course: c,
					score: scoreCourseMatch(
						{
							code: c.classCode.split('.')[0],
							classCode: c.classCode,
							courseName: c.courseName
						},
						query
					)
				}))
				.filter((item) => item.score > 0)
				.sort((a, b) => b.score - a.score || a.course.classCode.localeCompare(b.course.classCode))
				.map((item) => item.course);
		}

		if (filterClassCode.trim()) {
			const query = filterClassCode.trim();
			result = result
				.map((c) => ({
					course: c,
					score: getMatchScore(c.classCode, query)
				}))
				.filter((item) => item.score > 0)
				.sort((a, b) => b.score - a.score || a.course.classCode.localeCompare(b.course.classCode))
				.map((item) => item.course);
		}

		if (selectedDays.size > 0) {
			result = result.filter((c) => selectedDays.has(c.day));
		}

		if (filterInstructor.trim()) {
			const query = filterInstructor.trim();
			result = result
				.map((c) => ({
					course: c,
					score: getMatchScore(c.instructor, query)
				}))
				.filter((item) => item.score > 0)
				.sort((a, b) => b.score - a.score)
				.map((item) => item.course);
		}

		if (filterTiet.trim()) {
			result = result.filter((c) => fuzzyMatch(c.rawTiet || '', filterTiet));
		}

		// Smart Filters
		if (smartFilters.onlyAvailable) {
			const selSet = new Set(selectedIds);
			result = result.filter((c) => {
				if (selSet.has(c.id)) return true;
				return !conflictSet.has(c.id) && !duplicateCourseSet.has(c.id);
			});
		}

		if (smartFilters.selectionState === 'ONLY_SELECTED') {
			const selSet = new Set(selectedIds);
			result = result.filter((c) => selSet.has(c.id));
		} else if (smartFilters.selectionState === 'HIDE_SELECTED') {
			const selSet = new Set(selectedIds);
			result = result.filter((c) => !selSet.has(c.id));
		}

		if (smartFilters.session !== 'ALL') {
			result = result.filter((c) =>
				matchesSession(c.rawTiet || '', c.startTime, smartFilters.session)
			);
		}

		if (smartFilters.classType !== 'ALL') {
			result = result.filter((c) => {
				const isTH = c.type === 'TH' || c.classCode.split('.').length >= 3;
				return smartFilters.classType === 'TH' ? isTH : !isTH;
			});
		}

		if (smartFilters.faculty !== 'ALL') {
			result = result.filter((c) => matchesFaculty(c.classCode, smartFilters.faculty));
		}

		if (smartFilters.credits !== 'ALL') {
			result = result.filter((c) => {
				if (smartFilters.credits === 4) return c.credits >= 4;
				return c.credits === smartFilters.credits;
			});
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
		const parts = (classCode || '').trim().split('.');
		if (parts.length >= 3 && /^\d+$/.test(parts[parts.length - 1])) {
			return parts.slice(0, -1).join('.');
		}
		return (classCode || '').trim();
	}

	function isPractice(
		courseOrCode: { classCode: string; type?: string; id?: string } | string
	): boolean {
		if (typeof courseOrCode !== 'string') {
			if (courseOrCode.type === 'TH') return true;
			if (courseOrCode.type === 'LT') return false;
			if (courseOrCode.id && courseOrCode.id.startsWith('TH-')) return true;
			if (courseOrCode.id && courseOrCode.id.startsWith('LT-')) return false;
			return isPractice(courseOrCode.classCode);
		}
		const parts = (courseOrCode || '').trim().split('.');
		return parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1]);
	}

	function getCoursePrefix(classCode: string): string {
		return (classCode || '').trim().split('.')[0];
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
					if (isPractice(c)) {
						selectedPracticeByBase.add(base);
					} else {
						selectedTheoryByBase.add(base);
					}
				}

				for (const course of courses) {
					if (_selectedIds.has(course.id)) continue;

					const prefix = getCoursePrefix(course.classCode);
					const base = getBaseCode(course.classCode);
					const practice = isPractice(course);

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
			<div
				class="p-1 border-r border-gray-300 w-8 shrink-0 flex items-center justify-center relative"
			>
				<button
					id="smart-filter-trigger"
					type="button"
					onclick={() => (showSmartFilterModal = !showSmartFilterModal)}
					class="w-5 h-5 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-center transition-colors relative {activeSmartFilterCount >
					0
						? 'text-yellow-600 bg-yellow-100 border border-black/30 shadow-xs font-bold'
						: 'text-gray-400 hover:text-black'}"
					title={activeSmartFilterCount > 0
						? `Bộ lọc thông minh (Đang bật ${activeSmartFilterCount} bộ lọc)`
						: 'Mở bộ lọc thông minh'}
				>
					<SlidersHorizontal size={13} />
					{#if activeSmartFilterCount > 0}
						<span
							class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center border border-white"
						>
							{activeSmartFilterCount}
						</span>
					{/if}
				</button>

				<SmartFilterModal
					isOpen={showSmartFilterModal}
					filters={smartFilters}
					onUpdate={(newFilters) => (smartFilters = newFilters)}
					onClose={() => (showSmartFilterModal = false)}
					totalCoursesCount={courses.length}
					filteredCoursesCount={filteredCourses.length}
				/>
			</div>
			<div bind:this={dropdownRef} class="p-1 border-r border-gray-300 w-[20%] shrink-0 relative">
				<button
					type="button"
					class="w-full h-6 px-1 border border-gray-300 rounded text-left text-[10px] bg-white hover:bg-gray-50 truncate flex items-center justify-between cursor-pointer"
					onclick={() => (showCourseDropdown = !showCourseDropdown)}
				>
					<span class="truncate"
						>{filterCourseName.trim()
							? filterCourseName
							: selectedSubjectCodes.size > 0
								? `${selectedSubjectCodes.size} môn đã chọn`
								: 'Tất cả môn...'}</span
					>
				</button>
				{#if showCourseDropdown}
					<div
						class="absolute top-full left-0 mt-1 min-w-70 w-max max-w-100 max-h-120 overflow-y-auto bg-white border border-gray-300 rounded shadow-lg z-50"
					>
						<div class="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
							<input
								type="text"
								bind:this={searchInputRef}
								bind:value={filterCourseName}
								placeholder="Tìm mã hoặc tên môn..."
								class="w-full h-6 px-2 border border-gray-300 rounded text-[10px]"
							/>
							{#if filterCourseName.trim()}
								<button
									type="button"
									class="cursor-pointer text-[10px] text-gray-500 hover:text-black mt-1 block"
									onclick={() => (filterCourseName = '')}
								>
									Xóa tìm kiếm
								</button>
							{/if}
						</div>
						<div class="p-1">
							{#if filteredUniqueCourses.selected.length > 0}
								<div class="px-2 py-0.5 text-[9px] font-bold text-gray-500 uppercase">
									Đang chọn ({filteredUniqueCourses.selected.length})
								</div>
								{#each filteredUniqueCourses.selected as item (item.code)}
									<label
										class="flex items-center gap-2 px-2 py-1 bg-yellow-50 hover:bg-yellow-100 cursor-pointer text-[10px] rounded"
									>
										<input
											type="checkbox"
											checked={true}
											onchange={() => toggleSubjectInSchedule(item.code)}
											class="w-3 h-3 shrink-0"
										/>
										<span class="truncate font-semibold text-black">{item.displayName}</span>
									</label>
								{/each}

								{#if filteredUniqueCourses.unselected.length > 0}
									<div class="border-t border-gray-200 my-1"></div>
								{/if}
							{/if}

							{#if filteredUniqueCourses.unselected.length > 0}
								{#if filteredUniqueCourses.selected.length > 0}
									<div class="px-2 py-0.5 text-[9px] font-bold text-gray-500 uppercase">
										Chưa chọn ({filteredUniqueCourses.unselected.length})
									</div>
								{/if}
								{#each filteredUniqueCourses.unselected as item (item.code)}
									<label
										class="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer text-[10px] rounded"
									>
										<input
											type="checkbox"
											checked={false}
											onchange={() => toggleSubjectInSchedule(item.code)}
											class="w-3 h-3 shrink-0"
										/>
										<span class="truncate text-gray-700">{item.displayName}</span>
									</label>
								{/each}
							{/if}

							{#if filteredUniqueCourses.selected.length === 0 && filteredUniqueCourses.unselected.length === 0}
								<div class="p-2 text-center text-gray-400 text-[10px]">Không tìm thấy môn học</div>
							{/if}
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
								class="p-1.5 border-r border-gray-300 w-[20%] shrink-0 font-semibold truncate flex items-center gap-1.5"
							>
								<button
									type="button"
									class="truncate text-left hover:underline hover:text-blue-600 focus:outline-none cursor-pointer"
									onclick={(e) => {
										e.stopPropagation();
										openCourseDetails(course);
									}}
									title="Bấm vào tiêu đề để xem tóm tắt môn học"
								>
									{course.classCode.split('.')[0]} - {course.courseName}
									{#if course.type}
										<span class="text-[10px] text-gray-400 font-normal">({course.type})</span>
									{/if}
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
		class="fixed px-3 py-1.5 text-sm font-medium rounded shadow-lg z-99999 pointer-events-none {tooltip.type ===
		'error'
			? 'bg-red-500 text-white'
			: 'bg-amber-500 text-white'}"
		style="left: {tooltip.x}px; top: {tooltip.y}px;"
	>
		{tooltip.text}
	</div>
{/if}

<CourseDetailModal course={detailedCourse} onClose={() => (detailedCourse = null)} />
