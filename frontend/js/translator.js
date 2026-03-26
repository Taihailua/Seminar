// translator.js
// Handles automatic translation using Google Translate API and localStorage

// Add Google Translate element to body
const gtScript = document.createElement('script');
gtScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
gtScript.async = true;
gtScript.onerror = function() {
    console.warn('Google Translate script was blocked or failed to load. Translation feature may be limited.');
    window.gtBlocked = true;
};
document.head.appendChild(gtScript);

const gtContainer = document.createElement('div');
gtContainer.id = 'google_translate_element';
gtContainer.style.display = 'none'; // Hide the default widget
document.body.appendChild(gtContainer);

// Inject CSS to hide Google Translate banners and tooltips
const style = document.createElement('style');
style.textContent = `
    /* Hide Google Translate top frame */
    .skiptranslate iframe,
    .goog-te-banner-frame.skiptranslate {
        display: none !important;
    }
    body {
        top: 0px !important;
    }
    /* Force original font family */
    body, h1, h2, h3, h4, h5, h6, p, span, button, input, label, a {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
    }
    /* Protect icons from translation */
    .material-symbols-outlined, .material-icons, .notranslate {
        font-family: 'Material Symbols Outlined' !important;
        font-feature-settings: 'liga' !important;
        text-transform: none !important;
        white-space: nowrap !important;
        word-wrap: normal !important;
        direction: ltr !important;
        -webkit-font-smoothing: antialiased !important;
    }
    /* Hide original text tooltip on hover */
    #goog-gt-tt, .goog-te-balloon-frame {
        display: none !important;
    }
    .goog-text-highlight {
        background-color: transparent !important;
        box-shadow: none !important;
    }
`;
document.head.appendChild(style);

window.googleTranslateElementInit = function() {
    try {
        if (typeof google !== 'undefined' && google.translate) {
            new google.translate.TranslateElement({
                pageLanguage: 'vi',
                autoDisplay: false
            }, 'google_translate_element');
            
            // Check if we have a saved language
            setTimeout(() => {
                const savedLang = localStorage.getItem('appLang');
                if (savedLang && savedLang !== 'vi') {
                    triggerTranslation(savedLang);
                }
            }, 1000);
        }
    } catch (e) {
        console.error('Error initializing Google Translate:', e);
    }
};

window.changeLanguage = function(langCode) {
    if (window.gtBlocked) {
        alert('Tính năng dịch đang bị chặn bởi trình duyệt của bạn (có thể do AdBlock). Vui lòng tắt AdBlock để sử dụng.');
        return;
    }
    localStorage.setItem('appLang', langCode);
    triggerTranslation(langCode, 0);
};

function triggerTranslation(langCode, retryCount = 0) {
    if (retryCount > 10) return; // Stop after 5 seconds
    
    const select = document.querySelector('.goog-te-combo');
    if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
    } else {
        // If Google Translate hasn't loaded fully yet, try again shortly
        setTimeout(() => triggerTranslation(langCode, retryCount + 1), 500);
    }
}

