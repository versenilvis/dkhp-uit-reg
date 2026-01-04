<script lang="ts">
	import { dayNamesVi, timeSlots } from '$lib/constants';
	import type { ScheduleItem } from './Schedule.svelte';
	import { AlertTriangle, Trash2 } from 'lucide-svelte';

	interface Props {
		items: ScheduleItem[];
		onRemove?: (id: string) => void;
	}

	let { items, onRemove }: Props = $props();

	let scheduledItems = $derived(items.filter((item) => item.day !== -1 && item.rawTiet !== '*'));
	let onlineItems = $derived(items.filter((item) => item.day !== -1 && item.rawTiet === '*'));
	let bottomItems = $derived(items.filter((item) => item.day === -1));

	let visibleTimeSlots = $derived.by(() => {
		const baseSlots = timeSlots.slice(0, 10);

		const hasEveningClasses = scheduledItems.some((item) => {
			const { endSlot } = getSlotRange(item);
			return endSlot >= 10;
		});

		if (hasEveningClasses) {
			return timeSlots;
		}
		return baseSlots;
	});

	function getSlotRange(item: ScheduleItem): { startSlot: number; endSlot: number } {
		let startSlot = -1;
		let endSlot = -1;

		for (let i = 0; i < timeSlots.length; i++) {
			const slot = timeSlots[i];
			const itemStart = item.startTime;
			const itemEnd = item.endTime;

			if (
				(itemStart >= slot.start && itemStart < slot.end) ||
				(itemEnd > slot.start && itemEnd <= slot.end) ||
				(itemStart <= slot.start && itemEnd >= slot.end)
			) {
				if (startSlot === -1) startSlot = i;
				endSlot = i;
			}
		}

		return { startSlot, endSlot };
	}

	function getItemForSlot(day: number, slotIndex: number): ScheduleItem | null {
		const dayItems = scheduledItems.filter((item) => item.day === day);

		for (const item of dayItems) {
			const { startSlot, endSlot } = getSlotRange(item);
			if (slotIndex >= startSlot && slotIndex <= endSlot) {
				return item;
			}
		}

		return null;
	}

	function getRowspan(item: ScheduleItem): number {
		const { startSlot, endSlot } = getSlotRange(item);
		return endSlot - startSlot + 1;
	}

	function getCourseColor(courseName: string): string {
		const colors = [
			'bg-blue-200 border-blue-400',
			'bg-cyan-200 border-cyan-400',
			'bg-purple-200 border-purple-400',
			'bg-pink-200 border-pink-400',
			'bg-orange-200 border-orange-400',
			'bg-green-200 border-green-400',
			'bg-yellow-200 border-yellow-400',
			'bg-red-200 border-red-400'
		];
		const hash = courseName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		return colors[hash % colors.length];
	}

	let hoveredBaseCode = $state<string | null>(null);

	function getBaseCode(classCode: string): string {
		const parts = classCode.split('.');
		return parts.length > 2 && /^\d+$/.test(parts[parts.length - 1])
			? parts.slice(0, 2).join('.')
			: classCode;
	}
</script>

