// =====================================
// LOAD FEATURES FROM JSON
// =====================================

fetch("data/data.json")
    .then(response => response.json())
    .then(data => {

        const featureContainer =
            document.getElementById("featureContainer");

        if (!featureContainer) return;

        data.features.forEach(feature => {

            const card = `

                <div class="feature-card reveal">

                    <div class="feature-icon">
                        <i class="${feature.icon}"></i>
                    </div>

                    <h3>${feature.title}</h3>

                    <p>${feature.description}</p>

                </div>

            `;

            featureContainer.innerHTML += card;

        });

        revealElements();

    })
    .catch(error => {

        console.error(
            "Error loading JSON:",
            error
        );

    });


// =====================================
// REVEAL ANIMATION
// =====================================

function revealElements() {

    const reveals =
        document.querySelectorAll(".reveal");

    reveals.forEach(element => {

        const windowHeight =
            window.innerHeight;

        const revealTop =
            element.getBoundingClientRect().top;

        const revealPoint = 120;

        if (revealTop < windowHeight - revealPoint) {

            element.classList.add("active");

        }

    });

}

window.addEventListener(
    "scroll",
    revealElements
);

window.addEventListener(
    "load",
    revealElements
);


// =====================================
// STICKY NAVBAR SHADOW
// =====================================

const header =
    document.querySelector("header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        header.style.boxShadow =
            "0 5px 20px rgba(0,0,0,0.08)";

    } else {

        header.style.boxShadow = "none";

    }

});


// =====================================
// BUTTON HOVER MICRO EFFECT
// =====================================

const buttons =
    document.querySelectorAll(
        ".btn-primary, .cta-btn"
    );

buttons.forEach(button => {

    button.addEventListener(
        "mouseenter",
        () => {

            button.style.transform =
                "translateY(-4px)";

        }
    );

    button.addEventListener(
        "mouseleave",
        () => {

            button.style.transform =
                "translateY(0)";

        }
    );

});


// =====================================
// ACTIVE NAV LINK
// =====================================

const navLinks =
    document.querySelectorAll(".nav-links a");

navLinks.forEach(link => {

    link.addEventListener("click", () => {

        navLinks.forEach(nav => {

            nav.classList.remove("active");

        });

        link.classList.add("active");

    });

});


// =====================================
// CONSOLE MESSAGE
// =====================================

console.log(
    "%cRumahAman Loaded Successfully 💜",
    "color:#7c3aed; font-size:16px; font-weight:bold;"
);

const mybutton = document.getElementById("scrollTopBtn");

window.onscroll = function() {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
};

// Fungsi untuk kembali ke atas apabila butang ditekan
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' 
    });
}

// =====================================
// MOBILE MENU
// =====================================

const menuToggle =
document.querySelector(".menu-toggle");

const navLinksMenu =
document.querySelector(".nav-links");

const authButtons =
document.querySelector(".auth-buttons");

menuToggle.addEventListener("click", () => {

    navLinksMenu.classList.toggle("active");

    authButtons.classList.toggle("active");

});

        document.querySelectorAll('.faq-accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const item = header.parentElement;
                const isOpen = item.classList.contains('open');

                document.querySelectorAll('.faq-accordion').forEach(a => a.classList.remove('open'));

                if (!isOpen) item.classList.add('open');
            });
        });

        /* ---------- Category Tabs ---------- */
        const tabs = document.querySelectorAll('.cat-tab');
        const groups = document.querySelectorAll('.faq-group');
        const accordions = document.querySelectorAll('.faq-accordion');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const cat = tab.dataset.cat;

                if (cat === 'all') {
                    groups.forEach(g => g.style.display = '');
                    accordions.forEach(a => a.style.display = '');
                } else {
                    groups.forEach(g => {
                        g.style.display = g.dataset.group === cat ? '' : 'none';
                    });
                }

                // Clear search
                document.getElementById('faqSearch').value = '';
                document.getElementById('noResults').style.display = 'none';
            });
        });
        