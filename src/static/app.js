document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Crea la lista dei partecipanti senza punti elenco e con icona elimina
        let participantsSection = "";
        if (details.participants.length > 0) {
          participantsSection = `
            <div class="participants-section">
              <strong>Partecipanti:</strong>
              <ul class="participants-list no-bullets">
                ${details.participants.map(email => `
                  <li class="participant-item">
                    <span>${email}</span>
                    <button class="delete-participant" title="Rimuovi" data-activity="${name}" data-email="${email}">
                      🗑️
                    </button>
                  </li>
                `).join("")}
              </ul>
            </div>
          `;
        } else {
          participantsSection = `
            <div class="participants-section">
              <strong>Partecipanti:</strong>
              <p class="no-participants">Nessun partecipante ancora.</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsSection}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Event delegation: aggiungi un solo event listener al contenitore
        // (solo la prima volta)
        if (!activitiesList._deleteListenerAdded) {
          activitiesList.addEventListener("click", async (e) => {
            const btn = e.target.closest(".delete-participant");
            if (btn) {
              const activityName = btn.getAttribute("data-activity");
              const email = btn.getAttribute("data-email");
              if (confirm(`Vuoi davvero rimuovere ${email} da ${activityName}?`)) {
                try {
                  const response = await fetch(`/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}`, {
                    method: "DELETE"
                  });
                  const result = await response.json();
                  if (response.ok) {
                    messageDiv.textContent = result.message;
                    messageDiv.className = "success";
                    fetchActivities();
                  } else {
                    messageDiv.textContent = result.detail || "Errore nella rimozione";
                    messageDiv.className = "error";
                  }
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => {
                    messageDiv.classList.add("hidden");
                  }, 5000);
                } catch (error) {
                  messageDiv.textContent = "Impossibile rimuovere il partecipante.";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }
              }
            }
          });
          activitiesList._deleteListenerAdded = true;
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Aggiorna la lista delle attività e partecipanti
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
