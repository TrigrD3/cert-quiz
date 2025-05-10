<script>
  import { onMount } from 'svelte';
  import QuestionSetCard from '$lib/components/QuestionSetCard.svelte';
  import QuizResultCard from '$lib/components/QuizResultCard.svelte';
  
  let questionSets = [];
  let recentAttempts = [];
  let isLoading = true;
  let isLoggedIn = false;
  
  onMount(async () => {
    isLoading = true;
    
    try {
      // Check if user is logged in
      const token = localStorage.getItem('authToken');
      if (token) {
        isLoggedIn = true;
        
        // Get recent attempts if logged in
        const statsResponse = await fetch('/api/user/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (statsResponse.ok) {
          const data = await statsResponse.json();
          recentAttempts = data.history.slice(0, 3); // Show only 3 most recent attempts
        }
      }
      
      // Get available question sets
      const response = await fetch('/api/question-sets');
      if (response.ok) {
        questionSets = await response.json();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="max-w-4xl mx-auto">
  <section class="mb-12">
    <h1 class="text-3xl font-bold mb-2">AWS Certification Quiz</h1>
    <p class="text-lg text-gray-700 mb-6">
      Practice for your AWS Associate and Professional Solution Architect certifications with our
      comprehensive quiz sets.
    </p>
    
    <!-- Features card (full width) -->
    <div class="mb-6">
      <div class="bg-blue-600 text-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4">Features</h2>
        <ul class="list-disc list-inside space-y-2">
          <li>Practice with real AWS exam-style questions</li>
          <li>Track your progress and performance</li>
          <li>Study at your own pace, anytime</li>
          <li>Review explanations to understand concepts</li>
          <li>Mobile-friendly interface</li>
          <li>Time limits: 1 hour for question sets with ≤ 50 questions, 2 hours for larger sets</li>
          <li>Challenge mode with 5-mistake limit</li>
        </ul>
        
        <a 
          href="/quiz" 
          class="inline-block mt-6 px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100"
        >
          Start Practicing
        </a>
      </div>
    </div>
    
    <!-- Recent Attempts or Account Features (full width) -->
    {#if isLoggedIn && recentAttempts.length > 0}
      <div class="mb-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4">Recent Attempts</h2>
          <div class="space-y-4">
            {#each recentAttempts as attempt}
              <QuizResultCard 
                result={attempt} 
                questionSetTitle={attempt.questionSet.title}
              />
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <div class="mb-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4">Account Features</h2>
          <p class="text-gray-700 mb-4">
            Create an account to track your progress and view detailed statistics on your
            performance across all certification types.
          </p>
          
          {#if !isLoggedIn}
            <div class="flex space-x-4">
              <a 
                href="/auth/login" 
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Login
              </a>
              <a 
                href="/auth/register" 
                class="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
              >
                Register
              </a>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </section>
  
  <section class="mb-12">
    <h2 class="text-2xl font-bold mb-6">Available Question Sets</h2>
    
    {#if isLoading}
      <p class="text-gray-600">Loading available question sets...</p>
    {:else if questionSets.length === 0}
      <p class="text-gray-600">No question sets available at the moment. Please check back later.</p>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each questionSets as questionSet}
          <QuestionSetCard {questionSet} />
        {/each}
      </div>
    {/if}
  </section>
</div>