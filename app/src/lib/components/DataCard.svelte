<script lang="ts">
	import { Database } from 'lucide-svelte';

	interface Props {
		fileSize?: number | null; // File size in bytes
		lastUploadTime?: string | null; // Last upload time string
		title?: string;
		subtitle?: string;
		className?: string;
	}

	function formatDateTime(date: Date = new Date()): string {
		const hours = date.getHours();
		const minutes = date.getMinutes();
		const day = date.getDate();
		const month = date.getMonth() + 1;
		const year = date.getFullYear();

		const ampm = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		const displayMinutes = minutes.toString().padStart(2, '0');

		return `${displayHours}:${displayMinutes} ${ampm} ${day}/${month}/${year}`;
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	let {
		fileSize = null,
		lastUploadTime = null,
		title = 'Dữ liệu hiện tại',
		subtitle,
		className = ''
	}: Props = $props();

	const displayAmount = $derived(fileSize ? formatBytes(fileSize) : '???KB');
	const displaySubtitle = $derived(subtitle ?? lastUploadTime ?? formatDateTime());
</script>

<div class="relative {className}" style="transform: rotate(-2deg);">
	<!-- Border wrapper bên ngoài -->
	<div class="rounded-3xl border-2 border-black">
		<!-- Card -->
		<div
			class="relative p-6 overflow-hidden rounded-3xl"
			style="border-radius: 23px; border-top: 5px solid white; background: linear-gradient(180deg, #88FFFF 0%, #88FFFF 10%, #44E1C6 10%, #44E1C6 100%);"
		>
			<!-- Content -->
			<div class="relative z-10">
				<!-- Title -->
				<div class="mb-4">
					<p class="text-black text-xs font-bold uppercase tracking-wide">{title}</p>
					<p class="text-black text-[10px] font-medium">{displaySubtitle}</p>
				</div>

				<!-- Amount (Large text) -->
				<div class="mb-4">
					<p
						class="text-4xl font-black uppercase tracking-tight"
						style="color: #C0C0C0; text-shadow: 2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000;"
					>
						{displayAmount}
					</p>
				</div>

				<!-- Icon and DATA text -->
				<div class="absolute top-3 right-8 flex flex-col items-end">
					<Database size={48} class="mr-1 text-black" />
					<span class="text-black text-lg font-bold uppercase">DATA</span>
				</div>
			</div>
		</div>
	</div>
</div>
