<script lang="ts">
	import {
		SlidersHorizontal,
		X,
		RotateCcw,
		Sun,
		Moon,
		BookOpen,
		Laptop,
		GraduationCap,
		ShieldCheck,
		Layers,
		GripVertical
	} from 'lucide-svelte';

	export interface SmartFilterState {
		onlyAvailable: boolean;
		selectionState: 'ALL' | 'ONLY_SELECTED' | 'HIDE_SELECTED';
		session: 'ALL' | 'MORNING' | 'AFTERNOON';
		classType: 'ALL' | 'LT' | 'TH';
		faculty: string;
		credits: number | 'ALL';
	}

	interface Props {
		isOpen: boolean;
		filters: SmartFilterState;
		onUpdate: (filters: SmartFilterState) => void;
		onClose: () => void;
		totalCoursesCount: number;
		filteredCoursesCount: number;
	}

	let {
		isOpen = false,
		filters,
		onUpdate,
		onClose,
		totalCoursesCount = 0,
		filteredCoursesCount = 0
	}: Props = $props();

	let popoverRef = $state<HTMLDivElement>();
	let position = $state<{ x: number; y: number }>({ x: 50, y: 120 });
	let isDragging = $state(false);
	let startPointer = { x: 0, y: 0 };
	let startPos = { x: 0, y: 0 };
	let hasInitializedPosition = $state(false);

	const facultyList = [
		{ id: 'ALL', label: 'Tất cả' },
		{ id: 'CS', label: 'KHMT', color: 'hover:bg-blue-100 active:bg-blue-200' },
		{ id: 'CE', label: 'KTMT', color: 'hover:bg-orange-100 active:bg-orange-200' },
		{ id: 'SE', label: 'CNPM', color: 'hover:bg-green-100 active:bg-green-200' },
		{ id: 'IS', label: 'HTTT', color: 'hover:bg-purple-100 active:bg-purple-200' },
		{ id: 'NT', label: 'Mạng', color: 'hover:bg-cyan-100 active:bg-cyan-200' },
		{ id: 'DS', label: 'KHDL', color: 'hover:bg-pink-100 active:bg-pink-200' },
		{ id: 'EC', label: 'TMĐT', color: 'hover:bg-amber-100 active:bg-amber-200' },
		{ id: 'IT', label: 'CNTT', color: 'hover:bg-indigo-100 active:bg-indigo-200' },
		{ id: 'GEN', label: 'Đại cương', color: 'hover:bg-red-100 active:bg-red-200' }
	];

	const creditOptions: (number | 'ALL')[] = ['ALL', 1, 2, 3, 4];

	function updateFilter<K extends keyof SmartFilterState>(key: K, value: SmartFilterState[K]) {
		onUpdate({
			...filters,
			[key]: value
		});
	}

	function handleReset() {
		onUpdate({
			onlyAvailable: false,
			selectionState: 'ALL',
			session: 'ALL',
			classType: 'ALL',
			faculty: 'ALL',
			credits: 'ALL'
		});
	}

	function onPointerDown(e: PointerEvent) {
		if ((e.target as HTMLElement).closest('button, input, label')) return;
		if (e.button !== 0) return;

		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);

		isDragging = true;
		startPointer = { x: e.clientX, y: e.clientY };
		startPos = { ...position };

		e.preventDefault();
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging || !popoverRef) return;

		const deltaX = e.clientX - startPointer.x;
		const deltaY = e.clientY - startPointer.y;

		const width = popoverRef.offsetWidth || 384;
		const height = popoverRef.offsetHeight || 400;

		const rawX = startPos.x + deltaX;
		const rawY = startPos.y + deltaY;

		const boundedX = Math.max(8, Math.min(window.innerWidth - width - 8, rawX));
		const boundedY = Math.max(8, Math.min(window.innerHeight - height - 8, rawY));

		position = { x: boundedX, y: boundedY };
	}

	function onPointerUp(e: PointerEvent) {
		if (!isDragging) return;
		isDragging = false;
		try {
			const target = e.currentTarget as HTMLElement;
			target.releasePointerCapture(e.pointerId);
		} catch {}
	}

	function handleClickOutside(e: MouseEvent) {
		if (!isOpen || isDragging || !popoverRef) return;
		const target = e.target as Node;
		const triggerBtn = document.getElementById('smart-filter-trigger');
		if (triggerBtn && triggerBtn.contains(target)) return;

		if (!popoverRef.contains(target)) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) return;
		if (e.key === 'Escape') {
			onClose();
		}
	}

	$effect(() => {
		if (isOpen) {
			if (!hasInitializedPosition) {
				const trigger = document.getElementById('smart-filter-trigger');
				if (trigger) {
					const rect = trigger.getBoundingClientRect();
					const initialX = Math.max(8, Math.min(window.innerWidth - 400, rect.left));
					const initialY = Math.max(8, Math.min(window.innerHeight - 500, rect.bottom + 8));
					position = { x: initialX, y: initialY };
				} else {
					position = { x: 50, y: 120 };
				}
				hasInitializedPosition = true;
			}
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
		}
		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

{#if isOpen}
	<div
		bind:this={popoverRef}
		class="fixed z-9999 w-96 max-w-[calc(100vw-24px)] bg-white/95 backdrop-blur-md border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col select-none text-left {isDragging
			? 'cursor-grabbing select-none pointer-events-auto transition-none'
			: 'transition-transform duration-75 ease-out'}"
		style="transform: translate3d({position.x}px, {position.y}px, 0); top: 0; left: 0; max-height: calc(100vh - 80px); will-change: transform;"
	>
		<!-- Draggable Header with High-performance Pointer Capture -->
		<div
			role="toolbar"
			tabindex="0"
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointercancel={onPointerUp}
			class="p-3 bg-yellow-400 border-b-2 border-black flex items-center justify-between gap-3 shrink-0 cursor-grab active:cursor-grabbing hover:bg-yellow-300 transition-colors touch-none select-none"
			title="Nhấn và kéo để di chuyển bảng lọc khắp màn hình"
		>
			<div class="flex items-center gap-2 pointer-events-none">
				<div
					class="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center border border-black shadow-[1px_1px_0px_0px_rgba(255,255,255,0.4)] shrink-0"
				>
					<SlidersHorizontal size={13} class="text-yellow-400" />
				</div>
				<div>
					<div class="flex items-center gap-1">
						<h3 class="text-xs font-black uppercase text-black leading-tight">Bộ lọc thông minh</h3>
						<GripVertical size={12} class="text-black/50" />
					</div>
					<p class="text-[10px] font-bold text-black/75">
						Tìm thấy <span class="font-extrabold text-black">{filteredCoursesCount}</span> / {totalCoursesCount}
						lớp
					</p>
				</div>
			</div>

			<button
				type="button"
				onclick={onClose}
				class="p-1 bg-white border-2 border-black rounded-lg hover:bg-gray-100 text-black cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none shrink-0"
				title="Đóng (Esc)"
			>
				<X size={14} />
			</button>
		</div>

		<!-- Popover Scrollable Body -->
		<div class="p-3.5 overflow-y-auto space-y-3.5 text-xs flex-1">
			<!-- Section 1: Tính khả dụng & Xung đột lịch -->
			<div>
				<div
					class="font-black text-black uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5"
				>
					<ShieldCheck size={13} class="text-blue-600" />
					Khả dụng & Trạng thái
				</div>

				<div class="space-y-1.5">
					<label
						class="flex items-center gap-2 p-2 rounded-xl border-2 cursor-pointer transition-all {filters.onlyAvailable
							? 'bg-yellow-100 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold'
							: 'bg-gray-50 hover:bg-gray-100 border-gray-300'}"
					>
						<input
							type="checkbox"
							checked={filters.onlyAvailable}
							onchange={(e) =>
								updateFilter('onlyAvailable', (e.target as HTMLInputElement).checked)}
							class="w-3.5 h-3.5 rounded text-black cursor-pointer shrink-0"
						/>
						<div>
							<div class="text-xs text-black leading-tight">
								Chỉ hiện môn có thể chọn (Khuyên dùng)
							</div>
							<div class="text-[9px] text-gray-500 font-medium">
								Ẩn các lớp bị trùng giờ hoặc trùng môn đã chọn
							</div>
						</div>
					</label>

					<div class="grid grid-cols-3 gap-1 pt-0.5">
						<button
							type="button"
							onclick={() => updateFilter('selectionState', 'ALL')}
							class="py-1 px-1.5 rounded-lg border font-bold text-[10px] transition-all cursor-pointer truncate {filters.selectionState ===
							'ALL'
								? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]'
								: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
						>
							Tất cả
						</button>
						<button
							type="button"
							onclick={() => updateFilter('selectionState', 'ONLY_SELECTED')}
							class="py-1 px-1.5 rounded-lg border font-bold text-[10px] transition-all cursor-pointer truncate {filters.selectionState ===
							'ONLY_SELECTED'
								? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]'
								: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
						>
							⭐ Đang chọn
						</button>
						<button
							type="button"
							onclick={() => updateFilter('selectionState', 'HIDE_SELECTED')}
							class="py-1 px-1.5 rounded-lg border font-bold text-[10px] transition-all cursor-pointer truncate {filters.selectionState ===
							'HIDE_SELECTED'
								? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]'
								: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
						>
							Ẩn đã chọn
						</button>
					</div>
				</div>
			</div>

			<!-- Section 2: Buổi học -->
			<div>
				<div
					class="font-black text-black uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5"
				>
					<Sun size={13} class="text-orange-500" />
					Buổi học trong ngày
				</div>
				<div class="grid grid-cols-3 gap-1.5">
					<button
						type="button"
						onclick={() => updateFilter('session', 'ALL')}
						class="py-1.5 px-2 rounded-lg border font-bold text-[10px] transition-all cursor-pointer truncate {filters.session ===
						'ALL'
							? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]'
							: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
					>
						Cả ngày
					</button>
					<button
						type="button"
						onclick={() => updateFilter('session', 'MORNING')}
						class="py-1.5 px-2 rounded-lg border font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer truncate {filters.session ===
						'MORNING'
							? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]'
							: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
					>
						<Sun size={11} class="text-yellow-400" />
						Sáng (1-5)
					</button>
					<button
						type="button"
						onclick={() => updateFilter('session', 'AFTERNOON')}
						class="py-1.5 px-2 rounded-lg border font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer truncate {filters.session ===
						'AFTERNOON'
							? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]'
							: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
					>
						<Moon size={11} class="text-blue-400" />
						Chiều (6-10)
					</button>
				</div>
			</div>

			<!-- Section 3: Loại lớp học -->
			<div>
				<div
					class="font-black text-black uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5"
				>
					<BookOpen size={13} class="text-green-600" />
					Loại hình lớp
				</div>
				<div class="grid grid-cols-3 gap-1.5">
					<button
						type="button"
						onclick={() => updateFilter('classType', 'ALL')}
						class="py-1.5 px-2 rounded-lg border font-bold text-[10px] transition-all cursor-pointer truncate {filters.classType ===
						'ALL'
							? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]'
							: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
					>
						Tất cả
					</button>
					<button
						type="button"
						onclick={() => updateFilter('classType', 'LT')}
						class="py-1.5 px-2 rounded-lg border font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer truncate {filters.classType ===
						'LT'
							? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]'
							: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
					>
						<BookOpen size={11} />
						Lý thuyết
					</button>
					<button
						type="button"
						onclick={() => updateFilter('classType', 'TH')}
						class="py-1.5 px-2 rounded-lg border font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer truncate {filters.classType ===
						'TH'
							? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]'
							: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
					>
						<Laptop size={11} />
						Thực hành
					</button>
				</div>
			</div>

			<!-- Section 4: Khoa / Hệ đào tạo -->
			<div>
				<div
					class="font-black text-black uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5"
				>
					<GraduationCap size={13} class="text-purple-600" />
					Khoa / Bộ môn
				</div>
				<div class="flex flex-wrap gap-1">
					{#each facultyList as fac}
						<button
							type="button"
							onclick={() => updateFilter('faculty', fac.id)}
							class="py-1 px-2 rounded-md border font-bold text-[10px] transition-all cursor-pointer {filters.faculty ===
							fac.id
								? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]'
								: 'bg-white text-gray-700 border-gray-200 ' + fac.color}"
						>
							{fac.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Section 5: Số tín chỉ -->
			<div>
				<div
					class="font-black text-black uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5"
				>
					<Layers size={13} class="text-indigo-600" />
					Số tín chỉ
				</div>
				<div class="flex flex-wrap gap-1.5">
					{#each creditOptions as opt}
						<button
							type="button"
							onclick={() => updateFilter('credits', opt)}
							class="py-1 px-2.5 rounded-md border font-bold text-[10px] transition-all cursor-pointer {filters.credits ===
							opt
								? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]'
								: 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}"
						>
							{opt === 'ALL' ? 'Tất cả' : `${opt} TC${opt === 4 ? '+' : ''}`}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Popover Footer -->
		<div
			class="p-2.5 px-3.5 border-t-2 border-black bg-gray-50 flex items-center justify-between gap-2 shrink-0"
		>
			<button
				type="button"
				onclick={handleReset}
				class="px-2.5 py-1.5 bg-white border border-gray-300 hover:border-black rounded-lg font-bold text-[10px] text-gray-700 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
			>
				<RotateCcw size={12} />
				Đặt lại
			</button>

			<button
				type="button"
				onclick={onClose}
				class="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black rounded-lg font-black text-[10px] uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none cursor-pointer transition-all"
			>
				Xong
			</button>
		</div>
	</div>
{/if}
