<script lang="ts">
	import type { ScheduleItem } from './Schedule.svelte';
	import Trash2 from 'lucide-svelte/icons/trash-2';

	interface Props {
		item: ScheduleItem;
		rowspan: number;
		isLastDay: boolean;
		hoveredBaseCode: string | null;
		getBaseCode: (code: string) => string;
		onRemove?: (id: string) => void;
		onMouseEnter: () => void;
		onMouseLeave: () => void;
		compact?: boolean;
	}

	let {
		item,
		rowspan,
		isLastDay,
		hoveredBaseCode,
		getBaseCode,
		onRemove,
		onMouseEnter,
		onMouseLeave,
		compact = false
	}: Props = $props();
</script>

<td
	style="padding: 0.5rem 0.25rem; vertical-align: middle; text-align: center; background-color: #ffffff; position: relative; border-bottom: 1px solid #e5e7eb; {!isLastDay
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
	<div
		style="font-size: {compact
			? '11px'
			: '12px'}; color: #1f2937; line-height: 1.35; text-align: center; width: 100%;"
	>
		<div style="font-weight: 700; color: #111827; word-break: break-all;">
			{item.classCode} -
		</div>
		<div style="color: #4b5563; word-break: break-word; margin-top: 1px;">
			{item.courseName.split(' - ')[1] || item.courseName}
		</div>
		<div style="font-weight: 700; color: #111827; margin-top: 2px; word-break: break-word;">
			{item.instructor}
		</div>
		<div
			style="color: #374151; font-size: {compact
				? '10px'
				: '11.5px'}; margin-top: 1px; word-break: break-all;"
		>
			{item.room}
		</div>
		{#if item.startDate && item.endDate}
			<div
				style="color: #64748b; font-size: {compact
					? '9px'
					: '10.5px'}; margin-top: 2px; line-height: 1.25; white-space: nowrap;"
			>
				BĐ: {item.startDate} <br /> KT: {item.endDate}
			</div>
		{/if}
	</div>
</td>
