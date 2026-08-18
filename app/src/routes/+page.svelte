<script lang="ts">
	import Upload from 'lucide-svelte/icons/upload';
	import FileText from 'lucide-svelte/icons/file-text';
	import CircleCheck from 'lucide-svelte/icons/circle-check';
	import Hash from 'lucide-svelte/icons/hash';
	import Clock from 'lucide-svelte/icons/clock';
	import Mail from 'lucide-svelte/icons/mail';
	import Bug from 'lucide-svelte/icons/bug';
	import { goto } from '$app/navigation';
	import { courseData, selectedCourseIds } from '$lib/stores';
	import { get } from 'svelte/store';
	import { getStartEndTime, getDayIndex } from '$lib/constants';
	import Magnet from '$lib/components/common/Magnet.svelte';
	import Star from '$lib/components/common/Star.svelte';
	import UploadingAnimation from '$lib/components/homepage/UploadingAnimation.svelte';
	import DataCard from '$lib/components/homepage/DataCard.svelte';
	import Background from '$lib/components/common/Background.svelte';
	import Rays from '$lib/components/common/Rays.svelte';
	import Button from '$lib/components/common/button.svelte';

	let preloadedFileSize: number | null = null;
	let preloadedUploadTime: string | null = null;

	if (typeof window !== 'undefined') {
		const savedFileSize = localStorage.getItem('dkhp_lastFileSize');
		const savedUploadTime = localStorage.getItem('dkhp_lastUploadTime');
		if (savedFileSize) {
			preloadedFileSize = parseInt(savedFileSize, 10);
		}
		if (savedUploadTime) {
			preloadedUploadTime = savedUploadTime;
		}
	}

	let file = $state<File | null>(null);
	let isDragging = $state(false);
	let isProcessing = $state(false);
	let uploadProgress = $state(0);
	let lastFileSize = $state<number | null>(preloadedFileSize);
	let lastUploadTime = $state<string | null>(preloadedUploadTime);

	let xlsxPromise: Promise<typeof import('xlsx')> | null = null;

	function loadXlsx() {
		if (!xlsxPromise) xlsxPromise = import('xlsx');
		return xlsxPromise;
	}

	function handleDrag(event: DragEvent) {
		event.preventDefault();
		if (event.type === 'dragover') loadXlsx();
		isDragging = event.type === 'dragover';
	}

	async function processFile(uploadedFile: File) {
		file = uploadedFile;
		isProcessing = true;
		uploadProgress = 0;

		try {
			const XLSX = await loadXlsx();

			const data = await uploadedFile.arrayBuffer();
			const workbook = XLSX.read(data);

			function formatExcelDate(val: any): string {
				if (!val) return '';
				if (typeof val === 'number' && val > 30000 && val < 60000) {
					const date = new Date(Math.round((val - 25569) * 86400 * 1000));
					if (!isNaN(date.getTime())) {
						const d = String(date.getUTCDate()).padStart(2, '0');
						const m = String(date.getUTCMonth() + 1).padStart(2, '0');
						const y = date.getUTCFullYear();
						return `${d}/${m}/${y}`;
					}
				}
				if (val instanceof Date) {
					const d = String(val.getDate()).padStart(2, '0');
					const m = String(val.getMonth() + 1).padStart(2, '0');
					const y = val.getFullYear();
					return `${d}/${m}/${y}`;
				}
				const str = String(val).trim();
				if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
					const [y, m, d] = str.split('T')[0].split('-');
					return `${d}/${m}/${y}`;
				}
				return str;
			}

			function parseSheet(sheetName: string, sheetIndex: number): any[] {
				const worksheet = workbook.Sheets[sheetName];
				if (!worksheet) return [];

				const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
				const sheetType = sheetName.toUpperCase().includes('TH') ? 'TH' : 'LT';

				let startColIdx = 19;
				let endColIdx = 20;
				let roomColIdx = 13;
				let tietColIdx = 11;
				let dayColIdx = 10;
				let instructorColIdx = 5;
				let creditsColIdx = 7;
				let courseNameColIdx = 3;
				let classCodeColIdx = 2;

				for (let r = 0; r < Math.min(10, rows.length); r++) {
					const headerRow = rows[r];
					if (!Array.isArray(headerRow)) continue;
					headerRow.forEach((cell, cIdx) => {
						const text = String(cell).toLowerCase().trim();
						if (
							text === 'nbd' ||
							text.includes('bắt đầu') ||
							text.includes('bat dau') ||
							text.includes('ngày bd') ||
							text.includes('ngày bđ')
						) {
							startColIdx = cIdx;
						} else if (
							text === 'nkt' ||
							text.includes('kết thúc') ||
							text.includes('ket thuc') ||
							text.includes('ngày kt')
						) {
							endColIdx = cIdx;
						} else if (text === 'phonghoc' || text.includes('phòng') || text.includes('phong')) {
							roomColIdx = cIdx;
						} else if (text === 'tiet' || text === 'tiết') {
							tietColIdx = cIdx;
						} else if (text === 'thu' || text === 'thứ') {
							dayColIdx = cIdx;
						} else if (
							text === 'tengv' ||
							text.includes('tên giảng viên') ||
							text.includes('ten giang vien') ||
							text.includes('cbgd')
						) {
							instructorColIdx = cIdx;
						} else if (
							text === 'malop' ||
							text === 'mã lớp' ||
							text === 'ma lop' ||
							text.includes('mã lớp học')
						) {
							classCodeColIdx = cIdx;
						} else if (
							text === 'tenmh' ||
							text.includes('tên môn') ||
							text.includes('ten mon') ||
							text.includes('tên mh')
						) {
							courseNameColIdx = cIdx;
						} else if (
							text === 'sotc' ||
							text.includes('stc') ||
							text.includes('tín chỉ') ||
							text.includes('tin chi') ||
							text === 'tc'
						) {
							creditsColIdx = cIdx;
						}
					});
				}

				return rows
					.filter((row) => typeof row[0] === 'number')
					.map((row, idx) => {
						const rawTiet = String(row[tietColIdx] || row[11] || '');
						const { startTime, endTime } = getStartEndTime(rawTiet);
						const day = getDayIndex(row[dayColIdx] || row[10]);

						const classCode = String(row[classCodeColIdx] || row[2] || '').trim();
						const cleanCode = classCode.replace(/[^a-zA-Z0-9]/g, '_');

						const startDate = formatExcelDate(row[startColIdx]);
						const endDate = formatExcelDate(row[endColIdx]);

						return {
							id: `${sheetType}-${sheetIndex}-${idx}-${cleanCode}`,
							courseName: String(row[courseNameColIdx] || row[3] || 'Chưa rõ tên'),
							classCode,
							day,
							startTime,
							endTime,
							rawTiet,
							room: String(row[roomColIdx] || row[13] || 'Trống'),
							instructor: String(row[instructorColIdx] || row[5] || '').trim(),
							credits: Number(row[creditsColIdx] || row[7]) || 0,
							startDate,
							endDate,
							type: sheetType
						};
					})
					.filter((c) => c.classCode);
			}

			let allCourses: any[] = [];
			workbook.SheetNames.forEach((name, idx) => {
				allCourses = [...allCourses, ...parseSheet(name, idx)];
			});

			const prevSelectedIds: string[] = get(selectedCourseIds);
			const prevCourses: any[] = get(courseData);

			const newDateByCode = new Map<string, { startDate: string; endDate: string }>();
			for (const c of allCourses) {
				if (c.classCode && (c.startDate || c.endDate)) {
					newDateByCode.set(c.classCode, {
						startDate: c.startDate || '',
						endDate: c.endDate || ''
					});
				}
			}
			const prevDateByCode = new Map<string, { startDate: string; endDate: string }>();
			for (const c of prevCourses) {
				if (c.classCode && (c.startDate || c.endDate)) {
					prevDateByCode.set(c.classCode, {
						startDate: c.startDate || '',
						endDate: c.endDate || ''
					});
				}
			}

			for (const c of allCourses) {
				if (!c.startDate && !c.endDate && prevDateByCode.has(c.classCode)) {
					const prev = prevDateByCode.get(c.classCode)!;
					c.startDate = prev.startDate;
					c.endDate = prev.endDate;
				}
			}

			const mergedPrevCourses = prevCourses.map((c: any) => {
				if (newDateByCode.has(c.classCode)) {
					const nd = newDateByCode.get(c.classCode)!;
					return {
						...c,
						startDate: nd.startDate || c.startDate || '',
						endDate: nd.endDate || c.endDate || ''
					};
				}
				return c;
			});

			const prevCodeSet = new Set(prevCourses.map((c: any) => c.classCode));
			for (const c of allCourses) {
				if (!prevCodeSet.has(c.classCode)) {
					mergedPrevCourses.push(c);
				}
			}

			const newIdByCode = new Map<string, string>(
				mergedPrevCourses.map((c: any) => [c.classCode, c.id])
			);
			const prevIdToCode = new Map<string, string>(
				prevCourses.map((c: any) => [c.id, c.classCode])
			);

			const restoredIds: string[] = [];
			for (const oldId of prevSelectedIds) {
				const classCode = prevIdToCode.get(oldId);
				if (classCode && newIdByCode.has(classCode)) {
					const newId = newIdByCode.get(classCode)!;
					if (!restoredIds.includes(newId)) restoredIds.push(newId);
				}
			}

			courseData.set(mergedPrevCourses);
			selectedCourseIds.set(restoredIds.length > 0 ? restoredIds : prevSelectedIds);

			uploadProgress = 100;
			lastFileSize = uploadedFile.size;
			lastUploadTime = formatDateTime(new Date());
			localStorage.setItem('dkhp_lastFileSize', lastFileSize.toString());
			localStorage.setItem('dkhp_lastUploadTime', lastUploadTime);

			await new Promise((r) => setTimeout(r, 300));
			goto('/tao-tkb');
		} catch (error: any) {
			console.error('Error processing file:', error);
			alert(error.message || 'Có lỗi xảy ra khi xử lý file.');
		} finally {
			isProcessing = false;
			uploadProgress = 0;
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;

		const uploadedFile = event.dataTransfer?.files?.[0];
		if (uploadedFile && /\.(xlsx|xls)$/i.test(uploadedFile.name)) {
			processFile(uploadedFile);
		}
	}

	function handleFileInput(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files?.[0]) {
			processFile(target.files[0]);
		}
	}

	function getSemesterInfo() {
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth() + 1; // 1-12
		const currentDay = now.getDate();

		let currentSemester: number;
		let currentSchoolYear: string;

		if (currentMonth < 8 || (currentMonth === 8 && currentDay < 15)) {
			currentSemester = 2;
			currentSchoolYear = `${currentYear - 1}-${currentYear}`;
		} else if (
			(currentMonth === 8 && currentDay >= 15) ||
			(currentMonth > 8 && currentMonth < 12) ||
			(currentMonth === 12 && currentDay < 15)
		) {
			currentSemester = 1;
			currentSchoolYear = `${currentYear}-${currentYear + 1}`;
		} else {
			currentSemester = 2;
			currentSchoolYear = `${currentYear}-${currentYear + 1}`;
		}

		return { semester: currentSemester, schoolYear: currentSchoolYear };
	}

	const { semester, schoolYear } = getSemesterInfo();

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

	const cornerStars = [
		{ size: Math.floor(Math.random() * 30) + 100, rotation: Math.floor(Math.random() * 360) }, // 50-80px
		{ size: Math.floor(Math.random() * 30) + 50, rotation: Math.floor(Math.random() * 360) },
		{ size: Math.floor(Math.random() * 30) + 70, rotation: Math.floor(Math.random() * 360) },
		{ size: Math.floor(Math.random() * 30) + 30, rotation: Math.floor(Math.random() * 360) }
	];
