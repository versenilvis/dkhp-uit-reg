<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../styles/global.css';
	import PersistentSchedule from '$lib/components/layout/PersistentSchedule.svelte';
	import BottomNavBar from '$lib/components/layout/BottomNavBar.svelte';

	let { children } = $props();
</script>

<PersistentSchedule />

<svelte:head>
	<title>DKHP v2 - Tool đăng ký học phần và xếp thời khóa biểu UIT (UIT REG)</title>
	<meta
		name="description"
		content="DKHP v2 (UIT REG) - Tool đăng ký học phần và xếp thời khóa biểu tự động cho sinh viên UIT. Hỗ trợ lọc trùng lịch, tra cứu môn học, xuất ảnh TKB và tự động tạo script đăng ký học phần nhanh chóng."
	/>
	<meta
		name="keywords"
		content="dkhp, dkhp v2, dkhpv2, dang ky hoc phan, đăng ký học phần, dkhp uit, dkhpuit, dkhp v2 uit, tool dkhp, tool dkhp v2, tool dang ky hoc phan, tool đăng ký học phần uit, xep thoi khoa bieu uit, xếp thời khóa biểu uit, tao tkb uit, tạo tkb uit, xep tkb uit, script dkhp uit, auto dkhp uit, UIT REG, dai hoc cong nghe thong tin, trường đại học công nghệ thông tin"
	/>
	<meta name="author" content="UIT REG Team" />
	<meta
		name="robots"
		content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
	/>

	<!-- OpenGraph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="vi_VN" />
	<meta property="og:site_name" content="DKHP v2 - UIT REG" />
	<meta property="og:title" content="DKHP v2 - Tool đăng ký học phần và xếp thời khóa biểu UIT" />
	<meta
		property="og:description"
		content="Tool xếp thời khóa biểu và đăng ký học phần tự động cho sinh viên UIT (DKHP v2 / UIT REG). Lọc trùng lịch, tra cứu môn học và sinh script đăng ký nhanh chóng."
	/>
	<meta property="og:image" content="/preview.png" />
	<meta property="og:image:type" content="image/png" />

	<!-- Twitter Cards -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="DKHP v2 - Tool đăng ký học phần và xếp thời khóa biểu UIT" />
	<meta
		name="twitter:description"
		content="Tool xếp thời khóa biểu và đăng ký học phần tự động cho sinh viên UIT (DKHP v2 / UIT REG). Lọc trùng lịch, tra cứu môn học và sinh script đăng ký."
	/>
	<meta name="twitter:image" content="/preview.png" />

	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,700;0,900;1,700;1,900&display=swap"
		rel="stylesheet"
	/>
	<link href="https://fonts.googleapis.com/css2?family=Boldonse&display=swap" rel="stylesheet" />

	<!-- Schema.org JSON-LD Structured Data -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "WebApplication",
		"name": "DKHP v2 - UIT REG",
		"alternateName": ["DKHP v2", "dkhpv2", "dkhp", "Tool đăng ký học phần UIT", "UIT REG"],
		"description": "Tool đăng ký học phần và xếp thời khóa biểu tự động cho sinh viên Đại học Công nghệ Thông tin (UIT).",
		"applicationCategory": "EducationalApplication",
		"operatingSystem": "All",
		"browserRequirements": "Requires JavaScript. Requires HTML5.",
		"inLanguage": "vi",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "VND"
		}
	}
	</script>`}
</svelte:head>

{@render children()}

<BottomNavBar stickyBottom={true} />
