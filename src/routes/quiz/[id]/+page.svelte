<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import QuestionCard from '$lib/components/QuestionCard.svelte';
  import QuizResultCard from '$lib/components/QuizResultCard.svelte';
  
  const questionSetId = $page.params.id;
  
  let questionSet = null;
  let currentQuestionIndex = 0;
  let quizAttempt = null;
  let selectedAnswerId = null;
  let selectedAnswerIds = [];
  let isSubmitted = false;
  let isCorrect = null;
  let showExplanation = false;
  let isLoading = true;
  let error = null;
  let quizCompleted = false;
  let quizResult = null;
  let quizFailed = false;
  let mistakeCount = 0;
  let isChallengeMode = false;
  let maxMistakes = 5;
  
  // Timer variables
  let startTime = null;
  let elapsedTime = 0;
  let timer = null;
  
  // Helper function to save quiz state to localStorage
  function saveQuizState() {
    if (!quizAttempt || quizCompleted) return;
    
    const quizState = {
      questionSetId,
      quizAttemptId: quizAttempt.id,
      currentQuestionIndex,
      elapsedTime,
      isChallengeMode,
      mistakeCount,
      isSubmitted,
      selectedAnswerId,
      selectedAnswerIds,
      isCorrect,
      showExplanation,
      startTime: Date.now() - (elapsedTime * 1000), // Calculate original start time
      lastSaved: Date.now()
    };
    
    localStorage.setItem(`quizState_${questionSetId}`, JSON.stringify(quizState));
    console.log('Saved quiz state:', quizState);
  }
  
  // Helper function to restore quiz state from localStorage
  async function restoreQuizState() {
    try {
      const savedStateStr = localStorage.getItem(`quizState_${questionSetId}`);
      if (!savedStateStr) return false;
      
      const savedState = JSON.parse(savedStateStr);
      console.log('Found saved state:', savedState);
      
      // Check if the saved state is for the current quiz and not too old (24 hours max)
      const isExpired = (Date.now() - savedState.lastSaved) > (24 * 60 * 60 * 1000);
      if (savedState.questionSetId !== questionSetId || isExpired) {
        localStorage.removeItem(`quizState_${questionSetId}`);
        return false;
      }
      
      // Fetch the attempt to see if it's still valid
      const attemptResponse = await fetch(`/api/quiz/attempt/${savedState.quizAttemptId}`);
      if (!attemptResponse.ok) return false;
      
      quizAttempt = await attemptResponse.json();
      
      // If attempt is already completed, don't restore
      if (quizAttempt.completedAt) {
        localStorage.removeItem(`quizState_${questionSetId}`);
        return false;
      }
      
      // Restore state
      currentQuestionIndex = savedState.currentQuestionIndex;
      isSubmitted = savedState.isSubmitted;
      selectedAnswerId = savedState.selectedAnswerId;
      selectedAnswerIds = savedState.selectedAnswerIds || [];
      isCorrect = savedState.isCorrect;
      showExplanation = savedState.showExplanation;
      isChallengeMode = savedState.isChallengeMode;
      mistakeCount = savedState.mistakeCount;
      
      // Restore timer state
      startTime = savedState.startTime;
      elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      
      return true;
    } catch (err) {
      console.error('Error restoring quiz state:', err);
      localStorage.removeItem(`quizState_${questionSetId}`);
      return false;
    }
  }

  onMount(async () => {
    try {
      // First fetch the question set metadata (without questions)
      // to determine if it's a shuffled set
      const metaResponse = await fetch(`/api/question-sets/${questionSetId}`);
      
      if (!metaResponse.ok) {
        error = 'Failed to load question set';
        return;
      }
      
      const questionSetMeta = await metaResponse.json();
      
      // Determine if this is a shuffled question set by checking title
      const isShuffledSet = questionSetMeta.title.includes('(Shuffled)');
      
      // Now fetch the full question set with shuffled questions if applicable
      const fullDataUrl = isShuffledSet 
        ? `/api/question-sets/${questionSetId}?shuffle=true` 
        : `/api/question-sets/${questionSetId}`;
        
      const fullDataResponse = await fetch(fullDataUrl);
      
      if (!fullDataResponse.ok) {
        error = 'Failed to load question set data';
        return;
      }
      
      questionSet = await fullDataResponse.json();
      
      // Check if this is a challenge mode question set
      isChallengeMode = questionSet.title.includes('Challenge Mode');
      
      // Try to restore saved state
      const restored = await restoreQuizState();
      
      if (!restored) {
        // If no saved state, create a new quiz attempt
        const token = localStorage.getItem('authToken');
        const attemptResponse = await fetch('/api/quiz/attempt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            questionSetId,
            token,
            shuffleQuestions: isShuffledSet,
            isChallengeMode,
            maxMistakes
          })
        });
        
        if (!attemptResponse.ok) {
          error = 'Failed to create quiz attempt';
          return;
        }
        
        quizAttempt = await attemptResponse.json();
        
        // Initialize selectedAnswerIds
        selectedAnswerIds = [];
        
        // Start timer
        startTime = Date.now();
      }
      
      // Start/continue timer
      timer = setInterval(() => {
        elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        // Save state every 10 seconds
        if (elapsedTime % 10 === 0) {
          saveQuizState();
        }
      }, 1000);
      
    } catch (err) {
      console.error('Error setting up quiz:', err);
      error = 'An error occurred while setting up the quiz';
    } finally {
      isLoading = false;
    }
    
    return () => {
      if (timer) clearInterval(timer);
      
      // Save state when component is unmounted
      if (!quizCompleted && quizAttempt) {
        saveQuizState();
      }
    };
  });
  
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  function isMultipleAnswerQuestion() {
    if (!getCurrentQuestion()) return false;
    const questionText = getCurrentQuestion().questionText;
    return questionText.includes('(Select TWO.)') || 
           questionText.includes('(Select TWO)') || 
           questionText.includes('(Select two.)') ||
           questionText.includes('(Choose two)') ||
           questionText.includes('(Choose TWO)');
  }
  
  async function submitAnswer() {
    if ((isMultipleAnswerQuestion() && selectedAnswerIds.length !== 2) || 
        (!isMultipleAnswerQuestion() && !selectedAnswerId) || 
        isSubmitted) return;
    
    try {
      // Calculate time spent on this question
      const questionTimeSpent = elapsedTime;
      
      if (isMultipleAnswerQuestion()) {
        console.log("Submitting multiple answers:", selectedAnswerIds);
        
        // For multiple answer questions, we need to submit multiple answers
        const results = await Promise.all(selectedAnswerIds.map(async (answerId) => {
          const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              quizAttemptId: quizAttempt.id,
              questionId: getCurrentQuestion().id,
              answerId,
              timeSpent: questionTimeSpent / selectedAnswerIds.length, // Split time between answers
              isMultipleAnswer: true
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to submit answer');
          }
          
          return response.json();
        }));
        
        console.log("Multiple answer submission results:", results);
        
        // Mark as correct if ALL submitted answers are correct
        isCorrect = results.every(result => result.isCorrect);
        
        // For challenge mode, check if any answer was incorrect and triggered a failure
        if (isChallengeMode) {
          const anyFailed = results.some(result => result.attemptFailed);
          if (anyFailed) {
            quizFailed = true;
          } else if (!isCorrect) {
            // Increment mistake count only if not already failed
            mistakeCount++;
          }
        }
      } else {
        // Single answer submission
        const response = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            quizAttemptId: quizAttempt.id,
            questionId: getCurrentQuestion().id,
            answerId: selectedAnswerId,
            timeSpent: questionTimeSpent
          })
        });
        
        if (!response.ok) {
          console.error('Failed to submit answer');
          return;
        }
        
        const result = await response.json();
        isCorrect = result.isCorrect;
        
        // Check if challenge mode failed
        if (isChallengeMode) {
          if (result.attemptFailed) {
            quizFailed = true;
          } else if (!isCorrect) {
            // Increment mistake count only if not already failed
            mistakeCount++;
          }
        }
      }
      
      isSubmitted = true;
      showExplanation = true;
      
      // Save state after submitting answer
      saveQuizState();
      
      // If the quiz was failed in challenge mode, complete it
      if (quizFailed) {
        if (timer) clearInterval(timer);
        
        try {
          // Get the current quiz attempt with correct answers count
          const response = await fetch(`/api/quiz/attempt/${quizAttempt.id}`);
          
          if (!response.ok) {
            throw new Error('Failed to get quiz attempt details');
          }
          
          const currentAttempt = await response.json();
          
          quizCompleted = true;
          quizResult = {
            score: 0,
            totalQuestions: questionSet.questions.length,
            correctAnswers: currentAttempt.correctAnswers || 0,
            failed: true,
            startedAt: currentAttempt.startedAt,
            completedAt: currentAttempt.completedAt,
            message: `Challenge failed! You made more than ${maxMistakes} mistakes.`
          };
          
          // Remove saved state when quiz fails
          localStorage.removeItem(`quizState_${questionSetId}`);
        } catch (err) {
          console.error('Error fetching quiz attempt details:', err);
          
          // Fallback in case of error
          quizCompleted = true;
          quizResult = {
            score: 0,
            totalQuestions: questionSet.questions.length,
            correctAnswers: 0,
            failed: true,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            message: `Challenge failed! You made more than ${maxMistakes} mistakes.`
          };
          
          // Remove saved state when quiz fails
          localStorage.removeItem(`quizState_${questionSetId}`);
        }
      }
      
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  }
  
  async function nextQuestion() {
    isSubmitted = false;
    showExplanation = false;
    selectedAnswerId = null;
    selectedAnswerIds = []; // Reset multiple answers array
    isCorrect = null;
    
    if (currentQuestionIndex < questionSet.questions.length - 1) {
      currentQuestionIndex++;
      startTime = Date.now();
      
      // Save state after moving to next question
      saveQuizState();
    } else {
      // Complete the quiz
      if (timer) clearInterval(timer);
      
      try {
        const response = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            quizAttemptId: quizAttempt.id,
            complete: true
          })
        });
        
        if (!response.ok) {
          console.error('Failed to complete quiz');
          return;
        }
        
        quizResult = await response.json();
        quizCompleted = true;
        
        // Remove saved state when quiz is completed
        localStorage.removeItem(`quizState_${questionSetId}`);
      } catch (err) {
        console.error('Error completing quiz:', err);
      }
    }
  }
  
  function getCurrentQuestion() {
    if (!questionSet || !questionSet.questions) return null;
    return questionSet.questions[currentQuestionIndex];
  }
  
  function getProgressPercent() {
    if (!questionSet) return 0;
    return (currentQuestionIndex / questionSet.questions.length) * 100;
  }
  
  function handleSelectMultiple(event) {
    console.log("Multiple selection event:", event.detail);
    // Ensure we're getting an array
    if (Array.isArray(event.detail.answerIds)) {
      selectedAnswerIds = [...event.detail.answerIds];
      console.log("Updated selectedAnswerIds:", selectedAnswerIds);
    } else {
      console.error("Received non-array answerIds:", event.detail.answerIds);
    }
  }
