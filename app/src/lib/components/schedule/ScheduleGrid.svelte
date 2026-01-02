<script lang="ts">
	import { dayNamesVi, timeSlots } from '$lib/constants';
	import type { ScheduleItem } from './Schedule.svelte';
	import { AlertTriangle } from 'lucide-svelte'; 

	interface Props {
		items: ScheduleItem[];
	}

	let { items }: Props = $props();

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
		const dayItems = items.filter((item) => item.day === day);

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
</script>

<div class="h-full w-full bg-white overflow-hidden">
	<div class="h-full overflow-hidden">
		<table class="w-full border-collapse" style="table-layout: fixed; width: 100%;">
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
				<tr class="border-b border-gray-300">
					<th
						class="p-2 text-center font-bold border-r border-gray-300 bg-[#ebebeb] text-xs text-gray-800"
					>
						Thứ / <br /> Tiết
					</th>
					{#each dayNamesVi as dayName}
						<th
							class="p-2 text-center font-bold border-r border-gray-300 last:border-r-0 bg-[#ebebeb] text-xs text-gray-800"
						>
							{dayName}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each timeSlots as slot, slotIndex}
					<tr class="border-b border-gray-200">
						<td
							class="p-2 border-r border-gray-300 bg-[#bdbdbd] font-medium text-xs text-center text-black"
						>
							<div>Tiết {slot.id}</div>
							<div class="text-[10px] opacity-90">({slot.time})</div>
						</td>
						{#each dayNamesVi as dayName, dayIndex}
							{@const item = getItemForSlot(dayIndex, slotIndex)}
							{@const isFirstSlot = item && slotIndex === getSlotRange(item).startSlot}
							{#if isFirstSlot}
								{@const rowspan = getRowspan(item!)}
								<td class="p-0 border-r border-gray-300 align-middle bg-white" {rowspan}>
									<div
										class="p-2 flex flex-col items-center text-center h-full justify-center space-y-0.5"
									>
										<div class="text-[11px] text-gray-800 leading-tight">
											<span class="font-bold">{item!.classCode}</span> - {item!.courseName.split(
												' - '
											)[1] || item!.courseName}
										</div>
										<div class="font-bold text-gray-900 text-xs">
											{item!.instructor}
										</div>
										<div class="text-gray-700 text-[11px]">
											{item!.room}
										</div>
										{#if item!.startDate && item!.endDate}
											<div class="text-gray-600 text-[10px]">
												BĐ: {item!.startDate}
											</div>
											<div class="text-gray-600 text-[10px]">
												KT: {item!.endDate}
											</div>
										{/if}
									</div>
								</td>
							{:else if !item}
								<td class="p-0 border-r border-gray-300 bg-[#bdbdbd]"></td>
							{/if}
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
