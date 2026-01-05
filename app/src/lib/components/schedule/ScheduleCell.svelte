<script lang="ts">
	import type { ScheduleItem } from './Schedule.svelte';
	import { Trash2 } from 'lucide-svelte';

	interface Props {
		item: ScheduleItem;
		rowspan: number;
		dayIndex: number;
		isLastDay: boolean;
		hoveredBaseCode: string | null;
		getBaseCode: (code: string) => string;
		onRemove?: (id: string) => void;
		onMouseEnter: () => void;
		onMouseLeave: () => void;
	}

	let {
		item,
		rowspan,
		dayIndex,
		isLastDay,
		hoveredBaseCode,
		getBaseCode,
		onRemove,
		onMouseEnter,
		onMouseLeave
	} = $props();
</script>

<td
	style="padding: 0; vertical-align: middle; background-color: #ffffff; position: relative; border-bottom: 1px solid #e5e7eb; {!isLastDay
		? 'border-right: 1px solid #e5e7eb;'
		: ''}"
	{rowspan}
	role="gridcell"
	onmouseenter={onMouseEnter}
	onmouseleave={onMouseLeave}
	class="group"
>
	{#if onRemove}
		<button
			type="button"
			class="absolute top-1 right-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
			class:opacity-100={hoveredBaseCode && getBaseCode(item.classCode) === hoveredBaseCode}
			onclick={() => onRemove(item.id)}
			title="Xóa môn này"
		>
			<Trash2 size={16} />
		</button>
	{/if}
	<div class="p-1.5 flex flex-col items-center text-center h-full justify-center space-y-0.5">
		<div style="font-size: 14px; color: #1f2937; line-height: 1.25;">
			<span style="font-weight: bold;">{item.classCode}</span> - {item.courseName.split(' - ')[1] ||
				item.courseName}
		</div>
		<div style="font-weight: bold; color: #111827; font-size: 14px; width: 100%;">
			{item.instructor}
		</div>
		<div style="color: #374151; font-size: 14px;">
			{item.room}
		</div>
		{#if item.startDate && item.endDate}
			<div style="color: #374151; font-size: 14px; margin-top: 0.125rem; white-space: nowrap;">
				BĐ: {item.startDate} <br /> KT: {item.endDate}
			</div>
		{/if}
	</div>
</td>
