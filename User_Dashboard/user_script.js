const DEMO_SEED_VERSION = "v1.1";
const DB_NAME = "RumahAmanDB";
const DB_VERSION = 1;
const PAGE_SIZE = 12;

let db = null;
let activeFilterType = "all";
let bookmarkedPropertyIds = [];
let allPropertiesCache = [];
let currentFilteredCache = [];
let visibleLimit = PAGE_SIZE;

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || {
    username: "aiman_dev26",
    email: "cs_student@umt.edu.my",
    role: "user"
};

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
    "Sabah": ["Beaufort", "Beluran", "Keningau", "Kinabatangan", "Kota Belud", "Kota Kinabalu", "Kota Marudu", "Kuala Penyu", "Kudat", "Kunak", "Lahad Datu", "Nabawan", "Papar", "Penampang", "Pitas", "Ranau", "Sandakan", "Semporna", "Sipitang", "Tambunan", "Tawau", "Tenom", "Tongod", "Tuaran"],
    "Sarawak": ["Asajaya", "Bau", "Belaga", "Betong", "Bintulu", "Dalat", "Daro", "Julau", "Kanowit", "Kapit", "Kuching", "Lawas", "Limbang", "Lubok Antu", "Lundu", "Marudi", "Matu", "Meradong", "Miri", "Mukah", "Pakan", "Samarahan", "Saratok", "Sarikei", "Selangau", "Serian", "Sibu", "Simunjan", "Song", "Sri Aman", "Tatau"],
    "Selangor": ["Gombak", "Hulu Langat", "Hulu Selangor", "Klang", "Kuala Langat", "Kuala Selangor", "Petaling", "Sabak Bernam", "Sepang"],
    "Terengganu": ["Besut", "Dungun", "Hulu Terengganu", "Kemaman", "Kuala Nerus", "Kuala Terengganu", "Marang", "Setiu"],
    "W.P. Kuala Lumpur": ["Kuala Lumpur"]
};

// =========================================================
// DETERMINISTIC DEMO SEEDER (3 TO 5 LISTINGS PER DISTRICT)
// =========================================================
const PROPERTY_TEMPLATES = [
    { houseType: "Terrace", label: "Double-Storey Terrace", beds: 4, baths: 3, rentBase: 1450, saleBase: 460000, image: "../images/house1.png" },
    { houseType: "Condominium", label: "Serviced Residence", beds: 3, baths: 2, rentBase: 1650, saleBase: 420000, image: "../images/house2.jpg" },
    { houseType: "Condominium", label: "Garden Condo Suite", beds: 3, baths: 2, rentBase: 1500, saleBase: 390000, image: "../images/house3.jpg" },
    { houseType: "Terrace", label: "Single-Storey Home", beds: 3, baths: 2, rentBase: 1100, saleBase: 310000, image: "../images/house4.jpeg" },
    { houseType: "Semi-D", label: "Corner Semi-D Villa", beds: 4, baths: 3, rentBase: 2200, saleBase: 680000, image: "../images/house5.jpg" },
    { houseType: "Apartment", label: "Modern Urban Apartment", beds: 2, baths: 1, rentBase: 950, saleBase: 240000, image: "../images/house6.webp" },
    { houseType: "Townhouse", label: "Gated Townhouse", beds: 3, baths: 3, rentBase: 1750, saleBase: 490000, image: "../images/house7.jpg" },
    { houseType: "Bungalow", label: "Executive Family Bungalow", beds: 5, baths: 4, rentBase: 3000, saleBase: 880000, image: "../images/house8.jpg" }
];

const AREA_PREFIXES = [
    "Taman Harmoni",
    "Residensi Aman",
    "Laman Hijau",
    "Sentosa Heights",
    "Desa Permai",
    "Mutiara Indah",
    "Sri Saujana",
    "Vista Damai",
    "Puncak Bayu",
    "Taman Sejahtera"
];

const DEMO_OWNERS = [
    { name: "Encik Hakim Razak (Demo)", contact: "012-000 1101", email: "hakim.demo@rumahaman.pwa" },
    { name: "Puan Nurul Aina (Demo)", contact: "013-000 2202", email: "aina.demo@rumahaman.pwa" },
    { name: "Mr. Jason Tan (Demo)", contact: "016-000 3303", email: "jason.demo@rumahaman.pwa" },
    { name: "Ms. Kavitha Devi (Demo)", contact: "017-000 4404", email: "kavitha.demo@rumahaman.pwa" },
    { name: "Encik Faris Danial (Demo)", contact: "019-000 5505", email: "faris.demo@rumahaman.pwa" },
    { name: "Ms. Rachel Lim (Demo)", contact: "011-0000 6606", email: "rachel.demo@rumahaman.pwa" }
];

