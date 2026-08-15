<script lang="ts">
	import ScheduleGrid from './ScheduleGrid.svelte';
	import type { ScheduleItem } from './Schedule.svelte';
	import { Check, Download, Clipboard, FileUp, FileDown } from 'lucide-svelte';
	import html2canvas from 'html2canvas';
	import { courseData, selectedCourseIds } from '$lib/stores';
	import { get } from 'svelte/store';
	import type { Course } from './CourseSelector.svelte';

	interface Props {
		scheduleItems: ScheduleItem[];
	}

	let { scheduleItems }: Props = $props();

	let scheduleRef = $state<HTMLDivElement | null>(null);
	let copiedTkb = $state(false);
	let fileInputRef = $state<HTMLInputElement | null>(null);

	async function copyTkbImage() {
		if (!scheduleRef) return;
		try {
			const target =
				(scheduleRef.querySelector('[data-schedule-capture]') as HTMLElement) ||
				(scheduleRef.querySelector('table') as HTMLElement) ||
				scheduleRef;

			const scrollContainer =
				(scheduleRef.querySelector('.schedule-scroll-container') as HTMLElement) || scheduleRef;
			const prevScrollTop = scrollContainer.scrollTop;
			const prevScrollLeft = scrollContainer.scrollLeft;
			scrollContainer.scrollTop = 0;
			scrollContainer.scrollLeft = 0;

			const canvas = await html2canvas(target, {
				backgroundColor: '#ffffff',
				scale: 2,
				logging: false,
				useCORS: true,
				scrollX: 0,
				scrollY: 0
			});

			scrollContainer.scrollTop = prevScrollTop;
			scrollContainer.scrollLeft = prevScrollLeft;

			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, 'image/png', 1.0)
			);

			if (!blob) throw new Error('Không thể tạo file ảnh từ dữ liệu');

			if (navigator.clipboard && window.ClipboardItem) {
				const item = new ClipboardItem({ [blob.type]: blob });
				await navigator.clipboard.write([item]);
				copiedTkb = true;
				setTimeout(() => (copiedTkb = false), 2000);
			} else {
				throw new Error('Trình duyệt của bạn không hỗ trợ API copy ảnh');
			}
		} catch (e: any) {
			console.error('Failed to copy TKB:', e);
			const msg = e?.message || 'Không rõ lỗi';
			alert(`Không thể copy: ${msg}. Hãy thử phím tắt hoặc dùng nút "Tải ảnh"`);
		}
	}

	async function downloadTkbImage() {
		if (!scheduleRef) return;
		try {
			const target =
				(scheduleRef.querySelector('[data-schedule-capture]') as HTMLElement) ||
				(scheduleRef.querySelector('table') as HTMLElement) ||
				scheduleRef;

			const scrollContainer =
				(scheduleRef.querySelector('.schedule-scroll-container') as HTMLElement) || scheduleRef;
			const prevScrollTop = scrollContainer.scrollTop;
			const prevScrollLeft = scrollContainer.scrollLeft;
			scrollContainer.scrollTop = 0;
			scrollContainer.scrollLeft = 0;

			const canvas = await html2canvas(target, {
				backgroundColor: '#ffffff',
				scale: 2,
				logging: false,
				useCORS: true,
				scrollX: 0,
				scrollY: 0
			});

			scrollContainer.scrollTop = prevScrollTop;
			scrollContainer.scrollLeft = prevScrollLeft;

			const dataUrl = canvas.toDataURL('image/png');
			const a = document.createElement('a');
			a.href = dataUrl;
			a.download = 'thoi-khoa-bieu.png';
			a.click();
		} catch (e) {
			console.error('Failed to download TKB:', e);
			alert('Không thể tải ảnh. Vui lòng thử lại');
		}
	}

	function exportSchedule() {
		const currentSelectedIds = get(selectedCourseIds);
		const allCourses = get(courseData);

		if (currentSelectedIds.length === 0) {
			alert('Chưa có môn nào được chọn để chia sẻ');
			return;
		}

		const selectedCourses = allCourses.filter((c) => currentSelectedIds.includes(c.id));

		const data = {
			app: 'DKHP_UIT',
			version: 2,
			exportedAt: new Date().toISOString(),
			selectedIds: currentSelectedIds,
			selectedCourses,
			allCourses
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `tkb-uit-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function triggerImport() {
		fileInputRef?.click();
	}

	function handleFileImport(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const content = event.target?.result as string;
				const parsed = JSON.parse(content);

				if (!parsed || (!parsed.selectedIds && !parsed.selectedCourses)) {
					throw new Error('File không hợp lệ hoặc thiếu dữ liệu thời khóa biểu');
				}

				// Auto override all courses if available
				if (Array.isArray(parsed.allCourses) && parsed.allCourses.length > 0) {
					courseData.set(parsed.allCourses);
				} else if (Array.isArray(parsed.selectedCourses) && parsed.selectedCourses.length > 0) {
					const existing = get(courseData);
					const merged = [...existing];
					parsed.selectedCourses.forEach((sc: Course) => {
						if (!merged.some((c) => c.id === sc.id)) {
							merged.push(sc);
						}
					});
					courseData.set(merged);
				}

				const targetIds = Array.isArray(parsed.selectedIds)
					? parsed.selectedIds
					: (parsed.selectedCourses || []).map((c: Course) => c.id);

				selectedCourseIds.set(targetIds);
				alert(`Đã import thành công ${targetIds.length} môn học vào thời khóa biểu!`);
			} catch (err: any) {
				console.error('Import failed:', err);
				alert(`Lỗi khi import file: ${err.message || 'File không đúng định dạng JSON'}`);
			} finally {
				input.value = '';
			}
		};
		reader.readAsText(file);
	}
</script>

<div
	style="flex: 1; background-color: rgba(255, 255, 255, 0.95); backdrop-filter: blur(4px); border: 2px solid #000000; border-radius: 0.75rem; overflow: hidden; display: flex; flex-direction: column; max-height: calc(100vh - 60px);"
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
							Hãy chọn lớp từ trang "Tạo TKB" hoặc Import file TKB
						</p>
					</div>
				</div>
			{:else}
				<ScheduleGrid items={scheduleItems} />
			{/if}
		</div>

		<!-- Floating Actions (2x2 grid: Import/Export on left, Copy/Download on right) -->
		<div class="absolute top-14 right-4 grid grid-cols-2 gap-2 z-20 pointer-events-none">
			<!-- Top-Left: Import -->
			<button
				type="button"
				onclick={triggerImport}
				class="pointer-events-auto w-8 h-8 bg-white border-2 border-black rounded-lg shadow-lg hover:bg-yellow-400 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
				title="Import lịch học (nhận TKB)"
			>
				<FileUp size={14} class="text-black" />
			</button>

			<!-- Top-Right: Copy -->
			{#if scheduleItems.length > 0}
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
			{:else}
				<div></div>
			{/if}

			<!-- Bottom-Left: Export -->
			{#if scheduleItems.length > 0}
				<button
					type="button"
					onclick={exportSchedule}
					class="pointer-events-auto w-8 h-8 bg-white border-2 border-black rounded-lg shadow-lg hover:bg-yellow-400 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
					title="Export lịch học (chia sẻ TKB)"
				>
					<FileDown size={14} class="text-black" />
				</button>
			{:else}
				<div></div>
			{/if}

			<!-- Bottom-Right: Download -->
			{#if scheduleItems.length > 0}
				<button
					type="button"
					onclick={downloadTkbImage}
					class="pointer-events-auto w-8 h-8 bg-white border-2 border-black rounded-lg shadow-lg hover:bg-yellow-400 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
					title="Tải ảnh thời khóa biểu"
				>
					<Download size={14} class="text-black" />
				</button>
			{:else}
				<div></div>
			{/if}

			<input
				type="file"
				accept=".json"
				bind:this={fileInputRef}
				onchange={handleFileImport}
				class="hidden"
			/>
		</div>
	</div>
</div>
