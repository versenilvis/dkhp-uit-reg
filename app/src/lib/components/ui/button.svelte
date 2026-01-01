<script lang="ts">
	export let href: string | null = null;
	export let target: string | undefined = undefined;
	export let variant: 'default' | 'reverse' | 'neutral' = 'default';
	export let className = '';

	let pressed = false;

	const colors = {
		default: 'bg-yellow-400 text-black',
		reverse: 'bg-black text-white',
		neutral: 'bg-white text-black'
	};

	// quyết định render thẻ gì
	$: tag = href ? 'a' : 'button';
</script>

<div class="inline-block relative">
	<!-- SHADOW (đứng yên) -->
	<div
		class="absolute inset-0 translate-x-1 translate-y-1
		       border-2 border-black rounded-lg
		       bg-black"
		aria-hidden="true"
	></div>

	<!-- MAIN ELEMENT -->
	{#if href}
		<a
			{href}
			{target}
			class={`
				relative z-10 inline-flex items-center justify-center
				border-2 border-black rounded-lg
				px-4 py-2 font-bold uppercase text-sm
				select-none transition-transform duration-75
                hover:bg-gray-100
				${colors[variant]} ${className}
			`}
			class:translate-x-1={pressed}
			class:translate-y-1={pressed}
			on:mousedown={() => (pressed = true)}
			on:mouseup={() => (pressed = false)}
			on:mouseleave={() => (pressed = false)}
		>
			<slot />
		</a>
	{:else}
		<button
			class={`
				relative z-10 inline-flex items-center justify-center
				border-2 border-black rounded-lg
				px-4 py-2 font-bold uppercase text-sm
				select-none transition-transform duration-75
				${colors[variant]} ${className}
			`}
			class:translate-x-1={pressed}
			class:translate-y-1={pressed}
			on:mousedown={() => (pressed = true)}
			on:mouseup={() => (pressed = false)}
			on:mouseleave={() => (pressed = false)}
		>
			<slot />
		</button>
	{/if}
</div>
