var saved_json = null;

function download(){
	if ( navigator.msSaveBlob ) {
		var blob = new Blob( [ JSON.stringify(saved_json, null, "\t") ], { type: "text/json"} );
		navigator.msSaveBlob( blob, "your_translation.json" );
	} else {
		var dataStr = "data:text/json;charset=utf-8,"+ encodeURIComponent(
			JSON.stringify(saved_json, null, "\t")
			);
		var dlAnchorElem = document.getElementById('download');
		dlAnchorElem.setAttribute("href", dataStr);
		dlAnchorElem.click();
	}
}

function merge(en_json, your_json){
	var result = {};
	for(var key in en_json) {
		result[key] = en_json[key];
	}
	for(var key in your_json) {
		if(result[key]){
			if(typeof your_json[key] === 'string'){
				result[key] = your_json[key];
			}
			else{
				result[key] = merge(en_json[key], your_json[key]);
			}
		}
	}
	return result;
}

function update_json_file(){
	if(!last_active_input){
		return;
	}
	var path = last_active_input.previousSibling.id.replace('.','');

	function update_json_key(old_json, path){
		var current_level = path.shift();
		if(typeof old_json[current_level] === 'string'){
			old_json[current_level] = last_active_input.value;
		}else{
			update_json_key(old_json[current_level], path);
		}
	}
	update_json_key(saved_json, path.split("."));
}

var last_active_input = null;
function changed_input_text(last_active_element){
	last_active_input = last_active_element;
	update_json_file();

	uls = document.querySelectorAll('ul');
	for(i = 0; i < uls.length; i++) {
		uls[i].classList.remove("needs_translation");
	}
	textInputs = document.querySelectorAll('input[type=text]');
	var needs_translation = 0;
	for(i = 0; i < textInputs.length; i++) {
		if (textInputs[i].value == textInputs[i].previousSibling.textContent){
			needs_translation++;
			textInputs[i].classList.add("needs_translation");
			var ul_element= textInputs[i].parentNode;
			while (ul_element.tagName != "MAIN") {
				if (ul_element.tagName == "UL"){
					ul_element.classList.add("needs_translation");
				}
				ul_element = ul_element.parentNode;
			}
		}else{
			textInputs[i].classList.remove("needs_translation");
		}
	}
	document.getElementById("to_translate").innerHTML = "Not translated: "+needs_translation;
	document.getElementById("percent").innerHTML = "Completed: "+Math.ceil((string_counter-needs_translation)/string_counter*1000)/10+"%";
}

function collapse(arrow){
	arrow.nextSibling.classList.toggle("collapsed");
	if (arrow.innerHTML == "►"){
		arrow.innerHTML = "▼";
	}else{
		arrow.innerHTML = "►";
	}
}

function reset_input_file(input_file_element){
	input_file_element.value = "";
}

function isVisible(e) {
	return !!( e.offsetWidth || e.offsetHeight || e.getClientRects().length );
}

function goto_next_unstranslated(){
	let all_text_inputs = document.querySelectorAll("input[type='text']");
	if (!last_active_input){
		last_active_input = all_text_inputs[all_text_inputs.length-1];
	}
	let visible_text_inputs = [];
	for(var i = 0; i < all_text_inputs.length; i++){
		if ( ( isVisible(all_text_inputs[i]) && all_text_inputs[i].classList.contains('needs_translation') ) || all_text_inputs[i] == last_active_input){
			visible_text_inputs.push(all_text_inputs[i]);
		}
	}
	for(var i = 0; i < visible_text_inputs.length; i++){
		if(visible_text_inputs[i] == last_active_input){
			let next = visible_text_inputs[i + 1];
			if (next){
				next.focus();
				break;
			}else{
				visible_text_inputs[0].focus();
			}
		}
	}
}

var string_counter = 0;
function load_en_file() {
	let en_input, en_file, fileReader;

	en_input = document.getElementById('en_fileinput_element');
	if (!en_input.files[0]) {
		alert("Please select a file before clicking 'Load'");
	}
	else {
		en_file = en_input.files[0];
		fileReader = new FileReader();
		fileReader.onload = receivedText;
		fileReader.readAsText(en_file);
	}

	string_counter = 0;
	function populateHTML(json_table, json_key_in_input_id) {
		var txt = "<ul>";
		for (key in json_table) {
			var current_key = json_key_in_input_id+"."+key;
			if(typeof json_table[key] === 'string'){
				string_counter++;
				txt+="<li class='key_value'>";
				txt += "<span class='key'>"+key+": </span>";
				txt += "<span class='value' id='"+current_key+"'>"+
				json_table[key].replace(/</g,'&lt;')+"</span>";
				txt += "<input type='text' onblur='changed_input_text(this)' ";
				txt += "value='"+json_table[key].replace(/'/g,"&apos;")+"'>";
				txt+="</li>";
			}
			else{
				txt += "<li>"+key+"<span class='collapse_button' onclick='collapse(this)'>▼</span>";
				txt += populateHTML(json_table[key], current_key);
				txt += "</li>";
			}
		}
		return txt + "</ul>";
	}
	function receivedText(e) {
		let lines = e.target.result;
		let en_json = JSON.parse(lines);
		saved_json = en_json;
		let new_html = populateHTML(en_json, "");
		document.getElementsByTagName("main")[0].innerHTML = new_html;
		document.getElementById("status").innerHTML = "Loaded: en.json only";
		document.getElementById("strings").innerHTML = "Strings: "+string_counter;
		changed_input_text();
		reset_input_file(en_input);
	}
}

function load_your_file() {
	let your_input, your_file, fileReader;

	your_input = document.getElementById('your_fileinput_element');
	if (!your_input.files[0]) {
		alert("Please select a file before clicking 'Load'");
	}else if(saved_json == null){
		alert("Please select the original file first");
	}
	else {
		your_file = your_input.files[0];
		fileReader = new FileReader();
		fileReader.onload = receivedText;
		fileReader.readAsText(your_file);
	}

	function populateHTML_inputs(json_table, json_key_in_input_id) {
		for (key in json_table) {
			var current_key = json_key_in_input_id+"."+key;
			if(typeof json_table[key] === 'string'){
				document.getElementById(current_key).nextSibling.value = json_table[key];
			}
			else{
				populateHTML_inputs(json_table[key], current_key);
			}
		}
	}
	function receivedText(e) {
		let lines = e.target.result;
		let your_json = JSON.parse(lines);
		saved_json = merge(saved_json, your_json)
		needs_translation = 0;
		populateHTML_inputs(saved_json, "");
		document.getElementById("status").innerHTML = "Loaded: both files";
		changed_input_text();
		reset_input_file(your_input);
	}
}