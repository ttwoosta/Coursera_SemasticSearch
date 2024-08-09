import { openai } from '../config';
const env = import.meta.env;

const form = document.querySelector('form');
const input = document.querySelector('input');
const reply = document.querySelector('.reply');

// Assistant variables
const asstID = env.VITE_ASSISTANT_ID;
const threadID = env.VITE_THREAD_ID;

form.addEventListener('submit', function(e) {
  e.preventDefault();
  main();
  input.value = '';
});

// Bring it all together
async function main() {
  reply.innerHTML = 'Thinking...';
  
  // Create a message
  await createMessage(input.value);

  // create a run
  const run = await runThread();

  // retrieve the current run
  const currentRun = await retrieveRun(threadID, run.id);

  // poll for updates and check if run status is completed
  await openai.beta.threads.runs.poll(threadID, currentRun.id);

  // get messages from the thread
  const { data } = await listMessages();

  // display the last message for the current run
  reply.innerHTML = data[0].content[0].text.value;
}

/* -- Assistants API Functions -- */

// Create a message
async function createMessage(question) {
  const threadMessages = await openai.beta.threads.messages.create(
    threadID,
    { role: "user", content: question }
  );
}

// Run the thread / assistant
async function runThread() {
  const run = await openai.beta.threads.runs.create(
    threadID, { assistant_id: asstID }
  );
  return run;
}

// List thread Messages
async function listMessages() {
  return await openai.beta.threads.messages.list(threadID);
}

// Get the current run
async function retrieveRun(thread, run) {
  return await openai.beta.threads.runs.retrieve(thread, run);
}