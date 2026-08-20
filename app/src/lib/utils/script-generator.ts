export function generateRegistrationScript(classCodes: string[]): string {
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

    // Tự động kích hoạt giải Cloudflare Turnstile qua API
    function triggerTurnstile() {
        if (typeof window.turnstile !== 'undefined') {
            try {
                const container = document.querySelector('.cf-turnstile, [data-sitekey], [data-turnstile-sitekey]');
                if (container) {
                    window.turnstile.execute(container);
                } else {
                    window.turnstile.execute();
                }
                log.info('⚡ Đã kích hoạt giải Cloudflare Turnstile');
            } catch (e) { }
        }
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

        // Kích hoạt Turnstile ngay
        triggerTurnstile();

        // Tick chọn chính xác các môn trong danh sách
        document.querySelectorAll('tbody tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            const isMatch = cells.some(td => pendingClasses.has(td.textContent?.trim()));
            if (!isMatch) return;

            const cb = row.querySelector('input[type="checkbox"]');
            if (cb && !cb.checked && !cb.disabled) {
                cb.click();
                const malop = row.querySelector('td:nth-child(2)')?.textContent?.trim();
                log.ok('Đã chọn ' + (malop || 'môn'));
            }
        });

        // Tìm chính xác nút Đăng ký
        const btn = [...document.querySelectorAll('button,input[type="submit"],input[type="button"]')]
            .find(b => {
                const text = (b.innerText || b.textContent || b.value || '').trim().toLowerCase();
                return (text === 'đăng ký' || text.includes('đăng ký')) && !text.includes('xóa') && !text.includes('hủy') && !text.includes('đã');
            });

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
                            log.ok('🎉 THÀNH CÔNG ' + malop);
                        }
                    });
                });

                Object.keys(loi).forEach(mamh => {
                    const reason = loi[mamh];
                    log.err(\`❌ LỖI \${mamh}: \${reason}\`);

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
                    log.ok('🎉 ĐÃ ĐĂNG KÝ FULL MÔN');
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
}
