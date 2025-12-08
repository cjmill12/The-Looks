document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM elements
    const videoFeed = document.getElementById('video-feed');
    const canvas = document.getElementById('hidden-canvas');
    const takeSelfieBtn = document.getElementById('take-selfie-btn');
    const tryOnBtn = document.getElementById('try-on-btn');
    
    // Get all style options from the new visual gallery
    const styleOptions = document.querySelectorAll('.style-option'); 
    
    const originalSelfieImg = document.getElementById('original-selfie');
    const aiResultImg = document.getElementById('ai-result');
    const statusMessage = document.getElementById('status-message');
    
    let capturedImageBase64 = null; // Stores the selfie data
    let selectedPrompt = null; // Stores the AI prompt from the clicked gallery item

    // --- Start Camera ---
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                videoFeed.srcObject = stream;
                statusMessage.textContent = "Camera ready. Smile and click 'Take Selfie'!";
            })
            .catch(err => {
                console.error("Camera access error:", err);
                statusMessage.textContent = "Error: Cannot access camera. Check permissions.";
            });
    }

    // --- Capture Selfie ---
    takeSelfieBtn.addEventListener('click', () => {
        if (videoFeed.readyState !== 4) { 
            statusMessage.textContent = "Camera not ready yet.";
            return;
        }

        canvas.width = videoFeed.videoWidth;
        canvas.height = videoFeed.videoHeight;
        const context = canvas.getContext('2d');
        
        // Draw the current video frame onto the canvas
        context.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
        
        // Get the image data URL and strip the prefix to send raw Base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        capturedImageBase64 = dataUrl.split(',')[1]; 

        originalSelfieImg.src = dataUrl;
        originalSelfieImg.style.display = 'inline';
        aiResultImg.style.display = 'none';

        // ONLY enable the Try On button if a style is already selected
        if (selectedPrompt) {
            tryOnBtn.disabled = false;
        }
        statusMessage.textContent = "Selfie captured. Select a style and click 'Try On!'";
    });

    // --- Style Selection Logic ---
    styleOptions.forEach(option => {
        option.addEventListener('click', () => {
            // 1. Remove 'selected' class from all options
            styleOptions.forEach(opt => opt.classList.remove('selected'));
            
            // 2. Add 'selected' class to the clicked option (requires CSS)
            option.classList.add('selected');
            
            // 3. Store the AI prompt from the data attribute
            selectedPrompt = option.getAttribute('data-prompt');
            
            // 4. Enable the Try On button only if a selfie has been taken
            if (capturedImageBase64) {
                tryOnBtn.disabled = false;
            }
            statusMessage.textContent = `${option.getAttribute('data-name')} selected. Click 'Try On!'`;
        });
    });


    // --- Call Netlify Function for AI Processing ---
    tryOnBtn.addEventListener('click', async () => {
        if (!capturedImageBase64 || !selectedPrompt) {
            statusMessage.textContent = "Please take a selfie AND select a style!";
            return;
        }

        statusMessage.textContent = `Applying your selected style... This may take a moment.`;
        tryOnBtn.disabled = true;

        try {
            const response = await fetch('/.netlify/functions/tryon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseImage: capturedImageBase64,
                    // Use the stored selectedPrompt variable
                    prompt: `Apply a high-quality, photorealistic ${selectedPrompt} to the person in the image. Maintain natural shadows and lighting.`
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            // Display the AI-generated image
            aiResultImg.src = `data:image/jpeg;base64,${data.generatedImageBase64}`;
            aiResultImg.style.display = 'inline';
            statusMessage.textContent = `Done! Your new look is ready.`;

        } catch (error) {
            console.error('AI Processing Error:', error);
            statusMessage.textContent = `Error during AI try-on: ${error.message}. Please try again.`;
        } finally {
            tryOnBtn.disabled = false;
        }
    });
});
