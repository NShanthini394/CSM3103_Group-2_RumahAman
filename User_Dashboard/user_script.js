
const DB_NAME = "RumahAmanDB";
const DB_VERSION = 1;
let db = null;

let activeFilterType = "all";
let bookmarkedPropertyIds = [];

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || {
    username: "aiman_dev26",
    email: "cs_student@umt.edu.my",
    role: "user"
};

window.onload = function () {
    initIndexedDB();
    populateDistrictReviewDropdown();
    loadThemeState(); 
};

function initIndexedDB() {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = function (event) {
        console.error("IndexedDB initialization failed:", event.target.error);
        alert("Critical Error: Web database access failed.");
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("IndexedDB connected successfully.");

        syncWithLandlordStorage();
        initUserInterface();
        loadStateDropdowns();
        refreshDashboardData();
    };

    request.onupgradeneeded = function (event) {
        let dbInstance = event.target.result;
        if (!dbInstance.objectStoreNames.contains("properties")) {
            dbInstance.createObjectStore("properties", { keyPath: "id" });
        }
        if (!dbInstance.objectStoreNames.contains("bookmarks")) {
            dbInstance.createObjectStore("bookmarks", { keyPath: "id" });
        }
        if (!dbInstance.objectStoreNames.contains("reviews")) {
            dbInstance.createObjectStore("reviews", { keyPath: "id", autoIncrement: true });
        }
    };
}

function syncWithLandlordStorage() {
    let globalListings = JSON.parse(localStorage.getItem('propertyListings')) || [];
    if (!db) return;

    const transaction = db.transaction(["properties"], "readwrite");
    const store = transaction.objectStore("properties");

    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = function (event) {
        const currentIndexedDBList = event.target.result || [];

        const activeGlobalIds = globalListings.map(item => item.id);

        currentIndexedDBList.forEach(localItem => {
            if (!activeGlobalIds.includes(localItem.id)) {
                store.delete(localItem.id);
                console.log(`Sync Engine: Iklan ${localItem.id} telah dibuang dari IndexedDB kerana dipadam oleh landlord.`);
            }
        });

        globalListings.forEach(item => {
            let mappedItem = {
                id: item.id,
                title: item.title,
                type: item.type,
                houseType: item.houseType,
                beds: parseInt(item.beds) || 3,
                baths: parseInt(item.baths) || 2,
                state: item.state,
                district: item.district,
                price: parseFloat(item.price),
                owner: "Authorized Landlord",
                contact: item.contact || "011-1234567",
                email: item.ownerEmail || "admin@rumahaman.pwa",
                image: item.image || "",
                likes: item.likes !== undefined ? parseInt(item.likes) : 0
            };
            store.put(mappedItem);
        });
    };
}

function initUserInterface() {
    const usernameEl = document.getElementById('profileUsername');
    const emailEl = document.getElementById('profileEmail');

    if (usernameEl) usernameEl.textContent = currentUser.username;
    if (emailEl) emailEl.textContent = currentUser.email;
}

function switchTab(tabId, element) {
    document.querySelectorAll('.view-container').forEach(t => t.classList.add('hidden'));

    const targetView = document.getElementById('view-' + tabId);
    if (targetView) targetView.classList.remove('hidden');

    document.querySelectorAll('.bottom-nav .nav-item').forEach(i => i.classList.remove('active'));
    element.classList.add('active');

    if (tabId === 'home' || tabId === 'favorites') {
        refreshDashboardData();
    } else if (tabId === 'reviews') {
        renderReviewsFeed();
    }
}

function loadStateDropdowns() {
    const stateFilter = document.getElementById("stateFilter");
    if (!stateFilter) return;

    stateFilter.innerHTML = '<option value="">-- All States --</option>';
    for (let state in locationData) {
        stateFilter.innerHTML += `<option value="${state}">${state}</option>`;
    }
}

function populateUserDistricts() {
    const stateSelect = document.getElementById("stateFilter");
    const districtSelect = document.getElementById("districtFilter");

    if (!stateSelect || !districtSelect) return;

    districtSelect.innerHTML = '<option value="">-- All Districts --</option>';

    if (stateSelect.value === "") {
        districtSelect.disabled = true;
        filterProperties();
        return;
    }

    districtSelect.disabled = false;
    const districts = locationData[stateSelect.value] || [];
    districts.forEach(district => {
        districtSelect.innerHTML += `<option value="${district}">${district}</option>`;
    });

    filterProperties();
}

