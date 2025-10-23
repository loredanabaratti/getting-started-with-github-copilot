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
      renderActivities(activities);

      Object.entries(activities).forEach(([name, details]) => {
        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Render activities to the page
  function renderActivities(activities) {
    const activitiesList = document.getElementById("activities-list");
    activitiesList.innerHTML = "";

    Object.entries(activities).forEach(([name, activity]) => {
      const freeSpots = activity.max_participants - activity.participants.length;
      const card = document.createElement("div");
      card.className = "activity-card";

      // Teilnehmerliste als HTML generieren, ohne Aufzählungspunkte und mit Delete-Icon
      let participantsHTML = "";
      if (activity.participants.length > 0) {
        participantsHTML = activity.participants.map(email => `
          <li class="participant-item" style="list-style-type:none;display:flex;align-items:center;gap:6px;padding-left:0;">
            <span>${email}</span>
            <span class="delete-participant" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}" title="Remove participant" style="cursor:pointer;color:#c62828;font-size:18px;user-select:none;">&#128465;</span>
          </li>
        `).join("");
      } else {
        participantsHTML = '<li style="color:#888;font-style:italic;list-style-type:none;">No participants yet</li>';
      }

      card.innerHTML = `
        <h4>${name}</h4>
        <p><strong>Description:</strong> ${activity.description}</p>
        <p><strong>Schedule:</strong> ${activity.schedule}</p>
        <p><strong>Availability:</strong> ${freeSpots} free spot${freeSpots === 1 ? "" : "s"}</p>
        <div class="activity-participants">
          <div class="activity-participants-title">Participants:</div>
          <ul class="activity-participants-list" style="padding-left:0;">
            ${participantsHTML}
          </ul>
        </div>
      `;

      activitiesList.appendChild(card);
    });

    // Event Delegation für Delete-Icons
    activitiesList.querySelectorAll('.delete-participant').forEach(icon => {
      icon.addEventListener('click', async (e) => {
        const activity = decodeURIComponent(icon.getAttribute('data-activity'));
        const email = decodeURIComponent(icon.getAttribute('data-email'));
        if (!confirm(`Remove ${email} from ${activity}?`)) return;
        try {
          const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            // Nach erfolgreichem Entfernen Aktivitäten neu laden
            fetchActivities();
          } else {
            const result = await response.json();
            alert(result.detail || 'Failed to remove participant.');
          }
        } catch (err) {
          alert('Network error while removing participant.');
        }
      });
    });
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
        // Aktivitätenliste nach erfolgreichem Signup neu laden
        fetchActivities();
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
