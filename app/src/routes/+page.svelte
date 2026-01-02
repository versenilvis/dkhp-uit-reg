<script lang="ts">
	import {
		Upload,
		FileText,
		CircleCheck,
		Hash,
		Clock,
		Github,
		Facebook,
		Mail,
		Bug
	} from 'lucide-svelte';
	import * as XLSX from 'xlsx';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { courseData } from '$lib/stores';
	import { getStartEndTime, getDayIndex } from '$lib/constants';
	import Magnet from '$lib/components/Magnet.svelte';
	import Star from '$lib/components/Star.svelte';
	import UploadingAnimation from '$lib/components/UploadingAnimation.svelte';
	import DataCard from '$lib/components/DataCard.svelte';
	import Background from '$lib/components/Background.svelte';
	import Rays from '$lib/components/Rays.svelte';
	import Button from '$lib/components/ui/button.svelte';

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
	let showUploadBox = $state(false);

	$effect(() => {
		setTimeout(() => {
			showUploadBox = true;
		}, 100);
	});
	let lastFileSize = $state<number | null>(preloadedFileSize);
	let lastUploadTime = $state<string | null>(preloadedUploadTime);
	let showDataCard = $state(false);

	$effect(() => {
		setTimeout(() => {
			showDataCard = true;
		}, 100);
	});

	function handleDrag(event: DragEvent) {
		event.preventDefault();
		isDragging = event.type === 'dragover';
	}

	async function processFile(uploadedFile: File) {
		file = uploadedFile;
		isProcessing = true;
		uploadProgress = 0;

		try {
			const data = await uploadedFile.arrayBuffer();
			const workbook = XLSX.read(data);

			function fuzzyNormalize(str: string) {
				return String(str || '')
					.normalize('NFD')
					.replace(/[\u0300-\u036f]/g, '')
					.replace(/đ/g, 'd')
					.replace(/Đ/g, 'D')
					.toUpperCase()
					.trim()
					.replace(/\s+/g, '');
			}

			
			function parseSheet(sheetName: string, sheetIndex: number): any[] {
				const worksheet = workbook.Sheets[sheetName];
				if (!worksheet) return [];

				const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
				if (rows.length < 1) return [];

				const cleanRows = rows.filter((row) =>
					row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
				);

				
				const requiredFuzzy = ['MALOP', 'MONHOC', 'THU', 'TIET', 'LOP', 'TEN', 'GV'];
				let headerRowIndex = cleanRows.findIndex((row) => {
					const rowText = row.map((c) => fuzzyNormalize(String(c))).join('|');
					return requiredFuzzy.filter((k) => rowText.includes(k)).length >= 2;
				});

				if (headerRowIndex === -1) {
					headerRowIndex = cleanRows.findIndex((row) =>
						row.some((cell) => fuzzyNormalize(String(cell)).includes('MALOP'))
					);
				}

				if (headerRowIndex === -1) {
					console.log(`Sheet "${sheetName}": Không tìm thấy header hợp lệ, bỏ qua.`);
					return [];
				}

				const rawHeaders = cleanRows[headerRowIndex].map((h) => String(h || '').trim());
				const fuzzyHeaders = rawHeaders.map((h) => fuzzyNormalize(h));

				const findCol = (keys: string[]) => {
					const fuzzyKeys = keys.map((k) => fuzzyNormalize(k));
					for (const fuzzyKey of fuzzyKeys) {
						const idx = fuzzyHeaders.findIndex((h) => h === fuzzyKey);
						if (idx !== -1) return idx;
					}
					for (const fuzzyKey of fuzzyKeys) {
						const idx = fuzzyHeaders.findIndex((h) => h.includes(fuzzyKey));
						if (idx !== -1) return idx;
					}
					return -1;
				};

				const colMap = {
					courseName: findCol(['TENMONHOC', 'MONHOC', 'MH', 'MON']),
					classCode: findCol(['MALOP', 'LOP', 'MAMH', 'MALOP_MAHP']),
					day: findCol(['THU', 'DAY', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T2-T7']),
					instructor: findCol([
						'TENGIANGVIEN',
						'GIANGVIÊN',
						'GV',
						'GIAOVIEN',
						'TENTROGIANG',
						'TROGIANG'
					]),
					tiết: findCol(['TIET', 'SLOT', 'TIETHOC']),
					credits: findCol(['SOTC', 'TINCHI', 'STC', 'TOTC', 'TC', 'SOTINCHI']),
					room: findCol(['PHONGHOC', 'PHONG', 'ROOM', 'PH']),
					nbd: findCol(['NBD', 'NGAYBATDAU', 'BATDAU']),
					nkt: findCol(['NKT', 'NGAYKETTHUC', 'KETTHUC'])
				};

				
				if (colMap.classCode === -1 || colMap.day === -1 || colMap.tiết === -1) {
					return [];
				}

				const dataRows = cleanRows.slice(headerRowIndex + 1);
				const sheetType = sheetIndex === 0 ? 'LT' : 'TH';

				return dataRows
					.filter((row) => row[colMap.classCode] && String(row[colMap.classCode]).trim() !== '')
					.map((row, idx): any => {
						const rawTiet = String(row[colMap.tiết] || '');
						const { startTime, endTime } = getStartEndTime(rawTiet);
						const day = getDayIndex(row[colMap.day]);
						const instructor = String(row[colMap.instructor] || '').trim();

						return {
							id: `${sheetType}-${sheetIndex}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
							courseName: String(row[colMap.courseName] || row[colMap.classCode] || 'Chưa rõ tên'),
							classCode: String(row[colMap.classCode] || ''),
							day,
							startTime,
							endTime,
							rawTiet,
							room: String(row[colMap.room] || 'Trống'),
							instructor: instructor === 'null' || instructor === 'undefined' ? '' : instructor,
							credits: Number(row[colMap.credits]) || 0,
							startDate: String(row[colMap.nbd] || ''),
							endDate: String(row[colMap.nkt] || ''),
							type: sheetType 
						};
					})
					.filter((c) => c.day !== -1 && c.startTime !== '');
			}

			let allCourses: any[] = [];
			console.log(`Workbook có ${workbook.SheetNames.length} sheet(s):`, workbook.SheetNames);

			workbook.SheetNames.forEach((sheetName, index) => {
				const sheetCourses = parseSheet(sheetName, index);
				allCourses = [...allCourses, ...sheetCourses];
			});

			allCourses.sort((a, b) => {
				const prefixA = (a.classCode || '').split('.')[0];
				const prefixB = (b.classCode || '').split('.')[0];
				if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
				return (a.classCode || '').localeCompare(b.classCode || '');
			});

			courseData.set(allCourses);
			if (browser) {
				localStorage.setItem('dkhp_parsedCourses', JSON.stringify(allCourses));
			}

			
			for (let i = 0; i <= 10; i++) {
				await new Promise((r) => setTimeout(r, 20));
				uploadProgress = i * 10;
			}

			const fileSize = uploadedFile.size;
			const uploadTime = formatDateTime(new Date());
			lastFileSize = fileSize;
			lastUploadTime = uploadTime;
			localStorage.setItem('dkhp_lastFileSize', fileSize.toString());
			localStorage.setItem('dkhp_lastUploadTime', uploadTime);

			
			await new Promise((r) => setTimeout(r, 500));

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

		// calculate current semester and school year
		// if before 15/8 of current year: semester 2 (previous year)
		if (currentMonth < 8 || (currentMonth === 8 && currentDay < 15)) {
			currentSemester = 2;
			currentSchoolYear = `${currentYear - 1}-${currentYear}`;
		}
		// from 15/8 to 14/12: semester 1
		else if (
			(currentMonth === 8 && currentDay >= 15) ||
			(currentMonth > 8 && currentMonth < 12) ||
			(currentMonth === 12 && currentDay < 15)
		) {
			currentSemester = 1;
			currentSchoolYear = `${currentYear}-${currentYear + 1}`;
		}
		// from 15/12 to 31/12: semester 2 (current year)
		else {
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

	const currentDateTime = formatDateTime();

	// 4 large stars at corners
	const cornerStars = [
		{ size: Math.floor(Math.random() * 30) + 100, rotation: Math.floor(Math.random() * 360) }, // 50-80px
		{ size: Math.floor(Math.random() * 30) + 50, rotation: Math.floor(Math.random() * 360) },
		{ size: Math.floor(Math.random() * 30) + 70, rotation: Math.floor(Math.random() * 360) },
		{ size: Math.floor(Math.random() * 30) + 30, rotation: Math.floor(Math.random() * 360) }
	];
</script>

<svelte:head>
	<title>UIT REG</title>
	<meta name="description" content="UIT REG - Công cụ hỗ trợ đăng ký học phần UIT" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,700;0,900;1,700;1,900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div
	class="relative h-screen w-full bg-primary text-[#111] font-sans overflow-hidden flex flex-col selection:bg-black selection:text-white"
	style="font-family: Inter, sans-serif;"
>
	<Background />

	<main class="flex-1 flex overflow-hidden">
		<!-- Left -->
		<div class="w-[450px] p-12 flex flex-col justify-between overflow-y-auto">
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
					<!-- Badge alpha version -->
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
							<p class="text-[12px] text-gray-700 leading-relaxed max-w-[300px]">
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
							<p class="text-[12px] text-gray-700 leading-relaxed max-w-[300px]">
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
							<p class="text-[12px] text-gray-700 leading-relaxed max-w-[300px]">
								Chỉ cần dán script vào console và hãy để tool tự lo mọi thứ cho bạn
							</p>
						</div>
					</div>
				</div>
			</div>

			<div class="mb-16 pt-2">
				<div
					class="relative z-30 transition-all duration-400 ease-in-out"
					class:opacity-100={showDataCard}
					class:opacity-0={!showDataCard}
					style={`transform: ${showDataCard ? 'translateY(0)' : 'translateY(16px)'};`}
				>
					<DataCard fileSize={lastFileSize} {lastUploadTime} />
				</div>
			</div>
		</div>

		<!-- Right -->
		<div
			class="relative flex-1 bg-primary p-12 flex items-center justify-center"
			id="right-section"
		>
			<div class="absolute top-6 right-25 z-10">
				<div class="relative inline-block">
					<Button
						href="/huong-dan"
						target="_blank"
						variant="neutral"
						className="flex items-center gap-2"
					>
						<span>Hướng dẫn</span>
					</Button>
				</div>
			</div>
			<!-- 4 large stars at corners -->
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
					class={`w-full aspect-[1.5/1] bg-white rounded-3xl border-2 border-black transition-all duration-400 ease-in-out flex flex-col overflow-hidden
          ${isDragging ? 'border-blue-500 ring-4 ring-blue-50' : 'border border-black'}`}
					class:opacity-100={showUploadBox}
					class:opacity-0={!showUploadBox}
					style={`transform: rotate(2deg) ${showUploadBox ? 'translateY(0)' : 'translateY(16px)'};`}
					ondragover={handleDrag}
					ondragleave={handleDrag}
					ondrop={handleDrop}
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
								<p class="text-gray-400 text-[11px] font-medium max-w-[180px] mb-8 leading-tight">
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
		<!-- Decorative arc -->
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
			>
				<Github size={22} />
			</a>
			<a
				href="https://www.facebook.com/t.hoang0901"
				target="_blank"
				class="text-gray-400 hover:text-blue-500 transition-colors"
			>
				<Facebook size={22} />
			</a>
			<a
				href="mailto:versedev.store@proton.me"
				class="text-gray-400 hover:text-purple-500 transition-colors"
			>
				<Mail size={22} />
			</a>
			<button
				type="button"
				class="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
				aria-label="Báo lỗi"
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

		<!-- <div
			class="flex items-center space-x-6
           text-[9px] font-bold text-gray-300 uppercase tracking-widest"
		>
			<a href="#" class="hover:text-black transition-colors">Privacy</a>
			<a href="#" class="hover:text-black transition-colors"> Chính sách bảo mật </a>
		</div> -->
	</footer>
</div>
