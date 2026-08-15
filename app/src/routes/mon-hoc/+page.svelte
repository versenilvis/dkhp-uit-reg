<script lang="ts">
	import { Search, BookOpen, X, ExternalLink, Sparkles } from 'lucide-svelte';
	import { fuzzyMatch } from '$lib/utils/search';
	import CourseCard from '$lib/components/courses/CourseCard.svelte';
	import CourseDetailModal from '$lib/components/courses/CourseDetailModal.svelte';
	import Background from '$lib/components/common/Background.svelte';
	import coursesData from '$lib/data/courses.json';

	interface Course {
		id: string;
		name: string;
		description: string;
		faculty?: string;
		tags?: string[];
	}

	const allCourses: Course[] = coursesData.courses;

	const facultyTabs = [
		{ id: 'ALL', label: 'TẤT CẢ' },
		{ id: 'CS', label: 'KHMT' },
		{ id: 'CE', label: 'KTMT' },
		{ id: 'SE', label: 'CNPM' },
		{ id: 'IS', label: 'HTTT' },
		{ id: 'NT', label: 'MẠNG' },
		{ id: 'DS', label: 'KHDL' },
		{ id: 'EC', label: 'TMĐT' },
		{ id: 'IT', label: 'CNTT' },
		{ id: 'IE', label: 'KTTT' },
		{ id: 'GEN', label: 'ĐẠI CƯƠNG' }
	];

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

	let searchQuery = $state('');
	let selectedTab = $state('ALL');
	let displayLimit = $state(36);
	let selectedCourse = $state<Course | null>(null);
	let copiedId = $state(false);
	let copiedName = $state(false);

	const filteredCourses = $derived.by(() => {
		let list = allCourses;

		if (selectedTab !== 'ALL') {
			if (selectedTab === 'GEN') {
				list = list.filter((c) => generalPrefixes.includes(c.faculty || ''));
			} else {
				list = list.filter((c) => (c.faculty || '').toUpperCase() === selectedTab);
			}
		}

		if (searchQuery.trim()) {
			const query = searchQuery.trim();
			list = list.filter(
				(c) =>
					fuzzyMatch(c.id, query) || fuzzyMatch(c.name, query) || fuzzyMatch(c.description, query)
			);
		}

		return list;
	});

	const displayedCourses = $derived(filteredCourses.slice(0, displayLimit));

	function handleTabChange(tabId: string) {
		selectedTab = tabId;
		displayLimit = 36;
	}

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;
		displayLimit = 36;
	}

	function clearSearch() {
		searchQuery = '';
		displayLimit = 36;
	}

	function loadMore() {
		displayLimit += 36;
	}

	function openCourseModal(course: Course) {
		selectedCourse = course;
		copiedId = false;
		copiedName = false;
	}

	function closeCourseModal() {
		selectedCourse = null;
	}

	async function copyText(text: string, type: 'id' | 'name') {
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'id') {
				copiedId = true;
				setTimeout(() => (copiedId = false), 1500);
			} else {
				copiedName = true;
				setTimeout(() => (copiedName = false), 1500);
			}
		} catch (err) {
			console.error('Failed to copy', err);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && selectedCourse) {
			closeCourseModal();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Môn học UIT - Tóm tắt thông tin môn học DAA</title>
</svelte:head>

<div
	class="min-h-screen w-full bg-primary text-[#111] font-sans selection:bg-black selection:text-white pb-28 overflow-x-hidden relative"
>
	<Background />

	<div class="max-w-7xl mx-auto pt-8 md:pt-12 px-4 sm:px-6">
		<!-- Header Area -->
		<header class="relative z-10 mb-8 text-center">
			<div class="mb-6">
				<div
					class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white text-[11px] font-black uppercase tracking-wider mb-4 border border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]"
				>
					<Sparkles size={12} class="text-yellow-400" />
					Dữ liệu chính thức từ DAA UIT
				</div>
				<h1
					class="text-4xl sm:text-6xl md:text-7xl text-black font-black uppercase mb-3 drop-shadow-sm"
					style="font-family: 'WiseSans-Heavy', Inter, sans-serif;"
				>
					MÔN HỌC Ở UIT
				</h1>
				<p
					class="text-xs sm:text-sm md:text-base font-bold text-black/75 uppercase tracking-wider max-w-2xl mx-auto leading-relaxed"
				>
					Bảng tóm tắt thông tin và nội dung chi tiết các môn học để bạn dễ dàng lựa chọn
				</p>
			</div>

			<!-- Search Bar -->
			<div class="max-w-xl mx-auto mb-6">
				<div
					class="relative flex items-center bg-white rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-within:translate-x-[1px] focus-within:translate-y-[1px] focus-within:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
				>
					<div class="pl-5 pr-3 text-black">
						<Search size={20} />
					</div>
					<input
						type="text"
						placeholder="Tìm theo mã môn (IT001, CE103...), tên môn, từ khóa..."
						value={searchQuery}
						oninput={handleSearchInput}
						class="w-full py-3.5 pr-10 text-sm md:text-base font-bold placeholder-gray-400 focus:outline-none bg-transparent text-black"
					/>
					{#if searchQuery}
						<button
							type="button"
							onclick={clearSearch}
							class="absolute right-3.5 p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black cursor-pointer transition-colors"
							title="Xóa tìm kiếm"
						>
							<X size={18} />
						</button>
					{/if}
				</div>
			</div>

			<!-- Filter Tabs -->
			<div
				class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black/10 pb-4"
			>
				<div class="flex flex-wrap items-center gap-2 p-1">
					{#each facultyTabs as tab}
						{@const isSelected = selectedTab === tab.id}
						<button
							type="button"
							class="shrink-0 px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black uppercase transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none {isSelected
								? 'bg-black text-white'
								: 'bg-white text-black hover:bg-gray-100'}"
							onclick={() => handleTabChange(tab.id)}
						>
							{tab.label}
						</button>
					{/each}
				</div>

				<div
					class="flex items-center justify-between md:justify-end gap-3 text-xs font-black shrink-0 px-1"
				>
					<span class="px-2.5 py-1 bg-white/80 border border-black/20 rounded-lg text-black">
						{filteredCourses.length} môn học
					</span>
					<a
						href="https://daa.uit.edu.vn/content/bang-tom-tat-mon-hoc"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1 text-black hover:underline uppercase text-[11px]"
					>
						<span>Nguồn DAA</span>
						<ExternalLink size={13} />
					</a>
				</div>
			</div>
		</header>

		<!-- Main Grid -->
		<main class="relative z-10">
			{#if displayedCourses.length > 0}
				<div class="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{#each displayedCourses as course, i (course.id)}
						<CourseCard {course} index={i} onSelect={openCourseModal} />
					{/each}
				</div>

				<!-- Load More Button -->
				{#if displayLimit < filteredCourses.length}
					<div class="flex flex-col items-center justify-center mt-10 gap-2">
						<button
							type="button"
							onclick={loadMore}
							class="px-6 py-3 bg-white hover:bg-yellow-300 text-black font-black uppercase text-sm border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
						>
							Xem thêm môn học ({filteredCourses.length - displayLimit} còn lại)
						</button>
						<span class="text-xs font-bold text-black/60">
							Đang hiển thị {displayLimit} / {filteredCourses.length} môn
						</span>
					</div>
				{/if}
			{:else}
				<div
					class="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-black/30"
				>
					<BookOpen size={48} class="text-black/30 mb-3" />
					<p class="text-lg font-black uppercase text-black">Không tìm thấy môn học phù hợp</p>
					<p class="text-xs font-bold text-gray-600 mt-1">
						Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang tab "TẤT CẢ"
					</p>
					<button
						type="button"
						onclick={() => {
							searchQuery = '';
							selectedTab = 'ALL';
						}}
						class="mt-4 px-4 py-2 bg-black text-white text-xs font-black uppercase rounded-xl border border-black cursor-pointer hover:bg-gray-800"
					>
						Đặt lại bộ lọc
					</button>
				</div>
			{/if}
		</main>
	</div>
</div>

<CourseDetailModal course={selectedCourse} onClose={closeCourseModal} />
