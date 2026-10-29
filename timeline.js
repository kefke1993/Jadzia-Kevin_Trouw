// Koppelt de tijdlijnknoppen aan het gedeelde detailvenster.
const timelineDialog = document.getElementById("timelineDialog");

if (timelineDialog) {
  const closeButton = timelineDialog.querySelector(".timeline-dialog-close");
  const dateLabel = document.getElementById("timelineDialogDate");
  const titleLabel = document.getElementById("timelineDialogTitle");
  const timeLabel = document.getElementById("timelineDialogTime");
  const locationRow = document.getElementById("timelineDialogLocationRow");
  const locationLabel = document.getElementById("timelineDialogLocation");
  const detailLabel = document.getElementById("timelineDialogDetail");

  document.querySelectorAll(".event-more, .event-photo-action").forEach((button) => {
    button.addEventListener("click", () => {
      const eventCard = button.closest(".ceremonie");
      if (!eventCard) return;

      // Vul het venster met de inhoud van de aangeklikte kaart.
      dateLabel.textContent = eventCard.querySelector(".event-date")?.textContent.trim() || "Onze dag";
      titleLabel.textContent = eventCard.querySelector(".title")?.textContent.trim() || "Een bijzonder moment";
      timeLabel.textContent = eventCard.querySelector("time.info")?.textContent.replace(/\s+/g, " ").trim() || "";
      detailLabel.textContent = eventCard.dataset.detail || "";

      const location = eventCard.dataset.location || "";
      locationLabel.textContent = location;
      locationRow.hidden = !location;

      if (typeof timelineDialog.showModal === "function") {
        timelineDialog.showModal();
      }
    });
  });

  // Sluiten kan met de knop, Escape (native dialog) of een klik op de achtergrond.
  closeButton.addEventListener("click", () => timelineDialog.close());
  timelineDialog.addEventListener("click", (event) => {
    if (event.target === timelineDialog) timelineDialog.close();
  });
}
