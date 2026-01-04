<script lang="ts">
	import ScheduleGrid from './ScheduleGrid.svelte';
	import type { ScheduleItem } from './Schedule.svelte';
	import { Check, Download, Clipboard } from 'lucide-svelte';
	import html2canvas from 'html2canvas';

	interface Props {
		scheduleItems: ScheduleItem[];
	}

	let { scheduleItems }: Props = $props();

	let scheduleRef = $state<HTMLDivElement | null>(null);
	let copiedTkb = $state(false);

	async function copyTkbImage() {
		if (!scheduleRef) return;
		try {
			const target = (scheduleRef.querySelector('table') as HTMLElement) || scheduleRef;
			const canvas = await html2canvas(target, {
				backgroundColor: '#ffffff',
				scale: 2,
				logging: false,
				useCORS: true,
				width: target.offsetWidth,
				height: target.offsetHeight
			});

			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, 'image/png', 1.0)
			);

			if (!blob) throw new Error('Không thể tạo file ảnh từ dữ liệu.');

			if (navigator.clipboard && window.ClipboardItem) {
				const item = new ClipboardItem({ [blob.type]: blob });
				await navigator.clipboard.write([item]);
				copiedTkb = true;
				setTimeout(() => (copiedTkb = false), 2000);
			} else {
				throw new Error('Trình duyệt của bạn không hỗ trợ API copy ảnh.');
			}
		} catch (e: any) {
			console.error('Failed to copy TKB:', e);
			const msg = e?.message || 'Không rõ lỗi';
			alert(`Không thể copy: ${msg}. Hãy thử phím tắt hoặc dùng nút "Tải ảnh".`);
		}
	}

	async function downloadTkbImage() {
		if (!scheduleRef) return;
		try {
			const target = (scheduleRef.querySelector('table') as HTMLElement) || scheduleRef;
			const canvas = await html2canvas(target, {
				backgroundColor: '#ffffff',
				scale: 2,
				logging: false,
				useCORS: true,
				width: target.offsetWidth,
				height: target.offsetHeight
			});
			const dataUrl = canvas.toDataURL('image/png');
			const a = document.createElement('a');
			a.href = dataUrl;
			a.download = 'thoi-khoa-bieu.png';
			a.click();
		} catch (e) {
			console.error('Failed to download TKB:', e);
			alert('Không thể tải ảnh. Vui lòng thử lại.');
		}
	}
</script>

<div
	style="flex: 1; background-color: rgba(255, 255, 255, 0.95); backdrop-filter: blur(4px); border: 2px solid #000000; border-radius: 0.75rem; overflow: hidden; display: flex; flex-direction: column; max-height: calc(100vh - 100px);"
>
	<div class="flex-1 relative overflow-hidden">
		<div class="absolute inset-0 overflow-auto" bind:this={scheduleRef}>
			{#if scheduleItems.length === 0}
				<div
					style="height: 100%; display: flex; align-items: center; justify-content: center; color: #6b7280;"
				>
					<div style="text-align: center;">
						<p style="font-size: 1.125rem; font-weight: 500;">Chưa có lớp nào được chọn</p>
						<p style="font-size: 0.875rem; margin-top: 0.25rem;">
							Hãy chọn lớp từ trang "Tạo TKB" trước
						</p>
					</div>
				</div>
			{:else}
				<ScheduleGrid items={scheduleItems} />
			{/if}
		</div>

		{#if scheduleItems.length > 0}
			<!-- Floating Actions -->
			<div class="absolute top-14 right-4 flex flex-col gap-3 z-20 pointer-events-none">
				<button
					type="button"
					onclick={copyTkbImage}
					class="pointer-events-auto w-8 h-8 bg-white border-2 border-black rounded-lg shadow-lg hover:bg-yellow-400 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
					title="Copy ảnh thời khóa biểu"
				>
					{#if copiedTkb}
						<Check size={14} class="text-green-600" />
					{:else}
						<Clipboard size={14} class="text-black" />
					{/if}
				</button>
				<button
					type="button"
					onclick={downloadTkbImage}
					class="pointer-events-auto w-8 h-8 bg-white border-2 border-black rounded-lg shadow-lg hover:bg-yellow-400 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
					title="Tải ảnh thời khóa biểu"
				>
					<Download size={14} class="text-black" />
				</button>
			</div>
		{/if}
	</div>
</div>