function getStatePriceMultiplier(state) {
    if (state === "W.P. Kuala Lumpur" || state === "Selangor" || state === "Pulau Pinang") return 1.3;
    if (state === "Johor" || state === "Melaka" || state === "Negeri Sembilan" || state === "Sabah" || state === "Sarawak" || state === "Perak") return 1.05;
    return 0.9;
}

function hashText(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function generateDemoProperties() {
    const demoListings = [];

    Object.keys(locationData).forEach((state) => {
        const multiplier = getStatePriceMultiplier(state);

        locationData[state].forEach((district) => {
            const baseHash = hashText(state + "::" + district);
            // Guaranteed 3, 4, or 5 properties per district
            const count = 3 + (baseHash % 3);

            for (let i = 0; i < count; i++) {
                const tpl = PROPERTY_TEMPLATES[(baseHash + i * 3) % PROPERTY_TEMPLATES.length];
                const prefix = AREA_PREFIXES[(baseHash + i * 2) % AREA_PREFIXES.length];
                const owner = DEMO_OWNERS[(baseHash + i) % DEMO_OWNERS.length];

                // Alternating rent/sale guarantees BOTH deal types exist in every district
                const dealType = (i % 2 === 0) ? "rent" : "sale";
                const variance = 0.92 + (((baseHash + i * 7) % 18) / 100);

                const price = dealType === "rent"
                    ? Math.round((tpl.rentBase * multiplier * variance) / 50) * 50
                    : Math.round((tpl.saleBase * multiplier * variance) / 10000) * 10000;

                const safeSlug = `${state}_${district}_${i}`.toLowerCase().replace(/[^a-z0-9]+/g, "_");

                demoListings.push({
                    id: `demo_${safeSlug}`,
                    title: `${prefix} ${tpl.label}`,
                    type: dealType,
                    houseType: tpl.houseType,
                    beds: tpl.beds,
                    baths: tpl.baths,
                    state: state,
                    district: district,
                    address: `Jalan ${prefix}, ${district}, ${state}`,
                    price: price,
                    owner: owner.name,
                    contact: owner.contact,
                    email: owner.email,
                    image: tpl.image,
                    likes: 5 + ((baseHash + i * 11) % 38),
                    isDemo: true
                });
            }
        });
    });

    return demoListings;
}

// =========================================================
// INITIALIZATION & INDEXEDDB SYNC
// =========================================================
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

        initUserInterface();
        loadStateDropdowns();

        // Wait for demo seeding + landlord sync to finish BEFORE rendering UI
        syncAndSeedProperties(function () {
            refreshDashboardData();
        });
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

function syncAndSeedProperties(onCompleteCallback) {
    if (!db) return;

    const globalListings = JSON.parse(localStorage.getItem('propertyListings')) || [];
    const transaction = db.transaction(["properties"], "readwrite");
    const store = transaction.objectStore("properties");

    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = function (event) {
        const currentIndexedDBList = event.target.result || [];
        const activeGlobalIds = globalListings.map(item => item.id);
        const existingDemoCount = currentIndexedDBList.filter(item => item.isDemo).length;
        const needsDemoSeed = localStorage.getItem("rumahAmanDemoSeeded") !== DEMO_SEED_VERSION || existingDemoCount === 0;

        // 1. Remove landlord listings that were deleted in Landlord Dashboard (keep demo items intact)
        currentIndexedDBList.forEach(localItem => {
            if (localItem.isDemo) {
                if (needsDemoSeed) store.delete(localItem.id);
            } else if (!activeGlobalIds.includes(localItem.id)) {
                store.delete(localItem.id);
                console.log(`Sync Engine: Listing ${localItem.id} removed because landlord deleted it.`);
            }
        });

        // 2. Seed deterministic demo listings if not yet seeded
        if (needsDemoSeed) {
            const demoItems = generateDemoProperties();
            demoItems.forEach(demo => store.put(demo));
            localStorage.setItem("rumahAmanDemoSeeded", DEMO_SEED_VERSION);
            console.log(`Seeded ${demoItems.length} demo listings across all Malaysian districts.`);
        }

        // 3. Sync live Landlord Dashboard listings into IndexedDB
        globalListings.forEach(item => {
            const mappedItem = {
                id: item.id,
                title: item.title,
                type: item.type,
                houseType: item.houseType || "Property",
                beds: parseInt(item.beds) || 3,
                baths: parseInt(item.baths) || 2,
                state: item.state,
                district: item.district,
                address: item.address || `${item.district}, ${item.state}`,
                price: parseFloat(item.price),
                owner: "Authorized Landlord",
                contact: item.contact || "011-1234567",
                email: item.ownerEmail || "admin@rumahaman.pwa",
                image: item.image || "",
                likes: item.likes !== undefined ? parseInt(item.likes) : 0,
                isDemo: false
            };
            store.put(mappedItem);
        });
    };

    transaction.oncomplete = function () {
        if (typeof onCompleteCallback === "function") {
            onCompleteCallback();
        }
    };

    transaction.onerror = function (err) {
        console.error("Sync transaction failed:", err);
        if (typeof onCompleteCallback === "function") {
            onCompleteCallback();
        }
    };
}

// =========================================================
// UI NAVIGATION & DROPDOWNS
// =========================================================
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

    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(i => i.classList.remove('active'));

    if (element) {
        element.classList.add('active');
    } else {
        const tabIndexMap = { home: 0, favorites: 1, reviews: 2, profile: 3 };
        const fallbackNav = navItems[tabIndexMap[tabId]];
        if (fallbackNav) fallbackNav.classList.add('active');
    }

    if (tabId === 'home' || tabId === 'favorites') {
        refreshDashboardData(true);
    } else if (tabId === 'reviews') {
        renderReviewsFeed();
    }
}

