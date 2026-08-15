<script lang="ts">
	import ScheduleGrid from './ScheduleGrid.svelte';
	import type { ScheduleItem } from './Schedule.svelte';
	import { Check, Download, Clipboard, Share2, ClipboardPaste, X } from 'lucide-svelte';
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
	let copiedCode = $state(false);
	let showImportModal = $state(false);
	let importInputText = $state('');
	let importError = $state('');

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

	async function copyShareCode() {
		const currentSelectedIds = get(selectedCourseIds);
		const allCourses = get(courseData);

		if (currentSelectedIds.length === 0) {
			alert('Chưa có môn nào được chọn để chia sẻ');
			return;
		}

		const selectedCourses = allCourses.filter((c) => currentSelectedIds.includes(c.id));
		const classCodes = selectedCourses.map((c) => c.classCode);

		const sharePayload = {
			app: 'DKHP_UIT',
			v: 2,
			codes: classCodes,
			courses: selectedCourses
		};

		const shareText = JSON.stringify(sharePayload);

		try {
			await navigator.clipboard.writeText(shareText);
			copiedCode = true;
			setTimeout(() => (copiedCode = false), 2000);
		} catch (err) {
			console.error('Copy share code failed:', err);
			prompt('Copy mã TKB dưới đây để chia sẻ:', shareText);
		}
	}

	function openImportModal() {
		importInputText = '';
		importError = '';
		showImportModal = true;
	}

	async function pasteFromClipboard() {
		try {
			if (navigator.clipboard) {
				const text = await navigator.clipboard.readText();
				if (text) {
					importInputText = text;
				}
			}
		} catch (err) {
			console.warn('Clipboard read failed:', err);
		}
	}

	function handleApplyImport() {
		importError = '';
		const raw = importInputText.trim();
		if (!raw) {
			importError = 'Vui lòng nhập hoặc dán mã TKB';
			return;
		}

		try {
			const allCourses = get(courseData);
			let targetCodes: string[] = [];
			let injectedCourses: Course[] = [];

			if (raw.startsWith('{') || raw.startsWith('[')) {
				const parsed = JSON.parse(raw);
				if (parsed.codes && Array.isArray(parsed.codes)) {
					targetCodes = parsed.codes;
				} else if (parsed.selectedCourses && Array.isArray(parsed.selectedCourses)) {
					targetCodes = parsed.selectedCourses.map((c: any) => c.classCode);
					injectedCourses = parsed.selectedCourses;
				} else if (Array.isArray(parsed)) {
					targetCodes = parsed.map((item: any) =>
						typeof item === 'string' ? item : item.classCode || item.id
					);
				}
				if (parsed.courses && Array.isArray(parsed.courses)) {
					injectedCourses = parsed.courses;
				}
			} else {
				targetCodes = raw
					.split(/[\s,\n\r\t]+/)
					.map((s) => s.trim())
					.filter(Boolean);
			}

			if (targetCodes.length === 0 && injectedCourses.length === 0) {
				throw new Error('Không tìm thấy danh sách mã lớp học trong nội dung');
			}

			let mergedCourses = [...allCourses];
			if (injectedCourses.length > 0) {
				injectedCourses.forEach((sc) => {
					if (!mergedCourses.some((c) => c.id === sc.id || c.classCode === sc.classCode)) {
						mergedCourses.push(sc);
					}
				});
				courseData.set(mergedCourses);
			}

			const matchedIds: string[] = [];
			targetCodes.forEach((code) => {
				const found = mergedCourses.find(
					(c) => c.classCode.toLowerCase() === code.toLowerCase() || c.id === code
				);
				if (found && !matchedIds.includes(found.id)) {
					matchedIds.push(found.id);
				}
			});

			if (matchedIds.length === 0 && injectedCourses.length > 0) {
				matchedIds.push(...injectedCourses.map((c) => c.id));
			}

			if (matchedIds.length === 0) {
				throw new Error(
					'Không tìm thấy lớp học tương ứng trong dữ liệu hiện tại. Hãy đảm bảo bạn đã tải file Excel lên hoặc dán đúng mã lớp.'
				);
			}

			selectedCourseIds.set(matchedIds);
			showImportModal = false;
			alert(`Đã áp dụng thành công ${matchedIds.length} môn học vào thời khóa biểu!`);
		} catch (err: any) {
			console.error('Import error:', err);
			importError = err.message || 'Mã TKB không hợp lệ';
		}
	}
</script>

<div
	style="flex: 1; background-color: rgba(255, 255, 255, 0.95); backdrop-filter: blur(4px); border: 2px solid #000000; border-radius: 0.75rem; overflow: hidden; display: flex; flex-direction: column; max-height: calc(100vh - 85px); height: calc(100vh - 85px);"
