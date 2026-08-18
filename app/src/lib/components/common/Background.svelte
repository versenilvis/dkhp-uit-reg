<script lang="ts">
	let canvasElement: HTMLCanvasElement | null = $state(null);
	let containerElement: HTMLDivElement | null = $state(null);

	const drawTexture = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
		const dotCount = Math.floor((canvas.width * canvas.height) / 100);
		const safeDotCount = Math.min(dotCount, 20000);
		for (let i = 0; i < safeDotCount; i++) {
			const x = Math.random() * canvas.width;
			const y = Math.random() * canvas.height;
			ctx.fillRect(x, y, 1, 1);
		}

		ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
		ctx.lineWidth = 0.5;
		const wrinkleCount = Math.floor((canvas.width + canvas.height) / 80);
		for (let i = 0; i < wrinkleCount; i++) {
			const x1 = Math.random() * canvas.width;
			const y1 = Math.random() * canvas.height;
			const length = Math.random() * 100 + 50;
			const angle = Math.random() * Math.PI * 2;
			const x2 = x1 + Math.cos(angle) * length;
			const y2 = y1 + Math.sin(angle) * length;

			ctx.beginPath();
			ctx.moveTo(x1, y1);
			const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 20;
			const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 20;
			ctx.quadraticCurveTo(midX, midY, x2, y2);
			ctx.stroke();
		}

		ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
		ctx.lineWidth = 0.5;
		const creaseCount = Math.floor((canvas.width + canvas.height) / 100);
		for (let i = 0; i < creaseCount; i++) {
			const x1 = Math.random() * canvas.width;
			const y1 = Math.random() * canvas.height;
			const length = Math.random() * 150 + 80;
			const angle = Math.random() * Math.PI * 2;
			const x2 = x1 + Math.cos(angle) * length;
			const y2 = y1 + Math.sin(angle) * length;

			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		}
	};

	$effect(() => {
		if (!canvasElement || !containerElement) return;

		const canvas = canvasElement;
		const container = containerElement;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		/*
		 * drawTexture() vẽ tới 20.000 fillRect + hàng trăm đường cong. Trước đây nó
		 * chạy lại mỗi lần ResizeObserver kích hoạt, không hề gom nhóm:
		 *   - Vẽ 2 lần ngay lúc mount (gọi trực tiếp + lần kích hoạt đầu của RO).
		 *   - Kéo đổi kích thước cửa sổ -> vẽ lại liên tục theo từng sự kiện.
		 *   - RO còn kích hoạt cả khi kích thước không đổi.
		 *
		 * Giờ gom về tối đa MỘT lần vẽ mỗi khung hình, và bỏ qua hẳn khi kích thước
		 * không đổi. Thuật toán vẽ giữ nguyên 100% nên hoạ tiết vẫn y hệt về mật độ
		 * và kiểu dáng (bản thân nó đã dùng Math.random() nên mỗi lần tải trang vốn
		 * đã ra một mẫu nhiễu khác nhau).
		 */
		let lastWidth = -1;
		let lastHeight = -1;
		let frame = 0;

		const paint = () => {
			frame = 0;
			const width = container.offsetWidth;
			const height = container.offsetHeight;
			if (width === lastWidth && height === lastHeight) return;

			lastWidth = width;
			lastHeight = height;
			// Gán width/height luôn xoá sạch canvas, kể cả khi gán đúng giá trị cũ,
			// nên chỉ gán khi kích thước thực sự đổi.
			canvas.width = width;
			canvas.height = height;
			drawTexture(ctx, canvas);
		};

		const schedulePaint = () => {
			if (!frame) frame = requestAnimationFrame(paint);
		};

		paint();

		const resizeObserver = new ResizeObserver(schedulePaint);
		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
			if (frame) cancelAnimationFrame(frame);
		};
	});
</script>

<div bind:this={containerElement} class="absolute inset-0 overflow-hidden pointer-events-none">
	<canvas bind:this={canvasElement} class="absolute inset-0 w-full h-full"></canvas>
</div>
