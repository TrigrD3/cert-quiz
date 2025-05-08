<script>
  import '../app.css';
  import Navbar from '$lib/components/Navbar.svelte';
</script>

<div class="min-h-screen bg-gray-100">
  <Navbar />
  
  <main class="container mx-auto py-8 px-4">
    <slot />
  </main>
  
  <footer class="bg-gray-800 text-white py-6">
    <div class="container mx-auto px-4">
      <p class="text-center">© {new Date().getFullYear()} AWS Cert Quiz - Practice for AWS Certification Exams</p>
    </div>
  </footer>
</div>