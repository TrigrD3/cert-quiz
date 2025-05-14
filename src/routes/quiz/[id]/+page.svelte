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
  let selectedAnswerIds = []; // Ensure this is initialized as an array
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
  let timeLimitSeconds = 0;

  // Helper function to parse required selections from question text
  // (Can be moved to a shared utility if used elsewhere)
  function parseRequiredSelections(text) {
    if (!text) return 1;
    if (text.match(/\((Select|Choose)\s+THREE\.?\)/i)) return 3;
    if (text.match(/\((Select|Choose)\s+TWO\.?\)/i)) return 2;
    return 1; // Default to single answer
  }

  // Helper function to get the number of required selections for the current question
  function getRequiredSelectionsForCurrentQuestion() {
    const currentQ = getCurrentQuestion();
    if (!currentQ || !currentQ.questionText) return 1; // Default if no question or text
    return parseRequiredSelections(currentQ.questionText);
  }
  
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
      selectedAnswerIds, // Save this array
      isCorrect,
      showExplanation,
      startTime: Date.now() - (elapsedTime * 1000),
      lastSaved: Date.now()
    };
    
    localStorage.setItem(`quizState_${questionSetId}`, JSON.stringify(quizState));
    // console.log('Saved quiz state:', quizState);
  }
  
  // Helper function to restore quiz state from localStorage
  async function restoreQuizState() {
    try {
      const savedStateStr = localStorage.getItem(`quizState_${questionSetId}`);
      if (!savedStateStr) return false;
      
      const savedState = JSON.parse(savedStateStr);
      // console.log('Found saved state:', savedState);
      
      const isExpired = (Date.now() - savedState.lastSaved) > (24 * 60 * 60 * 1000);
      if (savedState.questionSetId !== questionSetId || isExpired) {
        localStorage.removeItem(`quizState_${questionSetId}`);
        return false;
      }
      
      const attemptResponse = await fetch(`/api/quiz/attempt/${savedState.quizAttemptId}`);
      if (!attemptResponse.ok) return false;
      
      quizAttempt = await attemptResponse.json();
      
      if (quizAttempt.completedAt) {
        localStorage.removeItem(`quizState_${questionSetId}`);
        return false;
      }
      
      currentQuestionIndex = savedState.currentQuestionIndex;
      isSubmitted = savedState.isSubmitted;
      selectedAnswerId = savedState.selectedAnswerId;
      // Ensure selectedAnswerIds is restored as an array
      selectedAnswerIds = Array.isArray(savedState.selectedAnswerIds) ? savedState.selectedAnswerIds : [];
      isCorrect = savedState.isCorrect;
      showExplanation = savedState.showExplanation;
      isChallengeMode = savedState.isChallengeMode;
      mistakeCount = savedState.mistakeCount;
      
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
      const metaResponse = await fetch(`/api/question-sets/${questionSetId}`);
      if (!metaResponse.ok) {
        error = 'Failed to load question set';
        return;
      }
      const questionSetMeta = await metaResponse.json();
      const isShuffledSet = questionSetMeta.title.includes('(Shuffled)');
      const fullDataUrl = isShuffledSet
        ? `/api/question-sets/${questionSetId}?shuffle=true`
        : `/api/question-sets/${questionSetId}`;
      const fullDataResponse = await fetch(fullDataUrl);
      if (!fullDataResponse.ok) {
        error = 'Failed to load question set data';
        return;
      }
      questionSet = await fullDataResponse.json();
      isChallengeMode = questionSet.title.includes('Challenge Mode');
      timeLimitSeconds = questionSet.questions.length > 50 ? 7200 : 3600;

      const restored = await restoreQuizState();

      if (!restored) {
        const token = localStorage.getItem('authToken');
        const attemptResponse = await fetch('/api/quiz/attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        selectedAnswerIds = []; // Initialize as empty array for new attempts
        startTime = Date.now();
      }

      timer = setInterval(() => {
        elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        if (elapsedTime % 10 === 0) saveQuizState();
        if (timeLimitSeconds > 0 && elapsedTime >= timeLimitSeconds) {
          clearInterval(timer);
          alert('Time limit reached! Your quiz will be submitted automatically.');
          completeQuizDueToTimeLimit();
        }
      }, 1000);

      window.addEventListener('beforeunload', handleBeforeUnload);
    } catch (err) {
      console.error('Error setting up quiz:', err);
      error = 'An error occurred while setting up the quiz';
    } finally {
      isLoading = false;
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timer) clearInterval(timer);
      if (!quizCompleted && quizAttempt) {
        saveQuizState();
        handleQuizAbandonment();
      }
    };
  });

  function handleBeforeUnload(event) {
    if (!quizCompleted && quizAttempt) {
      saveQuizState();
      event.preventDefault();
      event.returnValue = '';
      return '';
    }
  }

  async function handleQuizAbandonment() {
    if (!quizCompleted && quizAttempt) {
      try {
        await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizAttemptId: quizAttempt.id,
            complete: true,
            abandoned: true
          })
        });
      } catch (err) {
        console.error('Error abandoning quiz:', err);
      }
    }
  }
  
  async function completeQuizDueToTimeLimit() {
    // ... (existing code, no changes needed here for 3-answer compatibility)
    if (timer) clearInterval(timer);
    
    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quizAttemptId: quizAttempt.id,
          complete: true,
          timeLimit: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        quizCompleted = true;
        quizResult = result;
        quizResult.message = "Time limit reached! Your quiz has been automatically submitted.";
        
        localStorage.removeItem(`quizState_${questionSetId}`);
      } else {
        // Fallback if API fails
        throw new Error('API submission failed');
      }
    } catch (err) {
      console.error('Error completing quiz due to time limit:', err);
      quizCompleted = true;
      quizResult = {
        score: 0,
        totalQuestions: questionSet?.questions?.length || 0,
        correctAnswers: 0,
        startedAt: new Date(startTime).toISOString(), // Use existing startTime
        completedAt: new Date().toISOString(),
        message: "Time limit reached! Your quiz has been automatically submitted. There was an issue saving the final state."
      };
      localStorage.removeItem(`quizState_${questionSetId}`);
    }
  }
  
  async function quitQuiz() {
    // ... (existing code, no changes needed here for 3-answer compatibility)
    if (confirm('Are you sure you want to quit this quiz? Your progress will be saved and results will be shown.')) {
      if (timer) clearInterval(timer);
      
      try {
        if (quizAttempt) {
          const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              quizAttemptId: quizAttempt.id,
              complete: true,
              abandoned: true // Mark as abandoned
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            quizCompleted = true;
            quizResult = result;
            quizResult.message = "Quiz completed early. Here are your results.";
            localStorage.removeItem(`quizState_${questionSetId}`);
            return;
          }
        }
        // Fallback or if no attempt
        localStorage.removeItem(`quizState_${questionSetId}`);
        window.location.href = '/quiz';
      } catch (err) {
        console.error('Error abandoning quiz:', err);
        localStorage.removeItem(`quizState_${questionSetId}`);
        window.location.href = '/quiz';
      }
    }
  }

  function formatTime(seconds) {
    // ... (existing code)
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }
  
  function getRemainingTime() {
    // ... (existing code)
    if (timeLimitSeconds <= 0) return '';
    const remaining = Math.max(0, timeLimitSeconds - elapsedTime);
    return formatTime(remaining);
  }

  // This function is no longer needed here as QuestionCard handles its own detection
  // function isMultipleAnswerQuestion() { ... }

  async function submitAnswer() {
    const currentQ = getCurrentQuestion();
    if (!currentQ) return;

    const requiredSelections = getRequiredSelectionsForCurrentQuestion();
    const isMultiSelectQuestion = requiredSelections > 1;

    // Updated guard condition
    if (isSubmitted) return;
    if (isMultiSelectQuestion) {
      if (!Array.isArray(selectedAnswerIds) || selectedAnswerIds.length !== requiredSelections) {
        // console.log(`Multi-select: Expected ${requiredSelections}, got ${selectedAnswerIds?.length}. Aborting submit.`);
        return;
      }
    } else { // Single select question
      if (!selectedAnswerId) {
        // console.log("Single-select: No answer selected. Aborting submit.");
        return;
      }
    }
    
    try {
      const questionTimeSpent = elapsedTime; // This is total quiz time up to this point
                                            // Consider if per-question time tracking is needed

      if (isMultiSelectQuestion) {
        // console.log(`Submitting ${requiredSelections} answers:`, selectedAnswerIds);
        
        const results = await Promise.all(selectedAnswerIds.map(async (answerId) => {
          const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizAttemptId: quizAttempt.id,
              questionId: currentQ.id,
              answerId,
              timeSpent: questionTimeSpent / selectedAnswerIds.length, // Distribute time
              isMultipleAnswer: true // Crucial flag for backend
            })
          });
          if (!response.ok) throw new Error('Failed to submit one of the multiple answers');
          return response.json();
        }));
        
        // console.log("Multiple answer submission results:", results);
        isCorrect = results.every(result => result.isCorrect);
        
        if (isChallengeMode) {
          const anyFailed = results.some(result => result.attemptFailed);
          if (anyFailed) {
            quizFailed = true;
          } else if (!isCorrect) {
            mistakeCount++;
          }
        }
      } else { // Single answer submission
        const response = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizAttemptId: quizAttempt.id,
            questionId: currentQ.id,
            answerId: selectedAnswerId,
            timeSpent: questionTimeSpent
          })
        });
        
        if (!response.ok) {
          console.error('Failed to submit single answer');
          return; // Or throw new Error
        }
        
        const result = await response.json();
        isCorrect = result.isCorrect;
        
        if (isChallengeMode) {
          if (result.attemptFailed) {
            quizFailed = true;
          } else if (!isCorrect) {
            mistakeCount++;
          }
        }
      }
      
      isSubmitted = true;
      showExplanation = true;
      saveQuizState(); // Save state after answer submission and processing
      
      if (quizFailed) {
        if (timer) clearInterval(timer);
        // ... (rest of quizFailed logic, seems fine)
        try {
          const response = await fetch(`/api/quiz/attempt/${quizAttempt.id}`);
          if (!response.ok) throw new Error('Failed to get quiz attempt details for failed challenge');
          const currentAttempt = await response.json();
          quizCompleted = true;
          quizResult = {
            score: 0, // Or calculate based on currentAttempt.correctAnswers
            totalQuestions: questionSet.questions.length,
            correctAnswers: currentAttempt.correctAnswers || 0,
            failed: true,
            startedAt: currentAttempt.startedAt,
            completedAt: currentAttempt.completedAt || new Date().toISOString(),
            message: `Challenge failed! You made more than ${maxMistakes} mistakes.`
          };
          localStorage.removeItem(`quizState_${questionSetId}`);
        } catch (err) {
          console.error('Error fetching quiz attempt details on challenge fail:', err);
          quizCompleted = true;
          quizResult = { /* ... fallback ... */ };
          localStorage.removeItem(`quizState_${questionSetId}`);
        }
      }
      
    } catch (err) {
      console.error('Error submitting answer:', err);
      // Potentially set an error message for the user
    }
  }
  
  async function nextQuestion() {
    isSubmitted = false;
    showExplanation = false;
    selectedAnswerId = null;
    selectedAnswerIds = []; // Reset for the next question
    isCorrect = null;

    if (currentQuestionIndex < questionSet.questions.length - 1) {
      currentQuestionIndex++;
      saveQuizState(); // Save state when moving to next question
    } else {
      // Complete the quiz
      if (timer) clearInterval(timer);
      try {
        const response = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizAttemptId: quizAttempt.id,
            complete: true
          })
        });
        if (!response.ok) {
          console.error('Failed to complete quiz');
          return; // Or throw
        }
        quizResult = await response.json();
        quizCompleted = true;
        localStorage.removeItem(`quizState_${questionSetId}`);
      } catch (err) {
        console.error('Error completing quiz:', err);
      }
    }
  }
  
  function getCurrentQuestion() {
    if (!questionSet || !questionSet.questions || questionSet.questions.length === 0) return null;
    return questionSet.questions[currentQuestionIndex];
  }
  
  function getProgressPercent() {
    if (!questionSet || !questionSet.questions || questionSet.questions.length === 0) return 0;
    return ((currentQuestionIndex + 1) / questionSet.questions.length) * 100; // +1 for user-facing progress
  }
  
  // This function is correctly bound to QuestionCard's event.
  // QuestionCard now dispatches { answerIds: selectedAnswerIds }
  function handleSelectMultiple(event) {
    // console.log("Main: Multiple selection event:", event.detail);
    if (Array.isArray(event.detail.answerIds)) {
      selectedAnswerIds = [...event.detail.answerIds]; // Update local state
      // console.log("Main: Updated selectedAnswerIds:", selectedAnswerIds);
    } else {
      // console.error("Main: Received non-array answerIds:", event.detail.answerIds);
      selectedAnswerIds = []; // Fallback to empty array
    }
  }
