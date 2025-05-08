<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import QuizResultCard from '$lib/components/QuizResultCard.svelte';
  
  let isLoading = true;
  let history = [];
  let stats = { overall: {}, certifications: {} };
  let error = '';
  
  onMount(async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      goto('/auth/login');
      return;
    }
    
    try {
      const response = await fetch('/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token invalid or expired
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          goto('/auth/login');
          return;
        }
        
        error = 'Failed to load statistics';
        return;
      }
      
      const data = await response.json();
      history = data.history;
      stats = data.stats;
      
    } catch (err) {
      console.error('Error loading stats:', err);
      error = 'An error occurred while loading your statistics';
    } finally {
      isLoading = false;
    }
  });
  
  function formatPercent(value) {
    return value ? value.toFixed(1) + '%' : '0%';
  }
</script>

<div class="max-w-4xl mx-auto">
  <h1 class="text-3xl font-bold mb-6">Your Quiz Statistics</h1>
  
  {#if isLoading}
    <p class="text-gray-600">Loading your statistics...</p>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <p>{error}</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-lg font-semibold mb-3">Overall Performance</h2>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-600">Total Attempts:</span>
            <span class="font-semibold">{stats.overall.totalAttempts || 0}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Average Score:</span>
            <span class="font-semibold">{formatPercent(stats.overall.avgScore)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Best Score:</span>
            <span class="font-semibold">{formatPercent(stats.overall.bestScore)}</span>
          </div>
        </div>
      </div>
      
      {#each Object.entries(stats.certifications) as [certName, certStats]}
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-lg font-semibold mb-3">{certName}</h2>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">Attempts:</span>
              <span class="font-semibold">{certStats.totalAttempts}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Avg Score:</span>
              <span class="font-semibold">{formatPercent(certStats.avgScore)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Best Score:</span>
              <span class="font-semibold">{formatPercent(certStats.bestScore)}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    <h2 class="text-2xl font-bold mb-4">Quiz History</h2>
    
    {#if history.length === 0}
      <p class="text-gray-600">You haven't completed any quizzes yet.</p>
    {:else}
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quiz
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Correct
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each history as attempt}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{attempt.questionSet.title}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{attempt.score.toFixed(1)}%</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{attempt.correctAnswers} / {attempt.totalQuestions}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {new Date(attempt.completedAt).toLocaleDateString()}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>