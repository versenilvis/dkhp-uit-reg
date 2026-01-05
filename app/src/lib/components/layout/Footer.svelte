<script lang="ts">
	import { Mail, Bug, Clock } from 'lucide-svelte';

	interface Props {
		semester: number | string;
		schoolYear: string;
	}

	let { semester, schoolYear }: Props = $props();
</script>

<!-- Decorative arc -->
<div class="absolute bottom-10 left-0 right-0 h-20 overflow-hidden pointer-events-none z-20">
	<svg
		class="w-full h-full"
		viewBox="0 0 1440 80"
		preserveAspectRatio="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M0,0 Q720,40 1440,0 L1440,80 L0,80 Z" fill="#000" opacity="1" />
	</svg>
</div>

<footer
	class="relative h-10 px-6
         flex items-center justify-between
         shrink-0 bg-primary z-30"
>
	<div class="flex items-center space-x-6 pb-6 text-lg">
		<a
			href="https://github.com/versenilvis/dkhp-uit-reg"
			target="_blank"
			class="text-gray-400 hover:text-white transition-colors"
			title="GitHub"
		>
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path
					d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
				/>
				<path d="M9 18c-4.51 2-5-2-7-2" />
			</svg>
		</a>
		<a
			href="https://www.facebook.com/t.hoang0901"
			target="_blank"
			class="text-gray-400 hover:text-blue-500 transition-colors"
			title="Facebook"
		>
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
			</svg>
		</a>
		<a
			href="mailto:versedev.store@proton.me"
			class="text-gray-400 hover:text-purple-500 transition-colors"
			title="Email"
		>
			<Mail size={22} />
		</a>
		<button
			type="button"
			class="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
			aria-label="Báo lỗi"
		>
			<a href="https://github.com/versenilvis/dkhp-uit-reg/issues/new" target="_blank">
				<Bug size={22} color="#ef4444" />
			</a>
		</button>
	</div>

	<div
		class="flex items-center space-x-1 pb-6
           text-[9px] text-gray-400 font-bold uppercase tracking-wider"
	>
		<Clock size={10} />
		<span class="ml-1">Đăng ký học phần học kỳ {semester} ({schoolYear})</span>
	</div>
</footer>