</script>

<svelte:head>
	<title>DKHP v2 - Tool đăng ký học phần và xếp TKB UIT tự động (UIT REG)</title>
	<meta
		name="description"
		content="DKHP v2 (dkhpv2 / UIT REG) - Công cụ đăng ký học phần UIT thông minh. Upload file TKB Excel, tự động xếp lịch không trùng, tra cứu môn học và sinh script đăng ký học phần siêu tốc."
	/>
	<meta
		name="keywords"
		content="dkhp, dkhp v2, dkhpv2, dang ky hoc phan, đăng ký học phần, dkhp uit, dkhpuit, dkhp v2 uit, tool dkhp, tool dang ky hoc phan, xep thoi khoa bieu uit, UIT REG"
	/>
	<meta
		property="og:title"
		content="DKHP v2 - Tool đăng ký học phần và xếp TKB UIT tự động (UIT REG)"
	/>
	<meta
		property="og:description"
		content="DKHP v2 (dkhpv2 / UIT REG) - Công cụ đăng ký học phần UIT thông minh. Upload file TKB Excel, tự động xếp lịch không trùng, tra cứu môn học và sinh script đăng ký học phần siêu tốc."
	/>
</svelte:head>

<div
	class="relative h-screen w-full bg-primary text-[#111] font-sans overflow-hidden flex flex-col selection:bg-black selection:text-white"
	style="font-family: Inter, sans-serif;"
