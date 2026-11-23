/**
 * Annadhara AI — Contextual Fallback Response Service
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Provides intelligent, question-aware, multilingual fallback responses when
 * cloud LLM inference is in offline standby or temporarily unreachable.
 *
 * Requirements handled:
 * 1. Never returns a static repetitive paragraph for different queries.
 * 2. Natural greetings for greeting inputs.
 * 3. Specific platform explanation for "What is Annadhara and how does it work?".
 * 4. Specific FSSAI food safety guidance for safety queries.
 * 5. Step-by-step donation guide for donation queries.
 * 6. Step-by-step reservation guide for finding food queries.
 * 7. Volunteer logistics guide for pickup queries.
 * 8. Handover verification explanation for code/OTP queries.
 * 9. Polite domain-scoping for out-of-scope inquiries.
 * 10. Native multilingual responses in English, Kannada, and Hindi.
 * 11. Zero exposure of internal technical provider errors in user-facing message bubbles.
 */

const { detectLanguage, normalizeLanguage } = require('./aiLanguageService');

/**
 * Normalizes input text for keyword and intent matching
 * @param {string} text
 * @returns {string}
 */
const clean = (text) => (text || '').toLowerCase().trim();

/**
 * Generates an intent-specific, question-aware fallback response
 *
 * @param {Object} params
 * @param {string} params.userMessage - User input
 * @param {string} [params.role='donor'] - User role (donor, recipient, volunteer, admin)
 * @param {string} [params.language='en'] - Target language ('en', 'kn', 'hi')
 * @returns {{ message: string, intent: string, model: string, isMock: boolean }}
 */
