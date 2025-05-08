<script>
  import { onMount } from 'svelte';
  
  let isLoggedIn = false;
  let username = '';
  
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
  });
  
  function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    isLoggedIn = false;
    username = '';
    window.location.href = '/';
  }
</script>

<nav class="bg-blue-600 p-4 text-white">
  <div class="container mx-auto flex justify-between items-center">
    <a href="/" class="text-xl font-bold">AWS Cert Quiz</a>
    
    <div class="flex space-x-4">
      <a href="/" class="hover:text-blue-200">Home</a>
      <a href="/quiz" class="hover:text-blue-200">Question Sets</a>
      
      {#if isLoggedIn}
        <a href="/stats" class="hover:text-blue-200">My Stats</a>
        <div class="flex items-center">
          <span class="mr-2">{username}</span>
          <button on:click={logout} class="text-sm bg-red-500 px-2 py-1 rounded hover:bg-red-600">
            Logout
          </button>
        </div>
      {:else}
        <a href="/auth/login" class="hover:text-blue-200">Login</a>
        <a href="/auth/register" class="hover:text-blue-200">Register</a>
      {/if}
    </div>
  </div>
</nav>