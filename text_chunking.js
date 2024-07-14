
import { CharacterTextSplitter } from "langchain/text_splitter";

export async function onTextChunkingBtnClick(e) {
  const response = await fetch('podcasts.txt');
  const text = await response.text();

  const splitter = new CharacterTextSplitter({
    separator: " ",
    chunkSize: 150,
    chunkOverlap: 0,
  });
  const output = await splitter.createDocuments([text]);
  console.log(output);
}