function loadStateDropdowns() {
    const stateFilter = document.getElementById("stateFilter");
    if (!stateFilter) return;

    let optionsHTML = '<option value="">-- All States --</option>';
    for (let state in locationData) {
        optionsHTML += `<option value="${state}">${state}</option>`;
    }
    stateFilter.innerHTML = optionsHTML;
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
    let districtOptions = '<option value="">-- All Districts --</option>';
    districts.forEach(district => {
        districtOptions += `<option value="${district}">${district}</option>`;
    });
    districtSelect.innerHTML = districtOptions;

    filterProperties();
}

// =========================================================
// DATA LOADING, FILTERING & RENDERING
// =========================================================
function refreshDashboardData(preserveLimit = false) {
    if (!db) return;

    const transaction = db.transaction(["bookmarks", "properties"], "readonly");
    const bookmarkStore = transaction.objectStore("bookmarks");
    const propertyStore = transaction.objectStore("properties");

    const getBookmarksReq = bookmarkStore.getAll();
    const getPropertiesReq = propertyStore.getAll();

    getBookmarksReq.onsuccess = function () {
        bookmarkedPropertyIds = (getBookmarksReq.result || []).map(b => b.id);
    };

    getPropertiesReq.onsuccess = function () {
        allPropertiesCache = getPropertiesReq.result || [];
    };

    transaction.oncomplete = function () {
        filterProperties(preserveLimit);
        renderFavoritesGrid();
        updateProfileStatsUI();
    };
}

