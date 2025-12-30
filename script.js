(function() {
    'use strict';

    /******** CONFIG ********/
    const CONFIG = {
        monDangKy: `
SS008.Q28
PE232.Q224
IT002.Q225
IT002.Q225.1
`.trim(),

        CHECK_INTERVAL: 2000,   // poll /courses
        WAIT_AFTER_CLICK: 800  // đợi backend sau khi bấm đăng ký
    };

    /******** STATE ********/
    const pendingClasses = new Set(
        CONFIG.monDangKy.split('\n').map(s => s.trim()).filter(Boolean)
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

    /******** LOG ********/
    const log = {
        ok: m => console.log('%c' + m, 'color:green;font-weight:bold'),
        warn: m => console.log('%c' + m, 'color:orange;font-weight:bold'),
        err: m => console.log('%c' + m, 'color:red;font-weight:bold'),
        info: m => console.log('%c' + m, 'color:deepskyblue;font-weight:bold')
    };

    /******** HELPERS ********/
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

    /******** CORE: CHECK SLOT ********/
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
                    `[${new Date().toLocaleTimeString()}]`,
                    malop,
                    `| ${tenmh}`,
                    `| ${dadk}/${siso}`,
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

    /******** CORE: REGISTER ********/
    async function registerNow() {
        if (isRegistering) return;
        isRegistering = true;

        log.info('Có slot → bắt đầu đăng ký');
        readyToRegister.clear();

        // bỏ chọn cũ
        document.querySelectorAll('input[type="checkbox"]:checked')
            .forEach(cb => cb.click());

        // chọn lớp
        document.querySelectorAll('tbody tr').forEach(row => {
            const malop = row.querySelector('td:nth-child(2)')?.textContent?.trim();
            if (!pendingClasses.has(malop)) return;

            const cb = row.querySelector('input[type="checkbox"]');
            if (cb && !cb.checked && !cb.disabled) {
                cb.click();
                log.ok('Đã chọn ' + malop);
            }
        });

        // bấm đăng ký
        const btn = [...document.querySelectorAll('button,input[type="submit"]')]
            .find(b => (b.innerText || '').toLowerCase().includes('đăng ký'));

        if (!btn) {
            log.err('Không tìm thấy nút Đăng ký');
            isRegistering = false;
            return;
        }

        btn.click();
        log.info('Đã bấm Đăng ký – chờ backend');

        await sleep(CONFIG.WAIT_AFTER_CLICK);
    }

    /******** HOOK XHR – NHẬN KẾT QUẢ ********/
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
                    log.err(`LỖI ${mamh}: ${reason}`);

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
                    log.ok('🎉 ĐÃ XONG TẤT CẢ');
                    stop();
                } else {
                    log.info('Còn lại: ' + [...pendingClasses].join(', '));
                }

            } catch { }
        });

        return xhr;
    };

    /******** START ********/
    function start() {
        log.info('🚀 Auto DKHP (API-based) bắt đầu');
        timer = setInterval(checkSlots, CONFIG.CHECK_INTERVAL);
        checkSlots();
    }

    function stop() {
        clearInterval(timer);
        log.info('⏹ Đã dừng Auto DKHP');
    }

    window.stopDKHP = stop;
    window.getDKHPStatus = () => ({
        pending: [...pendingClasses],
        permanentFailed: [...permanentFailed.entries()]
    });

    start();
})();

