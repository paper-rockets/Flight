
function showError(msg) {
    var overlay = document.getElementById('debug-overlay');
    overlay.style.display = 'block';
    overlay.innerHTML += msg + '<br><br>';
}
window.onerror = function(msg, url, line, col, error) {
    showError('Error: ' + msg + ' at line ' + line);
};
window.addEventListener("unhandledrejection", function(event) {
    showError('Unhandled Promise Rejection: ' + (event.reason ? event.reason.message || event.reason : "unknown"));
});
const origConsoleError = console.error;
console.error = function(...args) {
    showError('Console Error: ' + args.join(' '));
    origConsoleError.apply(console, args);
};
