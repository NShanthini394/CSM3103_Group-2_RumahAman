

let map;
let dynamicSearchLayer;
let safetyDataAggregated = {};
let dataLoaded = false;
let maxCrimesInMalaysia = 0;

let currentEditingId = null; 
let uploadedImageBase64 = "";
let editedImageBase64 = "";

// --- 1. GEOGRAPHICAL DATA STRUCTURE ---
const locationData = {
    "Johor": ["Johor Bahru", "Kecil Pontian", "Kluang", "Kota Tinggi", "Kulai", "Mersing", "Muar", "Pontian", "Segamat", "Tangkak"],
    "Kedah": ["Baling", "Bandar Baharu", "Kota Setar", "Kuala Muda", "Kubang Pasu", "Kulim", "Langkawi", "Padang Terap", "Pendang", "Pokok Sena", "Sik", "Yan"],
    "Kelantan": ["Bachok", "Gua Musang", "Jeli", "Kota Bharu", "Kuala Krai", "Machang", "Pasir Mas", "Pasir Puteh", "Tanah Merah", "Tumpat"],
    "Melaka": ["Alor Gajah", "Melaka Tengah", "Jasin"],
    "Negeri Sembilan": ["Jelebu", "Jempol", "Kuala Pilah", "Port Dickson", "Rembau", "Seremban", "Tampin"],
    "Pahang": ["Bentong", "Bera", "Cameron Highlands", "Jerantut", "Kuantan", "Lipis", "Maran", "Pekan", "Raub", "Rompin", "Temerloh"],
    "Pulau Pinang": ["Barat Daya", "Seberang Perai Selatan", "Seberang Perai Tengah", "Seberang Perai Utara", "Timur Laut"],
    "Perak": ["Bagan Datuk", "Batang Padang", "Hilir Perak", "Hulu Perak", "Kampar", "Kerian", "Kinta", "Kuala Kangsar", "Larut Matang Dan Selama", "Manjung", "Muallim", "Perak Tengah"],
    "Perlis": ["Kangar"],
    "Sabah": ["Beaufort", "Beluran", "Keningau", "Kinabatangan", "Kota Belud", "Kota Kinabalu", "Kota Marudu", "Kuala Penyu", "Kudat", "Kunak", "Lahad Datu", "Nabawan", "Papar", "Penampang", "Pitas", "Ranau", "Sandakan", "Semporna", "Sipitang", "Tambunan", "Tawau", "Tenom", "Tongod", "Tuaran"],
    "Sarawak": ["Asajaya", "Bau", "Belaga", "Betong", "Bintulu", "Dalat", "Daro", "Julau", "Kanowit", "Kapit", "Kuching", "Lawas", "Limbang", "Lubok Antu", "Lundu", "Marudi", "Matu", "Meradong", "Miri", "Mukah", "Pakan", "Samarahan", "Saratok", "Sarikei", "Selangau", "Serian", "Sibu", "Simunjan", "Song", "Sri Aman", "Tatau"],
    "Selangor": ["Gombak", "Hulu Langat", "Hulu Selangor", "Klang", "Kuala Langat", "Kuala Selangor", "Petaling", "Sabak Bernam", "Sepang"],
    "Terengganu": ["Besut", "Dungun", "Hulu Terengganu", "Kemaman", "Kuala Nerus", "Kuala Terengganu", "Marang", "Setiu"],
    "W.P. Kuala Lumpur": ["Kuala Lumpur"]
};

// --- 2. SYSTEM INITIALIZATION ---
window.onload = function() {
    const currentLandlord = JSON.parse(localStorage.getItem('currentLandlord'));
    if (!currentLandlord) {
        alert('Access Denied. Please log in first.');
        window.location.href = '../index.html';
        return;
    }

    const profileNameEl = document.getElementById('profile-name');
    const profileEmailEl = document.getElementById('profile-email');
    if (profileNameEl) profileNameEl.innerText = currentLandlord.name || 'Landlord Admin';
    if (profileEmailEl) profileEmailEl.innerText = currentLandlord.email || 'admin@rumahaman.pwa';

    const greetingEl = document.getElementById('landlord-greeting');
    if (greetingEl) greetingEl.innerHTML = `Hello, ${currentLandlord.name || 'Owner'}!`;

    loadThemeState();
    fetchGovernmentData();
    
    const stateSelect = document.getElementById("state-select");
    if (stateSelect) {
        for (let state in locationData) { 
            stateSelect.innerHTML += `<option value="${state}">${state}</option>`; 
        }
    }

    // Muat Senarai Rumah dari LocalStorage
    loadSavedListings();
};

