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
	class="w-[640px] shrink-0 bg-[#1e1e1e] border-2 border-black rounded-xl overflow-hidden flex flex-col"
	style="max-height: calc(100vh - 100px);"
>
	<!-- Header Dots -->
	<div class="bg-[#252526] px-4 py-2 flex items-center justify-between">
		<div class="flex space-x-1.5">
			<div class="w-2.5 h-2.5 rounded-full bg-red-300"></div>
			<div class="w-2.5 h-2.5 rounded-full bg-yellow-300"></div>
			<div class="w-2.5 h-2.5 rounded-full bg-green-300"></div>
		</div>
	</div>

	<!-- Class codes summary -->
	<div class="bg-[#252526] border-b border-[#3c3c3c] p-3">
		<div class="flex items-center gap-2 flex-wrap">
			{#if classCodes.length === 0}
				<span class="text-gray-500 text-sm italic">Chưa có môn nào được chọn</span>
			{:else}
				{#each classCodes as code}
					<span class="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs font-mono">
						{code}
					</span>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Script content -->
	<div class="flex-1 overflow-auto p-4 relative group">
		<button
			type="button"
			onclick={copyToClipboard}
			disabled={classCodes.length === 0}
			class="sticky top-0 float-right text-gray-400 hover:text-white disabled:opacity-0 transition-all p-2 cursor-pointer z-10"
			title="Copy script"
		>
			{#if copied}
				<Check size={16} class="text-green-500" />
			{:else}
				<Copy size={16} />
			{/if}
		</button>
		<pre
			class="text-[13px] font-mono whitespace-pre-wrap break-all leading-relaxed">{@html highlightedScript}</pre>
	</div>

	<!-- Instructions -->
	<div class="bg-[#252526] border-t border-[#3c3c3c] p-3">
		<div class="text-sm text-gray-400 space-y-1">
			<p class="font-medium text-white">Hướng dẫn sử dụng:</p>
			<p>1. Copy script bằng nút "Copy" ở trên</p>
			<p>
				2. Mở trang <a
					class="underline text-blue-400"
					href="https://dkhp.uit.edu.vn/"
					target="_blank">ĐKHP UIT</a
				>, nhấn F12 → Bật tab Console
			</p>
			<p>3. Khi mở đăng ký, dán script và nhấn Enter</p>
			<p class="text-yellow-400">
				⚠️ Lưu ý: Script sẽ tự spam đăng ký các lớp full cho tới khi có slot trống (tức là ai đó hủy
				lớp)
			</p>
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
		font-weight: 500;
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
		font-weight: 500;
	}

	:global(.hl-builtin) {
		color: #4ec9b0;
	}

	:global(.hl-arrow) {
		color: #569cd6;
		font-weight: bold;
	}

	:global(.hl-operator) {
		color: #d4d4d4;
	}

	:global(.hl-bracket) {
		color: #ffd700;
	}
</style>
