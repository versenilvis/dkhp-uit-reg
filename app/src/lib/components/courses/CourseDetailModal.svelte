<script lang="ts">
	import { X, Copy, Check, ExternalLink, BookOpen } from 'lucide-svelte';

	export type CourseInfo = {
		id: string;
		name: string;
		description: string;
		faculty?: string;
	};

	interface Props {
		course: CourseInfo | null;
		onClose: () => void;
	}

	let { course, onClose }: Props = $props();

	let copiedId = $state(false);
	let copiedName = $state(false);

	async function copyText(text: string, type: 'id' | 'name') {
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'id') {
				copiedId = true;
				setTimeout(() => (copiedId = false), 1500);
			} else {
				copiedName = true;
				setTimeout(() => (copiedName = false), 1500);
			}
		} catch (err) {
			console.error('Failed to copy', err);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if course}
	<div
		role="dialog"
		aria-modal="true"
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
		onclick={(e) => e.target === e.currentTarget && onClose()}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		tabindex="-1"
	>
		<div
			class="bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
		>
			<!-- Modal Header -->
			<div class="p-5 border-b-2 border-black bg-yellow-400 flex items-start justify-between gap-4">
				<div>
					<div class="flex items-center gap-2 mb-1.5">
						<span class="px-2.5 py-0.5 bg-black text-white font-mono font-black text-xs rounded-md">
							{course.id}
						</span>
						{#if course.faculty}
							<span
								class="px-2 py-0.5 bg-white text-black font-bold text-[11px] rounded-md border border-black"
							>
								{course.faculty}
							</span>
						{/if}
					</div>
					<h2
						class="text-lg sm:text-xl font-black uppercase text-black leading-snug pt-0.5"
						style="font-family: 'Be Vietnam Pro', 'Inter', sans-serif;"
					>
						{course.name}
					</h2>
				</div>

				<button
					type="button"
					onclick={onClose}
					class="p-1.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 text-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none shrink-0"
					title="Đóng"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Modal Body -->
			<div
				class="p-6 overflow-y-auto flex-1 text-sm text-gray-800 leading-relaxed whitespace-pre-line space-y-4"
			>
				<div>
					<h4
						class="text-xs font-black uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5"
					>
						<BookOpen size={14} />
						Tóm tắt nội dung môn học (Nguồn DAA UIT)
					</h4>
					<div
						class="bg-gray-50 p-4 rounded-xl border border-gray-200 font-medium text-gray-800 text-sm leading-relaxed"
					>
						{course.description ||
							'Chưa có thông tin mô tả chi tiết cho môn học này trên cổng DAA.'}
					</div>
				</div>
			</div>

			<!-- Modal Footer -->
			<div
				class="p-4 border-t-2 border-black bg-gray-50 flex flex-wrap items-center justify-between gap-2"
			>
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => course && copyText(course.id, 'id')}
						class="px-3 py-1.5 bg-white hover:bg-gray-100 border-2 border-black rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none"
					>
						{#if copiedId}
							<Check size={14} class="text-green-600" />
							<span class="text-green-600">Đã copy mã</span>
						{:else}
							<Copy size={14} />
							<span>Copy mã</span>
						{/if}
					</button>

					<button
						type="button"
						onclick={() => course && copyText(course.name, 'name')}
						class="px-3 py-1.5 bg-white hover:bg-gray-100 border-2 border-black rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none"
					>
						{#if copiedName}
							<Check size={14} class="text-green-600" />
							<span class="text-green-600">Đã copy tên</span>
						{:else}
							<Copy size={14} />
							<span>Copy tên</span>
						{/if}
					</button>

					<a
						href="https://daa.uit.edu.vn/content/bang-tom-tat-mon-hoc"
						target="_blank"
						rel="noopener noreferrer"
						class="px-3 py-1.5 bg-white hover:bg-gray-100 border-2 border-black rounded-xl text-xs font-black uppercase flex items-center gap-1 cursor-pointer text-gray-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none"
					>
						<span>DAA</span>
						<ExternalLink size={12} />
					</a>
				</div>

				<button
					type="button"
					onclick={onClose}
					class="px-4 py-1.5 bg-black text-white hover:bg-gray-800 border-2 border-black rounded-xl text-xs font-black uppercase cursor-pointer"
				>
					Đóng
				</button>
			</div>
		</div>
	</div>
{/if}
