const planetContainer = document.querySelector("#planetContainer");
const overlay = document.getElementById("overlay");
const planetNameElement = document.getElementById("planetName");
const planetLatinElement = document.getElementById("planetLatin");
const planetDescriptionElement = document.getElementById("planetDescription");
const planetFeaturesContainer = document.getElementById("planetFeaturesContainer");

// Scale for distance between celestial bodies
const DISTANCE_SCALE = 0.000000001;
const START_POSITION_X = 0;

// Size factors
const STAR_SIZE_FACTOR = 0.0001;
const PLANET_SIZE_FACTOR = 0.0005;
const MIN_PLANET_SIZE_PX = 8;

// API fuction to get data
async function getSolarisData() {
  let apiKey = null;
  // Try & catch to get the API key first
  try {
    const keyResponse = await fetch(
      "https://4a6l0o1px9.execute-api.eu-north-1.amazonaws.com/key"
    );
    if (!keyResponse.ok) {
      throw new Error(`Key Error: ${keyResponse.status}`);
    }
    const keyData = await keyResponse.json();
    apiKey = keyData.key;
    console.log("API key successfully obtained.");
  } catch (error) {
    console.error("Critical error obtaining the key. Stopping.", error);
    return;
  }

  // Try & catch to get the bodies data
  try {
    const bodiesResponse = await fetch(
      "https://corsproxy.io/?https://4a6l0o1px9.execute-api.eu-north-1.amazonaws.com/bodies",
      {
        method: "GET",
        headers: { "x-zocom": apiKey },
      }
    );

    if (!bodiesResponse.ok) {
      throw new Error(`Bodies error: ${bodiesResponse.status}`);
    }

    const bodiesData = await bodiesResponse.json();
    console.log("Bodies data successfully obtained.");

    // Call function to render planets
    renderPlanets(bodiesData.bodies);
  } catch (error) {
    console.error("Critical error obtaining the bodies.", error);
  }
}

// Function to render planets and the sun
function renderPlanets(planetsData) {
  planetsData.forEach((planet) => {
    // Iterate through each planet

    const planetDiv = document.createElement("div"); // Create a div for each planet
    planetDiv.classList.add("planet"); // Add the common 'planet' class

    let sizeFactor; // Variable to hold size factor
    let positionX; // Variable to hold X position

    if (planet.type === "star") {
      // Special handling for the sun
      sizeFactor = STAR_SIZE_FACTOR;

      const sunSize = planet.circumference * sizeFactor; // Calculate sun size

      planetDiv.classList.add("sun");

      planetDiv.style.width = `${sunSize}px`; // Set sun size (width and height)
      planetDiv.style.height = `${sunSize}px`;

      // Force center the sun on the screen ----
      planetDiv.style.position = "fixed";
      planetDiv.style.left = "0";
      planetDiv.style.top = "50%";
      planetDiv.style.transform = "translate(-50%, -50%)";

      planetContainer.appendChild(planetDiv); // Add sun to the container

      planetDiv.addEventListener("click", () => showPlanetDetails(planet)); // Click event for sun details
      return;
    } else {
      // Handling for planets
      planetDiv.classList.add(`planet-${planet.name.toLowerCase()}`); // Add specific class for each planet
      sizeFactor = PLANET_SIZE_FACTOR; // Set size factor for planets

      let calculatedSize = planet.circumference * sizeFactor;
      let finalSize = Math.max(calculatedSize, MIN_PLANET_SIZE_PX);

      planetDiv.style.width = `${finalSize}px`;
      planetDiv.style.height = `${finalSize}px`;

      positionX = START_POSITION_X + planet.distance * DISTANCE_SCALE; // Calculate X position based on distance
    }

    planetDiv.style.left = `${positionX}px`; // horizontal position

    planetContainer.appendChild(planetDiv); // Add planet to the container
    // Click event for planet details
    planetDiv.addEventListener("click", () => {
      showPlanetDetails(planet);
    });
  });
}

/**
 * Show planet details in the overlay.
 * @param {Object} planet - the planet data object
 */
function showPlanetDetails(planet) {
  // Fill elements with planet data
  planetNameElement.textContent = planet.name.toUpperCase();
  planetLatinElement.textContent = planet.latinName.toUpperCase();
  planetDescriptionElement.textContent = planet.desc;

  // Clean previous features
  planetFeaturesContainer.innerHTML = "";

  // Function to create and add a feature item to the container
  function addFeatureItem(label, value, isFullWidth = false) {
    const itemDiv = document.createElement("div"); // Create feature item div
    itemDiv.classList.add("feature-item"); // Add common class
    if (isFullWidth) {
      // If full width, span both columns
      itemDiv.style.gridColumn = "1 / span 2";
    }

    const labelSpan = document.createElement("span"); // Create label span
    labelSpan.classList.add("feature-label"); // Add label class
    labelSpan.textContent = label; // Set label text

    const valueSpan = document.createElement("span"); // Create value span
    valueSpan.classList.add("feature-value"); // Add value class

    if (["OMKRETS", "KM FRÅN SOLEN"].includes(label)) {
      // If the label is for circumference or distance
      valueSpan.textContent = `${Number(
        value.replace(" km", "").replace(/,/g, "")
      ).toLocaleString("sv-SE")} km`; // Format number with thousands separator
    } else {
      valueSpan.textContent = value; // Else set value text directly
    }

    itemDiv.appendChild(labelSpan);
    itemDiv.appendChild(valueSpan);
    planetFeaturesContainer.appendChild(itemDiv);
  }

  // Create the characteristic items in two columns
  // First column
  addFeatureItem("OMKRETS", `${planet.circumference} km`);
  addFeatureItem("KM FRÅN SOLEN", `${planet.distance} km`);

  // Second column
  addFeatureItem("MAX TEMPERATUR", `${planet.temp.day} °C`);
  addFeatureItem("MIN TEMPERATUR", `${planet.temp.night} °C`);

  // Moons
  let moonsText;
  if (planet.moons && planet.moons.length > 0) {
    moonsText = planet.moons.join(", ");
  } else {
    moonsText = "-";
  }
  addFeatureItem("MÅNAR", moonsText, true);

  // Show the overlay
  overlay.classList.remove("hidden");
}

// Overlay references
const overlayContent = document.getElementById("overlayContent");

// Close overlay when clicking outside content
overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    overlay.classList.add("hidden");
  }
});

// Start fetching data when the page loads
getSolarisData();