function escapeHTML(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function interleaveByState(listings) {
    // Always prioritize real Landlord-created properties at the top
    const liveListings = listings.filter(item => !item.isDemo).reverse();
    const demoListings = listings.filter(item => item.isDemo);

    const grouped = {};
    demoListings.forEach(item => {
        if (!grouped[item.state]) grouped[item.state] = [];
        grouped[item.state].push(item);
    });

    const states = Object.keys(grouped);
    const interleaved = [];
    let index = 0;
    let remaining = true;

    while (remaining) {
        remaining = false;
        for (let s = 0; s < states.length; s++) {
            const bucket = grouped[states[s]];
            if (index < bucket.length) {
                interleaved.push(bucket[index]);
                remaining = true;
            }
        }
        index++;
    }

    return [...liveListings, ...interleaved];
}

function createPropertyCardHTML(item) {
    const isBookmarked = bookmarkedPropertyIds.includes(item.id);
    const badgeClass = item.type === "rent" ? "badge-rent" : "badge-sale";
    const dealType = item.type === "rent" ? "For Rent" : "For Sale";
    const priceUnit = item.type === "rent" ? " / mo" : "";

    const safeTitle = escapeHTML(item.title);
    const safeState = escapeHTML(item.state);
    const safeDistrict = escapeHTML(item.district);
    const safeHouseType = escapeHTML(item.houseType || "Residence");

    const mediaTag = item.image
        ? `<img src="${escapeHTML(item.image)}" alt="${safeTitle}" loading="lazy" style="width:100%; height:160px; object-fit:cover; display:block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="property-img-placeholder" style="display:none; width:100%; height:160px;">
               <i class="fa-solid fa-house-chimney"></i>
               <span>RUMAHAMAN ASSET</span>
           </div>`
        : `<div class="property-img-placeholder" style="width:100%; height:160px;">
               <i class="fa-solid fa-house-chimney"></i>
               <span>RUMAHAMAN ASSET</span>
           </div>`;

    const itemSeed = ((item.state || "").length + (item.district || "").length) % 3;
    const itemSafetyScore = itemSeed === 0 ? "89%" : (itemSeed === 1 ? "96%" : "74%");
    const itemSafetyColor = itemSeed === 0 ? "#22c55e" : (itemSeed === 1 ? "var(--primary)" : "var(--warning)");

    const demoPill = item.isDemo
        ? `<span style="font-size: 0.65rem; font-weight: 600; color: var(--gray); background: var(--bg-app); padding: 2px 7px; border-radius: 6px; border: 1px solid var(--border-color);">Demo</span>`
        : `<span style="font-size: 0.65rem; font-weight: 600; color: var(--primary); background: var(--lightGreen, #dcfce7); padding: 2px 7px; border-radius: 6px;">Landlord</span>`;

    return `
        <div class="property-card" data-type="${escapeHTML(item.type)}" data-state="${safeState}" data-district="${safeDistrict}">
            <div style="position:relative; width:100%; height:160px; overflow:hidden;">
                ${mediaTag}
            </div>
            <button class="fav-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmarkState('${escapeHTML(item.id)}', event)">
                <i class="fa-solid fa-heart"></i>
                <span class="like-counter-num">${item.likes || 0}</span>
            </button>
            <div class="property-details">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="badge ${badgeClass}">${dealType}</span>
                        <span style="font-size: 0.72rem; color: var(--gray); font-weight: 500;">${safeHouseType}</span>
                    </div>
                    ${demoPill}
                </div>
                <h3 style="text-transform: capitalize;">${safeTitle}</h3>

                <p class="location-text" style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 12px; gap: 5px;">
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65%;"><i class="fa-solid fa-location-dot"></i> ${safeDistrict}, ${safeState}</span>
                    <span style="font-size: 0.7rem; font-weight: 600; color: ${itemSafetyColor}; background: var(--bg-app); padding: 2px 6px; border-radius: 6px; border: 1px solid var(--border-color); display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;" title="Zone Safety Score">
                        <i class="fa-solid fa-shield-halved" style="font-size: 0.65rem;"></i> ${itemSafetyScore} Safety
                    </span>
                </p>

                <div class="property-specs">
                    <span><i class="fa-solid fa-bed"></i> ${item.beds || 3} Beds</span>
                    <span><i class="fa-solid fa-bath"></i> ${item.baths || 2} Baths</span>
                </div>

                <div class="property-footer">
                    <div class="property-price">RM ${parseFloat(item.price).toLocaleString()}<span>${priceUnit}</span></div>
                    <button class="action-btn" onclick="openOwnerContactModalById('${escapeHTML(item.id)}')">
                        <i class="fa-solid fa-phone"></i> Contact
                    </button>
                </div>
            </div>
        </div>
    `;
}

function updateResultsMetaBar(shownCount, totalCount, stateQuery, districtQuery) {
    const propertyContainer = document.getElementById("user-property-container");
    if (!propertyContainer) return;

    let metaBar = document.getElementById("results-meta-bar");
    if (!metaBar) {
        metaBar = document.createElement("div");
        metaBar.id = "results-meta-bar";
        metaBar.style.cssText = "display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:14px; font-size:0.82rem; color:var(--gray);";
        propertyContainer.parentNode.insertBefore(metaBar, propertyContainer);
    }

    let areaLabel = "across Malaysia";
    if (stateQuery && districtQuery) areaLabel = `in ${districtQuery}, ${stateQuery}`;
    else if (stateQuery) areaLabel = `in ${stateQuery}`;

    metaBar.innerHTML = `
        <span>Showing <strong>${shownCount}</strong> of <strong>${totalCount}</strong> properties ${escapeHTML(areaLabel)}</span>
        <span style="font-size:0.75rem; background:var(--bg-card, var(--white)); border:1px solid var(--border-color); padding:3px 10px; border-radius:999px;">
            <i class="fa-solid fa-database" style="color:var(--primary); margin-right:4px;"></i> Sample PWA Dataset + Live Landlord Sync
        </span>
    `;
}

function updateLoadMoreButton(totalFiltered) {
    const propertyContainer = document.getElementById("user-property-container");
    if (!propertyContainer) return;

    let wrapper = document.getElementById("load-more-wrapper");
    if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.id = "load-more-wrapper";
        wrapper.style.cssText = "text-align:center; margin: 22px 0 30px;";
        propertyContainer.parentNode.insertBefore(wrapper, propertyContainer.nextSibling);
    }

    if (visibleLimit < totalFiltered) {
        const remaining = totalFiltered - visibleLimit;
        wrapper.innerHTML = `
            <button type="button" class="category-btn active" onclick="loadMoreProperties()" style="border:none; cursor:pointer; padding:10px 24px;">
                Load More Properties (${remaining} remaining)
            </button>
        `;
        wrapper.style.display = "block";
    } else {
        wrapper.innerHTML = "";
        wrapper.style.display = "none";
    }
}

