import { importQuestionSet } from './import';
import { createShuffledQuestionSet } from './quiz';
import prisma from './database';

// Since we can't easily do dynamic file loading in ES modules in all environments,
// we'll import the files explicitly
import awsSAAC03Part1 from './aws-saa-c03-part1.json';
import awsSAAC03Part2 from './aws-saa-c03-part2.json';
import awsSAAC03Part3 from './aws-saa-c03-part3.json';
import awsSAAC03Part4 from './aws-saa-c03-part4.json';
import awsSAAC03Part5 from './aws-saa-c03-part5.json';
import awsSAAC03Part6 from './aws-saa-c03-part6.json';
import awsSAAC03Part7 from './three-answer.json';


// This array contains all question sets to import
// When adding a new question set JSON file, add it to this array
const questionSets = [
  { data: awsSAAC03Part1, source: 'aws-saa-c03-part1.json' },
  { data: awsSAAC03Part2, source: 'aws-saa-c03-part2.json' },
  { data: awsSAAC03Part3, source: 'aws-saa-c03-part3.json' },
  { data: awsSAAC03Part4, source: 'aws-saa-c03-part4.json' },
  { data: awsSAAC03Part5, source: 'aws-saa-c03-part5.json' },
  { data: awsSAAC03Part6, source: 'aws-saa-c03-part6.json' },
  { data: awsSAAC03Part7, source: 'three-answer.json' }
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

// Import samples only, without creating shuffled versions
async function initializeSampleData() {
  // Import all question sets found in the server directory
  await importAllQuestionSets();
  
  // Disabled automatic creation of shuffled versions
  // Shuffled versions will be created on-demand from the UI
  // await createShuffledSampleSets();
}

export default initializeSampleData;