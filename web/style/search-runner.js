
document.addEventListener("DOMContentLoaded", function(event) {
	var idx;
	var loading = false;
	var body = document.getElementsByTagName('main')[0];
	var search = document.getElementById('search');
	search.onchange = onSearch;
	search.onkeypress = onSearch;
	search.onkeyup = onSearch;
	function onSearch(e){
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
			s.src = "search-index.js";
			s.type = 'application/ecmascript';
			s.onload = runSearch;
			head.appendChild(s);
		}else{
			runSearch();
		}
	}
	window.searchIndexLoaded = runSearch;
	function runSearch(){
		if(typeof lunr!=='function') return;
		if(typeof searchIndex!=='object') return;
		if(!idx) idx = lunr.Index.load(searchIndex);
		var result = idx.search(search.value);
		console.log(result);
		body.innerText = JSON.stringify(result);
	}
});
