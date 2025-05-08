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
  let isCreatingChallenge = false;
  let isCreatingChallengeShuffled = false;
  let error = '';
  let shuffledSet = null;
  let challengeSet = null;
  let challengeShuffledSet = null;

  // Check if this is already a special version
  const isShuffledVersion = questionSet.title.includes('(Shuffled)');
  const isChallengeVersion = questionSet.title.includes('Challenge Mode');
  const isSpecialVersion = isShuffledVersion || isChallengeVersion;

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
  
  async function createChallengeVersion(shuffle = false) {
    if (shuffle) {
      if (isCreatingChallengeShuffled) return;
      isCreatingChallengeShuffled = true;
    } else {
      if (isCreatingChallenge) return;
      isCreatingChallenge = true;
    }
    
    error = '';
    
    try {
      const response = await fetch('/api/question-sets/create-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionSetId: questionSet.id,
          shuffle
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        error = result.error || 'Failed to create challenge version';
        return;
      }
      
      if (shuffle) {
        challengeShuffledSet = result.questionSet;
      } else {
        challengeSet = result.questionSet;
      }
    } catch (err) {
      console.error('Error creating challenge version:', err);
      error = 'An unexpected error occurred';
    } finally {
      if (shuffle) {
        isCreatingChallengeShuffled = false;
      } else {
        isCreatingChallenge = false;
      }
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
    
    {#if isChallengeVersion}
      <span class="inline-block bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full ml-2">
        Challenge Mode
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
    
    {#if !isSpecialVersion}
      <!-- Shuffled Version Button -->
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
      
      <!-- Challenge Mode Button -->
      {#if challengeSet}
        <a 
          href="/quiz/{challengeSet.id}" 
          class="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Challenge Mode (Fixed)
        </a>
      {:else}
        <button 
          on:click={() => createChallengeVersion(false)}
          class="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isCreatingChallenge}
        >
          {isCreatingChallenge ? 'Creating...' : 'Challenge Mode (Fixed)'}
        </button>
      {/if}
      
      <!-- Challenge Mode Shuffled Button -->
      {#if challengeShuffledSet}
        <a 
          href="/quiz/{challengeShuffledSet.id}" 
          class="inline-block px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Challenge Mode (Shuffled)
        </a>
      {:else}
        <button 
          on:click={() => createChallengeVersion(true)}
          class="inline-block px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isCreatingChallengeShuffled}
        >
          {isCreatingChallengeShuffled ? 'Creating...' : 'Challenge Mode (Shuffled)'}
        </button>
      {/if}
    {/if}
  </div>
  
  {#if error}
    <p class="mt-2 text-red-600 text-sm">{error}</p>
  {/if}
</div>