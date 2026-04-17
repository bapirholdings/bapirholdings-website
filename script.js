// script.js
function openPrivacyModal() {
    document.getElementById('privacyModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevents scrolling behind the modal
}

function closePrivacyModal() {
    document.getElementById('privacyModal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Restores scrolling
}

// Close the modal if the user clicks anywhere outside of the modal content
window.onclick = function(event) {
    var modal = document.getElementById('privacyModal');
    if (event.target == modal) {
        closePrivacyModal();
    }
}