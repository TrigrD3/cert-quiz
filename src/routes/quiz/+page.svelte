<script>
  import { onMount } from 'svelte';
  import QuestionSetCard from '$lib/components/QuestionSetCard.svelte';
  
  let questionSets = [];
  let isLoading = true;
  
  onMount(async () => {
    try {
      const response = await fetch('/api/question-sets');
      if (response.ok) {
        questionSets = await response.json();
      } else {
        console.error('Failed to fetch question sets');
      }
    } catch (error) {
      console.error('Error loading question sets:', error);
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="max-w-4xl mx-auto">
  <h1 class="text-3xl font-bold mb-6">AWS Certification Question Sets</h1>
  
  {#if isLoading}
    <p class="text-gray-600">Loading question sets...</p>
  {:else if questionSets.length === 0}
    <p class="text-gray-600">No question sets available at the moment. Please check back later.</p>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each questionSets as questionSet}
        <QuestionSetCard {questionSet} />
      {/each}
    </div>
  {/if}
</div>