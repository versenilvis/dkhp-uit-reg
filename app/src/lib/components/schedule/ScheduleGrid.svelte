<script lang="ts">
	import { dayNamesVi, timeSlots } from '$lib/constants';
	import type { ScheduleItem } from './Schedule.svelte';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ArrowLeftRight from 'lucide-svelte/icons/arrow-left-right';
	import ScheduleCell from './ScheduleCell.svelte';

	interface Props {
		items: ScheduleItem[];
		onRemove?: (id: string) => void;
		onSwitch?: (id: string) => void;
		getSwitchInfo?: (id: string) => { nextCode: string; tooltip: string } | null;
		compact?: boolean;
	}

	let { items, onRemove, onSwitch, getSwitchInfo, compact = false }: Props = $props();

	let scheduledItems = $derived(items.filter((item) => item.day !== -1 && item.rawTiet !== '*'));
	let onlineItems = $derived(items.filter((item) => item.day !== -1 && item.rawTiet === '*'));
	let bottomItems = $derived(items.filter((item) => item.day === -1));

	let visibleTimeSlots = $derived.by(() => {
		const baseSlots = timeSlots.slice(0, 10);
		const hasEveningClasses = scheduledItems.some((item) => getSlotRange(item).endSlot >= 10);
		return hasEveningClasses ? timeSlots : baseSlots;
	});

	function getSlotRange(item: ScheduleItem): { startSlot: number; endSlot: number } {
		let startSlot = -1;
		let endSlot = -1;
		for (let i = 0; i < timeSlots.length; i++) {
			const slot = timeSlots[i];
			if (
				(item.startTime >= slot.start && item.startTime < slot.end) ||
				(item.endTime > slot.start && item.endTime <= slot.end) ||
				(item.startTime <= slot.start && item.endTime >= slot.end)
			) {
				if (startSlot === -1) startSlot = i;
				endSlot = i;
			}
		}
		return { startSlot, endSlot };
	}

	function getItemForSlot(dayIndex: number, slotIndex: number): ScheduleItem | null {
		return (
			scheduledItems.find((item) => {
				if (item.day !== dayIndex) return false;
				const range = getSlotRange(item);
				return slotIndex >= range.startSlot && slotIndex <= range.endSlot;
			}) || null
		);
	}

	function getRowspan(item: ScheduleItem): number {
		const range = getSlotRange(item);
		return range.endSlot - range.startSlot + 1;
	}

	let hoveredBaseCode = $state<string | null>(null);

	function getBaseCode(classCode: string): string {
		const parts = (classCode || '').trim().split('.');
		if (parts.length >= 3 && /^\d+$/.test(parts[parts.length - 1])) {
			return parts.slice(0, -1).join('.');
		}
		return (classCode || '').trim();
	}
</script>

<div
	class="schedule-scroll-container"
	style="height: 100%; width: 100%; background-color: #f3f4f6; overflow: auto;"