<div class="h-full w-full bg-gray-100 overflow-auto">
	<div class="min-h-full">
		<table
			class="w-full"
			style="table-layout: fixed; width: 100%; border-collapse: separate; border-spacing: 0;"
		>
			<colgroup>
				<col style="width: 70px;" />
				<col />
				<col />
				<col />
				<col />
				<col />
				<col />
			</colgroup>
			<thead class="bg-gray-100 sticky top-0 z-10">
				<tr class="border-b border-gray-200">
					<th
						class="p-2 text-center font-bold border-r border-gray-200 bg-[#ebebeb] text-xs text-gray-800"
					>
						Thứ / <br /> Tiết
					</th>
					{#each dayNamesVi as dayName, idx}
						<th
							class="p-2 text-center font-bold bg-[#ebebeb] text-xs text-gray-800 {idx <
							dayNamesVi.length - 1
								? 'border-r border-gray-200'
								: ''}"
						>
							{dayName}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each visibleTimeSlots as slot, slotIndex}
					<tr>
						<td
							class="p-2 border-r border-b border-gray-200 bg-[#bdbdbd] font-medium text-xs text-center text-black"
						>
							<div>Tiết {slot.id}</div>
							<div class="text-[10px] opacity-90">({slot.time})</div>
						</td>
						{#each dayNamesVi as dayName, dayIndex}
							{@const item = getItemForSlot(dayIndex, slotIndex)}
							{@const isFirstSlot = item && slotIndex === getSlotRange(item).startSlot}
							{#if isFirstSlot}
								{@const rowspan = getRowspan(item!)}
								<td
									class="p-0 align-middle bg-white relative group border-b border-gray-200 {dayIndex <
									dayNamesVi.length - 1
										? 'border-r'
										: ''}"
									{rowspan}
									role="gridcell"
									onmouseenter={() => (hoveredBaseCode = getBaseCode(item!.classCode))}
									onmouseleave={() => (hoveredBaseCode = null)}
								>
									{#if onRemove}
										<button
											type="button"
											class="absolute top-1 right-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
											class:opacity-100={hoveredBaseCode &&
												getBaseCode(item!.classCode) === hoveredBaseCode}
											onclick={() => onRemove(item!.id)}
											title="Xóa môn này"
										>
											<Trash2 size={16} />
										</button>
									{/if}
									<div
										class="p-1.5 flex flex-col items-center text-center h-full justify-center space-y-0.5"
									>
										<div class="text-[11px] text-gray-800 leading-tight">
											<span class="font-bold">{item!.classCode}</span> - {item!.courseName.split(
												' - '
											)[1] || item!.courseName}
										</div>
										<div class="font-bold text-gray-900 text-[11px] w-full">
											{item!.instructor}
										</div>
										<div class="text-gray-700 text-[11px]">
											{item!.room}
										</div>
										{#if item!.startDate && item!.endDate}
											<div class="text-gray-700 text-[10px] mt-0.5 whitespace-nowrap">
												BĐ: {item!.startDate} <br /> KT: {item!.endDate}
											</div>
										{/if}
									</div>
								</td>
							{:else if !item}
								<td
									class="p-0 bg-[#bdbdbd] border-b border-gray-200 {dayIndex < dayNamesVi.length - 1
										? 'border-r'
										: ''}"
								></td>
							{/if}
						{/each}
					</tr>
				{/each}

				{#if onlineItems.length > 0}
					<tr class="border-b border-gray-200">
						<td
							class="p-2 border-r border-gray-200 bg-[#bdbdbd] font-medium text-xs text-center text-black"
						>
							<div class="font-bold">Tiết *</div>
							<div class="text-[10px]">Online</div>
						</td>
						{#each dayNamesVi as _, dayIndex}
							{@const dayOnlineItems = onlineItems.filter((it) => it.day === dayIndex)}
							<td
								class="p-0 border-r border-gray-200 align-top {dayOnlineItems.length > 0
									? 'bg-white'
									: 'bg-[#bdbdbd]'} relative"
							>
								{#each dayOnlineItems as item}
									<div
										class="w-full py-3 border-b border-gray-100 last:border-b-0 flex flex-col items-center justify-center text-center relative group/item min-h-[80px] px-1 overflow-hidden"
										role="group"
										onmouseenter={() => (hoveredBaseCode = getBaseCode(item.classCode))}
										onmouseleave={() => (hoveredBaseCode = null)}
									>
										{#if onRemove}
											<button
												type="button"
												class="absolute top-1 right-1 text-red-500 hover:text-red-700 opacity-0 group-hover/item:opacity-100 transition-opacity z-10 cursor-pointer"
												class:opacity-100={hoveredBaseCode &&
													getBaseCode(item.classCode) === hoveredBaseCode}
												onclick={() => onRemove(item.id)}
												title="Xóa môn này"
											>
												<Trash2 size={14} />
											</button>
										{/if}
										<div class="flex flex-col gap-0.5 w-full">
											<div class="text-gray-800 font-bold text-[11px] leading-tight">
												{item.classCode} -
											</div>
											<div class="text-gray-800 text-[11px] leading-tight mb-1 line-clamp-2">
												{item.courseName}
											</div>
											<div class="text-gray-800 text-[11px] mb-1">*</div>
											{#if item.startDate && item.endDate}
												<div class="text-[#64748b] text-[10px] leading-tight whitespace-nowrap">
													BĐ: {item.startDate} <br /> KT: {item.endDate}
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</td>
						{/each}
					</tr>
				{/if}
			</tbody>
		</table>

		{#if bottomItems.length > 0}
			<div class="flex flex-col bg-white">
				{#each bottomItems as item}
					<div
						class="py-3 border-t border-gray-300 shadow-sm relative group flex flex-col items-center justify-center text-center px-4 overflow-hidden"
						role="group"
						onmouseenter={() => (hoveredBaseCode = getBaseCode(item.classCode))}
						onmouseleave={() => (hoveredBaseCode = null)}
					>
						{#if onRemove}
							<button
								type="button"
								class="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
								class:opacity-100={hoveredBaseCode &&
									getBaseCode(item.classCode) === hoveredBaseCode}
								onclick={() => onRemove(item.id)}
								title="Xóa môn này"
							>
								<Trash2 size={18} />
							</button>
						{/if}

						<div class="flex flex-col gap-0.5">
							<div class="text-[#1a1a1a] font-bold text-[11px] leading-tight">
								{item.classCode} -
							</div>
							<div class="text-[#1a1a1a] text-[11px] leading-tight mb-1 line-clamp-2">
								{item.courseName}
							</div>

							<div class="text-[#1a1a1a] text-[11px] mb-1">*</div>

							{#if item.startDate && item.endDate}
								<div class="text-[#64748b] text-[10px] whitespace-nowrap">
									BĐ: {item.startDate} — KT: {item.endDate}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
