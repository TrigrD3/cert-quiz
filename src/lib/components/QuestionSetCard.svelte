<script>
  export let questionSet = {
    id: '',
    title: '',
    description: '',
    certificationType: {
      name: ''
    },
    _count: {
      questions: 0
    }
  };

  let isCreatingShuffled = false;
  let error = '';
  let shuffledSet = null;

  // Check if this is already a shuffled version
  const isShuffledVersion = questionSet.title.includes('(Shuffled)');

  async function createShuffledVersion() {
    if (isCreatingShuffled) return;
    
    isCreatingShuffled = true;
    error = '';
    
    try {
      const response = await fetch('/api/question-sets/create-shuffled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionSetId: questionSet.id
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        error = result.error || 'Failed to create shuffled version';
        return;
      }
      
      shuffledSet = result.questionSet;
    } catch (err) {
      console.error('Error creating shuffled version:', err);
      error = 'An unexpected error occurred';
    } finally {
      isCreatingShuffled = false;
    }
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h3 class="text-xl font-semibold mb-2">{questionSet.title}</h3>
  
  <div class="mb-2">
    <span class="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
      {questionSet.certificationType.name}
    </span>
    
    {#if isShuffledVersion}
      <span class="inline-block bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full ml-2">
        Shuffled Questions
      </span>
    {/if}
  </div>
  
  {#if questionSet.description}
    <p class="text-gray-600 mb-4">{questionSet.description}</p>
  {/if}
  
  <div class="flex items-center justify-between mb-4">
    <span class="text-gray-700">{questionSet._count.questions} questions</span>
  </div>
  
  <div class="flex flex-wrap gap-2">
    <a 
      href="/quiz/{questionSet.id}" 
      class="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    >
      Start Quiz
    </a>
    
    {#if !isShuffledVersion}
      {#if shuffledSet}
        <a 
          href="/quiz/{shuffledSet.id}" 
          class="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Try Shuffled Version
        </a>
      {:else}
        <button 
          on:click={createShuffledVersion}
          class="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isCreatingShuffled}
        >
          {isCreatingShuffled ? 'Creating...' : 'Create Shuffled Version'}
        </button>
      {/if}
    {/if}
  </div>
  
  {#if error}
    <p class="mt-2 text-red-600 text-sm">{error}</p>
  {/if}
</div>