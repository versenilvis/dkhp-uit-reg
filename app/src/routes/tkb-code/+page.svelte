<script lang="ts">
	import Background from '$lib/components/Background.svelte';
	import ScheduleGrid from '$lib/components/schedule/ScheduleGrid.svelte';
	import type { ScheduleItem } from '$lib/components/schedule/Schedule.svelte';
	import type { Course } from '$lib/components/schedule/CourseSelector.svelte';
	import { courseData, selectedCourseIds as selectedStore } from '$lib/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { Copy, Check, Download, Image, Clipboard } from 'lucide-svelte';
	import html2canvas from 'html2canvas';

	let availableCourses = $state<Course[]>([]);
	let selectedCourseIds = $state<string[]>([]);
	let copied = $state(false);
	let copiedTkb = $state(false);
	let copiedCodes = $state(false);
	let copyError = $state(false);
	let scheduleRef = $state<HTMLDivElement | null>(null);

	onMount(() => {
		const unsubCourse = courseData.subscribe((value) => {
			availableCourses = value;
		});

		const unsubSelected = selectedStore.subscribe((value) => {
			selectedCourseIds = value;
		});

		if (browser) {
			const savedCourses = localStorage.getItem('dkhp_parsedCourses');
			if (savedCourses && availableCourses.length === 0) {
				const parsed = JSON.parse(savedCourses);
				availableCourses = parsed;
				courseData.set(parsed);
			}

			const savedIds = localStorage.getItem('dkhp_selectedIds');
			if (savedIds && selectedCourseIds.length === 0) {
				const parsed = JSON.parse(savedIds);
				selectedCourseIds = parsed;
				selectedStore.set(parsed);
			}
		}

		return () => {
			unsubCourse();
			unsubSelected();
		};
	});

	let scheduleItems = $derived.by(() => {
		return selectedCourseIds
			.map((id) => availableCourses.find((c) => c.id === id))
			.filter((course): course is Course => !!course)
			.map(
				(course): ScheduleItem => ({
					id: course.id,
					courseName: course.courseName,
					classCode: course.classCode,
					day: course.day,
					startTime: course.startTime,
					endTime: course.endTime,
					rawTiet: course.rawTiet || '',
					room: course.room,
					instructor: course.instructor,
					startDate: course.startDate,
					endDate: course.endDate
				})
			);
	});

	let classCodes = $derived.by(() => {
		const codes = scheduleItems.map((item) => item.classCode);
		return [...new Set(codes)];
	});

	let generatedScript = $derived.by(() => {
		const classCodesStr = classCodes.join('\n');
		return `(function() {
    'use strict';

    const CONFIG = {
        monDangKy: \`
${classCodesStr}
\`.trim(),
        CHECK_INTERVAL: 2000,
        WAIT_AFTER_CLICK: 800
    };

    const pendingClasses = new Set(
        CONFIG.monDangKy.split('\\n').map(s => s.trim()).filter(Boolean)
    );

    const permanentFailed = new Map();
    const readyToRegister = new Set();
    let isRegistering = false;
    let timer = null;

    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('❌ Không tìm thấy authToken');
        return;
    }

    const log = {
        ok: m => console.log('%c' + m, 'color:green;font-weight:bold'),
        warn: m => console.log('%c' + m, 'color:orange;font-weight:bold'),
        err: m => console.log('%c' + m, 'color:red;font-weight:bold'),
        info: m => console.log('%c' + m, 'color:deepskyblue;font-weight:bold')
    };

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const getMaMon = malop => malop.split('.')[0];

    function isPermanentError(msg = '') {
        const t = msg.toLowerCase();
        return (
            t.includes('tiên quyết') ||
            t.includes('cần học trước') ||
            t.includes('vượt số tín chỉ') ||
            t.includes('trùng lịch') ||
            t.includes('không đủ điều kiện')
        );
    }

    async function checkSlots() {
        if (isRegistering || pendingClasses.size === 0) return;

        try {
            const res = await fetch('https://dkhpapi.uit.edu.vn/courses', {
                headers: { Authorization: 'Bearer ' + token }
            });
            const json = await res.json();

            if (!Array.isArray(json.courses)) {
                log.warn('Response không có courses[]');
                return;
            }

            pendingClasses.forEach(malop => {
                const lop = json.courses.find(c => c.malop === malop);
                if (!lop) return;

                const { dadk, siso, tenmh } = lop;
                const status = dadk < siso ? '🟢 CÒN SLOT' : '🔴 FULL';

                console.log(
                    \`[\${new Date().toLocaleTimeString()}]\`,
                    malop,
                    \`| \${tenmh}\`,
                    \`| \${dadk}/\${siso}\`,
                    status
                );

                if (dadk < siso) {
                    readyToRegister.add(malop);
                }
            });

            if (readyToRegister.size > 0) {
                await registerNow();
            }

        } catch (e) {
            log.err('Lỗi fetch /courses: ' + e.message);
        }
    }

    async function registerNow() {
        if (isRegistering) return;
        isRegistering = true;

        log.info('Có slot → bắt đầu đăng ký');
        readyToRegister.clear();

        document.querySelectorAll('input[type="checkbox"]:checked')
            .forEach(cb => cb.click());

        document.querySelectorAll('tbody tr').forEach(row => {
            const malop = row.querySelector('td:nth-child(2)')?.textContent?.trim();
            if (!pendingClasses.has(malop)) return;

            const cb = row.querySelector('input[type="checkbox"]');
            if (cb && !cb.checked && !cb.disabled) {
                cb.click();
                log.ok('Đã chọn ' + malop);
            }
        });

        const btn = [...document.querySelectorAll('button,input[type="submit"]')]
            .find(b => (b.innerText || '').toLowerCase().includes('đăng ký'));

        if (!btn) {
            log.err('Không tìm thấy nút Đăng ký');
            isRegistering = false;
            return;
        }

        btn.click();
        log.info('Đã bấm Đăng ký – chờ server của trường phản hồi...');

        await sleep(CONFIG.WAIT_AFTER_CLICK);
    }

    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new OriginalXHR();
        let url = '';

        const open = xhr.open;
        xhr.open = function(m, u, ...r) {
            url = u;
            return open.call(this, m, u, ...r);
        };

        xhr.addEventListener('load', () => {
            if (!url.includes('/courses-waiting-processing')) return;

            try {
                const json = JSON.parse(xhr.responseText);
                const { thanhcong = {}, loi = {} } = json.task_result || {};

                Object.keys(thanhcong).forEach(mamh => {
                    [...pendingClasses].forEach(malop => {
                        if (getMaMon(malop) === mamh) {
                            pendingClasses.delete(malop);
                            log.ok('THÀNH CÔNG ' + malop);
                        }
                    });
                });

                Object.keys(loi).forEach(mamh => {
                    const reason = loi[mamh];
                    log.err(\`LỖI \${mamh}: \${reason}\`);

                    [...pendingClasses].forEach(malop => {
                        if (getMaMon(malop) === mamh && isPermanentError(reason)) {
                            pendingClasses.delete(malop);
                            permanentFailed.set(malop, reason);
                            log.warn('BỎ QUA ' + malop);
                        }
                    });
                });

                isRegistering = false;

                if (pendingClasses.size === 0) {
                    log.ok('ĐÃ ĐĂNG KÝ FULL MÔN');
                    stop();
                } else {
                    log.info('Còn lại: ' + [...pendingClasses].join(', '));
                }

            } catch { }
        });

        return xhr;
    };

    function start() {
        log.info('Auto DKHP bắt đầu - Powered by UIT REG');
        timer = setInterval(checkSlots, CONFIG.CHECK_INTERVAL);
        checkSlots();
    }

    function stop() {
        clearInterval(timer);
        log.info('Đã dừng Auto DKHP');
    }

    window.stopDKHP = stop;
    window.getDKHPStatus = () => ({
        pending: [...pendingClasses],
        permanentFailed: [...permanentFailed.entries()]
    });

    start();
})();`;
	});

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(generatedScript);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (e) {
			console.error('Failed to copy:', e);
		}
	}

	async function copyClassCodes() {
		try {
			await navigator.clipboard.writeText(classCodes.join(','));
			copiedCodes = true;
			setTimeout(() => (copiedCodes = false), 2000);
		} catch (e) {
			console.error('Failed to copy class codes:', e);
		}
	}

	function downloadScript() {
		const blob = new Blob([generatedScript], { type: 'text/javascript' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'dkhp-script.js';
		a.click();
		URL.revokeObjectURL(url);
	}

	async function copyTkbImage() {
		if (!scheduleRef) return;
		try {
			const target = (scheduleRef.querySelector('table') as HTMLElement) || scheduleRef;

			const canvas = await html2canvas(target, {
				backgroundColor: '#ffffff',
				scale: 2,
				logging: false,
				useCORS: true,
				width: target.offsetWidth,
				height: target.offsetHeight
			});

			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, 'image/png', 1.0)
			);

			if (!blob) {
				throw new Error('Không thể tạo file ảnh từ dữ liệu.');
			}

			if (navigator.clipboard && window.ClipboardItem) {
				const item = new ClipboardItem({ [blob.type]: blob });
				await navigator.clipboard.write([item]);
				copiedTkb = true;
				setTimeout(() => (copiedTkb = false), 2000);
			} else {
				throw new Error('Trình duyệt của bạn không hỗ trợ API copy ảnh.');
			}
		} catch (e: any) {
			console.error('Failed to copy TKB:', e);
			copyError = true;
			setTimeout(() => (copyError = false), 3000);
			const msg = e?.message || 'Không rõ lỗi';
			alert(`Không thể copy: ${msg}. Hãy thử phím tắt hoặc dùng nút "Tải ảnh".`);
		}
	}

	async function downloadTkbImage() {
		if (!scheduleRef) return;
		try {
			const target = (scheduleRef.querySelector('table') as HTMLElement) || scheduleRef;
			const canvas = await html2canvas(target, {
				backgroundColor: '#ffffff',
				scale: 2,
				logging: false,
				useCORS: true,
				width: target.offsetWidth,
				height: target.offsetHeight
			});
			const dataUrl = canvas.toDataURL('image/png');
			const a = document.createElement('a');
			a.href = dataUrl;
			a.download = 'thoi-khoa-bieu.png';
			a.click();
		} catch (e) {
			console.error('Failed to download TKB:', e);
			alert('Không thể tải ảnh. Vui lòng thử lại.');
		}
	}

	function highlightJS(code: string): string {
		const escapeHtml = (str: string) =>
			str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

		let result = escapeHtml(code);

		result = result.replace(/(['"`])(?:(?!\1)[^\\]|\\.)*?\1/g, '<span class="hl-string">$&</span>');

		result = result.replace(
			/\b(const|let|var|function|async|await|return|if|else|try|catch|for|new|typeof|instanceof|class|extends|import|export|from|this)\b/g,
			'<span class="hl-keyword">$1</span>'
		);

		result = result.replace(
			/\b(true|false|null|undefined)\b/g,
			'<span class="hl-boolean">$1</span>'
		);

		result = result.replace(
			/\b(window|document|console|localStorage|Array|Object|Map|Set|Promise|JSON|Math)\b/g,
			'<span class="hl-builtin">$1</span>'
		);

		result = result.replace(
			/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
			'<span class="hl-function">$1</span>'
		);

		result = result.replace(/\.([a-zA-Z_][a-zA-Z0-9_]*)/g, '.<span class="hl-method">$1</span>');

		result = result.replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>');

		result = result.replace(/=&gt;/g, '<span class="hl-arrow">=&gt;</span>');

		result = result.replace(
			/(===|!==|==|!=|&lt;=|&gt;=|&lt;|&gt;|\|\||&amp;&amp;|\?\?|\+\+|--|\+=|-=|\*=|\/=)/g,
			'<span class="hl-operator">$1</span>'
		);

		result = result.replace(/([{}\[\]])/g, '<span class="hl-bracket">$1</span>');

		return result;
	}

	let highlightedScript = $derived(highlightJS(generatedScript));
</script>

<div class="fixed inset-0 z-[40] bg-primary flex flex-col">
	<Background />

	<main class="flex-1 flex flex-col overflow-hidden pt-4 pb-20">
		<div class="flex-1 overflow-hidden flex items-center justify-center px-4">
			<div class="w-full max-w-[1800px] h-full flex gap-4">
				<!-- Left: Schedule Preview -->
				<div
					style="flex: 1; background-color: rgba(255, 255, 255, 0.95); backdrop-filter: blur(4px); border: 2px solid #000000; border-radius: 0.75rem; overflow: hidden; display: flex; flex-direction: column; max-height: calc(100vh - 100px);"
				>
					<!-- Header for schedule actions -->

					<div class="flex-1 relative overflow-hidden">
						<div class="absolute inset-0 overflow-auto" bind:this={scheduleRef}>
							{#if scheduleItems.length === 0}
								<div
									style="height: 100%; display: flex; align-items: center; justify-content: center; color: #6b7280;"
								>
									<div style="text-align: center;">
										<p style="font-size: 1.125rem; font-weight: 500;">Chưa có lớp nào được chọn</p>
										<p style="font-size: 0.875rem; margin-top: 0.25rem;">
											Hãy chọn lớp từ trang "Tạo TKB" trước
										</p>
									</div>
								</div>
							{:else}
								<ScheduleGrid items={scheduleItems} />
							{/if}
						</div>

						{#if scheduleItems.length > 0}
							<!-- Floating Actions -->
							<div class="absolute top-8 right-4 flex flex-col gap-2 z-20 pointer-events-none">
								<button
									type="button"
									onclick={copyTkbImage}
									class="pointer-events-auto p-2 text-gray-500 hover:text-black transition-all cursor-pointer active:scale-95 flex items-center justify-center"
									title="Copy ảnh thời khóa biểu"
								>
									{#if copiedTkb}
										<Check size={20} class="text-green-500" />
									{:else}
										<Clipboard size={20} />
									{/if}
								</button>
								<button
									type="button"
									onclick={downloadTkbImage}
									class="pointer-events-auto p-2 text-gray-500 hover:text-black transition-all cursor-pointer active:scale-95 flex items-center justify-center"
									title="Tải ảnh thời khóa biểu"
								>
									<Download size={20} />
								</button>
							</div>
						{/if}
					</div>
				</div>

				<!-- Right: Script -->
				<div
					class="w-[640px] shrink-0 bg-[#1e1e1e] border-2 border-black rounded-xl overflow-hidden flex flex-col"
					style="max-height: calc(100vh - 100px);"
				>
					<!-- Header -->
					<div class="bg-[#252526] px-4 py-2 flex items-center justify-between">
						<div class="flex space-x-1.5">
							<div class="w-2.5 h-2.5 rounded-full bg-red-300"></div>
							<div class="w-2.5 h-2.5 rounded-full bg-yellow-300"></div>
							<div class="w-2.5 h-2.5 rounded-full bg-green-300"></div>
						</div>
					</div>

					<!-- Class codes summary -->
					<div class="bg-[#252526] border-b border-[#3c3c3c] p-3">
						<div class="flex items-center gap-2 flex-wrap">
							{#if classCodes.length === 0}
								<span class="text-gray-500 text-sm italic">Chưa có</span>
							{:else}
								{#each classCodes as code}
									<span
										class="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs font-mono"
									>
										{code}
									</span>
								{/each}
							{/if}
						</div>
					</div>

					<!-- Script content -->
					<div class="flex-1 overflow-auto p-4 relative group">
						<button
							type="button"
							onclick={copyToClipboard}
							disabled={scheduleItems.length === 0}
							class="sticky top-0 float-right text-gray-400 hover:text-white disabled:opacity-0 transition-all p-2 cursor-pointer z-10"
							title="Copy script"
						>
							{#if copied}
								<Check size={16} class="text-green-500" />
							{:else}
								<Copy size={16} />
							{/if}
						</button>
						<pre
							class="text-[13px] font-mono whitespace-pre-wrap break-all leading-relaxed">{@html highlightedScript}</pre>
					</div>

					<!-- Instructions -->
					<div class="bg-[#252526] border-t border-[#3c3c3c] p-3">
						<div class="text-sm text-gray-400 space-y-1">
							<p class="font-medium text-white">Hướng dẫn sử dụng:</p>
							<p>1. Copy script bằng nút "Copy" ở trên</p>
							<p>
								2. Mở trang <a
									class="underline text-blue-400"
									href="https://dkhp.uit.edu.vn/"
									target="_blank">ĐKHP UIT</a
								>, nhấn F12 → Bật tab Console
							</p>
							<p>3. Khi mở đăng ký, dán script và nhấn Enter</p>
							<p class="text-yellow-400">
								⚠️ Lưu ý: Script sẽ tự spam đăng ký các lớp full cho tới khi có slot trống (tức là
								ai đó hủy lớp)
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	pre {
		tab-size: 4;
		color: #d4d4d4;
	}

	:global(.hl-keyword) {
		color: #c586c0;
		font-weight: 500;
	}

	:global(.hl-string) {
		color: #ce9178;
	}

	:global(.hl-number) {
		color: #b5cea8;
	}

	:global(.hl-function) {
		color: #dcdcaa;
	}

	:global(.hl-method) {
		color: #4fc1ff;
	}

	:global(.hl-boolean) {
		color: #569cd6;
		font-weight: 500;
	}

	:global(.hl-builtin) {
		color: #4ec9b0;
	}

	:global(.hl-arrow) {
		color: #569cd6;
		font-weight: bold;
	}

	:global(.hl-operator) {
		color: #d4d4d4;
	}

	:global(.hl-bracket) {
		color: #ffd700;
	}
</style>
