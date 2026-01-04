<script lang="ts">
	import { Copy, Check } from 'lucide-svelte';

	interface Props {
		classCodes: string[];
		highlightedScript: string;
		generatedScript: string;
		onCopy?: () => void;
	}

	let { classCodes, highlightedScript, generatedScript, onCopy }: Props = $props();

	let copied = $state(false);

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(generatedScript);
			copied = true;
			if (onCopy) onCopy();
			setTimeout(() => (copied = false), 2000);
		} catch (e) {
			console.error('Failed to copy:', e);
		}
	}
</script>

<div
	class="w-[640px] shrink-0 bg-[#0f0f0f] border-2 border-black rounded-2xl overflow-hidden flex flex-col shadow-2xl"
	style="max-height: calc(100vh - 100px);"
>
	<div class="bg-[#1a1a1a] px-5 py-3 flex items-center justify-between border-b border-white/5">
		<div class="flex items-center gap-4">
			<div class="flex space-x-2">
				<div class="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
				<div class="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
				<div class="w-3 h-3 rounded-full bg-[#27c93f]"></div>
			</div>
			<div class="h-4 w-[1px] bg-white/10"></div>
			<span class="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase"
				>uitreg_script.js</span
			>
		</div>
	</div>

	<!-- Class codes -->
	<div class="bg-[#141414] border-b border-white/5 p-4 flex flex-col gap-2">
		<span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest"
			>Các lớp đã chọn</span
		>
		<div class="flex items-center gap-2 flex-wrap">
			{#if classCodes.length === 0}
				<span class="text-gray-600 text-xs italic">Không có lớp nào được chọn...</span>
			{:else}
				{#each classCodes as code}
					<span
						class="bg-yellow-500/10 text-yellow-500/90 border border-yellow-500/20 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold"
					>
						{code}
					</span>
				{/each}
			{/if}
		</div>
	</div>

	<div class="flex-1 overflow-auto p-4 relative group bg-[#0f0f0f]">
		<!-- Copy button -->
		<button
			type="button"
			onclick={copyToClipboard}
			disabled={classCodes.length === 0}
			class="sticky top-2 right-0 float-right z-20 group/btn flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer disabled:opacity-0"
			title="Copy script"
		>
			{#if copied}
				<Check size={18} class="text-green-500" />
			{:else}
				<Copy size={18} />
			{/if}
		</button>

		<div class="font-mono text-[13px] leading-relaxed">
			<pre class="bg-transparent">{@html highlightedScript}</pre>
		</div>
	</div>

	<!-- Instructions-->
	<div class="bg-[#141414] border-t border-white/10 p-5">
		<div class="flex items-start gap-4">
			<div class="flex-1 space-y-3">
				<div class="flex items-center gap-2">
					<div class="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
					<span class="text-[11px] font-bold text-white uppercase tracking-wider"
						>HƯỚNG DẪN DÙNG SCRIPT</span
					>
				</div>
				<div class="grid grid-cols-3 gap-3">
					<div class="bg-white/5 p-2 rounded-lg border border-white/5">
						<p class="text-[10px] text-gray-500 mb-1">Bước 1</p>
						<p class="text-[11px] text-gray-300 font-medium">Copy script bằng nút Copy ở trên</p>  
					</div>
					<div class="bg-white/5 p-2 rounded-lg border border-white/5">
						<p class="text-[10px] text-gray-500 mb-1">Bước 2</p>
						<p class="text-[11px] text-gray-300 font-medium">
							Mở trang <a
								class="underline text-blue-400"
								href="https://dkhp.uit.edu.vn/"
								target="_blank">ĐKHP UIT</a
							>, F12 rồi mở Console
						</p>
					</div>
					<div class="bg-white/5 p-2 rounded-lg border border-white/5">
						<p class="text-[10px] text-gray-500 mb-1">Bước 3</p>
						<p class="text-[11px] text-gray-300 font-medium">Dán script vào Console rồi Enter</p>
					</div>
				</div>
				<div class="pt-1">
					<p class="text-[12px] text-yellow-500 leading-normal flex items-start gap-2 italic">
						<span>⚠</span>
						<span
							>Lưu ý: Script sẽ tự spam đăng ký các lớp full cho tới khi có slot trống (tức là ai đó
							hủy lớp)</span
						>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	pre {
		tab-size: 4;
		color: #d4d4d4;
	}

	:global(.hl-keyword) {
		color: #c586c0;
	}

	:global(.hl-string) {
		color: #ce9178;
	}

	:global(.hl-number) {
		color: #b5cea8;
	}

	:global(.hl-function) {
		color: #dcdcaa;
	}

	:global(.hl-method) {
		color: #4fc1ff;
	}

	:global(.hl-boolean) {
		color: #569cd6;
	}

	:global(.hl-builtin) {
		color: #4ec9b0;
	}

	:global(.hl-arrow) {
		color: #569cd6;
	}

	:global(.hl-operator) {
		color: #808080;
	}

	:global(.hl-bracket) {
		color: #ffd700;
	}

	/* Elegant Scrollbar */
	div::-webkit-scrollbar {
		width: 6px;
	}
	div::-webkit-scrollbar-track {
		background: transparent;
	}
	div::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
	}
	div::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.2);
	}
</style>