function loadMoreProperties() {
    visibleLimit += PAGE_SIZE;
    renderFilteredHomeGrid();
}

function renderFilteredHomeGrid() {
    const propertyContainer = document.getElementById("user-property-container");
    if (!propertyContainer) return;

    const stateQuery = document.getElementById("stateFilter")?.value || "";
    const districtQuery = document.getElementById("districtFilter")?.value || "";

    if (currentFilteredCache.length === 0) {
        propertyContainer.innerHTML = `
            <p id="empty-listings-msg" style="grid-column: 1 / -1; text-align: center; color: var(--gray); padding: 40px 0;">
                <i class="fa-solid fa-house-laptop" style="font-size: 2.5rem; margin-bottom: 10px; color: var(--border-color);"></i><br>
                No active properties match your selection.
            </p>
        `;
        updateResultsMetaBar(0, 0, stateQuery, districtQuery);
        updateLoadMoreButton(0);
        return;
    }

    const sliceToRender = currentFilteredCache.slice(0, visibleLimit);
    propertyContainer.innerHTML = sliceToRender.map(createPropertyCardHTML).join("");

    updateResultsMetaBar(sliceToRender.length, currentFilteredCache.length, stateQuery, districtQuery);
    updateLoadMoreButton(currentFilteredCache.length);
}

function renderFavoritesGrid() {
    const favoritesContainer = document.getElementById("user-favorites-container");
    if (!favoritesContainer) return;

    const favoriteItems = allPropertiesCache.filter(item => bookmarkedPropertyIds.includes(item.id));

    if (favoriteItems.length === 0) {
        favoritesContainer.innerHTML = `
            <p id="empty-favorites-msg" style="grid-column: 1 / -1; text-align: center; color: var(--gray); padding: 40px 0;">
                No bookmarked listings found. Click the heart icon on any deal to save it!
            </p>
        `;
        return;
    }

    favoritesContainer.innerHTML = favoriteItems.map(createPropertyCardHTML).join("");
}

function filterType(typeValue, element) {
    activeFilterType = typeValue;
    document.querySelectorAll('.categories .category-btn').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    filterProperties(false);
}

