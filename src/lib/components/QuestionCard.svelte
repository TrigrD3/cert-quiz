<script>
  import { createEventDispatcher } from 'svelte';
  
  export let question = {
    id: '',
    questionText: '',
    explanation: null,
    answers: []
  };
  
  export let selectedAnswerId = null;
  export let showExplanation = false;
  export let isSubmitted = false;
  export let isCorrect = null;
  
  const dispatch = createEventDispatcher();
  
  function selectAnswer(answerId) {
    if (isSubmitted) return; // Prevent changing answer after submission
    selectedAnswerId = answerId;
    dispatch('select', { answerId });
  }
  
  function handleKeyDown(event, answerId) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectAnswer(answerId);
    }
  }
</script>

<div class="bg-white p-6 rounded-lg shadow-md">
  <h3 class="text-xl font-semibold mb-4">{question.questionText}</h3>
  
  <div class="space-y-3 mb-4">
    {#each question.answers as answer}
      <button 
        type="button"
        class="p-3 border w-full text-left rounded-md cursor-pointer transition-colors {
          selectedAnswerId === answer.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
        } {
          isSubmitted && answer.id === selectedAnswerId && isCorrect ? 'bg-green-100 border-green-500' : ''
        } {
          isSubmitted && answer.id === selectedAnswerId && !isCorrect ? 'bg-red-100 border-red-500' : ''
        } {
          isSubmitted && answer.isCorrect && answer.id !== selectedAnswerId ? 'bg-green-50 border-green-300' : ''
        }"
        on:click={() => selectAnswer(answer.id)}
        on:keydown={(e) => handleKeyDown(e, answer.id)}
        disabled={isSubmitted}
      >
        {answer.answerText}
      </button>
    {/each}
  </div>
  
  {#if showExplanation && question.explanation}
    <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <h4 class="font-semibold text-yellow-800 mb-1">Explanation:</h4>
      <p>{question.explanation}</p>
    </div>
  {/if}
  
  <div class="mt-4 flex justify-between">
    <button 
      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      on:click={() => dispatch('submit')}
      disabled={!selectedAnswerId || isSubmitted}
    >
      Submit Answer
    </button>
    
    {#if isSubmitted}
      <button 
        class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        on:click={() => dispatch('next')}
      >
        Next Question
      </button>
    {/if}
  </div>
</div>