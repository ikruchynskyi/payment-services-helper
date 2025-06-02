document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll("#results div").forEach(function(div) {
    div.addEventListener("click", function() {
      let divText = this.textContent;
      navigator.clipboard.writeText(divText);
    });
  });
});

