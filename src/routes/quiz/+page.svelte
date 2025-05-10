<script>
  import { onMount } from 'svelte';
  import QuestionSetCard from '$lib/components/QuestionSetCard.svelte';
  
  let questionSets = [];
  let isLoading = true;
  
  // Get unique base question sets by removing redundant versions
  async function getUniqueBaseSets() {
    try {
      const response = await fetch('/api/question-sets');
      if (!response.ok) {
        console.error('Failed to fetch question sets');
        return [];
      }
      
      const allSets = await response.json();
      const uniqueTitles = new Set();
      const result = [];
      
      // Step 1: Extract base titles from all question sets
      // For "AWS Solutions Architect (Shuffled)" or "AWS Solutions Architect (Challenge Mode)" 
      // we extract "AWS Solutions Architect" as the base title
      const baseTitleMap = new Map();
      
      allSets.forEach(set => {
        let baseTitle = set.title;
        
        // Extract base title by removing suffixes
        if (baseTitle.includes('(Shuffled)')) {
          baseTitle = baseTitle.replace(' (Shuffled)', '');
        } else if (baseTitle.includes('(Challenge Mode')) {
          baseTitle = baseTitle.replace(/ \(Challenge Mode.*\)/, '');
        }
        
        // Map each question set to its base title
        if (!baseTitleMap.has(baseTitle)) {
          baseTitleMap.set(baseTitle, []);
        }
        baseTitleMap.get(baseTitle).push(set);
      });
      
      // Step 2: For each base title, find the original question set
      // If no original exists, choose any variant
      for (const [baseTitle, sets] of baseTitleMap.entries()) {
        // Try to find the original set (exact title match)
        const originalSet = sets.find(s => s.title === baseTitle);
        
        if (originalSet) {
          result.push(originalSet);
        } else if (sets.length > 0) {
          // If no original set exists, take the first variant
          result.push(sets[0]);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error processing question sets:', error);
      return [];
    }
  }
  
  onMount(async () => {
    try {
      questionSets = await getUniqueBaseSets();
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