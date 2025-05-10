<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let isLoggedIn = false;
  let username = '';
  let isInQuiz = false;

  onMount(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        username = parsedUser.username;
        isLoggedIn = true;
      } catch (e) {
        // Invalid user data in localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }

    // Check if we're in a quiz page
    isInQuiz = $page.url.pathname.startsWith('/quiz/');
  });

  function logout() {
    if (isInQuiz && !confirmNavigation()) {
      return;
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    isLoggedIn = false;
    username = '';
    window.location.href = '/';
  }

  function confirmNavigation() {
    // Check if there's an active quiz
    const activeQuizIds = Object.keys(localStorage)
      .filter(key => key.startsWith('quizState_'));

    if (activeQuizIds.length > 0) {
      return confirm('You have an active quiz in progress. If you leave now, your progress will be saved, but your attempt will be marked as incomplete. Are you sure you want to leave?');
    }

    return true;
  }

  function handleNavClick(event, url) {
    if (isInQuiz && !confirmNavigation()) {
      event.preventDefault();
      return false;
    }
  }
</script>

<nav class="bg-blue-600 p-4 text-white">
  <div class="container mx-auto flex justify-between items-center">
    <a href="/" class="text-xl font-bold" on:click={(e) => handleNavClick(e, '/')}>AWS Cert Quiz</a>

    <div class="flex space-x-4">
      <a href="/" class="hover:text-blue-200" on:click={(e) => handleNavClick(e, '/')}>Home</a>
      <a href="/quiz" class="hover:text-blue-200" on:click={(e) => handleNavClick(e, '/quiz')}>Question Sets</a>

      {#if isLoggedIn}
        <a href="/stats" class="hover:text-blue-200" on:click={(e) => handleNavClick(e, '/stats')}>My Stats</a>
        <div class="flex items-center">
          <span class="mr-2">{username}</span>
          <button on:click={logout} class="text-sm bg-red-500 px-2 py-1 rounded hover:bg-red-600">
            Logout
          </button>
        </div>
      {:else}
        <a href="/auth/login" class="hover:text-blue-200" on:click={(e) => handleNavClick(e, '/auth/login')}>Login</a>
        <a href="/auth/register" class="hover:text-blue-200" on:click={(e) => handleNavClick(e, '/auth/register')}>Register</a>
      {/if}
    </div>
  </div>
</nav>