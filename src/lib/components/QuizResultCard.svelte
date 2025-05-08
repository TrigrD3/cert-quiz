<script>
  export let result = {
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    startedAt: '',
    completedAt: '' 
  };
  
  export let questionSetTitle = '';
  export let detailed = false;
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
  
  function getScoreClass(score) {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6 {detailed ? 'w-full' : 'w-72'}">
  <h3 class="text-lg font-semibold mb-2">{questionSetTitle}</h3>
  
  <div class="flex items-center justify-between mb-3">
    <span class="text-gray-700">Score:</span>
    <span class="text-xl font-bold {getScoreClass(result.score)}">{result.score.toFixed(1)}%</span>
  </div>
  
  <div class="flex items-center justify-between mb-2">
    <span class="text-gray-700">Correct:</span>
    <span>{result.correctAnswers} / {result.totalQuestions}</span>
  </div>
  
  {#if detailed}
    <div class="text-sm text-gray-600 mt-4">
      <div class="flex justify-between mb-1">
        <span>Started:</span>
        <span>{formatDate(result.startedAt)}</span>
      </div>
      <div class="flex justify-between">
        <span>Completed:</span>
        <span>{formatDate(result.completedAt)}</span>
      </div>
    </div>
  {/if}
  
  <div class="mt-4">
    {#if !detailed}
      <a href="/stats" class="text-blue-600 hover:underline text-sm">
        View Details
      </a>
    {/if}
  </div>
</div>