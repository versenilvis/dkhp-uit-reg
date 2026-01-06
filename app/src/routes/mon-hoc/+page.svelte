<script lang="ts">
	import { Search, BookOpen, ChevronDown } from 'lucide-svelte';
	import CourseCard from '$lib/components/courses/CourseCard.svelte';
	import Button from '$lib/components/common/button.svelte';
	import Background from '$lib/components/common/Background.svelte';
	import coursesData from '$lib/data/courses.json';

	interface Course {
		id: string;
		name: string;
		description: string;
		prerequisites: string[];
		tags?: string[];
	}

	let searchQuery = $state('');
	let selectedTag = $state<string | null>(null);

	const allTags = $derived(() => {
		const tags = new Set<string>();
		coursesData.courses.forEach((course: Course) => {
			course.tags?.forEach((tag: string) => tags.add(tag));
		});
		return Array.from(tags);
	});

	const filteredCourses = $derived(() => {
		let courses = coursesData.courses as Course[];
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			courses = courses.filter(
				(c) =>
					c.name.toLowerCase().includes(query) ||
					c.description.toLowerCase().includes(query) ||
					c.id.toLowerCase().includes(query)
			);
		}
		if (selectedTag) {
			courses = courses.filter((c) => c.tags?.includes(selectedTag!));
		}
		return courses;
	});
</script>

<svelte:head>
	<title>Môn học - UIT REG</title>
</svelte:head>

<div class="min-h-screen w-full bg-primary text-[#111] font-sans selection:bg-black selection:text-white pb-32 overflow-x-hidden">
	<Background />

	<!-- Overall Margins applied through a centered container with MT and MX -->
	<div class="max-w-4xl mx-auto mt-64 px-6">
		<!-- Header Area -->
		<header class="relative z-10 mb-20 text-center">
			<!-- Big Heading -->
			<div class="mb-10">
				<h1 
					class="text-6xl md:text-8xl text-black font-black uppercase tracking-tighter mb-6 drop-shadow-sm"
					style="font-family: 'WiseSans-Heavy', sans-serif; -webkit-text-fill-color: black; -webkit-text-stroke: 0;"
				>
					MÔN HỌC Ở UIT
				</h1>
				<p class="text-sm md:text-base font-bold text-black/70 uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
					Những điều bạn cần biết trước khi chọn lựa những môn mình muốn học
				</p>
			</div>

			<!-- Search Bar - Thinner, Centered, No Shadow -->
			<div class="max-w-lg mx-auto mb-20">
				<div class="relative flex items-center bg-white rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:shadow-none transition-all">
					<div class="pl-6 pr-4">
						<Search size={22} class="text-black" />
					</div>
					<input
						type="text"
						placeholder="TÌM KIẾM MÔN HỌC..."
						bind:value={searchQuery}
						class="w-full py-4 pr-6 text-base font-bold placeholder-gray-400 focus:outline-none uppercase bg-transparent text-black"
					/>
				</div>
			</div>

			<!-- Filter Tabs & Meta Row -->
			<div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
				<!-- Tags -->
				<div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
					<button
						class="shrink-0 px-4 py-2 rounded-xl border-2 border-black text-[11px] font-black uppercase transition-all
						{selectedTag === null ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}"
						onclick={() => (selectedTag = null)}
					>
						ALL
					</button>
					{#each allTags() as tag}
						<button
							class="shrink-0 px-4 py-2 rounded-xl border-2 border-black text-[11px] font-black uppercase transition-all
							{selectedTag === tag ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}"
							onclick={() => (selectedTag = selectedTag === tag ? null : tag)}
						>
							{tag}
						</button>
					{/each}
				</div>

				<!-- Meta Info & Actions -->
				<div class="flex items-center gap-6">
					<div class="hidden lg:flex items-center gap-4 text-[11px] font-black uppercase opacity-60">
						<span>{filteredCourses().length} Available</span>
						<span>{filteredCourses().length} Total</span>
					</div>
					<div class="flex items-center gap-3 text-sm">
						<button class="font-black uppercase hover:underline">Submit Course</button>
						<Button variant="reverse" className="text-[11px]">Contact Me</Button>
					</div>
				</div>
			</div>
		</header>

		<!-- Main Grid -->
		<main class="relative z-10">
			{#if filteredCourses().length > 0}
				<div 
					class="grid gap-6"
					style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));"
				>
					{#each filteredCourses() as course, i}
						<CourseCard {course} index={i} />
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center py-20 bg-white/30 rounded-3xl border-2 border-dashed border-black/20">
					<p class="text-xl font-black uppercase italic opacity-20">No Courses Found</p>
				</div>
			{/if}
		</main>
	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
