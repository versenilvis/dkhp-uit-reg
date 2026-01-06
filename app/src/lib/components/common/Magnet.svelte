<script lang="ts">
	interface Props {
		padding?: number;
		disabled?: boolean;
		magnetStrength?: number;
		activeTransition?: string;
		inactiveTransition?: string;
		wrapperClassName?: string;
		innerClassName?: string;
	}

	let {
		padding = 100,
		disabled = false,
		magnetStrength = 2,
		activeTransition = 'transform 0.3s ease-out',
		inactiveTransition = 'transform 0.5s ease-in-out',
		wrapperClassName = '',
		innerClassName = '',
		children,
		...restProps
	}: Props & { children?: any } = $props();

	let isActive = $state(false);
	let position = $state({ x: 0, y: 0 });
	let magnetRef: HTMLDivElement;
	let innerRef: HTMLDivElement;

	$effect(() => {
		// Track disabled, padding, and magnetStrength as dependencies
		const currentDisabled = disabled;
		const currentPadding = padding;

		if (currentDisabled) {
			position = { x: 0, y: 0 };
			isActive = false;
			return;
		}

		const handler = (e: MouseEvent) => {
			if (!magnetRef || !innerRef || currentDisabled) return;

			const wrapperRect = magnetRef.getBoundingClientRect();
			const innerRect = innerRef.getBoundingClientRect();

			const centerX = innerRect.left + innerRect.width / 2;
			const centerY = innerRect.top + innerRect.height / 2;

			const distX = Math.abs(centerX - e.clientX);
			const distY = Math.abs(centerY - e.clientY);

			const threshold = wrapperRect.width / 2 + currentPadding;

			if (distX < threshold && distY < threshold) {
				isActive = true;
				const wrapperCenterX = wrapperRect.left + wrapperRect.width / 2;
				const wrapperCenterY = wrapperRect.top + wrapperRect.height / 2;

				const deltaX = e.clientX - wrapperCenterX;
				const deltaY = e.clientY - wrapperCenterY;
				const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

				const maxDistance = wrapperRect.width / 2 + currentPadding;
				const moveRatio = Math.min(0.8, 1 - (distance / maxDistance) * 0.3);

				const offsetX = deltaX * moveRatio;
				const offsetY = deltaY * moveRatio;
				position = { x: offsetX, y: offsetY };
			} else {
				isActive = false;
				position = { x: 0, y: 0 };
			}
		};

		window.addEventListener('mousemove', handler);

		return () => {
			window.removeEventListener('mousemove', handler);
		};
	});
</script>

<div
	bind:this={magnetRef}
	class={wrapperClassName}
	style="position: relative; display: inline-block;"
	{...restProps}
>
	<div
		bind:this={innerRef}
		class={innerClassName}
		style="transform: translate3d({position.x}px, {position.y}px, 0); transition: {isActive
			? activeTransition
			: inactiveTransition}; will-change: transform;"
	>
		{@render children()}
	</div>
</div>
