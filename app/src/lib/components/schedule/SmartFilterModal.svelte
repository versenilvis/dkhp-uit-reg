<script lang="ts">
	import {
		SlidersHorizontal,
		X,
		RotateCcw,
		Check,
		Sun,
		Moon,
		BookOpen,
		Laptop,
		GraduationCap,
		ShieldCheck
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

	// Local mutable state
	let localFilters = $state<SmartFilterState>({
		onlyAvailable: false,
		selectionState: 'ALL',
		session: 'ALL',
		classType: 'ALL',
		faculty: 'ALL',
		credits: 'ALL'
	});

	$effect(() => {
		if (isOpen) {
			localFilters = { ...filters };
		}
	});

	const facultyList = [
		{ id: 'ALL', label: 'Tất cả' },
		{ id: 'CS', label: 'KHMT' },
		{ id: 'CE', label: 'KTMT' },
		{ id: 'SE', label: 'CNPM' },
		{ id: 'IS', label: 'HTTT' },
		{ id: 'NT', label: 'Mạng' },
		{ id: 'DS', label: 'KHDL' },
		{ id: 'EC', label: 'TMĐT' },
		{ id: 'IT', label: 'CNTT' },
		{ id: 'GEN', label: 'Đại cương' }
	];

	const creditOptions: (number | 'ALL')[] = ['ALL', 1, 2, 3, 4];

	function handleApply() {
		onUpdate(localFilters);
		onClose();
	}

	function handleReset() {
		localFilters = {
			onlyAvailable: false,
			selectionState: 'ALL',
			session: 'ALL',
			classType: 'ALL',
			faculty: 'ALL',
			credits: 'ALL'
		};
		onUpdate(localFilters);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) return;
		if (e.key === 'Escape') {
			onClose();
		} else if (e.key === 'Enter') {
			handleApply();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div
		role="dialog"
		aria-modal="true"
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
		onclick={(e) => e.target === e.currentTarget && onClose()}
		tabindex="-1"
	>
		<div
			class="bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
		>
			<!-- Modal Header -->
			<div
				class="p-4 border-b-2 border-black bg-yellow-400 flex items-center justify-between gap-4"
			>
				<div class="flex items-center gap-2">
					<div
						class="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center border border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)] shrink-0"
					>
						<SlidersHorizontal size={16} class="text-yellow-400" />
					</div>
					<div>
						<h2 class="text-base font-black uppercase text-black leading-tight">
							Bộ lọc thông minh
						</h2>
						<p class="text-[11px] font-bold text-black/70">
							Tìm thấy {filteredCoursesCount} / {totalCoursesCount} lớp học
						</p>
					</div>
				</div>

				<button
					type="button"
					onclick={onClose}
					class="p-1.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 text-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none shrink-0"
					title="Đóng (Esc)"
				>
					<X size={16} />
				</button>
			</div>

			<!-- Modal Body -->
			<div class="p-5 overflow-y-auto space-y-5 text-xs">
				<!-- Section 1: Khả dụng & Xung đột lịch -->
				<div>
					<div
						class="font-black text-black uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5"
					>
						<ShieldCheck size={14} class="text-blue-600" />
						Tính khả dụng & Trạng thái chọn
					</div>

					<div class="space-y-2">
						<label
							class="flex items-center gap-2.5 p-2.5 rounded-xl border-2 border-black cursor-pointer transition-colors {localFilters.onlyAvailable
								? 'bg-yellow-100 border-black'
								: 'bg-gray-50 hover:bg-gray-100 border-gray-300'}"
						>
							<input
								type="checkbox"
								bind:checked={localFilters.onlyAvailable}
								class="w-4 h-4 rounded text-black cursor-pointer shrink-0"
							/>
							<div>
								<div class="font-bold text-black text-xs">
									Chỉ hiện môn có thể chọn (Khuyên dùng)
								</div>
								<div class="text-[10px] text-gray-500 font-medium">
									Tự động ẩn các lớp bị trùng giờ học hoặc trùng môn đã đăng ký
								</div>
							</div>
						</label>

						<div class="grid grid-cols-3 gap-1.5 pt-1">
							<button
								type="button"
								onclick={() => (localFilters.selectionState = 'ALL')}
								class="py-1.5 px-2 rounded-lg border-2 font-bold text-[11px] transition-all cursor-pointer {localFilters.selectionState ===
								'ALL'
									? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
									: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
							>
								Tất cả môn
							</button>
							<button
								type="button"
								onclick={() => (localFilters.selectionState = 'ONLY_SELECTED')}
								class="py-1.5 px-2 rounded-lg border-2 font-bold text-[11px] transition-all cursor-pointer {localFilters.selectionState ===
								'ONLY_SELECTED'
									? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
									: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
							>
								⭐ Đang chọn
							</button>
							<button
								type="button"
								onclick={() => (localFilters.selectionState = 'HIDE_SELECTED')}
								class="py-1.5 px-2 rounded-lg border-2 font-bold text-[11px] transition-all cursor-pointer {localFilters.selectionState ===
								'HIDE_SELECTED'
									? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
									: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
							>
								Ẩn môn đã chọn
							</button>
						</div>
					</div>
				</div>

				<!-- Section 2: Buổi học -->
				<div>
					<div
						class="font-black text-black uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5"
					>
						<Sun size={14} class="text-orange-500" />
						Buổi học trong ngày
					</div>
					<div class="grid grid-cols-3 gap-2">
						<button
							type="button"
							onclick={() => (localFilters.session = 'ALL')}
							class="py-2 px-3 rounded-xl border-2 font-bold text-xs transition-all cursor-pointer {localFilters.session ===
							'ALL'
								? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
								: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
						>
							Cả ngày
						</button>
						<button
							type="button"
							onclick={() => (localFilters.session = 'MORNING')}
							class="py-2 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer {localFilters.session ===
							'MORNING'
								? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
								: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
						>
							<Sun size={13} class="text-yellow-400" />
							Sáng (Tiết 1-5)
						</button>
						<button
							type="button"
							onclick={() => (localFilters.session = 'AFTERNOON')}
							class="py-2 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer {localFilters.session ===
							'AFTERNOON'
								? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
								: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
						>
							<Moon size={13} class="text-blue-400" />
							Chiều (Tiết 6-10)
						</button>
					</div>
				</div>

				<!-- Section 3: Loại lớp học -->
				<div>
					<div
						class="font-black text-black uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5"
					>
						<BookOpen size={14} class="text-green-600" />
						Loại hình lớp
					</div>
					<div class="grid grid-cols-3 gap-2">
						<button
							type="button"
							onclick={() => (localFilters.classType = 'ALL')}
							class="py-2 px-3 rounded-xl border-2 font-bold text-xs transition-all cursor-pointer {localFilters.classType ===
							'ALL'
								? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
								: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
						>
							Tất cả
						</button>
						<button
							type="button"
							onclick={() => (localFilters.classType = 'LT')}
							class="py-2 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer {localFilters.classType ===
							'LT'
								? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
								: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
						>
							<BookOpen size={13} />
							Lý thuyết (LT)
						</button>
						<button
							type="button"
							onclick={() => (localFilters.classType = 'TH')}
							class="py-2 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer {localFilters.classType ===
							'TH'
								? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
								: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
						>
							<Laptop size={13} />
							Thực hành (TH)
						</button>
					</div>
				</div>

				<!-- Section 4: Khoa / Hệ đào tạo -->
				<div>
					<div
						class="font-black text-black uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5"
					>
						<GraduationCap size={14} class="text-purple-600" />
						Khoa / Bộ môn
					</div>
					<div class="flex flex-wrap gap-1.5">
						{#each facultyList as fac}
							<button
								type="button"
								onclick={() => (localFilters.faculty = fac.id)}
								class="py-1 px-2.5 rounded-lg border-2 font-bold text-[11px] transition-all cursor-pointer {localFilters.faculty ===
								fac.id
									? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
									: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
							>
								{fac.label}
							</button>
						{/each}
					</div>
				</div>

				<!-- Section 5: Số tín chỉ -->
				<div>
					<div class="font-black text-black uppercase tracking-wider text-[11px] mb-2">
						Số tín chỉ
					</div>
					<div class="flex flex-wrap gap-2">
						{#each creditOptions as opt}
							<button
								type="button"
								onclick={() => (localFilters.credits = opt)}
								class="py-1.5 px-3 rounded-lg border-2 font-bold text-xs transition-all cursor-pointer {localFilters.credits ===
								opt
									? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
									: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
							>
								{opt === 'ALL' ? 'Tất cả' : `${opt} TC${opt === 4 ? '+' : ''}`}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="p-4 border-t-2 border-black bg-gray-50 flex items-center justify-between gap-3">
				<button
					type="button"
					onclick={handleReset}
					class="px-3 py-2 bg-white border-2 border-gray-300 hover:border-black rounded-xl font-bold text-xs text-gray-700 hover:text-black flex items-center gap-1.5 cursor-pointer transition-colors"
				>
					<RotateCcw size={14} />
					Đặt lại
				</button>

				<button
					type="button"
					onclick={handleApply}
					class="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black rounded-xl font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none cursor-pointer transition-all flex items-center gap-1.5"
				>
					<Check size={16} strokeWidth={3} />
					Áp dụng bộ lọc
				</button>
			</div>
		</div>
	</div>
{/if}
