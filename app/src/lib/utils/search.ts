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

export function fuzzyMatch(target: string, query: string): boolean {
	if (!query) return true;
	if (!target) return false;

	const cleanQuery = query.trim().toLowerCase();
	if (!cleanQuery) return true;

	const cleanTarget = target.toLowerCase();

	// 1. Direct lowercase substring match
	if (cleanTarget.includes(cleanQuery)) return true;

	const normTarget = removeVietnameseAccents(cleanTarget);
	const normQuery = removeVietnameseAccents(cleanQuery);

	// 2. Normalized without accents substring match
	if (normTarget.includes(normQuery)) return true;

	// 3. Multi-word tokens match (all tokens in query exist in target)
	const queryTokens = normQuery.split(/\s+/).filter(Boolean);
	if (queryTokens.length > 1) {
		const allTokensMatch = queryTokens.every((token) => normTarget.includes(token));
		if (allTokensMatch) return true;
	}

	// 4. Acronym match (e.g., 'nmlt' for 'Nhập môn lập trình', 'csdl' for 'Cơ sở dữ liệu')
	const acronym = getAcronym(target);
	if (acronym.includes(normQuery)) return true;

	// 5. Short subsequence fuzzy match
	if (!cleanQuery.includes(' ') && cleanQuery.length >= 2 && cleanQuery.length <= 8) {
		if (isFuzzySubsequence(normTarget, normQuery)) return true;
	}

	return false;
}
