<script lang="ts">
	import { cn } from '$lib/utils';
	import {
		House,
		CalendarPlus,
		FileCode,
		BookOpen,
		Route,
		CircleQuestionMark
	} from 'lucide-svelte';
	interface Props {
		className?: string;
		defaultIndex?: number;
		stickyBottom?: boolean;
	}

	let { className = '', defaultIndex = 0, stickyBottom = false }: Props = $props();

	let activeIndex = $state(0);

	$effect(() => {
		if (activeIndex === 0 && defaultIndex !== 0) {
			activeIndex = defaultIndex;
		}
	});

	const navItems = [
		{ label: 'Trang chủ', icon: House },
		{ label: 'Tạo TKB', icon: CalendarPlus },
		{ label: 'TKB & Code', icon: FileCode },
		{ label: 'Môn học', icon: BookOpen },
		{ label: 'Lộ trình', icon: Route },
		{ label: 'Câu hỏi', icon: CircleQuestionMark }
	];

	function getLabelWidth(label: string): number {
		const baseWidth = label.length * 7;
		return baseWidth;
	}
</script>

<nav
	aria-label="Bottom Navigation"
	class={cn(
		'bg-white dark:bg-gray-950 border-2 rounded-full flex items-center p-2 shadow-xl space-x-1 min-w-[320px] max-w-[95vw] h-[52px]',
		stickyBottom && 'fixed inset-x-0 bottom-4 mx-auto z-50 w-fit',
		className
	)}
	style="border-color: #fff;"
>
	{#each navItems as item, idx}
		{@const isActive = activeIndex === idx}
		{@const Icon = item.icon}
		<button
			class={cn(
				'flex items-center gap-0 px-3 py-2 rounded-full transition-all duration-300 relative h-10 min-w-[44px] min-h-[40px] max-h-[44px] cursor-pointer',
				isActive
					? 'bg-primary/20 text-primary gap-2'
					: 'bg-transparent text-white hover:bg-gray-100 dark:hover:bg-gray-800',
				'focus:outline-none focus-visible:ring-0'
			)}
			onclick={() => (activeIndex = idx)}
			aria-label={item.label}
			type="button"
		>
			<Icon
				size={22}
				strokeWidth={2}
				color={isActive ? '#FFD100' : '#fff'}
				aria-hidden
				class="transition-colors duration-200"
			/>

			<div
				class="overflow-hidden flex items-center justify-center transition-all duration-300 ease-out"
				style:width={isActive ? `${getLabelWidth(item.label)}px` : '0px'}
				style:opacity={isActive ? 1 : 0}
				style:margin-left={isActive ? '8px' : '0px'}
			>
				<span
					class="font-bold text-xs whitespace-nowrap select-none transition-opacity duration-200 leading-[1.9] px-2"
					style={isActive ? 'color: #FFD100;' : 'opacity: 0;'}
					title={item.label}
				>
					{item.label}
				</span>
			</div>
		</button>
	{/each}
</nav>

<style>
	button:active {
		transform: scale(0.97);
	}
</style>
