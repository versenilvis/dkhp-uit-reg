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
	{ id: 10, time: '16:15 - 17:00', start: '16:15', end: '17:00' }
];

export function getStartEndTime(tiet: string) {
	if (!tiet) return { startTime: '', endTime: '' };
	
	let slots: number[] = [];
	
	// Handle strings of digits like "12345" where each digit is a slot
	// but only if it doesn't contain separators and doesn't look like a single multi-digit slot (10+)
	const cleanTiet = String(tiet).trim();
	if (/^\d+$/.test(cleanTiet) && !['8', '9', '10', '11', '12'].includes(cleanTiet)) {
		slots = cleanTiet.split('').map(Number);
	} else {
		// Parse strings like "10-10", "1-3", "1, 2, 3"
		slots = cleanTiet.split(/[-,\s]+/).map(Number).filter(n => !isNaN(n));
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
	if (!thu) return -1;
	const s = thu.toString().toUpperCase().trim();
	
	const match = s.match(/\d+/);
	if (match) {
		const val = parseInt(match[0]);
		if (val >= 2 && val <= 8) {
			return val === 8 ? 6 : val - 2;
		}
	}
	return -1;
}