// --- 3. PHOTO UPLOAD & PREVIEW LOGIC ---
function previewUploadedImage(event) {
    const file = event.target.files[0];
    const wrapper = document.getElementById('image-preview-wrapper');
    const previewImg = document.getElementById('add-img-preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImageBase64 = e.target.result;
            previewImg.src = uploadedImageBase64;
            wrapper.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        uploadedImageBase64 = "";
        previewImg.src = "";
        wrapper.style.display = 'none';
    }
}

function previewEditImage(event) {
    const file = event.target.files[0];
    const previewImg = document.getElementById('edit-img-preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            editedImageBase64 = e.target.result;
            previewImg.src = editedImageBase64;
            previewImg.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    }
}

// --- 4. CRUD OPERATIONS (ADD, RENDER, EDIT, DELETE) ---

function uploadNewProperty() {
    const title = document.getElementById('prop-title').value.trim();
    const type = document.getElementById('prop-type').value;
    const houseType = document.getElementById('prop-house-type').value;
    const beds = document.getElementById('prop-beds').value;
    const baths = document.getElementById('prop-baths').value;
    const state = document.getElementById('state-select').value;
    const district = document.getElementById('district-input').value;
    const address = document.getElementById('prop-address').value.trim();
    const price = document.getElementById('prop-price').value;
    const contact = document.getElementById('prop-contact').value;

    if (!title || !beds || !baths || !state || !district || !address || !price || !contact) {
        alert("Please fill in all required information before submitting.");
        return;
    }

    const currentLandlord = JSON.parse(localStorage.getItem('currentLandlord')) || {};

    const newProperty = {
        id: 'prop_' + Date.now(),
        ownerEmail: currentLandlord.email || 'admin@rumahaman.pwa',
        title: title,
        type: type,
        houseType: houseType,
        beds: parseInt(beds),
        baths: parseInt(baths),
        state: state,
        district: district,
        address: address,
        price: parseFloat(price),
        contact: contact,
        image: uploadedImageBase64 || "" 
    };

    let globalListings = JSON.parse(localStorage.getItem('propertyListings')) || [];
    globalListings.push(newProperty);
    localStorage.setItem('propertyListings', JSON.stringify(globalListings));

    alert("Your property listing has been successfully published!");
    
    document.getElementById('add-property-form').reset();
    uploadedImageBase64 = "";
    const wrapper = document.getElementById('image-preview-wrapper');
    if (wrapper) wrapper.style.display = 'none';

    loadSavedListings();
    switchTab('manage', document.querySelectorAll('.nav-item')[1]);
}

