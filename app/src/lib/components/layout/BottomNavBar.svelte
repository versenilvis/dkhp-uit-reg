<script lang="ts">
	import { cn } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
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

	const navItems = [
		{ label: 'Trang chủ', icon: House, route: '/' },
		{ label: 'Tạo TKB', icon: CalendarPlus, route: '/tao-tkb' },
		{ label: 'TKB & Code', icon: FileCode, route: '/tkb-code' },
		{ label: 'Môn học', icon: BookOpen, route: '/mon-hoc' }
		/*
		{ label: 'Lộ trình', icon: Route, route: '/lo-trinh' },
		{ label: 'Câu hỏi', icon: CircleQuestionMark, route: '/cau-hoi' }
		*/
	];

	let activeIndex = $derived.by(() => {
		const currentPath = page.url.pathname;
		const idx = navItems.findIndex((item) => item.route === currentPath);
		return idx >= 0 ? idx : defaultIndex;
	});

	function handleNavClick(route: string) {
		goto(route, { replaceState: false, noScroll: true });
	}

	function getLabelWidth(label: string): number {
		return label.length * 7;
	}
</script>

<nav
	aria-label="Bottom Navigation"
	class={cn(
		'bg-white dark:bg-gray-950 border-2 rounded-full flex items-center p-1.5 px-2 shadow-xl space-x-1 max-w-[95vw] h-13',
		stickyBottom && 'fixed inset-x-0 bottom-4 mx-auto z-50 w-fit',
		className
	)}
	style="border-color: #fff;"
>
	{#each navItems as item, idx}
		{@const isActive = activeIndex === idx}
		{@const Icon = item.icon}

		<button
			type="button"
			aria-label={item.label}
			class={cn(
				'flex items-center gap-0 px-3 py-2 rounded-full transition-all duration-300 relative h-10 min-w-11 min-h-10 max-h-11 cursor-pointer',
				isActive
					? 'bg-primary/20 text-primary gap-2'
					: 'bg-transparent text-white hover:bg-gray-100 dark:hover:bg-gray-800',
				'focus:outline-none focus-visible:ring-0'
			)}
			onclick={() => handleNavClick(item.route)}
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
