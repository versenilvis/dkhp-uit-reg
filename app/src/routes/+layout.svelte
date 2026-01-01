<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../styles/global.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>UIT REG - Công cụ hỗ trợ đăng ký học phần UIT</title>
	<meta
		name="description"
	content="Công cụ hỗ trợ đăng ký học phần UIT. Tự động hóa, nhanh chóng và chính xác."
	/>
	<meta name="keywords" content="UIT REG, Đăng ký học phần, dkhp, Tool dkhp, Tool đăng ký học phần" />
	<meta property="og:title" content="UIT REG - Công cụ hỗ trợ đăng ký học phần UIT" />
	<meta
		property="og:description"
		content="Tự động hóa việc đăng ký học phần chưa bao giờ dễ dàng đến vậy."
	/>
	<meta property="og:type" content="website" />

	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,700;0,900;1,700;1,900&display=swap"
		rel="stylesheet"
	/>
	<link href="https://fonts.googleapis.com/css2?family=Boldonse&display=swap" rel="stylesheet" />
</svelte:head>

{@render children()}
