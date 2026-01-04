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

<div style="height: 100%; width: 100%; background-color: #f3f4f6; overflow: auto;">
	<div style="min-height: 100%;">
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
			<thead style="background-color: #f3f4f6; position: sticky; top: 0; z-index: 10;">
				<tr style="border-bottom: 1px solid #e5e7eb;">
					<th
						style="padding: 0.5rem; text-align: center; font-weight: bold; border-right: 1px solid #e5e7eb; background-color: #f3f4f6; font-size: 0.75rem; color: #1f2937;"
					>
						Thứ / <br /> Tiết
					</th>
					{#each dayNamesVi as dayName, idx}
						<th
							style="padding: 0.5rem; text-align: center; font-weight: bold; background-color: #f3f4f6; font-size: 0.75rem; color: #1f2937; {idx <
							dayNamesVi.length - 1
								? 'border-right: 1px solid #e5e7eb;'
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
							style="padding: 0.5rem; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; background-color: #bdbdbd; font-weight: 500; font-size: 0.75rem; text-align: center; color: #000000;"
						>
							<div>Tiết {slot.id}</div>
							<div style="font-size: 10px; opacity: 0.9;">({slot.time})</div>
						</td>
						{#each dayNamesVi as dayName, dayIndex}
							{@const item = getItemForSlot(dayIndex, slotIndex)}
							{@const isFirstSlot = item && slotIndex === getSlotRange(item).startSlot}
							{#if isFirstSlot}
								{@const rowspan = getRowspan(item!)}
								<td
									style="padding: 0; vertical-align: middle; background-color: #ffffff; position: relative; border-bottom: 1px solid #e5e7eb; {dayIndex <
									dayNamesVi.length - 1
										? 'border-right: 1px solid #e5e7eb;'
										: ''}"
									{rowspan}
									role="gridcell"
									onmouseenter={() => (hoveredBaseCode = getBaseCode(item!.classCode))}
									onmouseleave={() => (hoveredBaseCode = null)}
									class="group"
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
										<div style="font-size: 11px; color: #1f2937; line-height: 1.25;">
											<span style="font-weight: bold;">{item!.classCode}</span> - {item!.courseName.split(
												' - '
											)[1] || item!.courseName}
										</div>
										<div style="font-weight: bold; color: #111827; font-size: 11px; width: 100%;">
											{item!.instructor}
										</div>
										<div style="color: #374151; font-size: 11px;">
											{item!.room}
										</div>
										{#if item!.startDate && item!.endDate}
											<div
												style="color: #374151; font-size: 10px; margin-top: 0.125rem; white-space: nowrap;"
											>
												BĐ: {item!.startDate} <br /> KT: {item!.endDate}
											</div>
										{/if}
									</div>
								</td>
							{:else if !item}
								<td
									style="padding: 0; background-color: #bdbdbd; border-bottom: 1px solid #e5e7eb; {dayIndex <
									dayNamesVi.length - 1
										? 'border-right: 1px solid #e5e7eb;'
										: ''}"
								></td>
							{/if}
						{/each}
					</tr>
				{/each}

				{#if onlineItems.length > 0}
					<tr style="border-bottom: 1px solid #e5e7eb;">
						<td
							class="p-2 bg-[#bdbdbd] font-medium text-xs text-center text-black"
							style="border-right: 1px solid #e5e7eb;"
						>
							<div class="font-bold">Tiết *</div>
							<div class="text-[10px]">Online</div>
						</td>
						{#each dayNamesVi as _, dayIndex}
							{@const dayOnlineItems = onlineItems.filter((it) => it.day === dayIndex)}
							<td
								style="padding: 0; vertical-align: top; {dayIndex < dayNamesVi.length - 1
									? 'border-right: 1px solid #e5e7eb;'
									: ''} {dayOnlineItems.length > 0
									? 'background-color: #ffffff;'
									: 'background-color: #bdbdbd;'} position: relative;"
							>
								{#each dayOnlineItems as item}
									<div
										style="width: 100%; padding-top: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid #f3f4f6; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; position: relative; min-height: 80px; padding-left: 0.25rem; padding-right: 0.25rem; overflow: hidden;"
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
										<div style="display: flex; flex-direction: column; gap: 0.125rem; width: 100%;">
											<div
												style="color: #1f2937; font-weight: bold; font-size: 11px; line-height: 1.25;"
											>
												{item.classCode} -
											</div>
											<div
												style="color: #1f2937; font-size: 11px; line-height: 1.25; margin-bottom: 0.25rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"
											>
												{item.courseName}
											</div>
											<div style="color: #1f2937; font-size: 11px; margin-bottom: 0.25rem;">*</div>
											{#if item.startDate && item.endDate}
												<div
													style="color: #64748b; font-size: 10px; line-height: 1.25; white-space: nowrap;"
												>
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
			<div style="display: flex; flex-direction: column; background-color: #ffffff;">
				{#each bottomItems as item}
					<div
						style="padding-top: 0.75rem; padding-bottom: 0.75rem; border-top: 1px solid #d1d5db; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding-left: 1rem; padding-right: 1rem; overflow: hidden; position: relative;"
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
