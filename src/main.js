import "./style.css";

const fields = {
  start: createField("start"),
  end: createField("end"),
};
const searchButtons = document.querySelectorAll("[data-search]");
const calculateButton = document.querySelector("#calculate-button");
const resultPanel = document.querySelector("#result");
const distanceOutput = document.querySelector("#distance");
const routeSummary = document.querySelector("#route-summary");
const mapLink = document.querySelector("#map-link");
const errorMessage = document.querySelector("#error-message");

let lastGeocodeRequestAt = 0;
let selectedRoute = null;

function createField(name) {
  return {
    input: document.querySelector(`#${name}-input`),
    suggestions: document.querySelector(`#${name}-suggestions`),
    status: document.querySelector(`#${name}-status`),
    place: null,
  };
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.hidden = true;
}

function updateCalculateButton() {
  calculateButton.disabled = !(fields.start.place && fields.end.place);
}

function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters).toLocaleString("ko-KR")} m`;
  }
  const kilometers = meters / 1000;
  return `${kilometers.toLocaleString("ko-KR", {
    maximumFractionDigits: kilometers < 10 ? 1 : 0,
  })} km`;
}

async function waitForGeocodeCooldown() {
  const remaining = 1100 - (Date.now() - lastGeocodeRequestAt);
  if (remaining > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, remaining));
  }
  lastGeocodeRequestAt = Date.now();
}

async function searchPlaces(name) {
  const field = fields[name];
  const query = field.input.value.trim();
  clearError();

  if (query.length < 2) {
    field.status.textContent = "두 글자 이상 입력해 주세요.";
    field.input.focus();
    return;
  }

  field.place = null;
  field.suggestions.hidden = true;
  field.suggestions.replaceChildren();
  field.status.textContent = "장소를 찾고 있어요...";
  updateCalculateButton();
  searchButtons.forEach((button) => {
    button.disabled = true;
  });

  try {
    await waitForGeocodeCooldown();
    const response = await fetch(
      `/api/geocode?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "장소 검색에 실패했습니다.");
    }

    if (!Array.isArray(data) || data.length === 0) {
      if (field.input.value.trim() !== query) {
        return;
      }
      field.status.textContent = "검색 결과가 없습니다. 다른 검색어를 입력해 보세요.";
      return;
    }

    if (field.input.value.trim() !== query) {
      return;
    }
    renderSuggestions(field, data);
  } catch (error) {
    field.status.textContent = "검색하지 못했어요.";
    showError(error.message || "장소 검색 중 오류가 발생했습니다.");
  } finally {
    searchButtons.forEach((button) => {
      button.disabled = false;
    });
  }
}

function renderSuggestions(field, places) {
  field.suggestions.replaceChildren();
  places.forEach((place, index) => {
    const button = document.createElement("button");
    button.className = "suggestion";
    button.type = "button";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", "false");

    const name = document.createElement("span");
    name.className = "suggestion-name";
    name.textContent = place.name || place.display_name.split(",")[0];

    const address = document.createElement("span");
    address.className = "suggestion-address";
    address.textContent = place.display_name;

    button.append(name, address);
    button.addEventListener("click", () => selectPlace(field, place));
    field.suggestions.append(button);
    if (index === 0) {
      button.dataset.first = "true";
    }
  });
  field.suggestions.hidden = false;
  field.status.textContent = `${places.length}개의 검색 결과 중 장소를 선택해 주세요.`;
}

function selectPlace(field, place) {
  field.place = {
    name: place.name || place.display_name.split(",")[0],
    displayName: place.display_name,
    latitude: Number(place.lat),
    longitude: Number(place.lon),
  };
  field.input.value = field.place.displayName;
  field.suggestions.hidden = true;
  field.status.textContent = `선택됨: ${field.place.name}`;
  resultPanel.hidden = true;
  selectedRoute = null;
  clearError();
  updateCalculateButton();
}

async function calculateRoute() {
  if (!fields.start.place || !fields.end.place) {
    return;
  }
  clearError();
  resultPanel.hidden = true;
  calculateButton.disabled = true;
  calculateButton.classList.add("is-loading");

  const start = fields.start.place;
  const end = fields.end.place;
  const coordinates = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false&alternatives=false&steps=false`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("경로 검색 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    }
    const data = await response.json();
    const route = data.routes?.[0];
    if (data.code !== "Ok" || !route) {
      throw new Error("두 장소 사이의 자동차 경로를 찾을 수 없습니다. 장소를 다시 확인해 주세요.");
    }

    selectedRoute = { start, end };
    distanceOutput.textContent = formatDistance(route.distance);
    routeSummary.textContent = `${start.name}에서 ${end.name}까지`;
    mapLink.href = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(
      `${start.latitude},${start.longitude};${end.latitude},${end.longitude}`,
    )}`;
    resultPanel.hidden = false;
  } catch (error) {
    showError(error.message || "경로를 계산하는 중 오류가 발생했습니다.");
  } finally {
    calculateButton.classList.remove("is-loading");
    updateCalculateButton();
  }
}

searchButtons.forEach((button) => {
  button.addEventListener("click", () => searchPlaces(button.dataset.search));
});

Object.entries(fields).forEach(([name, field]) => {
  field.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!field.suggestions.hidden) {
        const firstSuggestion = field.suggestions.querySelector(".suggestion");
        firstSuggestion?.click();
      } else {
        searchPlaces(name);
      }
    }
    if (event.key === "Escape") {
      field.suggestions.hidden = true;
    }
  });

  field.input.addEventListener("input", () => {
    if (field.place && field.input.value !== field.place.displayName) {
      field.place = null;
      field.status.textContent = "장소가 변경되었습니다. 다시 검색해 주세요.";
      resultPanel.hidden = true;
      updateCalculateButton();
    }
    clearError();
  });
});

calculateButton.addEventListener("click", calculateRoute);
mapLink.addEventListener("click", (event) => {
  if (!selectedRoute) {
    event.preventDefault();
  }
});
