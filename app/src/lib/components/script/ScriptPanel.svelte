<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';

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

<div class="relative w-150 shrink-0 h-full flex flex-col">
	<div
		class="relative w-full h-full bg-[#f8f8f8] border-2 border-black rounded-xl overflow-hidden flex flex-col"
	>
		<!-- 3 dots -->
		<div
			class="bg-gray-100 px-5 py-4 flex items-center justify-between border-b-2 border-black shrink-0"
		>
			<div class="flex items-center gap-4">
				<div class="flex space-x-2">
					<div class="w-3 h-3 rounded-full bg-red-500 border border-black"></div>
					<div class="w-3 h-3 rounded-full bg-yellow-500 border border-black"></div>
					<div class="w-3 h-3 rounded-full bg-green-500 border border-black"></div>
				</div>
				<div class="h-4 w-0.5 bg-black/10"></div>
				<span class="text-xs font-bold text-black uppercase tracking-widest">uitreg_script.js</span>
			</div>
			<!-- DKHP -->
			<div
				class="bg-black text-white px-2 py-0.5 rounded border border-black text-[9px] font-bold uppercase"
			>
				<a class="hover:underline" href="https://dkhp.uit.edu.vn/" target="_blank"
					>DKHP.UIT.EDU.VN</a
				>
			</div>
		</div>

		<!-- Class codes area -->
		<div class="bg-[#f2f2f2] border-b border-black/10 p-4 shrink-0">
			<div class="flex items-center justify-between mb-2">
				<span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
					>Danh sách lớp đã chọn</span
				>
				{#if classCodes.length > 0}
					<span class="text-[10px] font-bold border border-black px-1.5 py-0.5 rounded bg-white"
						>{classCodes.length} Lớp</span
					>
				{/if}
			</div>
			<div class="flex items-center gap-2 flex-wrap min-h-8">
				{#if classCodes.length === 0}
					<span class="text-gray-400 text-xs italic">Chưa chọn lớp nào từ bảng biểu...</span>
				{:else}
					{#each classCodes as code}
						<span
							class="bg-yellow-100 text-black border border-black px-2 py-0.5 rounded text-[11px] font-mono font-bold"
						>
							{code}
						</span>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Code editor area -->
		<div class="flex-1 relative bg-[#0f0f0f] border-y-2 border-black min-h-0">
			<!-- Copy button-->
			<div class="absolute top-4 right-4 z-20">
				<button
					type="button"
					onclick={copyToClipboard}
					disabled={classCodes.length === 0}
					class="group/btn flex items-center justify-center w-10 h-10 bg-yellow-400 hover:bg-yellow-300 border-2 border-black rounded-xl text-black font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
					title="Copy script"
				>
					{#if copied}
						<Check size={18} strokeWidth={2.5} />
					{:else}
						<Copy size={18} strokeWidth={2.5} />
					{/if}
				</button>
			</div>

			<div class="absolute inset-0 overflow-auto p-4 custom-scrollbar">
				<div class="font-mono text-[13px] leading-relaxed pt-2">
					<pre class="bg-transparent whitespace-pre">{@html highlightedScript}</pre>
				</div>
			</div>
		</div>

		<div class="bg-[#f8f8f8] p-6">
			<div class="flex items-center gap-2 mb-6">
				<div class="w-2 h-2 rounded-full bg-red-500 animate-pulse border border-black/20"></div>
				<span class="text-xs font-bold text-black uppercase tracking-wider">Hướng dẫn sử dụng</span>
			</div>

			<div class="grid grid-cols-3 gap-6 mb-4">
				<!-- Step 1 -->
				<div class="relative group" style="transform: rotate(-2deg);">
					<div
						class="relative bg-[#FF8AFF] border-2 border-black p-3 rounded-2xl h-full flex flex-col justify-between min-h-25"
					>
						<p class="text-[9px] font-bold text-black/40 uppercase">Bước 01</p>
						<p class="text-[11px] text-black font-bold leading-tight">
							Nhấn nút Copy màu vàng ở trên
						</p>
					</div>
				</div>

				<!-- Step 2 -->
				<div class="relative group" style="transform: rotate(1.5deg);">
					<div
						class="relative bg-[#88FFFF] border-2 border-black p-3 rounded-2xl h-full flex flex-col justify-between min-h-25"
					>
						<p class="text-[9px] font-bold text-black/40 uppercase">Bước 02</p>
						<p class="text-[11px] text-black font-bold leading-tight">
							Mở <a
								class="underline decoration-black decoration-2 underline-offset-2 hover:bg-black hover:text-white px-0.5 transition-colors"
								href="https://dkhp.uit.edu.vn/"
								target="_blank">ĐKHP UIT</a
							>, nhấn F12 → Console
						</p>
					</div>
				</div>

				<!-- Step 3 -->
				<div class="relative group" style="transform: rotate(-1deg);">
					<div
						class="relative bg-[#FFDD44] border-2 border-black p-3 rounded-2xl h-full flex flex-col justify-between min-h-25"
					>
						<p class="text-[9px] font-bold text-black/40 uppercase">Bước 03</p>
						<p class="text-[11px] text-black font-bold leading-tight">Dán code vào và nhấn Enter</p>
					</div>
				</div>
			</div>

			<div class="mt-4 p-3 bg-red-50 border-2 border-black rounded-xl border-dashed">
				<p class="text-[11px] text-red-600 font-bold flex items-start gap-2">
					<span class="text-base leading-none">⚠</span>
					<span
						>Lưu ý: Script sẽ tự spam đăng ký các lớp full cho tới khi có slot trống (tức là ai đó
						hủy lớp)</span
					>
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	pre {
		tab-size: 4;
		color: #e0e0e0;
	}

	:global(.hl-keyword) {
		color: #ff79c6;
		font-weight: bold;
	}

	:global(.hl-string) {
		color: #50fa7b;
	}

	:global(.hl-number) {
		color: #bd93f9;
	}

	:global(.hl-function) {
		color: #8be9fd;
	}

	:global(.hl-method) {
		color: #8be9fd;
	}

	:global(.hl-boolean) {
		color: #ffb86c;
	}

	:global(.hl-builtin) {
		color: #f1fa8c;
	}

	:global(.hl-arrow) {
		color: #ff79c6;
	}

	:global(.hl-operator) {
		color: #ff79c6;
	}

	:global(.hl-bracket) {
		color: #f8f8f2;
	}

	/* Brutalist Scrollbar */
	div::-webkit-scrollbar {
		width: 8px;
	}
	div::-webkit-scrollbar-track {
		background: #000;
	}
	div::-webkit-scrollbar-thumb {
		background: #333;
		border: 1px solid #000;
	}
	div::-webkit-scrollbar-thumb:hover {
		background: #444;
	}
</style>