>
	<!-- Header Control Toolbar -->
	<div
		class="px-3 py-1.5 bg-gray-50 border-b-2 border-black flex items-center justify-between gap-2 shrink-0 select-none"
	>
		<div class="flex items-center gap-2">
			<span class="font-black uppercase text-xs tracking-wider text-black">Thời khóa biểu</span>
			<span
				class="text-[10px] font-bold px-2 py-0.5 bg-yellow-300 border border-black rounded-full text-black"
			>
				{scheduleItems.length} lớp
			</span>
		</div>

		<!-- Action Buttons on Top Bar -->
		<div class="flex items-center gap-1.5">
			<!-- Nhập TKB -->
			<button
				type="button"
				onclick={openImportModal}
				class="h-7 px-2.5 bg-white hover:bg-yellow-300 border-2 border-black rounded-lg text-[11px] font-black uppercase text-black flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px cursor-pointer transition-colors"
				title="Dán / Nhập mã TKB từ bạn bè"
			>
				<ClipboardPaste size={13} />
				<span>Nhập TKB</span>
			</button>

			{#if scheduleItems.length > 0}
				<!-- Chia sẻ TKB -->
				<button
					type="button"
					onclick={copyShareCode}
					class="h-7 px-2.5 bg-white hover:bg-yellow-300 border-2 border-black rounded-lg text-[11px] font-black uppercase text-black flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px cursor-pointer transition-colors"
					title="Copy mã chia sẻ TKB"
				>
					{#if copiedCode}
						<Check size={13} class="text-green-600" />
						<span class="text-green-600">Đã copy</span>
					{:else}
						<Share2 size={13} />
						<span>Chia sẻ</span>
					{/if}
				</button>

				<!-- Copy Ảnh -->
				<button
					type="button"
					onclick={copyTkbImage}
					class="h-7 px-2.5 bg-white hover:bg-yellow-300 border-2 border-black rounded-lg text-[11px] font-black uppercase text-black flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px cursor-pointer transition-colors"
					title="Copy ảnh thời khóa biểu"
				>
					{#if copiedTkb}
						<Check size={13} class="text-green-600" />
						<span class="text-green-600">Đã copy</span>
					{:else}
						<Clipboard size={13} />
						<span>Copy ảnh</span>
					{/if}
				</button>

				<!-- Tải Ảnh -->
				<button
					type="button"
					onclick={downloadTkbImage}
					class="h-7 px-2.5 bg-white hover:bg-yellow-300 border-2 border-black rounded-lg text-[11px] font-black uppercase text-black flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px cursor-pointer transition-colors"
					title="Tải ảnh thời khóa biểu"
				>
					<Download size={13} />
					<span>Tải ảnh</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Schedule Grid Body -->
	<div class="flex-1 relative overflow-hidden">
		<div class="absolute inset-0 overflow-auto" bind:this={scheduleRef}>
			{#if scheduleItems.length === 0}
				<div
					style="height: 100%; display: flex; align-items: center; justify-content: center; color: #6b7280;"
				>
					<div style="text-align: center;">
						<p style="font-size: 1.125rem; font-weight: 500;">Chưa có lớp nào được chọn</p>
						<p style="font-size: 0.875rem; margin-top: 0.25rem;">
							Hãy chọn lớp từ trang "Tạo TKB" hoặc bấm "Nhập TKB" ở trên
						</p>
					</div>
				</div>
			{:else}
				<ScheduleGrid items={scheduleItems} />
			{/if}
		</div>
	</div>
</div>

<!-- Modal Nhập TKB (Paste / Import) -->
{#if showImportModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
		onclick={(e) => e.target === e.currentTarget && (showImportModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showImportModal = false)}
		tabindex="-1"
	>
		<div
			class="relative w-full max-w-lg bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col"
		>
			<div class="p-4 border-b-2 border-black bg-yellow-300 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<ClipboardPaste size={18} class="text-black" />
					<h3 class="font-black uppercase text-sm text-black">Nhập mã thời khóa biểu</h3>
				</div>
				<button
					type="button"
					onclick={() => (showImportModal = false)}
					class="p-1 bg-white border-2 border-black rounded-lg hover:bg-gray-100 text-black cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
					title="Đóng"
				>
					<X size={16} />
				</button>
			</div>

			<div class="p-5 space-y-4">
				<p class="text-xs text-gray-700 font-medium leading-relaxed">
					Dán mã chia sẻ từ bạn bè hoặc danh sách các mã lớp (ví dụ: <code
						class="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold text-black"
						>CE224.R11, CE224.R11.1, IS211.R11</code
					>):
				</p>

				<textarea
					bind:value={importInputText}
					placeholder="Dán mã TKB hoặc danh sách mã lớp vào đây..."
					rows="5"
					class="w-full p-3 border-2 border-black rounded-xl text-xs font-mono bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
				></textarea>

				<div class="flex items-start gap-1.5 text-[11px] text-red-600 font-bold leading-tight">
					<span>*</span>
					<span>
						Lưu ý: Khi áp dụng, hệ thống sẽ xóa toàn bộ thời khóa biểu cũ và ghi đè bằng thời khóa
						biểu mới.
					</span>
				</div>

				{#if importError}
					<div
						class="p-2 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-600"
					>
						{importError}
					</div>
				{/if}

				<div class="flex items-center justify-between pt-2">
					<button
						type="button"
						onclick={pasteFromClipboard}
						class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px"
					>
						<ClipboardPaste size={14} />
						<span>Dán từ clipboard</span>
					</button>

					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={() => (showImportModal = false)}
							class="px-3 py-1.5 bg-white hover:bg-gray-100 border-2 border-black rounded-xl text-xs font-black uppercase cursor-pointer"
						>
							Hủy
						</button>
						<button
							type="button"
							onclick={handleApplyImport}
							class="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 border-2 border-black rounded-xl text-xs font-black uppercase text-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px"
						>
							Áp dụng TKB
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