function filterProperties(preserveLimit = false) {
    const stateQuery = document.getElementById("stateFilter")?.value || "";
    const districtQuery = document.getElementById("districtFilter")?.value || "";

    // 1. Update Safety Insights Panel
    const safetyBox = document.getElementById("safety-insights-box");
    const safetyScoreEl = document.getElementById("safety-score-value");
    const crimeRecordEl = document.getElementById("crime-record-value");

    if (safetyBox) {
        if (stateQuery === "") {
            safetyBox.classList.add("hidden");
            safetyBox.style.display = "none";
        } else {
            safetyBox.classList.remove("hidden");
            safetyBox.style.display = "block";

            const seed = (stateQuery.length + (districtQuery ? districtQuery.length : 0)) % 3;

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

    // 2. Filter Property List in Memory
    const matched = allPropertiesCache.filter(item => {
        const matchesType = (activeFilterType === "all" || item.type === activeFilterType);
        const matchesState = (stateQuery === "" || item.state === stateQuery);
        const matchesDistrict = (districtQuery === "" || item.district === districtQuery);
        return matchesType && matchesState && matchesDistrict;
    });

    currentFilteredCache = stateQuery === ""
        ? interleaveByState(matched)
        : [
            ...matched.filter(item => !item.isDemo).reverse(),
            ...matched.filter(item => item.isDemo)
        ];

    if (!preserveLimit) {
        // Show all listings immediately when a specific district is picked; paginate on broader views
        visibleLimit = districtQuery ? currentFilteredCache.length : PAGE_SIZE;
    }

    renderFilteredHomeGrid();
}

// =========================================================
// BOOKMARKS, REVIEWS, MODALS & THEME
// =========================================================
function toggleBookmarkState(propertyId, event) {
    if (event) event.stopPropagation();
    if (!db) return;

    const isBookmarked = bookmarkedPropertyIds.includes(propertyId);
    const transaction = db.transaction(["bookmarks", "properties"], "readwrite");
    const bookmarkStore = transaction.objectStore("bookmarks");
    const propertyStore = transaction.objectStore("properties");

    const propRequest = propertyStore.get(propertyId);

    propRequest.onsuccess = function () {
        const propertyData = propRequest.result;
        if (propertyData) {
            if (isBookmarked) {
                propertyData.likes = Math.max(0, (propertyData.likes || 0) - 1);
                bookmarkStore.delete(propertyId);
            } else {
                propertyData.likes = (propertyData.likes || 0) + 1;
                bookmarkStore.put({ id: propertyId, markedAt: new Date().toISOString() });
            }
            propertyStore.put(propertyData);

            // Sync likes back to localStorage only for live landlord-created properties
            if (!propertyData.isDemo) {
                let globalListings = JSON.parse(localStorage.getItem('propertyListings')) || [];
                let listingIndex = globalListings.findIndex(p => p.id === propertyId);
                if (listingIndex !== -1) {
                    globalListings[listingIndex].likes = propertyData.likes;
                    localStorage.setItem('propertyListings', JSON.stringify(globalListings));
                }
            }
        }
    };

    transaction.oncomplete = function () {
        refreshDashboardData(true);
    };
}

function populateDistrictReviewDropdown() {
    const selectEl = document.getElementById('review-district-select');
    if (!selectEl) return;

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
    if (event) event.stopPropagation();
    const menu = document.getElementById(menuId);
    if (menu) menu.classList.toggle('hidden');
}

window.onclick = function (event) {
    if (!event.target.matches('.fa-circle-user')) {
        const dropdowns = document.getElementsByClassName("dropdown");
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].classList.add('hidden');
        }
    }
};

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('userTheme', isDark ? 'dark' : 'light');
}

function loadThemeState() {
    if (localStorage.getItem('userTheme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

function submitUserReview(event) {
    event.preventDefault();
    if (!db) return;

    const districtContext = document.getElementById("review-district-select").value;
    const textContext = document.getElementById("review-text-input").value.trim();

    if (!districtContext || !textContext) {
        alert("Please select a district and enter your feedback.");
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
        alert("Your feedback has been successfully published!");
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
            streamContainer.innerHTML = `<p style="text-align: center; color: var(--gray);">No community feedback posted yet.</p>`;
            return;
        }

        reviews.reverse().forEach(rev => {
            const locationDisplay = escapeHTML(rev.district || rev.property || "General");
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
                    <span style="font-size: 0.75rem; color: var(--gray);">${escapeHTML(rev.timestamp)}</span>
                </div>
                <div style="font-size: 0.9rem; color: var(--text); margin-bottom: 8px;">
                    ${escapeHTML(rev.text)}
                </div>
                <div style="font-size: 0.75rem; color: var(--gray);">
                    Review from: <strong>@${escapeHTML(rev.author || 'Anonymous')}</strong>
                </div>
            `;
            streamContainer.appendChild(reviewCard);
        });
    };
}

function openOwnerContactModalById(propertyId) {
    const item = allPropertiesCache.find(p => p.id === propertyId);
    if (!item) return;
    openOwnerContactModal(item.owner, item.contact, item.email);
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
