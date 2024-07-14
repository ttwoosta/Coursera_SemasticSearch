import { onSematicSearchBtnClick } from './sematic_search.js';
import { onTextChunkingBtnClick } from './text_chunking.js';

document.querySelector('#app').innerHTML = `
  <div class="container">
    <div class="d-flex justify-content-center" style="height: 50em">
      <div class="align-self-center flex-column">
        <div class="p-2"><button type="button" class="btn btn-primary" id="search-btn" >Semastic Search</button></div>
        <div class="p-2"><button type="button" class="btn btn-primary" id="text-chunking-btn" >Text Chunking</button></div>
      </div>
    </div>
  </div>
`

document.getElementById('search-btn').onclick = (e) => {
  onSematicSearchBtnClick();
};

document.getElementById('text-chunking-btn').onclick = (e) => {
  onTextChunkingBtnClick(e);
}
