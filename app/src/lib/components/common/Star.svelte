<script lang="ts">
	interface Props {
		class?: string;
		size?: number;
		rotation?: number;
	}

	let { class: className = '', size = 24, rotation = 0 }: Props = $props();
</script>

<div style="transform: rotate({rotation}deg); display: inline-block; transform-origin: center;">
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="white"
		stroke="black"
		stroke-width="0.8"
		aria-hidden="true"
		class="star {className}"
		style="display: block;"
	>
		<path
			d="M12 2
			   C12.6 6.2 13.8 7.4 18 8
			   C13.8 8.6 12.6 9.8 12 14
			   C11.4 9.8 10.2 8.6 6 8
			   C10.2 7.4 11.4 6.2 12 2Z"
		/>
	</svg>
</div>
