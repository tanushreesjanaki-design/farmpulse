const API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE";

async function diagnose(base64Image, cropType, language) {
  try {
    const prompt = `You are a plant disease expert helping a small-scale farmer.

The farmer grows ${cropType}.

Respond ONLY in ${language}.

Return ONLY a raw JSON object.
No markdown.
No backticks.
No explanation.

JSON must have exactly this structure:
{
  "disease_name": "string",
  "severity": "High or Medium or Low",
  "treatment": "one simple action max 15 words",
  "product_to_buy": "one common product name",
  "medicines": [
    {
      "name": "specific real product name",
      "how_to_use": "max 15 words"
    },
    {
      "name": "specific real product name",
      "how_to_use": "max 15 words"
    }
  ]
}

If image is not a diseased plant, return:
{
  "disease_name": "Not a plant disease",
  "severity": "Low",
  "treatment": "Please take a clear photo of a sick leaf",
  "product_to_buy": "None",
  "medicines": [
    {
      "name": "None",
      "how_to_use": "Not applicable"
    },
    {
      "name": "None",
      "how_to_use": "Not applicable"
    }
  ]
}`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Image
                  }
                },
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error("Gemini API request failed");
    }

    const data = await response.json();

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response text received from Gemini");
    }

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const result = JSON.parse(text);

    return {
      disease_name: result.disease_name || "Unknown disease",
      severity: result.severity || "Low",
      treatment: result.treatment || "Consult a local agriculture expert.",
      product_to_buy:
        result.product_to_buy ||
        result.medicines?.[0]?.name ||
        "Neem oil",
      medicines: Array.isArray(result.medicines)
        ? result.medicines.slice(0, 2)
        : [
            {
              name: result.product_to_buy || "Neem oil",
              how_to_use: "Spray lightly in the evening."
            },
            {
              name: "Copper fungicide",
              how_to_use: "Use as per label instructions."
            }
          ]
    };
  } catch (error) {
    console.error("Diagnosis error:", error);
    return null;
  }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const img = new Image();

      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

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

        const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

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
    English: "en-IN",
    Hindi: "hi-IN",
    Kannada: "kn-IN",
    Tamil: "ta-IN",
    Telugu: "te-IN",
    Marathi: "mr-IN"
  };

  return languages[language] || "en-IN";
}

function speak(text, langCode) {
  if (!window.speechSynthesis) return;

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
        `agriculture pesticide fertilizer store ${productName} ${diseaseName}`
      );

      const mapsUrl = `https://www.google.com/maps/search/${query}/@${location.lat},${location.lng},14z`;

      window.open(mapsUrl, "_blank");
    })
    .catch(() => {
      const fallbackQuery = encodeURIComponent(
        `nearby agriculture pesticide fertilizer store ${productName}`
      );

      window.open(
        `https://www.google.com/maps/search/${fallbackQuery}`,
        "_blank"
      );
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

  if (disease.includes("wilt")) {
    return [
      "Remove badly infected plants.",
      "Avoid waterlogging near roots.",
      "Use compost to improve soil health."
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
  getLangCode,
  getUserLocation,
  openNearbyMedicineProviders,
  getHomeRemedies
};
