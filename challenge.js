import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { openai, supabase } from './config.js';

export async function onChallengeButtonClick(e) {
  await createAndStoreEmbeddings();
}

/*
  Challenge: Text Splitters, Embeddings, and Vector Databases!
    1. Use LangChain to split the content in movies.txt into smaller chunks.
    2. Use OpenAI's Embedding model to create an embedding for each chunk.
    3. Insert all text chunks and their corresponding embedding
       into a Supabase database table.
 */

/* Split movies.txt into text chunks.
Return LangChain's "output" – the array of Document objects. */
async function splitDocument(document) {
  let f = await fetch(document);
  let text = await f.text();

  //console.log(text);

  // https://js.langchain.com/v0.1/docs/modules/data_connection/document_transformers/recursive_text_splitter/
  const splitter = new RecursiveCharacterTextSplitter({
    // separators: ['\n\n'],
    chunkSize: 250,
    chunkOverlap: 35,
  });

  const output = await splitter.createDocuments([text]);
  
  let arrayStr = output.map(c => c.pageContent);
  console.log(arrayStr);
  return arrayStr;
}

/* Create an embedding from each text chunk.
Store all embeddings and corresponding text in Supabase. */
async function createAndStoreEmbeddings() {
  const chunkData = await splitDocument("movies.txt");

  const data = await Promise.all(chunkData.map(async text => {
    let embedding = await createEmbedding(text);
    return { 
      embedding: embedding,
      content: text
    };
  }));

  await supabase.from('movies').insert(data);
  console.log('Embedding and storing complete!');
}

async function createEmbedding(input) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: input
  });

  return embeddingResponse.data[0].embedding;
}



/*
  Challenge: Return and manage multiple matches
    - Return at least 3 matches from the database table
    - Combine all of the matching text into 1 string
*/

export async function onManageMultiMatchesClick(e) {
  console.log('Manage multi matches');
  const query = "Which movies can I take my child to?";
  const queryEmbeding = await createEmbedding(query);
  const matches = await findNearestMatch(queryEmbeding);
  console.log('MATCHES');
  console.log(matches);
  const message = await getChatCompletion(matches, query);
  console.log('MESSAGE');
  console.log(message);
}

// Query Supabase and return a semantically matching text chunk
async function findNearestMatch(embedding) {
  const { data } = await supabase.rpc('match_movies', {
    query_embedding: embedding,
    match_threshold: 0.50,
    match_count: 4
  });
  
  // Manage multiple returned matches
  const match = data.map(obj => obj.content).join('\n');
  return match;
}

// Use OpenAI to make the response conversational
const chatMessages = [{
    role: 'system',
    content: `You are an enthusiastic movie expert who loves recommending movies to people. 
    You will be given two pieces of information - some context about movies and a question. 
    Your main job is to formulate a short answer to the question using the provided context. 
    If you are unsure and cannot find the answer in the context, 
    say, "Sorry, I don't know the answer." Please do not make up the answer.` 
}];

async function getChatCompletion(text, query) {
  chatMessages.push({
    role: 'user',
    content: `Context: ${text} Question: ${query}`
  });
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: chatMessages,
    temperature: 0.5,
    frequency_penalty: 0.5
  });
  console.log(response.choices[0].message.content);
}