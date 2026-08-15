<script lang="ts">
	import { BookOpen, ArrowUpRight } from 'lucide-svelte';

	interface Course {
		id: string;
		name: string;
		description: string;
		faculty?: string;
		tags?: string[];
	}

	interface Props {
		course: Course;
		index?: number;
		onSelect?: (course: Course) => void;
	}

	let { course, index = 0, onSelect }: Props = $props();

	const facultyColors: Record<string, { bg: string; text: string; name: string }> = {
		CS: { bg: '#DBEAFE', text: '#1E40AF', name: 'Khoa học Máy tính' },
		CE: { bg: '#FFEDD5', text: '#C2410C', name: 'Kỹ thuật Máy tính' },
		SE: { bg: '#DCFCE7', text: '#166534', name: 'Công nghệ Phần mềm' },
		IS: { bg: '#F3E8FF', text: '#6B21A8', name: 'Hệ thống Thông tin' },
		NT: { bg: '#CFFAFE', text: '#0E7490', name: 'Mạng máy tính' },
		DS: { bg: '#FCE7F3', text: '#9D174D', name: 'Khoa học Dữ liệu' },
		EC: { bg: '#FEF3C7', text: '#B45309', name: 'Thương mại Điện tử' },
		IT: { bg: '#E0E7FF', text: '#3730A3', name: 'CNTT Cơ sở' },
		IE: { bg: '#CCFBF1', text: '#0F766E', name: 'Kỹ thuật Thông tin' },
		MSIS: { bg: '#EDE9FE', text: '#5B21B6', name: 'HTTT Quản lý' },
		MA: { bg: '#FEE2E2', text: '#991B1B', name: 'Toán học' },
		MATH: { bg: '#FEE2E2', text: '#991B1B', name: 'Toán học' },
		PH: { bg: '#E0F2FE', text: '#0369A1', name: 'Vật lý' },
		PHYS: { bg: '#E0F2FE', text: '#0369A1', name: 'Vật lý' },
		ENG: { bg: '#FEF08A', text: '#854D0E', name: 'Ngoại ngữ' },
		ENGL: { bg: '#FEF08A', text: '#854D0E', name: 'Ngoại ngữ' },
		JAN: { bg: '#FFE4E6', text: '#9F1239', name: 'Tiếng Nhật' },
		SS: { bg: '#F1F5F9', text: '#334155', name: 'Khoa học Xã hội' },
		PE: { bg: '#D1FAE5', text: '#065F46', name: 'Giáo dục Thể chất' }
	};

	const facultyInfo = $derived(
		facultyColors[course.faculty || ''] || {
			bg: '#F3F4F6',
			text: '#1F2937',
			name: course.faculty || 'Môn học'
		}
	);

	const bgAccents = ['#88FFFF', '#FFB8E0', '#A5D8FF', '#FFE066', '#D0BFFF', '#96F2D7'];
	const iconBg = $derived(bgAccents[index % bgAccents.length]);
</script>

<div
	role="button"
	tabindex="0"
	onclick={() => onSelect?.(course)}
	onkeydown={(e) => e.key === 'Enter' && onSelect?.(course)}
	class="group text-left cursor-pointer transition-all duration-200 hover:-translate-y-1 active:translate-y-0 h-full flex flex-col focus:outline-none"
>
	<div
		class="relative rounded-2xl border-2 border-black bg-white overflow-hidden flex flex-col h-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow"
	>
		<!-- Top header -->
		<div class="p-4 pb-2 flex items-center justify-between gap-2 border-b border-gray-100">
			<div class="flex items-center gap-2">
				<div
					class="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0"
					style="background-color: {iconBg};"
				>
					<BookOpen size={14} class="text-black" />
				</div>
				<span class="font-black text-sm tracking-wider uppercase text-black font-mono">
					{course.id}
				</span>
			</div>

			<span
				class="text-[10px] font-bold px-2 py-0.5 rounded-full border border-black/20 shrink-0"
				style="background-color: {facultyInfo.bg}; color: {facultyInfo.text};"
			>
				{course.faculty || 'UIT'}
			</span>
		</div>

		<!-- Title & Summary -->
		<div class="p-4 flex-1 flex flex-col gap-2">
			<h3
				class="text-sm md:text-base font-black uppercase leading-tight text-black line-clamp-2"
				title={course.name}
			>
				{course.name}
			</h3>

			<p class="text-xs text-gray-600 font-medium leading-relaxed line-clamp-4 mt-1">
				{course.description || 'Chưa có tóm tắt chi tiết cho môn học này'}
			</p>
		</div>

		<!-- Footer -->
		<div class="p-4 pt-2 mt-auto border-t border-gray-100 flex items-center justify-between">
			<span class="text-[11px] font-bold text-gray-500 line-clamp-1">
				{facultyInfo.name}
			</span>
			<span
				class="text-[11px] font-bold text-black group-hover:underline flex items-center gap-0.5 shrink-0"
			>
				Chi tiết
				<ArrowUpRight size={14} />
			</span>
		</div>
	</div>
</div>
