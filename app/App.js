const API_KEY = "PASTE_YOUR_KEY_HERE";
async function diagnose(base64Image, cropType, language) {
  try {
    const prompt = `You are a plant disease expert.
The farmer grows ${cropType}.
Respond ONLY in ${language}.
Return ONLY raw JSON, no markdown, no backticks:
{
  "disease_name": "string",
  "treatment": "one simple sentence max 15 words",
  "product_to_buy": "one common product name"
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

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    return JSON.parse(text);
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
    English: "en-US",
    Hindi: "hi-IN",
    Kannada: "kn-IN",
    Tamil: "ta-IN",
    Telugu: "te-IN"
  };

  return languages[language] || "en-US";
}

function speak(text, language) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = getLangCode(language);
  utterance.rate = 0.85;

  window.speechSynthesis.speak(utterance);
}

export { diagnose, compressImage, speak };
