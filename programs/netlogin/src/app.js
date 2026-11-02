window.defaultMessageBoxTitle = "Network Login";

let container = document.getElementById("app");

$("body").on("mousedown selectstart contextmenu", function (e) {
	if (
		e.target instanceof HTMLSelectElement ||
		e.target instanceof HTMLTextAreaElement ||
		(e.target instanceof HTMLLabelElement && e.type !== "contextmenu") ||
		(e.target instanceof HTMLInputElement && e.target.type !== "color")
	) {
		return;
	}
	e.preventDefault();
});


var query = Object.fromEntries(new URLSearchParams(location.search));
if (query.path) {
	var file_path = query.path;
	var file_name = file_name_from_path(file_path);
} else if (location.search.length > 1) {
	var local_storage_document_id = location.search.replace("?", "");
	var file_name = location.search.replace("?", "");
}
var default_file_name_for_title = "Untitled";


function update_title() {
	document.title = "Network Login: //CCCNET/" + file_path + "/";
	
	if (frameElement && frameElement.$window) 
		frameElement.$window.title(document.title);
}
update_title();

document.getElementById("netform").addEventListener("submit", function(event){
	showMessageBox({iconID: 'error', title:'Error', message: 'Incorrect or invalid credentials provided. \n[Cause: 401 Unauthorized Access]'});
	// alert("Password: " + document.getElementById("password").value);
	event.preventDefault();
  });