const API_KEY = 'PASTE_GEMINI_KEY_HERE';
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

export { diagnose, compressImage, speak };