</script>

<div class="max-w-3xl mx-auto">
  {#if isLoading}
    <div class="text-center py-12">
      <p class="text-gray-600">Loading quiz...</p>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <p>{error}</p>
      <a href="/quiz" class="text-blue-600 hover:underline">Back to Question Sets</a>
    </div>
  {:else if quizCompleted}
    <div class="text-center">
      <h1 class="text-3xl font-bold mb-6">Quiz Completed!</h1>
      
      <div class="max-w-md mx-auto">
        <QuizResultCard 
          result={quizResult} 
          questionSetTitle={questionSet.title}
          detailed={true}
        />
        
        <div class="mt-6 space-x-4">
          <a 
            href="/quiz" 
            class="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Another Quiz
          </a>
          <a 
            href="/" 
            class="inline-block px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  {:else}
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold">{questionSet.title}</h1>
      <div class="text-gray-600">
        <span class="font-medium">
          Question {currentQuestionIndex + 1} of {questionSet.questions.length}
        </span>
        <span class="ml-4">Time: {formatTime(elapsedTime)}</span>
        {#if isChallengeMode}
          <span class="ml-4 font-medium {mistakeCount > (maxMistakes - 2) ? 'text-red-600' : 'text-amber-600'}">
            Mistakes: {mistakeCount}/{maxMistakes}
          </span>
        {/if}
      </div>
    </div>
    
    <div class="w-full bg-gray-200 rounded-full h-2.5 mb-6">
      <div 
        class="bg-blue-600 h-2.5 rounded-full" 
        style="width: {getProgressPercent()}%"
      ></div>
    </div>
    
    {#if getCurrentQuestion()}
      <QuestionCard 
        question={getCurrentQuestion()}
        bind:selectedAnswerId
        bind:selectedAnswerIds
        bind:showExplanation
        bind:isSubmitted
        bind:isCorrect
        on:submit={submitAnswer}
        on:next={nextQuestion}
        on:select={() => {}}
        on:selectMultiple={handleSelectMultiple}
      />
    {/if}
  {/if}
</div>