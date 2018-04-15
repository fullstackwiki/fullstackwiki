
document.addEventListener("DOMContentLoaded", function(event) {
	var idx;
	var loading = false;
	var body = document.getElementById('search-results');
	var search = document.getElementById('search');
	search.onchange = onSearch;
	search.onkeypress = onSearch;
	search.onkeyup = onSearch;
	function onSearch(e){
		if(search.value==''){
			body.style.display = 'none';
			return;
		}
		if(loading===false){
			loading = true;
			var head = document.head || document.getElementsByTagName('head')[0];
			// <script type="application/ecmascript" src="https://unpkg.com/lunr/lunr.js" />
			var s = document.createElement('script');
			s.src = "https://unpkg.com/lunr/lunr.js";
			s.type = 'application/ecmascript';
			s.onload = runSearch;
			head.appendChild(s);
			// <script type="application/ecmascript" src="./search-index.js" />
			var s = document.createElement('script');
			s.src = document.getElementById('search-runner-script').getAttribute('src') + "/../../search-index.js";
			s.type = 'application/ecmascript';
			s.onload = runSearch;
			head.appendChild(s);
		}else{
			runSearch();
		}
	}
	function runSearch(){
		if(typeof lunr!=='function') return;
		if(typeof searchIndex!=='object') return;
		if(!idx) idx = lunr.Index.load(searchIndex);
		var tbody = body.lastElementChild.tBodies[0];
		while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
		idx.search(search.value).forEach(function(result, i){
			var tr = document.createElement('tr');
			tbody.appendChild(tr);
			var td0 = document.createElement('td');
			td0.textContent = result.ref;
			tr.appendChild(td0);
			var td1 = document.createElement('td');
			td1.textContent = JSON.stringify(result.matchData);
			tr.appendChild(td1);
		});
		body.style.display = 'block';
	}
});
