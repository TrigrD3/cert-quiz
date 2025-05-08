<script>
  import { goto } from '$app/navigation';
  
  let emailOrUsername = '';
  let password = '';
  let isLoading = false;
  let error = '';
  
  async function handleLogin() {
    if (!emailOrUsername || !password) {
      error = 'Email/username and password are required';
      return;
    }
    
    isLoading = true;
    error = '';
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailOrUsername,
          password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        error = data.error || 'Login failed';
        return;
      }
      
      // Store user data and token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      // Redirect to home page
      goto('/');
      
    } catch (err) {
      console.error('Login error:', err);
      error = 'An error occurred during login';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="max-w-md mx-auto">
  <h1 class="text-2xl font-bold mb-6">Login to Your Account</h1>
  
  <div class="bg-white p-6 rounded-lg shadow-md">
    {#if error}
      <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    {/if}
    
    <form on:submit|preventDefault={handleLogin} class="space-y-4">
      <div>
        <label for="emailOrUsername" class="block text-gray-700 mb-1">Email or Username</label>
        <input
          type="text"
          id="emailOrUsername"
          bind:value={emailOrUsername}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label for="password" class="block text-gray-700 mb-1">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>
      
      <button
        type="submit"
        class="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
    
    <div class="mt-4 text-center">
      <p class="text-gray-600">
        Don't have an account?
        <a href="/auth/register" class="text-blue-600 hover:underline">Register</a>
      </p>
    </div>
  </div>
</div>