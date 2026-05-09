const API_KEY = 'AIzaSyAD0kB70mKVgIG7iCvdfOybeqbxYLWFC74';
async function diagnose(base64Image, cropType, language) {
  try {
    const prompt = `You are a plant disease expert helping a small-scale farmer. The farmer grows ${cropType}. Respond ONLY in ${language}. Return ONLY a raw JSON object with no markdown, no backticks, no explanation. JSON must have exactly: disease_name (string), severity (exactly one of: High, Medium, Low), treatment (string, one simple action max 15 words), medicines (array of exactly 2 objects, each with name (string, a specific real product name) and how_to_use (string, max 15 words)). If image is not a diseased plant set disease_name to Not a plant disease, severity to Low, treatment to Please take a clear photo of a sick leaf, medicines to [{name: 'None', how_to_use: 'Not applicable'}, {name: 'None', how_to_use: 'Not applicable'}].`;
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image
                }
              },
              {
                text: prompt
              }
            ]
          }]
        })
      }
    );
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Diagnosis error:', error);
    return null;
  }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxSize = 800;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        resolve(base64);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getLangCode(language) {
  const languages = {
    English: "en-US",
    Hindi: "hi-IN",
    Kannada: "kn-IN",
    Tamil: "ta-IN",
    Telugu: "te-IN"
  };

  return languages[language] || "en-US";
}

function speak(text, langCode) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 0.85;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation is not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

function openNearbyMedicineProviders(productName, diseaseName) {
  getUserLocation()
    .then((location) => {
      const query = encodeURIComponent(
        `nearby fertilizer pesticide agriculture medicine store ${productName} ${diseaseName}`
      );

      const mapsUrl = `https://www.google.com/maps/search/${query}/@${location.lat},${location.lng},14z`;

      window.open(mapsUrl, "_blank");
    })
    .catch(() => {
      const fallbackQuery = encodeURIComponent(
        `nearby fertilizer pesticide agriculture medicine store ${productName}`
      );

      window.open(`https://www.google.com/maps/search/${fallbackQuery}`, "_blank");
    });
}

function getHomeRemedies(diseaseName) {
  const disease = diseaseName.toLowerCase();

  if (disease.includes("blight")) {
    return [
      "Remove infected leaves immediately.",
      "Avoid watering leaves directly.",
      "Spray diluted neem oil in the evening."
    ];
  }

  if (disease.includes("mildew")) {
    return [
      "Improve air circulation around plants.",
      "Avoid overcrowding crops.",
      "Spray baking soda solution lightly."
    ];
  }

  if (disease.includes("rust")) {
    return [
      "Remove affected leaves safely.",
      "Avoid overhead watering.",
      "Use neem oil as a preventive spray."
    ];
  }

  if (disease.includes("leaf spot")) {
    return [
      "Remove spotted leaves.",
      "Keep soil drainage proper.",
      "Spray neem oil once a week."
    ];
  }

  if (disease.includes("rot")) {
    return [
      "Reduce excess watering.",
      "Improve soil drainage.",
      "Remove badly affected plant parts."
    ];
  }

  return [
    "Remove infected leaves or plant parts.",
    "Avoid overwatering the crop.",
    "Use neem oil spray in the evening."
  ];
}
export {
  diagnose,
  compressImage,
  speak,
  getUserLocation,
  openNearbyMedicineProviders,
  getHomeRemedies
};