</script>

<!-- Your existing HTML structure -->
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
          questionSetTitle={questionSet?.title || 'Quiz'}
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
    <div class="mb-6">
      <div class="flex justify-between items-center mb-2">
        <h1 class="text-2xl font-bold">{questionSet?.title || 'Quiz'}</h1>
      </div>
      <div class="flex justify-between items-center">
        <div class="text-gray-600">
          <span class="font-medium">
            Question {currentQuestionIndex + 1} of {questionSet?.questions?.length || 0}
          </span>
          <span class="ml-4">Time: {formatTime(elapsedTime)}</span>
          {#if isChallengeMode}
            <span class="ml-4 font-medium {mistakeCount >= maxMistakes -1 ? 'text-red-600' : mistakeCount > (maxMistakes - 3) ? 'text-orange-500' : 'text-amber-600'}">
              Mistakes: {mistakeCount}/{maxMistakes}
            </span>
          {/if}
        </div>
        {#if timeLimitSeconds > 0}
        <div class="text-gray-600">
          <span class="font-medium">
            Time Remaining: {getRemainingTime()} / {questionSet?.questions?.length > 50 ? '2 hours' : '1 hour'}
          </span>
        </div>
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
        on:quit={quitQuiz}
        on:select={() => { /* selectedAnswerId is bound */ }} 
        on:selectMultiple={handleSelectMultiple}
      />
    {:else if !isLoading && questionSet?.questions?.length === 0}
      <div class="text-center py-12">
        <p class="text-gray-600">This question set has no questions.</p>
        <a href="/quiz" class="text-blue-600 hover:underline mt-2 inline-block">Back to Question Sets</a>
      </div>
    {/if}
  {/if}
</div>