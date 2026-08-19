<script lang="ts">
	import Background from '$lib/components/common/Background.svelte';
	import Schedule from '$lib/components/schedule/Schedule.svelte';
	import ScheduleGrid from '$lib/components/schedule/ScheduleGrid.svelte';
	import CourseSelector from '$lib/components/schedule/CourseSelector.svelte';
	import type { ScheduleItem } from '$lib/components/schedule/Schedule.svelte';
	import type { Course } from '$lib/components/schedule/CourseSelector.svelte';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import Undo2 from 'lucide-svelte/icons/undo-2';
	import Redo2 from 'lucide-svelte/icons/redo-2';
	import ArrowLeftRight from 'lucide-svelte/icons/arrow-left-right';
	import X from 'lucide-svelte/icons/x';
	import { get } from 'svelte/store';
	import { courseData, selectedCourseIds as selectedStore } from '$lib/stores';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let availableCourses = $state<Course[]>(get(courseData));
	let selectedCourseIds = $state<string[]>(get(selectedStore));
	let showPreview = $state(true);
	let isMobile = $state(false);

	let undoStack = $state<string[][]>([]);
	let redoStack = $state<string[][]>([]);
	let canUndo = $derived(undoStack.length > 0);
	let canRedo = $derived(redoStack.length > 0);
	let isInternalUpdate = false;

	let isActive = $derived(page.url.pathname === '/tao-tkb');

	onMount(() => {
		const unsubCourse = courseData.subscribe((value) => {
			availableCourses = value;
		});

		let prevIds: string[] | null = null;
		const unsubSelected = selectedStore.subscribe((value) => {
			if (prevIds !== null && !isInternalUpdate) {
				if (JSON.stringify(prevIds) !== JSON.stringify(value)) {
					undoStack = [...undoStack, prevIds];
					if (undoStack.length > 50) undoStack = undoStack.slice(-50);
					redoStack = [];
				}
			}
			prevIds = value;
			selectedCourseIds = value;
		});

		function handleGlobalKeydown(e: KeyboardEvent) {
			if (!isActive) return;
			const target = e.target as HTMLElement;
			if (
				target &&
				(target.tagName === 'INPUT' ||
					target.tagName === 'TEXTAREA' ||
					target.tagName === 'SELECT' ||
					target.isContentEditable)
			) {
				return;
			}

			if (e.key === 'Escape' && showSwitchConfirmModal) {
				e.preventDefault();
				showSwitchConfirmModal = false;
				return;
			}

			// Ctrl+Z or Cmd+Z (Undo)
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
				e.preventDefault();
				undo();
			}
			// Ctrl+Y or Cmd+Y or Ctrl+Shift+Z or Cmd+Shift+Z (Redo)
			else if (
				((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
				((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey)
			) {
				e.preventDefault();
				redo();
			}
		}

		window.addEventListener('keydown', handleGlobalKeydown);

		const mql = window.matchMedia('(max-width: 768px)');
		isMobile = mql.matches;
		const handler = (e: MediaQueryListEvent) => (isMobile = e.matches);
		mql.addEventListener('change', handler);

		return () => {
			unsubCourse();
			unsubSelected();
			mql.removeEventListener('change', handler);
			window.removeEventListener('keydown', handleGlobalKeydown);
		};
	});

	function undo() {
		if (undoStack.length === 0) return;
		const prev = undoStack[undoStack.length - 1];
		undoStack = undoStack.slice(0, -1);
		redoStack = [...redoStack, [...selectedCourseIds]];
		isInternalUpdate = true;
		selectedStore.set(prev);
		setTimeout(() => {
			isInternalUpdate = false;
		}, 0);
	}

	function redo() {
		if (redoStack.length === 0) return;
		const next = redoStack[redoStack.length - 1];
		redoStack = redoStack.slice(0, -1);
		undoStack = [...undoStack, [...selectedCourseIds]];
		isInternalUpdate = true;
		selectedStore.set(next);
		setTimeout(() => {
			isInternalUpdate = false;
		}, 0);
	}

	function isPractice(course: Course): boolean {
		if (course.type === 'TH') return true;
		if (course.type === 'LT') return false;
		if (course.id && course.id.startsWith('TH-')) return true;
		if (course.id && course.id.startsWith('LT-')) return false;
		const parts = (course.classCode || '').trim().split('.');
		return parts.length >= 3 && /^\d+$/.test(parts[parts.length - 1]);
	}

	type PracticeSwitchInfo = {
		nextCode: string;
		tooltip: string;
		oldIds: string[];
		nextIds: string[];
	};

	let courseIndex = $derived.by(() => {
		const byId = new Map<string, Course>();
		const idsByClassCode = new Map<string, string[]>();
		const practiceGroupMap = new Map<string, Set<string>>();

		for (const c of availableCourses) {
			byId.set(c.id, c);

			const list = idsByClassCode.get(c.classCode);
			if (list) list.push(c.id);
			else idsByClassCode.set(c.classCode, [c.id]);

			if (isPractice(c)) {
				const parts = (c.classCode || '').trim().split('.');
				const baseCode = parts.length >= 3 ? parts.slice(0, 2).join('.') : c.classCode;
				const grp = practiceGroupMap.get(baseCode);
				if (grp) grp.add(c.classCode);
				else practiceGroupMap.set(baseCode, new Set([c.classCode]));
			}
		}

		// Precompute switch info for every practical classCode
		const switchInfoMap = new Map<string, PracticeSwitchInfo>();
		for (const [baseCode, codesSet] of practiceGroupMap.entries()) {
			if (codesSet.size <= 1) continue;
			const sortedCodes = Array.from(codesSet).sort((a, b) =>
				a.localeCompare(b, 'vi', { numeric: true })
			);
			for (let i = 0; i < sortedCodes.length; i++) {
				const currentCode = sortedCodes[i];
				const nextCode = sortedCodes[(i + 1) % sortedCodes.length];
				const nextSuffix = nextCode.split('.').slice(2).join('.');
				switchInfoMap.set(currentCode, {
					nextCode,
					tooltip: `Đổi sang lớp thực hành .${nextSuffix || nextCode}`,
					oldIds: idsByClassCode.get(currentCode) || [],
					nextIds: idsByClassCode.get(nextCode) || []
				});
			}
		}

		// Precompute LT -> linked LT & TH ids
		const ltLinkedIdsMap = new Map<string, string[]>();
		for (const c of availableCourses) {
			if (!isPractice(c)) {
				const linked: string[] = [];
				for (const other of availableCourses) {
					if (other.classCode === c.classCode || other.classCode.startsWith(c.classCode + '.')) {
						linked.push(other.id);
					}
				}
				ltLinkedIdsMap.set(c.classCode, linked);
			}
		}

		return {
			byId,
			idsByClassCode,
			switchInfoMap,
			ltLinkedIdsMap
		};
	});

	let scheduleItems = $derived.by(() => {
		const { byId } = courseIndex;
		const items: ScheduleItem[] = [];
		for (const id of selectedCourseIds) {
			const course = byId.get(id);
			if (course) {
				items.push({
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
				});
			}
		}
		return items;
	});

	function toggleCourse(courseId: string) {
		const { byId, idsByClassCode, ltLinkedIdsMap } = courseIndex;
		const course = byId.get(courseId);
		if (!course) return;

		selectedStore.update((currentIds) => {
			if (currentIds.includes(courseId)) {
				if (isPractice(course)) {
					const thIds = idsByClassCode.get(course.classCode) || [];
					return currentIds.filter((id) => !thIds.includes(id));
				} else {
					const ltAndThIds = ltLinkedIdsMap.get(course.classCode) || [course.id];
					return currentIds.filter((id) => !ltAndThIds.includes(id));
				}
			} else {
				const linkedIds = idsByClassCode.get(course.classCode) || [course.id];
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
		const { byId, idsByClassCode, ltLinkedIdsMap } = courseIndex;
		const course = byId.get(id);
		if (!course) return;

		if (isPractice(course)) {
			const thIds = idsByClassCode.get(course.classCode) || [];
			selectedStore.update((currentIds) => currentIds.filter((cid) => !thIds.includes(cid)));
		} else {
			const ltAndThIds = ltLinkedIdsMap.get(course.classCode) || [course.id];
			selectedStore.update((currentIds) => currentIds.filter((cid) => !ltAndThIds.includes(cid)));
		}
	}

	function getSwitchInfo(id: string): { nextCode: string; tooltip: string } | null {
		const course = courseIndex.byId.get(id);
		if (!course) return null;
		const info = courseIndex.switchInfoMap.get(course.classCode);
		if (!info) return null;
		return { nextCode: info.nextCode, tooltip: info.tooltip };
	}

	function handleSwitchCourse(id: string) {
		const course = courseIndex.byId.get(id);
		if (!course) return;
		const switchInfo = courseIndex.switchInfoMap.get(course.classCode);
		if (!switchInfo) return;

		const { oldIds, nextIds } = switchInfo;
		selectedStore.update((currentIds) => {
			const nextSet = new Set(currentIds);
			for (const oid of oldIds) nextSet.delete(oid);
			for (const nid of nextIds) nextSet.add(nid);
			return Array.from(nextSet);
		});
	}

	type SwitchChangeItem = {
		courseName: string;
		oldCode: string;
		newCode: string;
	};

	let showSwitchConfirmModal = $state(false);

	// Hot Active Practice Cache: khi đang chọn lớp .1, tự động cache sẵn lớp .2 đối ứng và kết quả swap
	let activePracticeCache = $derived.by(() => {
		const { byId, switchInfoMap } = courseIndex;
		const toRemoveIds = new Set<string>();
		const toAddIds: string[] = [];
		const diffList: SwitchChangeItem[] = [];
		const processedCodes = new Set<string>();

		for (const id of selectedCourseIds) {
			const course = byId.get(id);
			if (!course) continue;

			const info = switchInfoMap.get(course.classCode);
			if (info && !processedCodes.has(course.classCode)) {
				processedCodes.add(course.classCode);
				for (const oid of info.oldIds) toRemoveIds.add(oid);
				toAddIds.push(...info.nextIds);
				diffList.push({
					courseName: course.courseName,
					oldCode: course.classCode,
					newCode: info.nextCode
				});
			}
		}

		// Tính sẵn danh sách ID sau khi swap, khi bấm đồng ý chỉ cần gán 1 bước duy nhất (0ms)
		const nextAllSelectedIds = selectedCourseIds
			.filter((id) => !toRemoveIds.has(id))
			.concat(toAddIds);

		return {
			hasSwitchable: diffList.length > 0,
			nextAllSelectedIds: Array.from(new Set(nextAllSelectedIds)),
			diffList
		};
	});

	let hasSwitchablePracticeCourses = $derived(activePracticeCache.hasSwitchable);

	function openSwitchConfirmModal() {
		if (!activePracticeCache.hasSwitchable) return;
		showSwitchConfirmModal = true;
	}

	function confirmSwitchAll() {
		if (!activePracticeCache.hasSwitchable) return;
		const { nextAllSelectedIds } = activePracticeCache;
		selectedStore.set(nextAllSelectedIds);
		showSwitchConfirmModal = false;
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

								<div class="flex items-center gap-1.5">
									<!-- Đổi all TH button -->
									<button
										type="button"
										onclick={openSwitchConfirmModal}
										disabled={!hasSwitchablePracticeCourses}
										class="h-7 px-2 bg-white hover:bg-yellow-200 border-2 border-black rounded-lg text-black font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px transition-all disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none shrink-0"
										title="Đổi tất cả các lớp thực hành sang nhóm còn lại (.1 ↔ .2)"
									>
										<ArrowLeftRight size={13} strokeWidth={2.5} />
										<span>Đổi all TH</span>
									</button>

									<!-- Undo button -->
									<button
										type="button"
										onclick={undo}
										disabled={!canUndo}
										class="h-7 px-2 bg-white hover:bg-gray-100 border-2 border-black rounded-lg text-black font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px transition-all disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none"
										title="Hoàn tác (Ctrl+Z)"
									>
										<Undo2 size={13} strokeWidth={2.5} />
										<span>Undo</span>
									</button>

									<!-- Redo button -->
									<button
										type="button"
										onclick={redo}
										disabled={!canRedo}
										class="h-7 px-2 bg-white hover:bg-gray-100 border-2 border-black rounded-lg text-black font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px transition-all disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none"
										title="Làm lại (Ctrl+Y / Ctrl+Shift+Z)"
									>
										<Redo2 size={13} strokeWidth={2.5} />
										<span>Redo</span>
									</button>

									<!-- Ẩn TKB button -->
									<button
										type="button"
										onclick={() => (showPreview = false)}
										class="h-7 px-2.5 bg-white hover:bg-red-50 border-2 border-black rounded-lg text-black hover:text-red-600 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px transition-all shrink-0"
										title="Ẩn khung TKB"
									>
										<EyeOff size={13} />
										<span>Ẩn TKB</span>
									</button>
								</div>
							</div>

							<!-- Confirmation Card for Switching All Practical Classes (Floating UI fitting 1 pageview) -->
							{#if showSwitchConfirmModal && activePracticeCache.hasSwitchable}
								<div
									class="absolute top-11 right-3 left-3 bg-white/98 backdrop-blur-md border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 z-30 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 select-none"
								>
									<!-- Header -->
									<div
										class="flex items-center justify-between gap-2 pb-1.5 border-b-2 border-black/10"
									>
										<div class="flex items-center gap-1.5 text-xs font-black uppercase text-black">
											<ArrowLeftRight size={13} strokeWidth={2.5} class="text-yellow-600" />
											<span>Đổi {activePracticeCache.diffList.length} lớp thực hành</span>
										</div>
										<button
											type="button"
											onclick={() => (showSwitchConfirmModal = false)}
											class="p-1 hover:bg-gray-100 rounded-md border border-black/20 text-gray-600 hover:text-black cursor-pointer transition-colors"
											title="Đóng (Không đổi)"
										>
											<X size={12} strokeWidth={3} />
										</button>
									</div>

									<!-- Compact Diff Grid (Fits all in 1 pageview) -->
									<div
										class="grid {activePracticeCache.diffList.length > 2
											? 'grid-cols-1 sm:grid-cols-2'
											: 'grid-cols-1'} gap-1.5"
									>
										{#each activePracticeCache.diffList as item}
											<div
												class="p-2 bg-gray-50 border-2 border-black/15 rounded-lg flex flex-col gap-1 text-[11px]"
											>
												<div class="font-bold text-black truncate" title={item.courseName}>
													{item.courseName}
												</div>
												<div class="flex items-center gap-1.5 font-mono text-[10px] font-black">
													<span
														class="px-1.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-400 rounded-md line-through shrink-0"
													>
														{item.oldCode}
													</span>
													<span class="text-black font-black shrink-0">➔</span>
													<span
														class="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-400 rounded-md shrink-0"
													>
														{item.newCode}
													</span>
												</div>
											</div>
										{/each}
									</div>

									<!-- Footer Actions -->
									<div
										class="pt-1.5 border-t-2 border-black/10 flex items-center justify-end gap-2"
									>
										<button
											type="button"
											onclick={() => (showSwitchConfirmModal = false)}
											class="px-3 py-1 bg-white hover:bg-gray-100 border-2 border-black rounded-md text-[11px] font-bold text-black cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px transition-all"
										>
											Hủy
										</button>
										<button
											type="button"
											onclick={confirmSwitchAll}
											class="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 border-2 border-black rounded-md text-[11px] font-black uppercase text-black flex items-center gap-1.5 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px transition-all"
										>
											<ArrowLeftRight size={12} strokeWidth={2.5} />
											<span>Đồng ý đổi</span>
										</button>
									</div>
								</div>
							{/if}

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