>
	<Background />

	<main class="flex-1 flex overflow-hidden">
		<!-- Left -->
		<div class="w-112.5 p-12 flex flex-col justify-between overflow-y-auto">
			<div>
				<div class="relative inline-block mb-6">
					<Rays />
					<h1
						id="upload-box-title"
						class="text-[52px] text-white leading-[1.1] font-bold tracking-tight uppercase italic drop-shadow-[0_4px_0_rgba(17,17,17,0.9)]"
						style="
							font-family: 'WiseSans-Heavy', sans-serif;
							-webkit-text-stroke: 2px #111;
							text-stroke: 2px #111;
							text-shadow:
								2px 0 0 #111,
								-2px 0 0 #111,
								0 2px 0 #111,
								0 -2px 0 #111,
								1px 1px 0 #111,
								-1px -1px 0 #111,
								1px -1px 0 #111,
								-1px 1px 0 #111;
						"
					>
						ĐĂNG KÝ HỌC PHẦN - UIT REG
					</h1>
					<div
						class="absolute px-2 py-1 bg-red-500 border-2 border-black rounded-lg"
						style="border-radius: 8px; transform: rotate(20deg); top: -10px; right: 10px; font-family: 'Boldonse', sans-serif;"
					>
						<span class="text-white text-[15px] font-bold uppercase">Alpha version</span>
					</div>
				</div>
				<p class="text-sm max-w-[320px]">
					Tự động hóa việc đăng ký học phần chưa bao giờ dễ dàng đến vậy
				</p>
				<div class="space-y-6 mt-10">
					<div class="flex items-start space-x-4">
						<div
							class="mt-1 w-6 h-6 flex items-center justify-center
             border border-black rounded-md
             text-[11px] font-bold italic shrink-0"
						>
							01
						</div>
						<div>
							<h3 class="text-[12px] font-bold uppercase tracking-wider mb-1">Tải lên dữ liệu</h3>
							<p class="text-[12px] text-gray-700 leading-relaxed max-w-75">
								Hệ thống sẽ xử lí và tạo bảng giúp bạn chọn và tạo thời khóa biểu
							</p>
						</div>
					</div>

					<div class="flex items-start space-x-4">
						<div
							class="mt-1 w-6 h-6 flex items-center justify-center
             border border-black rounded-md
             text-[11px] font-bold italic shrink-0"
						>
							02
						</div>
						<div>
							<h3 class="text-[12px] font-bold uppercase tracking-wider mb-1">
								Tạo thời khóa biểu theo ý bạn
							</h3>
							<p class="text-[12px] text-gray-700 leading-relaxed max-w-75">
								Kiểm tra trùng lịch, bộ lọc và số tín chỉ tối đa cho phép
							</p>
						</div>
					</div>
					<div class="flex items-start space-x-4">
						<div
							class="mt-1 w-6 h-6 flex items-center justify-center
             border border-black rounded-md
             text-[11px] font-bold italic shrink-0"
						>
							03
						</div>
						<div>
							<h3 class="text-[12px] font-bold uppercase tracking-wider mb-1">
								Đăng ký tự động với tool
							</h3>
							<p class="text-[12px] text-gray-700 leading-relaxed max-w-75">
								Chỉ cần dán script vào console và hãy để tool tự lo mọi thứ cho bạn
							</p>
						</div>
					</div>
				</div>
			</div>

			<div class="mb-16 pt-2">
				<div class="relative z-30 enter-rise">
					<DataCard fileSize={lastFileSize} {lastUploadTime} />
				</div>
			</div>
		</div>

		<!-- Right -->
		<div
			class="relative flex-1 bg-primary p-12 flex items-center justify-center"
			id="right-section"
		>
			<div class="absolute top-8 left-8 twinkle1">
				<Star size={cornerStars[0].size} rotation={cornerStars[0].rotation} class="twinkle1" />
			</div>
			<div class="absolute top-8 right-8 twinkle2">
				<Star size={cornerStars[1].size} rotation={cornerStars[1].rotation} class="twinkle2" />
			</div>
			<div class="absolute bottom-8 left-8 twinkle3">
				<Star size={cornerStars[2].size} rotation={cornerStars[2].rotation} class="twinkle3" />
			</div>
			<div class="absolute bottom-8 right-8 twinkle4">
				<Star size={cornerStars[3].size} rotation={cornerStars[3].rotation} class="twinkle4" />
			</div>

			<div class="relative w-full max-w-2xl">
				<div
					id="upload-box"
					role="button"
					tabindex="0"
					aria-label="Upload Excel file"
					class={`w-full aspect-[1.5/1] bg-white rounded-3xl border-2 border-black transition-all duration-400 ease-in-out flex flex-col overflow-hidden enter-rise-rotated
          ${isDragging ? 'border-blue-500 ring-4 ring-blue-50' : 'border border-black'}`}
					style="transform: rotate(2deg);"
					ondragover={handleDrag}
					ondragleave={handleDrag}
					ondrop={handleDrop}
					onmouseenter={loadXlsx}
					onfocusin={loadXlsx}
				>
					<div
						class="h-12 px-6 border-b border-gray-100 flex items-center justify-between shrink-0"
						style="box-shadow: 0 1px 4px 0 rgba(0,0,0,0.06);"
					>
						<div class="flex space-x-1.5">
							<div class="w-2.5 h-2.5 rounded-full bg-red-300"></div>
							<div class="w-2.5 h-2.5 rounded-full bg-yellow-300"></div>
							<div class="w-2.5 h-2.5 rounded-full bg-green-300"></div>
						</div>

						<span class="text-[9px] font-mono text-gray-500 uppercase">
							TKB_DỰ_KIẾN_HK{semester}_{schoolYear}.xlsx
						</span>
					</div>

					<div class="flex-1 flex items-center justify-center p-8">
						<input
							id="file-input"
							type="file"
							class="hidden"
							accept=".xlsx,.xls"
							onchange={handleFileInput}
						/>

						{#if !file}
							<label for="file-input" class="flex flex-col items-center text-center">
								<Magnet padding={30} magnetStrength={5}>
									<div
										class="w-16 h-16 cursor-pointer border-2 border-dashed border-black rounded-lg flex items-center justify-center mb-6
           hover:border-primary hover:scale-110 transition-all duration-300 group"
									>
										<Upload
											size={24}
											strokeWidth={1.5}
											class="group-hover:text-primary transition-colors"
										/>
									</div>
								</Magnet>
								<h3 class="text-xl font-bold uppercase italic mb-2">Thả file excel vào đây</h3>
								<p class="text-gray-400 text-[11px] font-medium max-w-45 mb-8 leading-tight">
									Hỗ trợ tệp tin định dạng .xlsx, .xls tối đa 10MB.
								</p>
							</label>
						{:else if isProcessing}
							<div class="flex flex-col items-center justify-center py-12">
								<div class="mb-6">
									<UploadingAnimation progress={uploadProgress} />
								</div>
								<div class="text-center space-y-2">
									<p class="text-sm font-bold uppercase italic text-gray-900">
										{file.name}
									</p>
									<div class="flex items-center justify-center gap-2 text-xs">
										<span class="text-gray-500">
											{(file.size / 1024).toFixed(1)} KB
										</span>
										<span class="font-medium text-blue-500">
											{Math.round(uploadProgress)}%
										</span>
									</div>
								</div>
							</div>
						{:else}
							<div class="max-w-sm w-full">
								<div class="bg-gray-50 p-6 rounded-2xl border mb-6">
									<div class="flex items-center space-x-4">
										<FileText size={20} class="text-green-600" />
										<div class="flex-1">
											<p class="text-sm font-bold truncate uppercase italic">{file.name}</p>
											<p class="text-[10px] text-gray-400 font-mono">
												{(file.size / 1024).toFixed(1)} KB
											</p>
										</div>
										<CircleCheck size={18} class="text-green-500" />
									</div>
								</div>
								<button
									class="w-full py-4 border text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-50 transition-colors"
									onclick={() => {
										file = null;
										isProcessing = false;
										uploadProgress = 0;
									}}
								>
									Upload file khác
								</button>
							</div>
						{/if}
					</div>

					<div
						class="bg-gray-100 px-6 py-4 border-t text-[9px] font-bold text-gray-500 uppercase tracking-widest flex justify-between"
					>
						<span class="flex items-center space-x-1">
							<Hash size={10} />
							<span>SHA-256 Verified</span>
						</span>
						<span class="flex items-center space-x-1" id="dkhp-uit-edu-vn">
							<svg
								width="13"
								height="13"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								class="mx-1"
								style="vertical-align:-2px;"
							>
								<path
									d="M8 14S2 10 2 6.5C2 4.5 3.5 3 5.25 3C6.38 3 7.44 3.74 7.88 4.81C8.32 3.74 9.38 3 10.5 3C12.25 3 13.75 4.5 13.75 6.5C13.75 10 8 14 8 14Z"
									fill="#ef4444"
									stroke="black"
									stroke-width="1"
								/>
							</svg>
							DKHP.UIT.EDU.VN
						</span>
					</div>
				</div>
			</div>
		</div>
		<div class="absolute bottom-0 left-0 right-0 h-20 overflow-hidden pointer-events-none z-20">
			<svg
				class="w-full h-full"
				viewBox="0 0 1440 80"
				preserveAspectRatio="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path d="M0,0 Q720,40 1440,0 L1440,80 L0,80 Z" fill="#000" opacity="1" />
			</svg>
		</div>
	</main>

	<footer
		class="relative h-10 px-6
         flex items-center justify-between
         shrink-0 bg-primary z-30"
	>
		<div class="flex items-center space-x-6 pb-6 text-lg">
			<a
				href="https://github.com/versenilvis/dkhp-uit-reg"
				target="_blank"
				class="text-gray-400 hover:text-white transition-colors"
				title="GitHub"
			>
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path
						d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
					/>
					<path d="M9 18c-4.51 2-5-2-7-2" />
				</svg>
			</a>
			<a
				href="https://www.facebook.com/t.hoang0901"
				target="_blank"
				class="text-gray-400 hover:text-blue-500 transition-colors"
				title="Facebook"
			>
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
				</svg>
			</a>
			<a
				href="mailto:versedev.store@proton.me"
				class="text-gray-400 hover:text-purple-500 transition-colors"
				title="Email"
			>
				<Mail size={22} />
			</a>
			<button
				type="button"
				class="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
				aria-label="Báo lỗi"
				title="Báo lỗi"
			>
				<a href="https://github.com/versenilvis/dkhp-uit-reg/issues/new" target="_blank">
					<Bug size={22} color="#ef4444" />
				</a>
			</button>
		</div>

		<div
			class="flex items-center space-x-1 pb-6
           text-[9px] text-gray-400 font-bold uppercase tracking-wider"
		>
			<Clock size={10} />
			<span class="ml-1">Đăng ký học phần học kỳ {semester} ({schoolYear})</span>
		</div>
	</footer>
</div>

<style>
	@keyframes enter-rise {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes enter-rise-rotated {
		from {
			opacity: 0;
			transform: rotate(2deg) translateY(16px);
		}
		to {
			opacity: 1;
			transform: rotate(2deg) translateY(0);
		}
	}

	.enter-rise {
		animation: enter-rise 400ms ease-in-out 100ms both;
	}

	.enter-rise-rotated {
		animation: enter-rise-rotated 400ms ease-in-out 100ms both;
	}

	@media (prefers-reduced-motion: reduce) {
		.enter-rise,
		.enter-rise-rotated {
			animation: none;
		}
	}
</style>