function refreshDashboardData() {
    if (!db) return;

    const transaction = db.transaction(["bookmarks"], "readonly");
    const store = transaction.objectStore("bookmarks");
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = function () {
        bookmarkedPropertyIds = getAllRequest.result.map(b => b.id);
        renderPropertiesGrid();
        updateProfileStatsUI();
    };
}

function renderPropertiesGrid() {
    const propertyContainer = document.getElementById("user-property-container");
    const favoritesContainer = document.getElementById("user-favorites-container");
    const reviewPropertySelect = document.getElementById("review-property-select");

    if (!propertyContainer) return;

    const transaction = db.transaction(["properties"], "readonly");
    const store = transaction.objectStore("properties");
    const fetchAll = store.getAll();

    fetchAll.onsuccess = function () {
        const listings = fetchAll.result || [];

        propertyContainer.innerHTML = "";
        if (favoritesContainer) favoritesContainer.innerHTML = "";
        if (reviewPropertySelect) {
            reviewPropertySelect.innerHTML = '<option value="">-- Choose Deployed Asset --</option>';
        }

        let totalRenderedHome = 0;
        let totalRenderedFavs = 0;

        listings.forEach(item => {
            const isBookmarked = bookmarkedPropertyIds.includes(item.id);

            if (reviewPropertySelect) {
                reviewPropertySelect.innerHTML += `<option value="${item.title} (${item.district})">${item.title} - ${item.district}</option>`;
            }

            const badgeClass = item.type === "rent" ? "badge-rent" : "badge-sale";
            const dealType = item.type === "rent" ? "Rent" : "Sale";
            const priceUnit = item.type === "rent" ? "/ mo" : "";

            const mediaTag = item.image
                ? `<img src="${item.image}" alt="Property Preview" style="width:100%; height:160px; object-fit:cover;">`
                : `<div class="property-img-placeholder">
                    <i class="fa-solid fa-house-chimney"></i>
                    <span>RUMAHAMAN ASSET</span>
                   </div>`;

            let itemSeed = ((item.state || "").length + (item.district || "").length) % 3;
            let itemSafetyScore = itemSeed === 0 ? "89%" : (itemSeed === 1 ? "96%" : "74%");
            let itemSafetyColor = itemSeed === 0 ? "#22c55e" : (itemSeed === 1 ? "var(--primary)" : "var(--warning)");

            const propertyCardHTML = `
                <div class="property-card" data-type="${item.type}" data-state="${item.state || ''}" data-district="${item.district || ''}" data-title="${item.title.toLowerCase()}">
                    <div style="position:relative; width:100%; height:160px; overflow:hidden;">
                        ${mediaTag}
                    </div>
                    <button class="fav-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmarkState('${item.id}', event)">
                        <i class="fa-solid fa-heart"></i>
                        <span class="like-counter-num">${item.likes || 0}</span>
                    </button>
                    <div class="property-details">
                        <div style="margin-bottom: 8px;">
                            <span class="badge ${badgeClass}">${dealType}</span>
                        </div>
                        <h3 style="text-transform: capitalize;">${item.title}</h3>
                        
                        <!-- BAHAGIAN DIUBAH: Ditambah gaya flexbox & lencana Safety Score -->
                        <p class="location-text" style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 12px; gap: 5px;">
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65%;"><i class="fa-solid fa-location-dot"></i> ${item.district}, ${item.state}</span>
                            <span style="font-size: 0.7rem; font-weight: 600; color: ${itemSafetyColor}; background: var(--bg-app); padding: 2px 6px; border-radius: 6px; border: 1px solid var(--border-color); display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;" title="Zon Safety Score">
                                <i class="fa-solid fa-shield-halved" style="font-size: 0.65rem;"></i> ${itemSafetyScore} Safety
                            </span>
                        </p>
                        
                        <div class="property-specs">
                            <span><i class="fa-solid fa-bed"></i> ${item.beds || 3} Beds</span>
                            <span><i class="fa-solid fa-bath"></i> ${item.baths || 2} Baths</span>
                        </div>
                        
                        <div class="property-footer">
                            <div class="property-price">RM ${parseFloat(item.price).toLocaleString()}<span>${priceUnit}</span></div>
                            <button class="action-btn" onclick="openOwnerContactModal('${item.owner}', '${item.contact}', '${item.email || 'admin@rumahaman.pwa'}')">
                                <i class="fa-solid fa-phone"></i> Contact
                            </button>
                        </div>
                    </div>
                </div>
            `;

            propertyContainer.innerHTML += propertyCardHTML;
            totalRenderedHome++;

            if (isBookmarked && favoritesContainer) {
                favoritesContainer.innerHTML += propertyCardHTML;
                totalRenderedFavs++;
            }
        });

        handleEmptyPlaceholderMessages(totalRenderedHome, totalRenderedFavs);
        filterProperties();
    };
}
function handleEmptyPlaceholderMessages(homeCount, favCount) {
    const homeMsg = document.getElementById("empty-listings-msg");
    const favMsg = document.getElementById("empty-favorites-msg");

    if (homeMsg) homeMsg.style.display = homeCount === 0 ? "block" : "none";
    if (favMsg) favMsg.style.display = favCount === 0 ? "block" : "none";
}