const generateContextualFallback = ({ userMessage = '', role = 'donor', language = 'en' }) => {
  const text = clean(userMessage);
  const detected = detectLanguage(userMessage);
  const lang = normalizeLanguage(language || detected);

  // 1. GREETINGS
  const isGreeting =
    /^(hi|hii|hiii|hello|hey|heyy|heya|namaste|vanakkam|namaskara|greetings)\b/i.test(text) ||
    text === 'hi' ||
    text === 'hii' ||
    text === 'hello' ||
    text === 'hey' ||
    text.includes('good morning') ||
    text.includes('good afternoon') ||
    text.includes('good evening') ||
    text.includes('ನಮಸ್ಕಾರ') ||
    text.includes('ಹಲೋ') ||
    text.includes('ಹಾಯ್') ||
    text.includes('नमस्ते') ||
    text.includes('नमस्कार') ||
    text.includes('हेलो') ||
    text.includes('हाय');

  if (isGreeting) {
    if (lang === 'kn') {
      return {
        intent: 'GREETING',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          'ನಮಸ್ಕಾರ! 👋 **ಅನ್ನಧಾರ** ವೇದಿಕೆಗೆ ಸುಸ್ವಾಗತ. ನಾನು ನಿಮ್ಮ ಬುದ್ಧಿವಂತ ವೇದಿಕೆ ಸಹಾಯಕ. ಆಹಾರ ದಾನ ಪ್ರಕಟಿಸುವುದು, ಲಭ್ಯವಿರುವ ಹೆಚ್ಚುವರಿ ಆಹಾರ ಹುಡುಕುವುದು, ಸ್ವಯಂಸೇವಕ ಪಿಕಪ್ ಕಾರ್ಯಾಚರಣೆಗಳು ಅಥವಾ ಆಹಾರ ಸುರಕ್ಷತಾ ಮಾನದಂಡಗಳಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
      };
    }
    if (lang === 'hi') {
      return {
        intent: 'GREETING',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          'नमस्ते! 👋 **अन्नधारा** में आपका स्वागत है। मैं आपका डिजिटल प्लेटफ़ॉर्म सहायक हूँ। मैं अधिशेष भोजन दान करने, उपलब्ध भोजन खोजने, स्वयंसेवक पिकअप प्रक्रिया या खाद्य सुरक्षा नियमों से संबंधित जानकारी प्राप्त करने में आपकी मदद कर सकता हूँ। आज आप क्या जानना चाहेंगे?',
      };
    }
    return {
      intent: 'GREETING',
      model: 'resilient-offline-engine',
      isMock: true,
      message:
        'Hello! 👋 Welcome to **Annadhara**. I can help you donate surplus food, find available food listings, understand reservation and pickup workflows, or answer food safety questions. What would you like to do?',
    };
  }

  // 2. ANNADHARA PLATFORM OVERVIEW & "HOW DOES IT WORK"
  const isPlatformQuestion =
    text.includes('what is annadhara') ||
    text.includes('what is foodbridge') ||
    text.includes('how does annadhara work') ||
    text.includes('how does it work') ||
    text.includes('about annadhara') ||
    text.includes('tell me about annadhara') ||
    text.includes('who is annadhara') ||
    text.includes('platform overview') ||
    text.includes('explain annadhara') ||
    text.includes('ಅನ್ನಧಾರ ಎಂದರೇನು') ||
    text.includes('ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ') ||
    text.includes('ಅನ್ನಧಾರ ಬಗ್ಗೆ ತಿಳಿಸಿ') ||
    text.includes('अन्नधारा क्या है') ||
    text.includes('यह कैसे काम करता है') ||
    text.includes('अन्नधारा के बारे में बताएं');

  if (isPlatformQuestion) {
    if (lang === 'kn') {
      return {
        intent: 'PLATFORM_OVERVIEW',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          '**ಅನ್ನಧಾರ (Annadhara)** ಎಂಬುದು ಹೆಚ್ಚುವರಿ ಆಹಾರ ವ್ಯರ್ಥವಾಗುವುದನ್ನು ತಡೆಗಟ್ಟಲು ಮತ್ತು ಹಸಿದವರಿಗೆ ಆಹಾರ ತಲುಪಿಸಲು ನಿರ್ಮಿಸಲಾದ ಸಮಗ್ರ ಆಹಾರ ರಕ್ಷಣೆ ಜಾಲವಾಗಿದೆ.\n\n### ಅನ್ನಧಾರ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ:\n1. **ಆಹಾರ ದಾನ ಪ್ರಕಟಣೆ (Donors):** ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು, ಮದುವೆ ಮಂಟಪಗಳು ಮತ್ತು ದಾನಿಗಳು ಉಳಿದ ಉತ್ತಮ ಗುಣಮಟ್ಟದ ಆಹಾರವನ್ನು ಪ್ರಮಾಣ, ತಯಾರಿಸಿದ ಸಮಯ ಮತ್ತು ಪಿಕಪ್ ವಿಳಾಸದೊಂದಿಗೆ ಪಟ್ಟಿಯಲ್ಲಿ ಪ್ರಕಟಿಸುತ್ತಾರೆ.\n2. **ಎನ್‌ಜಿಒ ಕಾಯ್ದಿರಿಸುವಿಕೆ (NGOs):** ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟ ಎನ್‌ಜಿಒಗಳು ತಮ್ಮ ಫಲಾನುಭವಿಗಳ ಅಗತ್ಯಕ್ಕೆ ತಕ್ಕಂತೆ ಆಹಾರವನ್ನು ಕಾಯ್ದಿರಿಸುತ್ತವೆ (Reserve).\n3. **ಸ್ವಯಂಸೇವಕ ಸಾರಿಗೆ (Volunteers):** ಸ್ವಯಂಸೇವಕರು ಪಿಕಪ್ ಕಾರ್ಯಾಚರಣೆಯನ್ನು ಆಯ್ದುಕೊಂಡು ಆಹಾರವನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಎನ್‌ಜಿಒಗೆ ಸಾಗಿಸುತ್ತಾರೆ.\n4. **ಪರಿಶೀಲಿತ ಹಸ್ತಾಂತರ (Verified Handover):** 6-ಅಕ್ಷರಗಳ ಹಸ್ತಾಂತರ ಕೋಡ್ (Handover Code) ಅಥವಾ QR ಕೋಡ್ ದೃಢೀಕರಣದೊಂದಿಗೆ ವಿತರಣೆಯನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಪೂರ್ಣಗೊಳಿಸಲಾಗುತ್ತದೆ.',
      };
    }
    if (lang === 'hi') {
      return {
        intent: 'PLATFORM_OVERVIEW',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          '**अन्नधारा (Annadhara)** एक अधिशेष भोजन बचाव और पुनर्विभाजन नेटवर्क है, जो भोजन दाताओं, गैर-सरकारी संगठनों (NGOs) और स्वयंसेवकों को जोड़ता है ताकि भोजन की बर्बादी को समाप्त किया जा सके।\n\n### अन्नधारा कैसे काम करता है:\n1. **दान सूचीकरण (Donors):** रेस्तरां, कैटरर्स और भोजन दाता अधिशेष भोजन की जानकारी (मात्रा, पकाने का समय, प्रकार) प्लेटफ़ॉर्म पर प्रकाशित करते हैं।\n2. **एनजीओ आरक्षण (NGOs):** सत्यापित एनजीओ उपलब्ध भोजन की जांच करते हैं और अपनी आवश्यकता के अनुसार उसे आरक्षित (Reserve) करते हैं।\n3. **स्वयंसेवक परिवहन (Volunteers):** स्वयंसेवक पिकअप मिशन स्वीकार करते हैं और भोजन को सुरक्षित रूप से एनजीओ तक पहुंचाते हैं।\n4. **सत्यापित हैंडओवर (Verified Handover):** सुरक्षित 6-अंकीय हैंडओवर कोड या QR सत्यापन द्वारा भोजन का हस्तांतरण पूर्ण और पारदर्शी बनाया जाता है।',
      };
    }
    return {
      intent: 'PLATFORM_OVERVIEW',
      model: 'resilient-offline-engine',
      isMock: true,
      message:
        '**Annadhara** is a surplus food rescue platform that connects food donors, NGOs, and volunteers to prevent food waste and fight hunger.\n\n### How It Works:\n1. **Donors List Surplus:** Restaurants, caterers, and individuals list quality edible surplus food with quantity, preparation timestamp, and pickup location.\n2. **NGOs Reserve Meals:** Verified charitable organizations browse live listings and reserve meals needed for their community beneficiaries.\n3. **Volunteers Coordinate Pickup:** Community volunteers claim transport missions to safely collect and deliver food using insulated carriers.\n4. **Verified Handover:** Every transfer is authenticated via a verified 6-character Handover Code or QR scan to ensure complete zero-loss traceability.',
    };
  }

  // 3. FOOD SAFETY & HANDLING GUIDELINES
  const isFoodSafetyQuestion =
    text.includes('food safety') ||
    text.includes('safe food') ||
    text.includes('food handling') ||
    text.includes('fssai') ||
    text.includes('temperature') ||
    text.includes('danger zone') ||
    text.includes('hot food') ||
    text.includes('cold food') ||
    text.includes('expiry') ||
    text.includes('shelf life') ||
    text.includes('spoilage') ||
    text.includes('hygiene') ||
    text.includes('ಸುರಕ್ಷತೆ') ||
    text.includes('ತಾಪಮಾನ') ||
    text.includes('ಆಹಾರ ಸುರಕ್ಷತೆ') ||
    text.includes('खाद्य सुरक्षा') ||
    text.includes('तापमान') ||
    text.includes('दिशानिर्देश');

  if (isFoodSafetyQuestion) {
    if (lang === 'kn') {
      return {
        intent: 'FOOD_SAFETY',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          '### ಅನ್ನಧಾರ ಆಹಾರ ಸುರಕ್ಷತೆ ಹಾಗೂ FSSAI ಮಾರ್ಗಸೂಚಿಗಳು:\n\n• **ತಾಪಮಾನ ನಿಯಂತ್ರಣ (Temperature Control):**\n  - ಬಿಸಿ ಬೇಯಿಸಿದ ಆಹಾರವನ್ನು ಯಾವಾಗಲೂ **≥ 65°C** ತಾಪಮಾನದಲ್ಲಿಡಬೇಕು ಮತ್ತು ತಯಾರಿಸಿದ **2 ರಿಂದ 4 ಗಂಟೆಗಳ ಒಳಗೆ** ವಿತರಿಸಬೇಕು.\n  - ಶೀತಲ ಆಹಾರವನ್ನು **≤ 5°C** ನಲ್ಲಿ ಸಂಗ್ರಹಿಸಬೇಕು.\n  - 5°C ನಿಂದ 65°C ನಡುವಿನ ತಾಪಮಾನವು "ಅಪಾಯಕಾರಿ ವಲಯ" (Danger Zone) ಆಗಿದ್ದು, ಬ್ಯಾಕ್ಟೀರಿಯಾಗಳು ವೇಗವಾಗಿ ಬೆಳೆಯುತ್ತವೆ.\n• **ಪ್ಯಾಕೇಜಿಂಗ್ ಮತ್ತು ನೈರ್ಮಲ್ಯ:** ಆಹಾರವನ್ನು ಸ್ವಚ್ಛ, ಮುಚ್ಚಳವಿರುವ ಆಹಾರ ದರ್ಜೆಯ (Food-grade) ಪಾತ್ರೆಗಳಲ್ಲಿ ಪ್ಯಾಕ್ ಮಾಡಬೇಕು.\n• **ಆಹಾರ ವರ್ಗೀಕರಣ:** ಶುದ್ಧ ಸಸ್ಯಾಹಾರಿ (Pure Veg), ಮಾಂಸಾಹಾರಿ (Non-Veg) ಹಾಗೂ ಅಲರ್ಜಿನ್ ವಿವರಗಳನ್ನು ಕಡ್ಡಾಯವಾಗಿ ನಮೂದಿಸಬೇಕು.\n• **ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆ:** ವಾಸನೆ, ಬಣ್ಣ ಅಥವಾ ವಿನ್ಯಾಸದಲ್ಲಿ ಯಾವುದೇ ವ್ಯತ್ಯಾಸ ಕಂಡುಬಂದರೆ ಅಂತಹ ಆಹಾರವನ್ನು ವಿತರಿಸಬಾರದು.',
      };
    }
    if (lang === 'hi') {
      return {
        intent: 'FOOD_SAFETY',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          '### अन्नधारा खाद्य सुरक्षा और FSSAI अनुपालन दिशानिर्देश:\n\n• **तापमान नियंत्रण (Temperature Standards):**\n  - पका हुआ गर्म भोजन **≥ 65°C** पर बनाए रखा जाना चाहिए और पकाने के **2 से 4 घंटे के भीतर** वितरित किया जाना चाहिए।\n  - ठंडा और खराब होने वाला भोजन **≤ 5°C** पर संग्रहीत किया जाना चाहिए।\n  - 5°C से 65°C के बीच "डेंजर ज़ोन" (Danger Zone) होता है जहाँ बैक्टीरिया तेजी से पनपते हैं।\n• **स्वच्छ पैकेजिंग:** भोजन को साफ, एयर-टाइट फ़ूड-ग्रेड कंटेनर या इंसुलेटेड बॉक्स में पैक करें।\n• **वर्गीकरण व एलर्जी सूचना:** शाकाहारी (Pure Veg) और मांसाहारी (Non-Veg) को अलग रखें तथा संभावित एलर्जी की जानकारी स्पष्ट करें।\n• **गुणवत्ता जांच:** गंध, स्वाद या रूप में किसी भी प्रकार का संदेह होने पर भोजन का वितरण न करें।',
      };
    }
    return {
      intent: 'FOOD_SAFETY',
      model: 'resilient-offline-engine',
      isMock: true,
      message:
        '### Safe Food Handling & FSSAI Standards on Annadhara:\n\n• **Temperature Standards:**\n  - **Hot Cooked Food:** Must be maintained at **≥ 65°C** and distributed within **2 to 4 hours** of preparation.\n  - **Cold Perishables:** Must be held at **≤ 5°C** in refrigerated storage.\n  - **Danger Zone:** Avoid leaving food between **5°C and 65°C** where bacterial growth accelerates.\n• **Food-Grade Packaging:** Store food in sealed, tamper-evident, food-grade containers or insulated thermal bags.\n• **Dietary Transparency:** Clearly label Pure Veg, Non-Veg, and common allergens (dairy, nuts, gluten).\n• **Sensory Inspection:** Verify sensory freshness (appearance, aroma, texture) prior to handover confirmation.',
    };
  }

  // 4. DONATION CREATION & HOW TO PUBLISH
  const isDonateQuestion =
    text.includes('how to donate') ||
    text.includes('how can i publish') ||
    text.includes('how do i publish') ||
    text.includes('publish donation') ||
    text.includes('create donation') ||
    text.includes('list food') ||
    text.includes('post food') ||
    text.includes('add food') ||
    text.includes('donor process') ||
    text.includes('ಆಹಾರ ದಾನವನ್ನು ಹೇಗೆ ಪ್ರಕಟಿಸುವುದು') ||
    text.includes('ದಾನ ಮಾಡುವುದು ಹೇಗೆ') ||
    text.includes('ಭೋಜನ ದಾನ') ||
    text.includes('भोजन दान कैसे प्रकाशित करें') ||
    text.includes('दान कैसे करें') ||
    text.includes('भोजन कैसे जोड़ें');

  if (isDonateQuestion) {
    if (lang === 'kn') {
      return {
        intent: 'DONATE_FOOD',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          '### ಆಹಾರ ದಾನವನ್ನು ಪ್ರಕಟಿಸುವ ಹಂತಗಳು:\n\n1. ಮೆನುವಿನಲ್ಲಿರುವ **Publish Food Donation** (`/create-donation`) ಪುಟಕ್ಕೆ ಹೋಗಿ.\n2. ಆಹಾರದ ಹೆಸರು, ಆಹಾರದ ವಿಧ (ಸಸ್ಯಾಹಾರಿ / ಮಾಂಸಾಹಾರಿ / ವೇಗನ್) ಮತ್ತು ಲಭ್ಯವಿರುವ ಪ್ರಮಾಣವನ್ನು (ಊಟಗಳ ಸಂಖ್ಯೆ ಅಥವಾ ಕೆ.ಜಿ) ನಮೂದಿಸಿ.\n3. ಆಹಾರ ತಯಾರಿಸಿದ ಸಮಯ ಹಾಗೂ ಸೂಕ್ತ ಪಿಕಪ್ ಸಮಯದ ಮಿತಿಯನ್ನು ನಿಗದಿಪಡಿಸಿ.\n4. ಪಿಕಪ್ ವಿಳಾಸ ಮತ್ತು ಸಂಪರ್ಕ ದೂರವಾಣಿ ಸಂಖ್ಯೆಯನ್ನು ದೃಢೀಕರಿಸಿ.\n5. **Publish Donation** ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.\n\nಯಾವುದಾದರೂ ಎನ್‌ಜಿಒ ನಿಮ್ಮ ದಾನವನ್ನು ಕಾಯ್ದಿರಿಸಿದ ತಕ್ಷಣ ನಿಮಗೆ ಅಧಿಸೂಚನೆ ಬರುತ್ತದೆ. ಪಿಕಪ್ ಸಮಯದಲ್ಲಿ ಅವರ 6-ಅಕ್ಷರಗಳ ಹಸ್ತಾಂತರ ಕೋಡ್ ಪರಿಶೀಲಿಸಿ ಆಹಾರವನ್ನು ನೀಡಿ.',
      };
    }
    if (lang === 'hi') {
      return {
        intent: 'DONATE_FOOD',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          '### भोजन दान प्रकाशित करने के चरण:\n\n1. ऐप या वेबसाइट पर **भोजन दान प्रकाशित करें** (`/create-donation`) पर जाएं।\n2. भोजन का नाम, आहार प्रकार (शाकाहारी / मांसाहारी) और मात्रा (थाली संख्या या किलो) दर्ज करें।\n3. भोजन पकाने का समय और सुरक्षित पिकअप समय सीमा निर्धारित करें।\n4. पिकअप का सटीक पता और संपर्क नंबर दर्ज करें।\n5. **Publish Donation** बटन पर क्लिक करें।\n\nजब कोई एनजीओ आपके दान को आरक्षित करेगा, तो आपको तुरंत सूचित किया जाएगा। पिकअप के समय उनके 6-अंकीय हैंडओवर कोड का मिलान करके भोजन सौंपें।',
      };
    }
    return {
      intent: 'DONATE_FOOD',
      model: 'resilient-offline-engine',
      isMock: true,
      message:
        '### How to Publish a Food Donation:\n\n1. Open **Publish Food Donation** (`/create-donation`).\n2. Enter the food title, dietary category (Pure Veg, Non-Veg, Vegan), and estimated quantity/servings.\n3. Specify the preparation time and safe pickup window.\n4. Enter the exact pickup address and contact telephone number.\n5. Click **Publish Donation**.\n\nWhen a verified NGO reserves your listing, you will receive a notification. Upon physical collection, match the recipient\'s verified 6-character Handover Code before releasing the food.',
    };
  }

  // 5. FINDING FOOD & RESERVATION WORKFLOW
  const isFindFoodQuestion =
    text.includes('find food') ||
    text.includes('how do i find') ||
    text.includes('available food') ||
    text.includes('browse food') ||
    text.includes('reserve food') ||
    text.includes('request food') ||
    text.includes('get food') ||
    text.includes('recipient process') ||
    text.includes('ಆಹಾರ ಹೇಗೆ ಕಂಡುಹಿಡಿಯುವುದು') ||
    text.includes('ಲಭ್ಯವಿರುವ ಆಹಾರ') ||
    text.includes('ಕಾಯ್ದಿರಿಸು') ||
    text.includes('भोजन कैसे खोजें') ||
    text.includes('उपलब्ध भोजन') ||
    text.includes('आरक्षण');

  if (isFindFoodQuestion) {
    if (lang === 'kn') {
      return {
        intent: 'FIND_FOOD',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          '### ಲಭ್ಯವಿರುವ ಆಹಾರ ಹುಡುಕುವುದು ಮತ್ತು ಕಾಯ್ದಿರಿಸುವ ಹಂತಗಳು:\n\n1. **Browse Food Listings** (`/find-food`) ಪುಟಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.\n2. ನಿಮ್ಮ ಪ್ರದೇಶ, ಆಹಾರದ ವಿಧ ಮತ್ತು ಪ್ರಮಾಣಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಪಟ್ಟಿಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ.\n3. ಆಹಾರ ತಯಾರಿಸಿದ ಸಮಯ ಮತ್ತು ಸುರಕ್ಷಿತ ಪಿಕಪ್ ಮಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.\n4. ನೀವು ಬಯಸಿದ ಪಟ್ಟಿಯ ಮೇಲೆ **Reserve** ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.\n5. ಕಾಯ್ದಿರಿಸುವಿಕೆ ದೃಢಪಟ್ಟ ನಂತರ ನಿಮಗೆ **6-ಅಕ್ಷರಗಳ ಹಸ್ತಾಂತರ ಕೋಡ್ (Handover Code)** ಲಭಿಸುತ್ತದೆ.\n6. ಆಹಾರ ಪಡೆಯುವಾಗ ದಾನಿ ಅಥವಾ ಸ್ವಯಂಸೇವಕರಿಗೆ ಈ ಕೋಡ್ ನೀಡಿ ಆಹಾರ ಸ್ವೀಕರಿಸಿ.',
      };
    }
    if (lang === 'hi') {
      return {
        intent: 'FIND_FOOD',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          '### उपलब्ध भोजन खोजने और आरक्षित करने के चरण:\n\n1. **भोजन सूची देखें** (`/find-food`) पेज पर जाएं।\n2. स्थान, आहार वरीयता (शाकाहारी/मांसाहारी) और मात्रा के अनुसार फ़िल्टर करें।\n3. भोजन की ताजगी और पिकअप समय सीमा की पुष्टि करें।\n4. अपनी आवश्यकता अनुसार **Reserve** बटन पर क्लिक करें।\n5. आरक्षण होते ही आपको **6-अंकीय हैंडओवर कोड (Handover Code)** मिलेगा।\n6. भोजन प्राप्त करते समय यह कोड दाता या स्वयंसेवक को दिखाकर हैंडओवर पूरा करें।',
      };
    }
    return {
      intent: 'FIND_FOOD',
      model: 'resilient-offline-engine',
      isMock: true,
      message:
        '### How to Find & Reserve Surplus Food:\n\n1. Visit **Browse Food Listings** (`/find-food`).\n2. Filter listings by proximity, meal category (Pure Veg / Non-Veg), and quantity.\n3. Check the preparation timestamp and pickup deadline.\n4. Click **Reserve** on the desired surplus listing.\n5. Receive your unique **6-character Handover Code** upon confirmation.\n6. Present this code to the donor or volunteer during collection to verify receipt.',
    };
  }

  // 6. VOLUNTEER & PICKUP LOGISTICS
  const isVolunteerQuestion =
    text.includes('volunteer') ||
    text.includes('pickup mission') ||
    text.includes('how do pickups work') ||
    text.includes('transport food') ||
    text.includes('delivery mission') ||
    text.includes('claim pickup') ||
    text.includes('ಸ್ವಯಂಸೇವಕ') ||
    text.includes('ಪಿಕಪ್ ಕಾರ್ಯಾಚರಣೆ') ||
    text.includes('स्वयंसेवक') ||
    text.includes('पिकअप मिशन');

  if (isVolunteerQuestion) {
    if (lang === 'kn') {
      return {
        intent: 'VOLUNTEER_PICKUP',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          '### ಸ್ವಯಂಸೇವಕ ಪಿಕಪ್ ಕಾರ್ಯಾಚರಣೆಯ ಪ್ರಕ್ರಿಯೆ:\n\n1. **Pickup Missions** (`/pickups`) ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ.\n2. ನಿಮ್ಮ ಮಾರ್ಗ ಮತ್ತು ವಾಹನ ಸಾಮರ್ಥ್ಯಕ್ಕೆ ಸರಿಹೊಂದುವ ಸಕ್ರಿಯ ಪಿಕಪ್ ಕಾರ್ಯಾಚರಣೆಯನ್ನು ಆಯ್ದುಕೊಂಡು ಕ್ಲೈಮ್ (Claim) ಮಾಡಿ.\n3. ದಾನಿಗಳ ಸ್ಥಳಕ್ಕೆ ತೆರಳಿ, ಆಹಾರದ ಪ್ಯಾಕೇಜಿಂಗ್ ಮತ್ತು ತಾಪಮಾನವನ್ನು ಪರಿಶೀಲಿಸಿ ಆಹಾರ ಸ್ವೀಕರಿಸಿ.\n4. ನಿಯೋಜಿತ ಎನ್‌ಜಿಒ ಫಲಾನುಭವಿಗಳಿಗೆ ಆಹಾರ ತಲುಪಿಸಿ, ಹಸ್ತಾಂತರ ಕೋಡ್ ಪರಿಶೀಲಿಸುವ ಮೂಲಕ ಕಾರ್ಯಾಚರಣೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಳಿಸಿ.',
      };
    }
    if (lang === 'hi') {
      return {
        intent: 'VOLUNTEER_PICKUP',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          '### स्वयंसेवक पिकअप प्रक्रिया:\n\n1. **पिकअप मिशन** (`/pickups`) डैशबोर्ड पर सक्रिय कार्यों को देखें।\n2. अपने मार्ग और वाहन क्षमता के अनुसार उपयुक्त मिशन को स्वीकार (Claim) करें।\n3. दाता के स्थान पर पहुँचकर कंटेनरों की सील और भोजन की स्थिति की जाँच करें।\n4. भोजन को गंतव्य एनजीओ तक पहुँचाएं और हैंडओवर कोड का सत्यापन करके मिशन को पूरा करें।',
      };
    }
    return {
      intent: 'VOLUNTEER_PICKUP',
      model: 'resilient-offline-engine',
      isMock: true,
      message:
        '### Volunteer Pickup Workflow:\n\n1. Open **Pickup Missions** (`/pickups`) to view surplus food donations awaiting transport.\n2. Claim a mission matching your route and transportation capacity.\n3. Arrive at the donor location, inspect packaging integrity and temperatures, and accept the items.\n4. Transport safely to the designated NGO beneficiary and verify the 6-character Handover Code to complete the run.',
    };
  }

  // 7. HANDOVER VERIFICATION & CODE
  const isHandoverQuestion =
    text.includes('handover code') ||
    text.includes('handover') ||
    text.includes('otp') ||
    text.includes('qr code') ||
    text.includes('6-character') ||
    text.includes('verification code') ||
    text.includes('ಹಸ್ತಾಂತರ ಕೋಡ್') ||
    text.includes('हैंडओवर कोड');

  if (isHandoverQuestion) {
    if (lang === 'kn') {
      return {
        intent: 'HANDOVER_VERIFICATION',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          '### 6-ಅಕ್ಷರಗಳ ಹಸ್ತಾಂತರ ಕೋಡ್ (Handover Code) ಕುರಿತು:\n\nಅನ್ನಧಾರದಲ್ಲಿ ಪ್ರತಿಯೊಂದು ಆಹಾರ ಕಾಯ್ದಿರಿಸುವಿಕೆಗೂ ವಿಶಿಷ್ಟವಾದ 6-ಅಕ್ಷರಗಳ ಕೋಡ್ ರಚನೆಯಾಗುತ್ತದೆ. ಆಹಾರವನ್ನು ದಾನಿಯಿಂದ ಎನ್‌ಜಿಒಗೆ ನೀಡುವಾಗ ಅಥವಾ ಸ್ವಯಂಸೇವಕರು ವಿತರಿಸುವಾಗ ಈ ಕೋಡ್ ಅನ್ನು ಪರಿಶೀಲಿಸುವುದು ಕಡ್ಡಾಯವಾಗಿದೆ. ಇದು ಆಹಾರವು ಸರಿಯಾದ ಫಲಾನುಭವಿಗಳಿಗೆ ತಲುಪಿದೆ ಎಂಬುದನ್ನು ಖಚಿತಪಡಿಸುತ್ತದೆ.',
      };
    }
    if (lang === 'hi') {
      return {
        intent: 'HANDOVER_VERIFICATION',
        model: 'resilient-offline-engine',
        isMock: true,
        message:
          '### 6-अंकीय हैंडओवर कोड सत्यापन:\n\nअन्नधारा पर प्रत्येक आरक्षण के लिए एक अद्वितीय 6-अंकीय हैंडओवर कोड उत्पन्न होता है। भोजन सौंपते समय दाता या स्वयंसेवक इस कोड को सत्यापित करते हैं। यह प्रक्रिया सुनिश्चित करती है कि अधिशेष भोजन सुरक्षित और पारदर्शी रूप से सही पंजीकृत प्राप्तकर्ता तक पहुंचे।',
      };
    }
    return {
      intent: 'HANDOVER_VERIFICATION',
      model: 'resilient-offline-engine',
      isMock: true,
      message:
        '### Handover Code Verification:\n\nThe **6-character Handover Code** is a platform safety invariant generated when an NGO reserves surplus food. During physical collection, the donor or volunteer confirms this code before releasing meals. This ensures zero diversion and creates a verified audit trail.',
    };
  }

  // 8. DEFAULT / GENERAL HELP SCOPE RESPONSE
  if (lang === 'kn') {
    return {
      intent: 'GENERAL_ASSISTANCE',
      model: 'resilient-offline-engine',
      isMock: true,
      message:
        'ನಾನು **ಅನ್ನಧಾರ AI**, ಹೆಚ್ಚುವರಿ ಆಹಾರ ರಕ್ಷಣೆ, ಆಹಾರ ದಾನಗಳು ಮತ್ತು FSSAI ಸುರಕ್ಷತಾ ಮಾನದಂಡಗಳ ಸಹಾಯಕ. ನಾನು ಆಹಾರ ದಾನ ಪ್ರಕಟಿಸುವುದು, ಲಭ್ಯವಿರುವ ಊಟ ಹುಡುಕುವುದು ಅಥವಾ ಪಿಕಪ್ ಪ್ರಕ್ರಿಯೆಗಳಲ್ಲಿ ನಿಮಗೆ ನೆರವಾಗಬಲ್ಲೆ. ಈ ಕುರಿತು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ದಯವಿಟ್ಟು ತಿಳಿಸಿ.',
    };
  }
  if (lang === 'hi') {
    return {
      intent: 'GENERAL_ASSISTANCE',
      model: 'resilient-offline-engine',
      isMock: true,
      message:
        'मैं **अन्नधारा AI** हूँ — अधिशेष भोजन बचाव, प्लेटफ़ॉर्म कार्यप्रवाह और FSSAI खाद्य सुरक्षा मानकों में आपकी सहायता के लिए समर्पित। आप भोजन दान करने, उपलब्ध भोजन खोजने या पिकअप से जुड़े प्रश्न पूछ सकते हैं। मैं आपकी क्या मदद करूँ?',
    };
  }

  return {
    intent: 'GENERAL_ASSISTANCE',
    model: 'resilient-offline-engine',
    isMock: true,
    message:
      'I am **Annadhara AI**, dedicated to surplus food rescue operations, listing workflows, and food safety standards. I can help you publish food donations, browse available meals, coordinate volunteer pickups, or follow FSSAI safety guidelines. How can I assist you with Annadhara today?',
  };
};

module.exports = {
  generateContextualFallback,
};

