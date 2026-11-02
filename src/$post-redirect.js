// After a shutdown, the next visit starts at the POST screen.
// Runs first (in <head>), so nothing else on the desktop starts loading before the redirect.
if (localStorage.getItem("POST") === "0") {
	location.replace("$POST.html");
}