function filterType(typeValue, element) {
    activeFilterType = typeValue;
    document.querySelectorAll('.categories .category-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    filterProperties();
}
function populateDistrictReviewDropdown() {
    const selectEl = document.getElementById('review-district-select');
    selectEl.innerHTML = '<option value="">-- Please Select The States --</option>';

    for (const negeri in locationData) {
        locationData[negeri].forEach(daerah => {
            const option = document.createElement('option');
            option.value = daerah;
            option.textContent = `${daerah} (${negeri})`;
            selectEl.appendChild(option);
        });
    }
}

function toggleMenu(menuId, event) {
    event.stopPropagation();
    document.getElementById(menuId).classList.toggle('hidden');
}

window.onclick = function(event) {
    if (!event.target.matches('.fa-circle-user')) {
        const dropdowns = document.getElementsByClassName("dropdown");
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].classList.add('hidden');
        }
    }
}

// Fungsi Dark Mode
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('userTheme', isDark ? 'dark' : 'light');
}

function loadThemeState() {
    if (localStorage.getItem('userTheme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
}


function filterProperties() {
    const stateQuery = document.getElementById("stateFilter")?.value || "";
    const districtQuery = document.getElementById("districtFilter")?.value || "";

    // Target elements inside the top safety insight panel
    const safetyBox = document.getElementById("safety-insights-box");
    const safetyScoreEl = document.getElementById("safety-score-value");
    const crimeRecordEl = document.getElementById("crime-record-value");

    if (safetyBox) {
        if (stateQuery === "") {
            safetyBox.style.display = "none";
        } else {
            safetyBox.style.display = "block";

            // Deterministic scoring engine based on selection attributes
            let seed = (stateQuery.length + (districtQuery ? districtQuery.length : 0)) % 3;

            if (seed === 0) {
                if (safetyScoreEl) safetyScoreEl.innerHTML = `<span style="color: #22c55e;">89 / 100</span> <sub style="font-size: 0.7rem; color: var(--gray); font-weight:400;">Grade A</sub>`;
                if (crimeRecordEl) crimeRecordEl.innerHTML = `<span style="color: #22c55e;"><i class="fa-solid fa-circle-check"></i> Low Risk</span><br><span style="font-size: 0.7rem; color: var(--gray); font-weight: 400;">Isolated petty incidents only</span>`;
            } else if (seed === 1) {
                if (safetyScoreEl) safetyScoreEl.innerHTML = `<span style="color: var(--primary);">96 / 100</span> <sub style="font-size: 0.7rem; color: var(--gray); font-weight:400;">Grade A+</sub>`;
                if (crimeRecordEl) crimeRecordEl.innerHTML = `<span style="color: var(--primary);"><i class="fa-solid fa-shield-heart"></i> Highly Secure</span><br><span style="font-size: 0.7rem; color: var(--gray); font-weight: 400;">Active neighborhood community watch</span>`;
            } else {
                if (safetyScoreEl) safetyScoreEl.innerHTML = `<span style="color: var(--warning);">74 / 100</span> <sub style="font-size: 0.7rem; color: var(--gray); font-weight:400;">Grade B</sub>`;
                if (crimeRecordEl) crimeRecordEl.innerHTML = `<span style="color: var(--warning);"><i class="fa-solid fa-triangle-exclamation"></i> Moderate Risk</span><br><span style="font-size: 0.7rem; color: var(--gray); font-weight: 400;">Regular law enforcement patrols present</span>`;
            }
        }
    }

    // 3. STANDARD REGIONAL PROPERTY CARD FILTERING
    const homeCards = document.querySelectorAll("#user-property-container .property-card");
    let matchCountHome = 0;

    homeCards.forEach(card => {
        const cType = card.getAttribute("data-type");
        const cState = card.getAttribute("data-state");
        const cDistrict = card.getAttribute("data-district");

        const matchesType = (activeFilterType === "all" || cType === activeFilterType);
        const matchesState = (stateQuery === "" || cState === stateQuery);
        const matchesDistrict = (districtQuery === "" || cDistrict === districtQuery);

        if (matchesType && matchesState && matchesDistrict) {
            card.style.display = "flex";
            matchCountHome++;
        } else {
            card.style.display = "none";
        }
    });

    const homeMsg = document.getElementById("empty-listings-msg");
    if (homeMsg) homeMsg.style.display = matchCountHome === 0 ? "block" : "none";
}
function toggleBookmarkState(propertyId, event) {
    if (event) event.stopPropagation();
    if (!db) return;

    const isBookmarked = bookmarkedPropertyIds.includes(propertyId);
    const transaction = db.transaction(["bookmarks", "properties"], "readwrite");
    const bookmarkStore = transaction.objectStore("bookmarks");
    const propertyStore = transaction.objectStore("properties");

    const propRequest = propertyStore.get(propertyId);
    
    propRequest.onsuccess = function() {
        let propertyData = propRequest.result;
        if (propertyData) {
            if (isBookmarked) {
                propertyData.likes = Math.max(0, (propertyData.likes || 0) - 1);
                bookmarkStore.delete(propertyId);
            } else {
                propertyData.likes = (propertyData.likes || 0) + 1;
                bookmarkStore.add({ id: propertyId, markedAt: new Date().toISOString() });
            }
            propertyStore.put(propertyData);

            let globalListings = JSON.parse(localStorage.getItem('propertyListings')) || [];
            let listingIndex = globalListings.findIndex(p => p.id === propertyId);
            if (listingIndex !== -1) {
                globalListings[listingIndex].likes = propertyData.likes;
                localStorage.setItem('propertyListings', JSON.stringify(globalListings));
            }
        }
    };

    transaction.oncomplete = function() {
        refreshDashboardData();
    };
}

function submitUserReview(event) {
    event.preventDefault();
    if (!db) return;

    const districtContext = document.getElementById("review-district-select").value;
    const textContext = document.getElementById("review-text-input").value;

    if (!districtContext || !textContext) {
        alert("Please Select Your States And Give The Message");
        return;
    }

    const newReview = {
        author: currentUser.username,
        district: districtContext,
        text: textContext,
        timestamp: new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const transaction = db.transaction(["reviews"], "readwrite");
    const store = transaction.objectStore("reviews");
    const addReq = store.add(newReview);

    addReq.onsuccess = function () {
        document.getElementById("review-text-input").value = "";
      
        document.getElementById("review-district-select").value = ""; 
        alert("Your feedback successfuly published!");
        
        renderReviewsFeed();
    };
}

function renderReviewsFeed() {
    const streamContainer = document.getElementById("community-reviews-stream");
    if (!db || !streamContainer) return;

    const transaction = db.transaction(["reviews"], "readonly");
    const store = transaction.objectStore("reviews");
    const getReviews = store.getAll();

    getReviews.onsuccess = function () {
        const reviews = getReviews.result || [];
        streamContainer.innerHTML = "";

        if (reviews.length === 0) {
            streamContainer.innerHTML = `<p style="text-align: center; color: var(--gray);">Tiada maklum balas buat masa ini.</p>`;
            return;
        }

        reviews.reverse().forEach(rev => {
            const locationDisplay = rev.district || rev.property || "not has location";
            
            const reviewCard = document.createElement("div");
            reviewCard.className = "card";
            reviewCard.style.padding = "15px";
            reviewCard.style.borderRadius = "12px";
            reviewCard.style.background = "var(--white)";
            reviewCard.style.border = "1px solid var(--border-color)";

            reviewCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary);">
                        <i class="fa-solid fa-location-dot"></i> ${locationDisplay}
                    </span>
                    <span style="font-size: 0.75rem; color: var(--gray);">${rev.timestamp}</span>
                </div>
                <div style="font-size: 0.9rem; color: var(--text); margin-bottom: 8px;">
                    ${rev.text}
                </div>
                <div style="font-size: 0.75rem; color: var(--gray);">
                    Review from: <strong>@${rev.author || 'Anonymous'}</strong>
                </div>
            `;
            streamContainer.appendChild(reviewCard);
        });
    };
}

function openOwnerContactModal(name, phone, email) {
    document.getElementById("contactName").textContent = name || "Authorized Landlord";
    document.getElementById("contactPhone").textContent = phone || "011-1234567";
    document.getElementById("contactEmail").textContent = email || "admin@rumahaman.pwa";
    document.getElementById("ownerModal").classList.remove("hidden");
}

function closeOwnerModal() {
    document.getElementById("ownerModal").classList.add("hidden");
}

function updateProfileStatsUI() {
    const statsCountEl = document.getElementById("profileSavedCount");
    if (statsCountEl) {
        statsCountEl.textContent = bookmarkedPropertyIds.length;
    }
}

function handleUserLogout() {
    if (confirm("Are you sure you want to exit your tenant profile session?")) {
        localStorage.removeItem('currentUser');
        alert("Session cleared safely.");
        window.location.href = "../index.html";
    }
}

// DATA GEOGRAFI MALAYSIA
const locationData = {
    "Johor": ["Johor Bahru", "Kecil Pontian", "Kluang", "Kota Tinggi", "Kulai", "Mersing", "Muar", "Pontian", "Segamat", "Tangkak"],
    "Kedah": ["Baling", "Bandar Baharu", "Kota Setar", "Kuala Muda", "Kubang Pasu", "Kulim", "Langkawi", "Padang Terap", "Pendang", "Pokok Sena", "Sik", "Yan"],
    "Kelantan": ["Bachok", "Gua Musang", "Jeli", "Kota Bharu", "Kuala Krai", "Machang", "Pasir Mas", "Pasir Puteh", "Tanah Merah", "Tumpat"],
    "Melaka": ["Alor Gajah", "Melaka Tengah", "Jasin"],
    "Negeri Sembilan": ["Jelebu", "Jempol", "Kuala Pilah", "Port Dickson", "Rembau", "Seremban", "Tampin"],
    "Pahang": ["Bentong", "Bera", "Cameron Highlands", "Jerantut", "Kuantan", "Lipis", "Maran", "Pekan", "Raub", "Rompin", "Temerloh"],
    "Pulau Pinang": ["Barat Daya", "Seberang Perai Selatan", "Seberang Perai Tengah", "Seberang Perai Utara", "Timur Laut"],
    "Perak": ["Bagan Datuk", "Batang Padang", "Hilir Perak", "Hulu Perak", "Kampar", "Kerian", "Kinta", "Kuala Kangsar", "Larut, Matang dan Selama", "Manjung", "Muallim", "Perak Tengah"],
    "Perlis": ["Kangar"],
    "Sabah": ["Beaufort", "Beluran", "Keningau", "Kinabatangan", "Kota Belud", "Kota Kinabalu", "Kota Marudu", "Kuala Penyu", "Kudat", "Kunid", "Lahad Datu", "Nabawan", "Papar", "Penampang", "Pitas", "Ranau", "Sandakan", "Semporna", "Sipitang", "Tambunan", "Tawau", "Tenom", "Tongod", "Tuaran"],
    "Sarawak": ["Asajaya", "Bau", "Belaga", "Betong", "Bintulu", "Dalat", "Daro", "Julau", "Kanowit", "Kapit", "Kuching", "Lawas", "Limbang", "Lubok Antu", "Lundu", "Marudi", "Matu", "Meradong", "Miri", "Mukah", "Pakan", "Samarahan", "Saratok", "Sarikei", "Selangau", "Serian", "Sibu", "Simunjan", "Song", "Sri Aman", "Tatau"],
    "Selangor": ["Gombak", "Hulu Langat", "Hulu Selangor", "Klang", "Kuala Langat", "Kuala Selangor", "Petaling", "Sabak Bernam", "Sepang"],
    "Terengganu": ["Besut", "Dungun", "Hulu Terengganu", "Kemaman", "Kuala Nerus", "Kuala Terengganu", "Marang", "Setiu"],
    "W.P. Kuala Lumpur": ["Kuala Lumpur"]
};