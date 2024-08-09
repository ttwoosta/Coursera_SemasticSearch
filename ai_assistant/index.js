import { openai } from '../config.js';
const env = import.meta.env;

const myFileId = env.VITE_FILE_ID;
const myVectorId = env.VITE_VECTOR_STORE_ID;
const myAssistantId = env.VITE_ASSISTANT_ID;
const myThreadId = env.VITE_THREAD_ID;
const runningThreadId = env.VITE_RUN_ID;

const btn = document.getElementById('upload-btn');
btn.onclick = async (e) => {
  btn.disabled = true;
  // Upload a file with an "assistants" purpose
  const file = await openai.files.create({
    file: await fetch("movies.txt"),
    purpose: "assistants"
  });
  console.log(file);
  btn.disabled = false;
}

const btnCreateVS = document.getElementById('create-vs-btn');
btnCreateVS.onclick = async (e) => {
  btnCreateVS.disabled = true;
  const vectorStore = await openai.beta.vectorStores.create({
    name: "Movie Db",
    file_ids: [myFileId]
  });
  console.log(vectorStore);
  btnCreateVS.disabled = false;
}


const createBtn = document.getElementById('create-assistant-btn');
createBtn.onclick = async (e) => {
  createBtn.disabled = true;
  await createAssistant();
  createBtn.disabled = false;
}

// Create Movie Expert Assistant
// https://platform.openai.com/docs/api-reference/assistants/createAssistant
async function createAssistant() {
  const myAssistant = await openai.beta.assistants.create({
    instructions: " You are great at recommending movies. When asked a question, use the information in the provided file to form a friendly repsonse. If you cannot find the answer in the file, do your best to infer what the answer should be.",
    name: "Movie Expert",
    tools: [{ type: "file_search" }],
    model: "gpt-3.5-turbo",
    tool_resources: {
      file_search: {
        vector_store_ids: [myVectorId]
      }
    }
  });

  console.log(myAssistant);
  return myAssistant;
}

const btnThread = document.getElementById('create-thread-btn');
btnThread.onclick = async (e) => {
  btnThread.disabled = true;

  // this accepts message (history)
  // https://platform.openai.com/docs/api-reference/threads/createThread
  const thread = await openai.beta.threads.create();
  console.log(thread);

  btnThread.disabled = false;
}

const btnRunThread = document.getElementById('run-thread-btn');
btnRunThread.onclick = async (e) => {
  btnRunThread.disabled = true;

  // this accepts message (history)
  // https://platform.openai.com/docs/api-reference/threads/createThread
  const run = await openai.beta.threads.runs.create(
    myThreadId,
    { assistant_id: myAssistantId}
  );
  console.log(run);

  btnRunThread.disabled = false;
}

const btnMessage = document.getElementById('create-message-btn');
btnMessage.onclick = async (e) => {
  btnMessage.disabled = true;

  // this accepts message (history)
  const message = await openai.beta.threads.messages.create(
    myThreadId,
    { role: 'user', content: 'Can you recommand a comedy'}
  );
  console.log(message);

  btnMessage.disabled = false;
}

const btnThreadStatus = document.getElementById('thread-status-btn');
btnThreadStatus.onclick = async (e) => {
  btnThreadStatus.disabled = true;

  const status = await openai.beta.threads.runs.retrieve(myThreadId, runningThreadId);
  console.log(status);
  btnThreadStatus.disabled = false;
}

const btnListMessages = document.getElementById('list-messages-btn');
btnListMessages.onclick = async (e) => {
  btnListMessages.disabled = true;

  const messages = await openai.beta.threads.messages.list(myThreadId);
  console.log(messages);
  // threadMessages.data[0].content[0].text.value

  btnListMessages.disabled = false;
}