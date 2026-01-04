export const dayNamesVi = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export const timeSlots = [
	{ id: 1, time: '7:30 - 8:15', start: '07:30', end: '08:15' },
	{ id: 2, time: '8:15 - 9:00', start: '08:15', end: '09:00' },
	{ id: 3, time: '9:00 - 9:45', start: '09:00', end: '09:45' },
	{ id: 4, time: '10:00 - 10:45', start: '10:00', end: '10:45' },
	{ id: 5, time: '10:45 - 11:30', start: '10:45', end: '11:30' },
	{ id: 6, time: '13:00 - 13:45', start: '13:00', end: '13:45' },
	{ id: 7, time: '13:45 - 14:30', start: '13:45', end: '14:30' },
	{ id: 8, time: '14:30 - 15:15', start: '14:30', end: '15:15' },
	{ id: 9, time: '15:30 - 16:15', start: '15:30', end: '16:15' },
	{ id: 10, time: '16:15 - 17:00', start: '16:15', end: '17:00' },
	{ id: 11, time: '18:00 - 18:45', start: '18:00', end: '18:45' },
	{ id: 12, time: '18:45 - 19:30', start: '18:45', end: '19:30' },
	{ id: 13, time: '19:30 - 20:15', start: '19:30', end: '20:15' }
];

export function getStartEndTime(tiet: string) {
	if (!tiet) return { startTime: '', endTime: '' };
	
	let slots: number[] = [];
	const cleanTiet = String(tiet).trim();
	
	if (cleanTiet.includes(',') || cleanTiet.includes('-') || cleanTiet.includes(' ')) {
		const parts = cleanTiet.split(/[-,\s]+/).map(Number).filter(n => n > 0);
		if (cleanTiet.includes('-') && parts.length >= 2) {
			for (let i = parts[0]; i <= parts[parts.length - 1]; i++) slots.push(i);
		} else {
			slots = parts;
		}
	} else if (/^\d+$/.test(cleanTiet)) {
		const results: number[][] = [];
		const backtrack = (idx: number, current: number[]) => {
			if (idx === cleanTiet.length) {
				results.push([...current]);
				return;
			}
			const one = parseInt(cleanTiet.slice(idx, idx + 1));
			if (one > 0 && (current.length === 0 || one > current[current.length - 1])) {
				current.push(one);
				backtrack(idx + 1, current);
				current.pop();
			}
			if (idx + 1 < cleanTiet.length && cleanTiet.slice(idx, idx + 2) === '90') {
				if (current.length === 0 || 9 > current[current.length - 1]) {
					current.push(9, 10);
					backtrack(idx + 2, current);
					current.pop();
					current.pop();
				}
			}
			if (idx + 1 < cleanTiet.length) {
				const two = parseInt(cleanTiet.slice(idx, idx + 2));
				if (two >= 10 && two <= 13 && (current.length === 0 || two > current[current.length - 1])) {
					current.push(two);
					backtrack(idx + 2, current);
					current.pop();
				}
			}
		};
		backtrack(0, []);
		if (results.length > 0) {
			results.sort((a, b) => b.length - a.length);
			slots = results[0];
		}
	}
	
	if (slots.length === 0) return { startTime: '', endTime: '' };
	const startSlotId = Math.min(...slots);
	const endSlotId = Math.max(...slots);
	const startSlot = timeSlots.find(s => s.id === startSlotId);
	const endSlot = timeSlots.find(s => s.id === endSlotId);
	
	return {
		startTime: startSlot?.start || '',
		endTime: endSlot?.end || ''
	};
}

export function getDayIndex(thu: string | number) {
	if (thu === undefined || thu === null || thu === '') return -1;
	const s = thu.toString().toUpperCase().trim();
	

	if (/^T[2-7]$/.test(s)) {
		const val = parseInt(s[1]);
		return val - 2;
	}

	if (s.includes('HAI') || s === '2') return 0;
	if (s.includes('BA') || s === '3') return 1;
	if (s.includes('TƯ') || s.includes('TU') || s === '4') return 2;
	if (s.includes('NĂM') || s.includes('NAM') || s === '5') return 3;
	if (s.includes('SÁU') || s.includes('SAU') || s === '6') return 4;
	if (s.includes('BẢY') || s.includes('BAY') || s === '7') return 5;

	const match = s.match(/\d+/);
	if (match) {
		const val = parseInt(match[0]);
		if (val >= 2 && val <= 7) return val - 2;
	}
	return -1;
}
