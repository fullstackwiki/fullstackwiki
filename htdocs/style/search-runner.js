
document.addEventListener("DOMContentLoaded", function(event) {
	var appRoot = document.getElementById('search-runner-script').getAttribute('src') + "/../..";
	var idx;
	var loading = false;
	var selectedIndex = 0;
	var body = document.getElementById('search-results');
	var tbody = body.lastElementChild.tBodies[0];
	var search = document.getElementById('search');
	search.onchange = onSearch;
	search.onkeypress = onSearch;
	search.onkeyup = onSearch;
	function onSearch(e){
		switch(e.which) {
		case 13: // enter
			e.preventDefault();
			// Activate link
			var cell = tbody.children[selectedIndex].firstChild;
			if(cell.firstChild) document.location = cell.firstChild.href;
			break;
		case 27: // esc
			search.value = '';
			break;
		case 38: // up
			e.preventDefault();
			if(selectedIndex>0) selectedIndex--;
			updateSelected();
			// Select previous
			break;
		case 40: // down
			e.preventDefault();
			if(selectedIndex+1<tbody.children.length) selectedIndex++;
			updateSelected();
			// Select next
			break;
		};

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
			s.src = appRoot + "/search-index.js";
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
		while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
		idx.search(search.value).forEach(function(result, i){
			var tr = document.createElement('tr');
			tbody.appendChild(tr);
			var td0 = document.createElement('td');
			tr.appendChild(td0);
			var td0a = document.createElement('a');
			td0.appendChild(td0a);
			td0a.href = appRoot + "/" + result.ref;
			//td0a.textContent = result.ref;
			td0a.textContent = searchIndex.labels[result.ref];
			var td1 = document.createElement('td');
			tr.appendChild(td1);
			var td1a = document.createElement('a');
			td1.appendChild(td1a);
			td1a.href = appRoot + "/" + result.ref;
			//td1a.textContent = JSON.stringify(result.matchData.metadata);
			td1a.textContent = result.ref;
		});
		if(!tbody.firstChild){
			var tr = document.createElement('tr');
			tbody.appendChild(tr);
			var td0 = document.createElement('th');
			tr.appendChild(td0);
			td0.textContent = 'No results';
		}
		body.style.display = 'block';
		updateSelected();
	}
	function updateSelected(){
		for(var i=0, tr=tbody.firstChild; tr; tr=tr.nextSibling, i++){
			var className = (selectedIndex==i) ? 'selected' : '' ;
			if(tr.className!=className) tr.className = className;
		}
	}
});
