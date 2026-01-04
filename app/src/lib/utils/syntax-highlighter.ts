export function highlightJS(code: string): string {
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
