window.defaultMessageBoxTitle = "Run";

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

function cancel() {
	window.close();
}
document.getElementById("cancel-button").addEventListener("click", cancel);

var query = Object.fromEntries(new URLSearchParams(location.search));
if (query.path) {
	var file_path = query.path;
	var file_name = file_name_from_path(file_path);
} else if (location.search.length > 1) {
	var local_storage_document_id = location.search.replace("?", "");
	var file_name = location.search.replace("?", "");
}
var default_file_name_for_title = "Untitled";

function position() {
	frameElement.parentElement.parentElement.style.top='unset';
	frameElement.parentElement.parentElement.style.bottom='4%';
	frameElement.parentElement.parentElement.style.left='220px';
	return;
}
position();

function update_title() {
	document.title = "Run";
	
	if (frameElement && frameElement.$window) 
		frameElement.$window.title(document.title);
}
update_title();


document.getElementById("runform").addEventListener("submit", function(event){
	event.preventDefault();
	var target = document.getElementById("target").value;
	// The desktop that opened this dialog (when opened on its own, parent is this window and there's nothing to run)
	parent.runCommand?.(target);

	window.close();
  });