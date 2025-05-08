<script>
  import { createEventDispatcher } from 'svelte';
  
  export let question = {
    id: '',
    questionText: '',
    explanation: null,
    answers: []
  };
  
  export let selectedAnswerId = null;
  export let selectedAnswerIds = [];
  export let showExplanation = false;
  export let isSubmitted = false;
  export let isCorrect = null;
  
  const dispatch = createEventDispatcher();
  
  // Check if question requires multiple answers
  const isMultipleAnswerQuestion = question.questionText.includes('(Select TWO.)') || 
                                   question.questionText.includes('(Select TWO)') || 
                                   question.questionText.includes('(Select two.)') ||
                                   question.questionText.includes('(Choose two)') ||
                                   question.questionText.includes('(Choose TWO)');
  
  function selectAnswer(answerId) {
    if (isSubmitted) return; // Prevent changing answer after submission
    
    if (isMultipleAnswerQuestion) {
      // Toggle selection for multiple answer questions
      const index = selectedAnswerIds.indexOf(answerId);
      if (index === -1) {
        selectedAnswerIds = [...selectedAnswerIds, answerId];
      } else {
        selectedAnswerIds = selectedAnswerIds.filter(id => id !== answerId);
      }
      dispatch('selectMultiple', { answerIds: selectedAnswerIds });
    } else {
      // Single answer selection
      selectedAnswerId = answerId;
      dispatch('select', { answerId });
    }
  }
  
  function handleKeyDown(event, answerId) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectAnswer(answerId);
    }
  }
  
  function isAnswerSelected(answerId) {
    if (isMultipleAnswerQuestion) {
      return selectedAnswerIds.includes(answerId);
    } else {
      return selectedAnswerId === answerId;
    }
  }
  
  function isSubmitDisabled() {
    if (isSubmitted) return true;
    
    if (isMultipleAnswerQuestion) {
      // Require exactly 2 selections for multiple answer questions
      return selectedAnswerIds.length !== 2;
    } else {
      return !selectedAnswerId;
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
          isAnswerSelected(answer.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
        } {
          isSubmitted && isAnswerSelected(answer.id) && (isMultipleAnswerQuestion ? 
            (answer.isCorrect ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500') : 
            (isCorrect ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'))
        } {
          isSubmitted && answer.isCorrect && !isAnswerSelected(answer.id) ? 'bg-green-50 border-green-300' : ''
        } {
          isMultipleAnswerQuestion && isAnswerSelected(answer.id) ? 'flex items-center' : ''
        }"
        on:click={() => selectAnswer(answer.id)}
        on:keydown={(e) => handleKeyDown(e, answer.id)}
        disabled={isSubmitted}
      >
        {#if isMultipleAnswerQuestion}
          <div class="flex items-center">
            <div class="w-6 h-6 mr-3 border border-gray-400 rounded {isAnswerSelected(answer.id) ? 'bg-blue-500 border-blue-500' : ''}">
              {#if isAnswerSelected(answer.id)}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="w-6 h-6">
                  <path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clip-rule="evenodd" />
                </svg>
              {/if}
            </div>
            <span>{answer.answerText}</span>
          </div>
        {:else}
          {answer.answerText}
        {/if}
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
      disabled={isSubmitDisabled()}
    >
      Submit Answer{isMultipleAnswerQuestion ? 's' : ''}
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