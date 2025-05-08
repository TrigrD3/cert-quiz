<script>
  import { goto } from '$app/navigation';
  
  let email = '';
  let username = '';
  let password = '';
  let confirmPassword = '';
  let isLoading = false;
  let error = '';
  
  async function handleRegister() {
    if (!email || !username || !password) {
      error = 'All fields are required';
      return;
    }
    
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }
    
    isLoading = true;
    error = '';
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          username,
          password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        error = data.error || 'Registration failed';
        return;
      }
      
      // Store user data and token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      // Redirect to home page
      goto('/');
      
    } catch (err) {
      console.error('Registration error:', err);
      error = 'An error occurred during registration';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="max-w-md mx-auto">
  <h1 class="text-2xl font-bold mb-6">Create an Account</h1>
  
  <div class="bg-white p-6 rounded-lg shadow-md">
    {#if error}
      <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    {/if}
    
    <form on:submit|preventDefault={handleRegister} class="space-y-4">
      <div>
        <label for="email" class="block text-gray-700 mb-1">Email</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label for="username" class="block text-gray-700 mb-1">Username</label>
        <input
          type="text"
          id="username"
          bind:value={username}
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
      
      <div>
        <label for="confirmPassword" class="block text-gray-700 mb-1">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          bind:value={confirmPassword}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>
      
      <button
        type="submit"
        class="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Register'}
      </button>
    </form>
    
    <div class="mt-4 text-center">
      <p class="text-gray-600">
        Already have an account?
        <a href="/auth/login" class="text-blue-600 hover:underline">Login</a>
      </p>
    </div>
  </div>
</div>