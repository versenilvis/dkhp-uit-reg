<script lang="ts">
	import { onMount } from 'svelte';
	import { XCircle, RotateCcw } from 'lucide-svelte';

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

	let filteredCourses = $derived(courses);

	function isSelected(courseId: string): boolean {
		return selectedIds.includes(courseId);
	}

	let totalCredits = $derived.by(() => {
		return courses
			.filter((course) => selectedIds.includes(course.id))
			.reduce((sum, course) => sum + course.credits, 0);
	});

	let selectedCourses = $derived(courses.filter((c) => selectedIds.includes(c.id)));

	const toMin = (t: string) => {
		if (!t) return 0;
		const [h, m] = t.split(':').map(Number);
		return h * 60 + m;
	};

	let conflictSet = $derived.by(() => {
		const conflicts = new Set<string>();
		if (selectedCourses.length === 0) return conflicts;

		for (const course of courses) {
			if (selectedIds.includes(course.id)) continue;

			const cStart = toMin(course.startTime);
			const cEnd = toMin(course.endTime);

			for (const selected of selectedCourses) {
				if (selected.day !== course.day) continue;

				const sStart = toMin(selected.startTime);
				const sEnd = toMin(selected.endTime);

				if (cStart < sEnd && cEnd > sStart) {
					conflicts.add(course.id);
					break;
				}
			}
		}
		return conflicts;
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
		<div class="flex bg-gray-50 text-[11px]">
			<div
				class="p-1.5 font-bold border-r border-gray-300 w-8 shrink-0 flex items-center justify-center"
			>
				{#if selectedIds.length > 0 || canRestore}
					<button
						type="button"
						onclick={handleToggleDeselect}
						class="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center transition-colors {canRestore
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
			<div class="p-1.5 font-bold border-r border-gray-300 uppercase w-8 shrink-0 text-center">
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
						<div
							class="flex items-center border-b border-gray-200 text-xs {selected
								? 'bg-yellow-100'
								: 'hover:bg-gray-50'} {conflicting
								? 'opacity-30 grayscale cursor-not-allowed'
								: 'cursor-pointer'}"
							style="height: {ROW_HEIGHT}px;"
							onclick={() => !conflicting && onToggle(course.id)}
							onkeydown={(e) => e.key === 'Enter' && !conflicting && onToggle(course.id)}
							title={conflicting ? 'Trùng lịch với môn đã chọn' : ''}
							role="row"
							tabindex="0"
						>
							<div
								class="p-1.5 border-r border-gray-300 w-8 shrink-0 flex items-center justify-center"
							>
								<input
									type="checkbox"
									checked={selected}
									disabled={conflicting}
									onchange={() => !conflicting && onToggle(course.id)}
									onclick={(e) => e.stopPropagation()}
									class="w-3.5 h-3.5"
								/>
							</div>
							<div
								class="p-1.5 border-r border-gray-300 w-[20%] shrink-0 font-semibold truncate"
								title="{course.classCode.split('.')[0]} - {course.courseName}"
							>
								{course.classCode.split('.')[0]} - {course.courseName}
							</div>
							<div
								class="p-1.5 border-r border-gray-300 w-28 shrink-0 truncate"
								title={course.classCode}
							>
								{course.classCode}
							</div>
							<div class="p-1.5 border-r border-gray-300 w-8 shrink-0 text-center">
								{course.day === 6 ? 'CN' : course.day + 2}
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
