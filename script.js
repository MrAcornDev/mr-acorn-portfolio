const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

document.getElementById("year").textContent = new Date().getFullYear();

function copyDiscord() {
  const value = document.getElementById("discordText").textContent;
  if (value === "YOUR_DISCORD_USERNAME") {
    alert("Replace YOUR_DISCORD_USERNAME in index.html with your Discord username first.");
    return;
  }
  navigator.clipboard.writeText(value);
  alert("Discord username copied!");
}
