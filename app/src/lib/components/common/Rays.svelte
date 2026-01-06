<script lang="ts">
	interface Props {
		className?: string;
	}
	let { className = '' }: Props = $props();
</script>

<div class={`absolute ${className}`}>
	<div
		class="absolute"
		style="
        top: 0;
        transform-origin: left center;
        transform: rotate(-115deg);
      "
	>
		<svg width="34" height="14" viewBox="0 0 40 12" xmlns="http://www.w3.org/2000/svg">
			<polygon points="0,4 6,1 40,0 40,12 6,11 0,8" fill="white" stroke="#111" stroke-width="4" />
		</svg>
	</div>

	<div
		class="absolute"
		style="
        top: 15px;
        transform-origin: left center;
        transform: rotate(-150deg);
      "
	>
		<svg width="40" height="16" viewBox="0 0 44 12" xmlns="http://www.w3.org/2000/svg">
			<polygon points="0,4 7,1 44,0 44,12 7,11 0,8" fill="white" stroke="#111" stroke-width="4" />
		</svg>
	</div>

	<div
		class="absolute"
		style="
        top: 30px;
        transform-origin: left center;
        transform: rotate(175deg);
      "
	>
		<svg width="32" height="12" viewBox="0 0 38 12" xmlns="http://www.w3.org/2000/svg">
			<polygon points="0,4 5,1 38,0 38,12 5,11 0,8" fill="white" stroke="#111" stroke-width="4" />
		</svg>
	</div>
</div>
