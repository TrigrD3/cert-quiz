<script>
  export let questionSet = {
    id: '',
    title: '',
    description: '',
    certificationType: {
      name: ''
    },
    _count: {
      questions: 0
    }
  };
</script>

<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h3 class="text-xl font-semibold mb-2">{questionSet.title}</h3>
  
  <div class="mb-2">
    <span class="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
      {questionSet.certificationType.name}
    </span>
  </div>
  
  {#if questionSet.description}
    <p class="text-gray-600 mb-4">{questionSet.description}</p>
  {/if}
  
  <div class="flex items-center justify-between mb-4">
    <span class="text-gray-700">{questionSet._count.questions} questions</span>
  </div>
  
  <a 
    href="/quiz/{questionSet.id}" 
    class="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
  >
    Start Quiz
  </a>
</div>