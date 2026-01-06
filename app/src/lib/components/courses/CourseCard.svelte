<script lang="ts">
	import { BookOpen, Users, ChevronRight } from 'lucide-svelte';

	interface Course {
		id: string;
		name: string;
		description: string;
		prerequisites: string[];
		tags?: string[];
	}

	interface Props {
		course: Course;
		index?: number;
	}

	let { course, index = 0 }: Props = $props();

	const gradients = [
		'#88FFFF', '#FFB8E0', '#A5D8FF', '#FFE066', '#D0BFFF', '#96F2D7'
	];
	const bgColor = gradients[index % gradients.length];
</script>

<div class="group relative transition-all duration-200 hover:-translate-y-1 active:translate-y-0 h-full">
	<!-- Shadow -->
	<div class="absolute inset-0 translate-x-1 translate-y-1 rounded-xl border-2 border-black bg-black"></div>

	<!-- Card -->
	<div class="relative rounded-xl border-2 border-black bg-white overflow-hidden flex flex-col h-full min-h-[180px]">
		<!-- Header Icon -->
		<div class="p-3 pb-0">
			<div 
				class="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
				style="background-color: {bgColor};"
			>
				<BookOpen size={14} class="text-black" />
			</div>
		</div>

		<!-- Title & ID -->
		<div class="p-4 flex-1 flex flex-col gap-2">
			<div>
				<h3 
					class="text-base font-black uppercase leading-tight mb-1 line-clamp-2"
					style="font-family: 'WiseSans-Heavy', Inter, sans-serif;"
				>
					{course.name}
				</h3>
				<p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{course.id}</p>
			</div>
			
			<p class="text-xs text-gray-700 font-medium leading-relaxed line-clamp-4">
				{course.description}
			</p>
		</div>

		<!-- Footer Tags (Small) -->
		<div class="px-4 pb-4 mt-auto">
			<div class="flex flex-wrap gap-1 opacity-50 hover:opacity-100 transition-opacity">
				{#each (course.tags || []).slice(0, 3) as tag}
					<span class="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-black/30 rounded-md">#{tag}</span>
				{/each}
			</div>
		</div>
	</div>
</div>