// Membaca & Memaparkan Rumah dalam Tab "Manage"
function loadSavedListings() {
    const container = document.getElementById('property-list-container');
    const countEl = document.getElementById('active-listings-count');
    const totalLikesEl = document.getElementById('total-likes-count');
    const currentLandlord = JSON.parse(localStorage.getItem('currentLandlord')) || {};
    
    let globalListings = JSON.parse(localStorage.getItem('propertyListings')) || [];

    let ownerListings = globalListings.filter(p => p.ownerEmail === currentLandlord.email);

    if (countEl) countEl.innerText = ownerListings.length;
    if (totalLikesEl) {
        let totalLikes = ownerListings.reduce((sum, prop) => sum + (prop.likes || 0), 0);
        totalLikesEl.innerText = totalLikes;
    }
    if (!container) return;

    if (ownerListings.length === 0) {
        container.innerHTML = `<p id="empty-manage-msg" style="text-align: center; color: var(--gray); font-size: 0.9rem; padding: 20px 0;">You have no active listings deployed.</p>`;
        return;
    }

    container.innerHTML = "";
    ownerListings.forEach(prop => {
        const imgTag = prop.image 
            ? `<img src="${prop.image}" alt="Property Image" style="width: 100%; height: 160px; object-fit: cover; border-radius: 0.6rem; margin-bottom: 12px;">`
            : `<div style="width: 100%; height: 160px; background: var(--border-color); border-radius: 0.6rem; margin-bottom: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--gray);">
                <i class="fa-solid fa-house-chimney" style="font-size: 2.2rem; margin-bottom: 5px;"></i>
                <span style="font-size: 0.75rem;">No Photo Available</span>
               </div>`;

        container.innerHTML += `
            <div class="card" style="margin-bottom: 15px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
                ${imgTag}
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <div style="flex-grow: 1;">
                        <h4 style="font-size: 1.1rem; color: var(--text); margin-bottom: 4px; text-transform: capitalize;">${prop.title}</h4>
                        <p style="font-size: 0.8rem; color: var(--gray); margin-bottom: 6px;"><i class="fa-solid fa-location-dot" style="color: var(--primary);"></i> ${prop.district}, ${prop.state}</p>
                        <h3 style="color: var(--primary); font-size: 1.2rem; margin-bottom: 8px;">RM ${parseFloat(prop.price).toLocaleString()}</h3>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                            <span style="font-size: 0.75rem; color: var(--text); background: var(--lightGreen); padding: 3px 8px; border-radius: 4px;"><i class="fa-solid fa-bed"></i> ${prop.beds} Beds</span>
                            <span style="font-size: 0.75rem; color: var(--text); background: #e0f2fe; padding: 3px 8px; border-radius: 4px;"><i class="fa-solid fa-bath"></i> ${prop.baths} Baths</span>
                            <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase;" class="badge ${prop.type === 'rent' ? 'badge-rent' : 'badge-sale'}">${prop.type}</span>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <button class="btn-primary" style="padding: 8px 12px; background: var(--info); border: none;" onclick="openEditAssetModal('${prop.id}')" title="Ubah Suai"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn-primary" style="padding: 8px 12px; background: var(--danger); border: none;" onclick="deleteProperty('${prop.id}')" title="Padam"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
}

// Membuka Edit Modal Berdasarkan ID Rumah
function openEditAssetModal(id) {
    let globalListings = JSON.parse(localStorage.getItem('propertyListings')) || [];
    let prop = globalListings.find(p => p.id === id);

    if (!prop) return;

    currentEditingId = id;
    
    // Isi maklumat lama ke dalam form modal
    document.getElementById('edit-prop-title').value = prop.title;
    document.getElementById('edit-prop-type').value = prop.type;
    document.getElementById('edit-prop-house-type').value = prop.houseType;
    document.getElementById('edit-prop-beds').value = prop.beds;
    document.getElementById('edit-prop-baths').value = prop.baths;
    document.getElementById('edit-prop-address').value = prop.address;
    document.getElementById('edit-prop-price').value = prop.price;
    document.getElementById('edit-prop-contact').value = prop.contact;

    const editStateSelect = document.getElementById('edit-state-select');
    editStateSelect.innerHTML = "";
    for (let state in locationData) {
        let selected = (state === prop.state) ? "selected" : "";
        editStateSelect.innerHTML += `<option value="${state}" ${selected}>${state}</option>`;
    }

    populateEditDistricts();
    document.getElementById('edit-district-input').value = prop.district;

    const editImgPreview = document.getElementById('edit-img-preview');
    if (prop.image) {
        editImgPreview.src = prop.image;
        editImgPreview.style.display = "inline-block";
        editedImageBase64 = prop.image;
    } else {
        editImgPreview.src = "";
        editImgPreview.style.display = "none";
        editedImageBase64 = "";
    }

    openModal('edit-modal');
}

// Menyimpan Semula Perubahan Rumah Dari Modal
function saveEditedProperty() {
    const title = document.getElementById('edit-prop-title').value.trim();
    const type = document.getElementById('edit-prop-type').value;
    const houseType = document.getElementById('edit-prop-house-type').value;
    const beds = document.getElementById('edit-prop-beds').value;
    const baths = document.getElementById('edit-prop-baths').value;
    const state = document.getElementById('edit-state-select').value;
    const district = document.getElementById('edit-district-input').value;
    const address = document.getElementById('edit-prop-address').value.trim();
    const price = document.getElementById('edit-prop-price').value;
    const contact = document.getElementById('edit-prop-contact').value;

    if (!title || !beds || !baths || !state || !district || !address || !price || !contact) {
        alert("Please fill in all empty fields.");
        return;
    }

    let globalListings = JSON.parse(localStorage.getItem('propertyListings')) || [];
    let index = globalListings.findIndex(p => p.id === currentEditingId);

    if (index !== -1) {
        globalListings[index].title = title;
        globalListings[index].type = type;
        globalListings[index].houseType = houseType;
        globalListings[index].beds = parseInt(beds);
        globalListings[index].baths = parseInt(baths);
        globalListings[index].state = state;
        globalListings[index].district = district;
        globalListings[index].address = address;
        globalListings[index].price = parseFloat(price);
        globalListings[index].contact = contact;
        globalListings[index].image = editedImageBase64;

        localStorage.setItem('propertyListings', JSON.stringify(globalListings));
        alert("Asset information updated successfully!");
        closeModal('edit-modal');
        
        // Reset fail input edit
        document.getElementById('edit-prop-image').value = "";
        
        loadSavedListings();
    }
}

// Memadam Iklan Rumah
function deleteProperty(id) {
    if (confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
        let globalListings = JSON.parse(localStorage.getItem('propertyListings')) || [];
        globalListings = globalListings.filter(p => p.id !== id);
        localStorage.setItem('propertyListings', JSON.stringify(globalListings));
        loadSavedListings();
    }
}

// --- 5. DISTRICT INTERACTION LOGIC ---
function populateDistricts() {
    const stateSelect = document.getElementById("state-select");
    const districtSelect = document.getElementById("district-input");
    resetSafetyPrompt();

    districtSelect.innerHTML = '<option value="">-- Select District --</option>';
    if (stateSelect.value !== "") {
        districtSelect.disabled = false;
        locationData[stateSelect.value].forEach(d => { 
            districtSelect.innerHTML += `<option value="${d}">${d}</option>`; 
        });
    } else {
        districtSelect.disabled = true;
    }
}

function populateEditDistricts() {
    const stateSelect = document.getElementById("edit-state-select");
    const districtSelect = document.getElementById("edit-district-input");

    districtSelect.innerHTML = '';
    if (stateSelect.value !== "") {
        locationData[stateSelect.value].forEach(d => { 
            districtSelect.innerHTML += `<option value="${d}">${d}</option>`; 
        });
    }
}

function loadCommunityFeed() {
    const feed = document.getElementById('reviews-feed');
    if (!feed) return;

    const request = indexedDB.open("RumahAmanDB", 1);

    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(["reviews"], "readonly");
        const store = transaction.objectStore("reviews");
        const getReviews = store.getAll();

        getReviews.onsuccess = function () {
            const reviews = getReviews.result || [];
            feed.innerHTML = "";

            if (reviews.length === 0) {
                feed.innerHTML = `<p style="text-align: center; color: var(--gray);">Tiada ulasan lagi daripada penyewa.</p>`;
                return;
            }

            reviews.reverse().forEach(rev => {
                feed.innerHTML += `
                    <div class="card" style="margin-bottom: 15px; padding: 15px;">
                        <div style="font-weight: bold; color: var(--primary);">@${rev.author}</div>
                        <div style="font-size: 0.8rem; color: #666; margin-bottom: 5px;">
                           <i class="fa-solid fa-location-dot"></i> ${rev.district || 'Tiada Daerah'} 
                           <span style="float: right;">${rev.timestamp}</span>
                        </div>
                        <p style="margin: 5px 0;">${rev.text}</p>
                    </div>
                `;
            });
        };
    };
}

// --- 6. NAVIGATION & TAB SWITCHER ---
function switchTab(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) {
        if(tabId === 'safety') {
            targetTab.style.display = 'flex';
            targetTab.classList.remove('hidden');
            setTimeout(() => { initializeMapLayout(); }, 200);
        } else {
            targetTab.style.display = 'block';
            targetTab.classList.remove('hidden');
        }
    }

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');
    if (tabId === 'reviews') {
        loadCommunityFeed();
    }
}

// --- 7. MODALS UTILITIES ---
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function toggleMenu(id, event) {
    if(event) event.stopPropagation();
    const dropdown = document.getElementById(id);
    if (dropdown) dropdown.classList.toggle('hidden');
}

document.addEventListener('click', function() {
    const notif = document.getElementById('notif-dropdown');
    const account = document.getElementById('account-dropdown');
    if (notif && !notif.classList.contains('hidden')) notif.classList.add('hidden');
    if (account && !account.classList.contains('hidden')) account.classList.add('hidden');
});

// --- 8. REALTIME GOVERNMENT DATA CATALOGUE FETCH (CRIME STATS) ---
function fetchGovernmentData() {
    var requestOptions = { method: "GET", redirect: "follow" };
    fetch("https://api.data.gov.my/data-catalogue?id=crime_district&limit=20000", requestOptions)
        .then(response => response.json())
        .then(result => {
            processApiData(result);
            const msgEl = document.getElementById('safety-loading-msg');
            if (msgEl) msgEl.innerHTML = "Search a district to see its safety score.";
            dataLoaded = true;
        }).catch(err => {
            console.error(err);
            const msgEl = document.getElementById('safety-loading-msg');
            if (msgEl) msgEl.innerHTML = "Failed to load government datastream.";
        });
}

function processApiData(rawData) {
    let rawArray = Array.isArray(rawData) ? rawData : (rawData.data || []);

    rawArray.forEach(row => {
        let dist = (row.district || "").toLowerCase();
        if (dist === "all" || dist === "malaysia" || dist === "") return;
        if (!row.date || !row.date.startsWith("2023")) return; 

        if (!safetyDataAggregated[dist]) {
            safetyDataAggregated[dist] = { assault: 0, burglary: 0, theft: 0, car_theft: 0, total: 0 };
        }

        let totalRow = 0;
        if(row.category === "assault") { safetyDataAggregated[dist].assault += row.crimes; totalRow = row.crimes; }
        if(row.category === "burglary") { safetyDataAggregated[dist].burglary += row.crimes; totalRow = row.crimes; }
        if(row.category === "theft") { safetyDataAggregated[dist].theft += row.crimes; totalRow = row.crimes; }
        if(row.category === "vehicle_theft") { safetyDataAggregated[dist].car_theft += row.crimes; totalRow = row.crimes; }

        safetyDataAggregated[dist].total += totalRow;
        if (safetyDataAggregated[dist].total > maxCrimesInMalaysia) {
            maxCrimesInMalaysia = safetyDataAggregated[dist].total;
        }
    });
}

// --- 9. MAP INTEGRATION (LEAFLET ENGINE) ---
function initializeMapLayout() {
    if (map) return; 
    map = L.map('owner-map').setView([4.2105, 101.9758], 6); // Koordinat Pusat Malaysia
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    dynamicSearchLayer = L.layerGroup().addTo(map);
}

function manualSearch() {
    const q = document.getElementById('map-search-input').value.trim().toLowerCase();
    if(!q) return;
    executeGeocoding(q);
}

function executeGeocoding(districtName) {
    const feed = document.getElementById('crime-data-feed');
    if(!dataLoaded) {
        if(feed) feed.innerHTML = "<p style='color:var(--danger); font-size:0.85rem;'>Data repository initialization incomplete.</p>";
        return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${districtName}+Malaysia`)
    .then(res => res.json())
    .then(geo => {
        if(geo && geo.length > 0) {
            let lat = parseFloat(geo[0].lat);
            let lon = parseFloat(geo[0].lon);
            map.setView([lat, lon], 11);
            dynamicSearchLayer.clearLayers();

            let cleanName = districtName.toLowerCase();
            let data = safetyDataAggregated[cleanName] || { assault: 0, burglary: 0, theft: 0, car_theft: 0, total: 0 };
            
            let color = "green";
            let status = "Secure Zone";
            if (data.total > 150) { color = "orange"; status = "Moderate Watch"; }
            if (data.total > 400) { color = "red"; status = "High Risk Level"; }

            L.circle([lat, lon], { color: color, fillColor: color, fillOpacity: 0.2, radius: 4000 }).addTo(dynamicSearchLayer);
            
            L.marker([lat, lon]).addTo(dynamicSearchLayer)
             .bindPopup(`<b>${districtName.toUpperCase()}</b><br>Status: ${status}<br>Total Crimes: ${data.total}`)
             .openPopup();

            if(feed) {
                feed.innerHTML = `
                    <div style="border-left: 4px solid ${color}; padding-left: 10px; margin-top:5px;">
                       <h4 style="text-transform: capitalize; font-size:1rem;">${districtName} Risk Profile (${status})</h4>
                       <p style="font-size:0.8rem; margin: 4px 0;"><i class="fa-solid fa-person-burst"></i> Assault / Keganasan: <b>${data.assault} cases</b></p>
                       <p style="font-size:0.8rem; margin: 4px 0;"><i class="fa-solid fa-person-shelter"></i> Burglary / Pecah Rumah: <b>${data.burglary} cases</b></p>
                       <p style="font-size:0.8rem; margin: 4px 0;"><i class="fa-solid fa-mask"></i> General Theft / Kecurian: <b>${data.theft} cases</b></p>
                       <p style="font-size:0.8rem; margin: 4px 0;"><i class="fa-solid fa-car-burst"></i> Vehicle Theft / Curi Kenderaan: <b>${data.car_theft} cases</b></p>
                       <hr style="border: 0.5px solid var(--border-color); margin: 8px 0;">
                       <strong style="font-size:0.85rem; color:var(--text)">Aggregated Annual Incidents: ${data.total}</strong>
                    </div>`;
            }
        } else {
            if(feed) feed.innerHTML = "<p style='color:var(--danger); font-size:0.85rem;'>District coordinates not detected.</p>";
        }
    });
}

// --- 10. INTERACTIVE AI VALUATION TRIGGER & SAFETY CHECKS ---
let promptSafetyTriggered = false;

function triggerSafetyCheck() {
    if (promptSafetyTriggered) return;
    const district = document.getElementById('district-input').value;
    if(!district) return;
    openModal('safety-check-modal');
    promptSafetyTriggered = true;
}

function resetSafetyPrompt() {
    promptSafetyTriggered = false;
}

function goToSafetyMap() {
    closeModal('safety-check-modal');
    const district = document.getElementById('district-input').value;
    switchTab('safety', document.querySelectorAll('.nav-item')[4]);
    
    if(district) {
        document.getElementById('map-search-input').value = district;
        document.getElementById('return-form-btn').classList.remove('hidden');
        setTimeout(() => { executeGeocoding(district); }, 600);
    }
}

function returnToForm() {
    document.getElementById('return-form-btn').classList.add('hidden');
    switchTab('add', document.querySelectorAll('.nav-item')[2]);
    document.getElementById('prop-price').focus();
}

// AI Smart Price Recommendation Engine
function suggestSmartPrice() {
    const district = document.getElementById('district-input').value;
    const houseType = document.getElementById('prop-house-type').value;
    const listingType = document.getElementById('prop-type').value;
    const beds = parseInt(document.getElementById('prop-beds').value) || 1;
    const msgEl = document.getElementById('ai-price-msg');

    if (!district) {
        alert("Please select a State and District first to calculate AI parameters.");
        return;
    }

    let cleanName = district.toLowerCase();
    let data = safetyDataAggregated[cleanName] || { total: 100 };
    let safetyFactor = 1.0; 

    if (data.total > 150) safetyFactor = 0.93; 
    if (data.total > 400) safetyFactor = 0.85;

    let basePrice = (listingType === 'rent') ? 350 : 120000;
    if(houseType === 'terrace') basePrice *= 2.2;
    if(houseType === 'condo') basePrice *= 2.0;
    if(houseType === 'bungalow') basePrice *= 4.5;

    let calculatedPrice = Math.round((basePrice * (1 + (beds * 0.18))) * safetyFactor);
    
    document.getElementById('prop-price').value = calculatedPrice;
    if(msgEl) {
        msgEl.innerHTML = `<i class="fa-solid fa-brain"></i> AI Optimal Valuation: <b>RM ${calculatedPrice.toLocaleString()}</b> (Adjusted against regional baseline risk metrics).`;
        msgEl.style.display = 'block';
    }
}

function resetAiEngine() {
    const msgEl = document.getElementById('ai-price-msg');
    if(msgEl) msgEl.style.display = 'none';
}

// --- 11. DARK MODE MANAGER ---
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('landlordTheme', isDark ? 'dark' : 'light');
}

function loadThemeState() {
    const savedTheme = localStorage.getItem('landlordTheme');
    const toggleInput = document.getElementById('theme-toggle');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (toggleInput) toggleInput.checked = true;
    }
}

// Proses Log Keluar Landlord
function handleLogout() {
    if (confirm("Are you sure you want to log out of the system?")) {
        localStorage.removeItem('currentLandlord');
        alert('Session ended. Log out successful.');
        window.location.href = '../index.html';
    }
}