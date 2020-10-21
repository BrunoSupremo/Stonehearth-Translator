var saved_json = null;
var en_json = null;
var your_json = null;
var string_counter = 0;
var needs_translation = 0;
var compare_mode = false;

function update_header(){
	if(compare_mode){
		document.getElementById('download').style.display="none";
		document.getElementById('change_mode').innerHTML="📚 Translation mode";
		document.getElementById('goto_next_unstranslated').innerHTML="📑 Next difference";
	}else{
		document.getElementById('download').style.display="";
		document.getElementById('change_mode').innerHTML="⚖️ Compare mode";
		document.getElementById('goto_next_unstranslated').innerHTML="📑 Next untranslated";
	}
}

function update_footer(){
	function loaded(){
		if (your_json) {
			return "both files";
		}
		if (en_json) {
			return "en.json only";
		}
		return "Nothing";
	}
	if(compare_mode){
		document.getElementById("status").innerHTML = "Loaded: "+loaded();
		document.getElementById("strings").innerHTML = "Strings: "+string_counter;
		document.getElementById("to_translate").innerHTML = "Differences: "+(string_counter-needs_translation);
		document.getElementById("percent").innerHTML = "Similarity: "+(Math.floor(needs_translation/string_counter*10000)/100 || 100)+"%";
	}else{
		document.getElementById("status").innerHTML = "Loaded: "+loaded();
		document.getElementById("strings").innerHTML = "Strings: "+string_counter;
		document.getElementById("to_translate").innerHTML = "Not translated: "+needs_translation;
		document.getElementById("percent").innerHTML = "Completed: "+(Math.ceil((string_counter-needs_translation)/string_counter*10000)/100 || 0)+"%";
	}
}

function change_mode(){
	compare_mode = !compare_mode;

	update_header();
	if (compare_mode) {
		document.getElementsByTagName("main")[0].classList.add("compare_mode");
	}else{
		document.getElementsByTagName("main")[0].classList.remove("compare_mode");
	}
	var textInputs = document.querySelectorAll('textarea');
	for (var i = 0; i < textInputs.length; i++) {
		textInputs[i].readOnly = compare_mode;
	}
	update_footer();
}

function download(){
	if ( navigator.msSaveBlob ) {
		var blob = new Blob( [ JSON.stringify(saved_json, null, "\t") ], { type: "text/json"} );
		navigator.msSaveBlob( blob, "your_translation.json" );
	} else {
		var dataStr = "data:text/json;charset=utf-8,"+ encodeURIComponent(
			JSON.stringify(saved_json, null, "\t")
			);
		var dlAnchorElem = document.getElementById('actual_download');
		dlAnchorElem.setAttribute("href", dataStr);
		dlAnchorElem.click();
	}
}

function merge(first_json, second_json){
	var result = {};
	for(var key in first_json) {
		result[key] = first_json[key];
	}
	for(var key in second_json) {
		if(result[key]){
			if(typeof second_json[key] === 'string'){
				result[key] = second_json[key];
			}
			else{
				result[key] = merge(first_json[key], second_json[key]);
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

	var uls = document.querySelectorAll('ul');
	for(i = 0; i < uls.length; i++) {
		uls[i].classList.remove("needs_translation");
	}
	var textInputs = document.querySelectorAll('textarea');
	needs_translation = 0;
	for(i = 0; i < textInputs.length; i++) {
		if ( textInputs[i].value == textInputs[i].previousSibling.textContent
			&& textInputs[i].value != "" && textInputs[i].value != " " ){
			needs_translation++;
			// ident
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
	update_footer();
}

function collapse(arrow){
	arrow.nextSibling.classList.toggle("collapsed");
	arrow.classList.toggle("change_arrow");
}

function reset_input_file(input_file_element){
	input_file_element.value = "";
}

function isVisible(e) {
	return !!( e.offsetWidth || e.offsetHeight || e.getClientRects().length );
}

function collapse_all_translated(){
	var uls = document.querySelectorAll('ul');
	for(i = 0; i < uls.length; i++) {
		if ( isVisible(uls[i]) && !uls[i].classList.contains('needs_translation') ){
			uls[i].classList.add("collapsed");
			uls[i].previousSibling.classList.toggle("change_arrow");
		}
	}
}

function goto_next_unstranslated(){
	let all_text_inputs = document.querySelectorAll("textarea");
	if (!last_active_input){
		last_active_input = all_text_inputs[all_text_inputs.length-1];
	}
	let visible_text_inputs = [];
	if (compare_mode) {
		for(var i = 0; i < all_text_inputs.length; i++){
			if ( ( isVisible(all_text_inputs[i]) && !all_text_inputs[i].classList.contains('needs_translation') ) || all_text_inputs[i] == last_active_input){
				visible_text_inputs.push(all_text_inputs[i]);
			}
		}
	}else{
		for(var i = 0; i < all_text_inputs.length; i++){
			if ( ( isVisible(all_text_inputs[i]) && all_text_inputs[i].classList.contains('needs_translation') ) || all_text_inputs[i] == last_active_input){
				visible_text_inputs.push(all_text_inputs[i]);
			}
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
				txt += "<textarea onblur='changed_input_text(this)'>";
				txt += json_table[key].replace(/'/g,"&apos;")+"</textarea>";
				txt+="</li>";
			}
			else{
				txt += "<li><span class='collapse_button' onclick='collapse(this)'>"+key+"</span>";
				txt += populateHTML(json_table[key], current_key);
				txt += "</li>";
			}
		}
		return txt + "</ul>";
	}
	function receivedText(e) {
		let lines = e.target.result;
		try{
			en_json = JSON.parse(lines);
		}catch (error){
			alert("The json file contain an error. \n" + error );
		}
		saved_json = en_json;
		let new_html = populateHTML(en_json, "");
		document.getElementsByTagName("main")[0].innerHTML = new_html;
		update_footer();
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
		try{
			your_json = JSON.parse(lines);
		}catch (error){
			alert("The json file contain an error. \n" + error );
		}
		saved_json = merge(saved_json, your_json)
		needs_translation = 0;
		populateHTML_inputs(saved_json, "");
		document.getElementById("status").innerHTML = "Loaded: both files";
		changed_input_text();
		reset_input_file(your_input);
	}
}