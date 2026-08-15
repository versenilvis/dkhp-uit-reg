export function removeVietnameseAccents(str: string): string {
	if (!str) return '';
	return str
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D');
}

export function getAcronym(str: string): string {
	return removeVietnameseAccents(str)
		.split(/[\s\-_\/.,]+/)
		.map((w) => w[0] || '')
		.join('')
		.toLowerCase();
}

export function isFuzzySubsequence(text: string, pattern: string): boolean {
	let tIdx = 0;
	let pIdx = 0;
	while (tIdx < text.length && pIdx < pattern.length) {
		if (text[tIdx] === pattern[pIdx]) {
			pIdx++;
		}
		tIdx++;
	}
	return pIdx === pattern.length;
}

export function getMatchScore(target: string, query: string): number {
	if (!query) return 1;
	if (!target) return 0;

	const cleanQuery = query.trim().toLowerCase();
	if (!cleanQuery) return 1;

	const cleanTarget = target.toLowerCase();
	const normTarget = removeVietnameseAccents(cleanTarget);
	const normQuery = removeVietnameseAccents(cleanQuery);

	if (cleanTarget === cleanQuery || normTarget === normQuery) {
		return 100000;
	}

	if (cleanTarget.startsWith(cleanQuery) || normTarget.startsWith(normQuery)) {
		return 50000 - Math.min(target.length, 50) * 10;
	}

	const words = normTarget.split(/[\s\-_\/.,]+/);
	for (let i = 0; i < words.length; i++) {
		if (words[i] === normQuery) {
			return 40000 - i * 100;
		}
		if (words[i].startsWith(normQuery)) {
			return 30000 - i * 100 - (words[i].length - normQuery.length) * 10;
		}
	}

	const subIdx = normTarget.indexOf(normQuery);
	if (subIdx !== -1) {
		return 20000 - Math.min(subIdx, 50) * 100;
	}

	const queryTokens = normQuery.split(/\s+/).filter(Boolean);
	if (queryTokens.length > 1) {
		const allMatch = queryTokens.every((t) => normTarget.includes(t));
		if (allMatch) {
			return 15000;
		}
	}

	const acronym = getAcronym(target);
	if (acronym === normQuery) {
		return 12000;
	}
	if (acronym.startsWith(normQuery)) {
		return 10000;
	}
	if (acronym.includes(normQuery)) {
		return 8000;
	}

	if (cleanQuery.length >= 3 && isFuzzySubsequence(normTarget, normQuery)) {
		return 1000;
	}

	return 0;
}

export function scoreCourseMatch(
	course: {
		code?: string;
		classCode?: string;
		name?: string;
		courseName?: string;
		instructor?: string;
		description?: string;
	},
	query: string
): number {
	if (!query.trim()) return 1;

	const baseCode = (course.code || course.classCode?.split('.')[0] || '').trim();
	const classCode = (course.classCode || '').trim();
	const name = (course.name || course.courseName || '').trim();
	const instructor = (course.instructor || '').trim();
	const desc = (course.description || '').trim();

	let maxScore = 0;

	if (baseCode) {
		const score = getMatchScore(baseCode, query);
		if (score > 0) maxScore = Math.max(maxScore, score * 2);
	}
	if (classCode) {
		const score = getMatchScore(classCode, query);
		if (score > 0) maxScore = Math.max(maxScore, score * 1.8);
	}
	if (name) {
		const score = getMatchScore(name, query);
		if (score > 0) maxScore = Math.max(maxScore, score * 1.5);
	}
	if (instructor) {
		const score = getMatchScore(instructor, query);
		if (score > 0) maxScore = Math.max(maxScore, score * 1.2);
	}
	if (desc) {
		const score = getMatchScore(desc, query);
		if (score > 0) maxScore = Math.max(maxScore, score * 0.8);
	}

	return maxScore;
}

export function fuzzyMatch(target: string, query: string): boolean {
	return getMatchScore(target, query) > 0;
}