>
	<div
		data-schedule-capture
		style="min-height: 100%; width: 100%; min-width: 600px; display: flex; flex-direction: column; background-color: #f3f4f6;"
	>
		<table
			style="table-layout: fixed; width: 100%; flex: 1; border-collapse: separate; border-spacing: 0;"
		>
			<colgroup>
				<col style="width: 85px;" />
				{#each dayNamesVi as _}<col />{/each}
			</colgroup>
			<thead style="background-color: #f3f4f6; position: sticky; top: 0; z-index: 10;">
				<tr style="border-bottom: 1px solid #e5e7eb;">
					<th
						style="padding: 0.2rem 0.35rem; text-align: center; font-weight: bold; border-right: 1px solid #e5e7eb; background-color: #f3f4f6; font-size: 0.72rem; color: #1f2937; line-height: 1.15; vertical-align: middle;"
					>
						Thứ / Tiết
					</th>
					{#each dayNamesVi as dayName, idx}
						<th
							style="padding: 0.2rem 0.35rem; text-align: center; font-weight: bold; background-color: #f3f4f6; font-size: 0.72rem; color: #1f2937; line-height: 1.15; vertical-align: middle; {idx <
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
							style="padding: 0.15rem 0.25rem; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; background-color: #bdbdbd; font-weight: 600; font-size: 0.7rem; text-align: center; color: #111; line-height: 1.15; vertical-align: middle;"
						>
							<div style="margin-top: -2px;">
								<div>Tiết {slot.id}</div>
								<div
									style="font-size: 0.62rem; font-weight: 400; color: #374151; white-space: nowrap; margin-top: 1px;"
								>
									({slot.time})
								</div>
							</div>
						</td>
						{#each dayNamesVi as _, dayIndex}
							{@const item = getItemForSlot(dayIndex, slotIndex)}
							{@const isFirstSlot = item && slotIndex === getSlotRange(item).startSlot}
							{#if isFirstSlot}
								<ScheduleCell
									{item}
									rowspan={getRowspan(item!)}
									isLastDay={dayIndex === dayNamesVi.length - 1}
									{hoveredBaseCode}
									{getBaseCode}
									{onRemove}
									{onSwitch}
									{getSwitchInfo}
									onMouseEnter={() => (hoveredBaseCode = getBaseCode(item!.classCode))}
									onMouseLeave={() => (hoveredBaseCode = null)}
									{compact}
								/>
							{:else if !item}
								<td
									style="padding: 0; background-color: #bdbdbd; border-bottom: 1px solid #e5e7eb; vertical-align: middle; {dayIndex <
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
							style="padding: 0.3rem 0.25rem; border-right: 1px solid #e5e7eb; background-color: #bdbdbd; font-weight: 600; font-size: 0.72rem; text-align: center; color: #111; line-height: 1.15; vertical-align: middle;"
						>
							<div>
								<div>Tiết *</div>
								<div style="font-size: 0.62rem; color: #374151; margin-top: 1px;">Online</div>
							</div>
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
									{@const sInfo = getSwitchInfo ? getSwitchInfo(item.id) : null}
									<div
										style="width: 100%; padding: 0.75rem 0.25rem; border-bottom: 1px solid #f3f4f6; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; position: relative; min-height: 80px; overflow: hidden;"
										role="group"
										onmouseenter={() => (hoveredBaseCode = getBaseCode(item.classCode))}
										onmouseleave={() => (hoveredBaseCode = null)}
									>
										{#if onRemove || (onSwitch && sInfo)}
											<div
												class="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/90 backdrop-blur-xs rounded px-0.5 py-0.5 shadow-xs border border-gray-200"
												class:opacity-100={hoveredBaseCode &&
													getBaseCode(item.classCode) === hoveredBaseCode}
											>
												{#if onSwitch && sInfo}
													<button
														type="button"
														class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-0.5 rounded cursor-pointer transition-colors"
														onclick={(e) => {
															e.stopPropagation();
															onSwitch(item.id);
														}}
														title={sInfo.tooltip}
													>
														<ArrowLeftRight size={13} />
													</button>
												{/if}
												{#if onRemove}
													<button
														type="button"
														class="text-red-500 hover:text-red-700 hover:bg-red-50 p-0.5 rounded cursor-pointer transition-colors"
														onclick={(e) => {
															e.stopPropagation();
															onRemove(item.id);
														}}
														title="Xóa môn này"
													>
														<Trash2 size={13} />
													</button>
												{/if}
											</div>
										{/if}
										<div style="display: flex; flex-direction: column; gap: 0.25rem; width: 100%;">
											<div style="font-size: {compact ? '11px' : '14px'}; line-height: 1.25;">
												<div style="color: #1f2937; font-weight: bold;">{item.classCode} -</div>
												<div style="color: #4b5563;">
													{item.courseName.split(' - ')[1] || item.courseName}
												</div>
											</div>
											<div
												style="color: #1f2937; font-size: {compact
													? '11px'
													: '14px'}; line-height: 1.25;"
											>
												*
											</div>
											{#if item.startDate && item.endDate}
												<div
													style="color: #64748b; font-size: {compact
														? '10px'
														: '13px'}; line-height: 1.25; white-space: nowrap;"
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
			<div
				style="width: 100%; border-top: 2px solid #d1d5db; background-color: #ffffff;"
				class="shrink-0"
			>
				<div
					class="grid {bottomItems.length === 1
						? 'grid-cols-1'
						: bottomItems.length === 2
							? 'grid-cols-2'
							: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}"
				>
					{#each bottomItems as item}
						{@const sInfo = getSwitchInfo ? getSwitchInfo(item.id) : null}
						<div
							style="padding: 0.625rem 0.75rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; overflow: hidden; position: relative; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db;"
							class="hover:bg-gray-50/80 transition-colors"
							role="group"
							onmouseenter={() => (hoveredBaseCode = getBaseCode(item.classCode))}
							onmouseleave={() => (hoveredBaseCode = null)}
						>
							{#if onRemove || (onSwitch && sInfo)}
								<div
									class="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/90 backdrop-blur-xs rounded px-0.5 py-0.5 shadow-xs border border-gray-200"
									class:opacity-100={hoveredBaseCode &&
										getBaseCode(item.classCode) === hoveredBaseCode}
								>
									{#if onSwitch && sInfo}
										<button
											type="button"
											class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-0.5 rounded cursor-pointer transition-colors"
											onclick={(e) => {
												e.stopPropagation();
												onSwitch(item.id);
											}}
											title={sInfo.tooltip}
										>
											<ArrowLeftRight size={14} />
										</button>
									{/if}
									{#if onRemove}
										<button
											type="button"
											class="text-red-500 hover:text-red-700 hover:bg-red-50 p-0.5 rounded cursor-pointer transition-colors"
											onclick={(e) => {
												e.stopPropagation();
												onRemove(item.id);
											}}
											title="Xóa môn"
										>
											<Trash2 size={14} />
										</button>
									{/if}
								</div>
							{/if}

							<div style="display: flex; flex-direction: column; gap: 0.2rem; width: 100%;">
								<div
									style="font-size: {compact ? '11px' : '13px'}; line-height: 1.25;"
									class="w-full"
								>
									<div style="color: #1a1a1a; font-weight: bold; word-break: break-all;">
										{item.classCode} -
									</div>
									<div style="color: #4b5563; word-break: break-word; margin-top: 0.125rem;">
										{item.courseName.split(' - ')[1] || item.courseName}
									</div>
								</div>
								<div
									style="color: #1a1a1a; font-size: {compact ? '11px' : '13px'}; line-height: 1.2;"
								>
									*
								</div>
								{#if item.startDate && item.endDate}
									<div
										style="color: #64748b; font-size: {compact
											? '10px'
											: '11px'}; line-height: 1.2; white-space: nowrap;"
									>
										BĐ: {item.startDate} <br /> KT: {item.endDate}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
