<script lang="ts">
	import { MapPin, User } from 'lucide-svelte';

	export type ScheduleItem = {
		id: string;
		courseName: string;
		classCode: string;
		day: number; 
		startTime: string; 
		endTime: string; 
		room: string;
		instructor: string;
		startDate?: string; 
		endDate?: string; 
		color?: string;
	};

	interface Props {
		items: ScheduleItem[];
	}

	let { items }: Props = $props();

	const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const dayNamesVi = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

	let itemsByDay = $derived.by(() => {
		const grouped: Record<number, ScheduleItem[]> = {};
		items.forEach((item) => {
			if (!grouped[item.day]) {
				grouped[item.day] = [];
			}
			grouped[item.day].push(item);
		});
		Object.keys(grouped).forEach((day) => {
			grouped[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
		});
		return grouped;
	});

	function getCourseColor(courseName: string, index: number): string {
		const colors = [
			'bg-blue-500',
			'bg-cyan-500',
			'bg-purple-500',
			'bg-pink-500',
			'bg-orange-500',
			'bg-green-500',
			'bg-yellow-500',
			'bg-red-500'
		];
		return colors[index % colors.length];
	}
</script>

<!-- Mobile View: List by Day -->
<div class="block md:hidden space-y-6">
	{#each dayNames as dayName, dayIndex}
		{@const dayItems = itemsByDay[dayIndex] || []}
		{#if dayItems.length > 0}
			<div class="space-y-3">
				<h2 class="text-2xl font-bold text-white uppercase">{dayName}</h2>
				<div class="space-y-3">
					{#each dayItems as item, idx}
						<div
							class="bg-gray-800 rounded-lg p-4 border-l-4 {getCourseColor(item.courseName, idx)}"
						>
							<div class="flex items-start justify-between mb-2">
								<span class="text-white/80 text-sm font-medium">
									{item.startTime} - {item.endTime}
								</span>
								<span class="text-white/60 text-xs">{item.classCode}</span>
							</div>
							<h3 class="text-white font-bold text-lg uppercase mb-3">{item.courseName}</h3>
							<div class="space-y-2">
								<div class="flex items-center gap-2 text-white/70 text-sm">
									<MapPin size={14} />
									<span>Room: {item.room}</span>
								</div>
								<div class="flex items-center gap-2 text-white/70 text-sm">
									<User size={14} />
									<span>Prof. {item.instructor}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>

<!-- Desktop View: Grid Table -->
<div class="hidden md:block">
	<div class="bg-white rounded-lg border-2 border-black overflow-hidden">
		<table class="w-full border-collapse">
			<thead>
				<tr class="bg-gray-100 border-b-2 border-black">
					<th class="p-3 text-left font-bold border-r border-gray-300">Thứ</th>
					<th class="p-3 text-left font-bold border-r border-gray-300">Tiết</th>
					<th class="p-3 text-left font-bold border-r border-gray-300">Môn học</th>
					<th class="p-3 text-left font-bold border-r border-gray-300">Mã lớp</th>
					<th class="p-3 text-left font-bold border-r border-gray-300">Phòng</th>
					<th class="p-3 text-left font-bold">Giảng viên</th>
				</tr>
			</thead>
			<tbody>
				{#each dayNamesVi as dayName, dayIndex}
					{@const dayItems = itemsByDay[dayIndex] || []}
					{#if dayItems.length > 0}
						{#each dayItems as item, idx}
							<tr class="border-b border-gray-200 hover:bg-gray-50">
								{#if idx === 0}
									<td class="p-3 border-r border-gray-300 font-medium" rowspan={dayItems.length}>
										{dayName}
									</td>
								{/if}
								<td class="p-3 border-r border-gray-300">
									{item.startTime} - {item.endTime}
								</td>
								<td class="p-3 border-r border-gray-300 font-semibold">{item.courseName}</td>
								<td class="p-3 border-r border-gray-300 text-sm">{item.classCode}</td>
								<td class="p-3 border-r border-gray-300">{item.room}</td>
								<td class="p-3">Prof. {item.instructor}</td>
							</tr>
						{/each}
					{:else}
						<tr class="border-b border-gray-200">
							<td class="p-3 border-r border-gray-300 font-medium">{dayName}</td>
							<td colspan="5" class="p-3 text-center text-gray-400">Không có lịch</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
</div>
