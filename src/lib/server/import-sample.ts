import { importQuestionSet } from './import';
import { createShuffledQuestionSet } from './quiz';
import prisma from './database';

// Since we can't easily do dynamic file loading in ES modules in all environments,
// we'll import the files explicitly
import sampleData from './sample-questions.json';
import awsQuestionsPart1 from './aws-saa-questions-part1.json';
import awsQuestionsPart2 from './aws-saa-questions-part2.json';
import exampleQuestions from './example-questions.json';

// This array contains all question sets to import
// When adding a new question set JSON file, add it to this array
const questionSets = [
  { data: sampleData, source: 'sample-questions.json' },
  { data: awsQuestionsPart1, source: 'aws-saa-questions-part1.json' },
  { data: awsQuestionsPart2, source: 'aws-saa-questions-part2.json' },
  { data: exampleQuestions, source: 'example-questions.json' }
];

console.log(`Found ${questionSets.length} question sets to import`);

async function importSingleQuestionSet(questionSetData, source) {
  console.log(`Starting import of "${questionSetData.title}" from ${source}...`);
  try {
    // Check if already imported to avoid duplicates
    const existingSet = await prisma.questionSet.findFirst({
      where: {
        title: questionSetData.title
      }
    });

    if (existingSet) {
      console.log(`"${questionSetData.title}" already imported. Skipping...`);
      return existingSet;
    }

    // Set the source filename in the jsonSource field
    const importData = {
      ...questionSetData,
      jsonSource: source
    };

    const result = await importQuestionSet(importData);
    console.log(`Imported ${result.questions.length} questions for "${result.title}"`);
    return result;
  } catch (error) {
    console.error(`Error importing "${questionSetData.title}":`, error);
    return null;
  }
}

// Function to import all discovered question sets
async function importAllQuestionSets() {
  const importedSets = [];
  
  for (const set of questionSets) {
    const result = await importSingleQuestionSet(set.data, set.source);
    if (result) {
      importedSets.push(result);
    }
  }
  
  return importedSets;
}

async function createShuffledSampleSets() {
  try {
    // Find all question sets without "(Shuffled)" in the title
    const regularSets = await prisma.questionSet.findMany({
      where: {
        title: {
          not: {
            contains: '(Shuffled)'
          }
        }
      }
    });

    // Create shuffled versions for each regular set
    for (const set of regularSets) {
      // Check if a shuffled version already exists
      const existingShuffled = await prisma.questionSet.findFirst({
        where: {
          title: {
            contains: `${set.title} (Shuffled)`
          }
        }
      });

      if (!existingShuffled) {
        console.log(`Creating shuffled version of "${set.title}"...`);
        await createShuffledQuestionSet(set.id);
      } else {
        console.log(`Shuffled version of "${set.title}" already exists. Skipping...`);
      }
    }
  } catch (error) {
    console.error('Error creating shuffled sample sets:', error);
  }
}

// Import samples and create shuffled versions
async function initializeSampleData() {
  // Import all question sets found in the server directory
  await importAllQuestionSets();
  
  // Then create shuffled versions
  await createShuffledSampleSets();
}

export default initializeSampleData;