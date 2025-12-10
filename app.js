document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM elements (remains the same)
    const videoFeed = document.getElementById('video-feed');
    const aiResultImg = document.getElementById('ai-result');
    const canvas = document.getElementById('hidden-canvas');
    
    // Buttons and Controls
    const takeSelfieBtn = document.getElementById('take-selfie-btn');
    const tryOnBtn = document.getElementById('try-on-btn');
    const spinner = document.getElementById('loading-spinner');
    
    const statusMessage = document.getElementById('status-message');
    
    // NEW: Filter elements (remains the same)
    const genderSelector = document.getElementById('gender-selector');
    const complexionSelector = document.getElementById('complexion-selector');
    const complexionGroup = document.getElementById('complexion-options-group');
    const galleryContainer = document.getElementById('hairstyle-gallery');
    
    // State tracking variables (remains the same)
    let capturedImageBase64 = null; 
    let selectedPrompt = null; 
    let cameraStarted = false; 
    let selectedGender = null;
    let selectedComplexion = null;

    // --- CONSTANTS (remains the same) ---
    const NEGATIVE_PROMPT = "extra fingers, blurry, low resolution, bad hands, deformed face, mask artifact, bad blending, unnatural hair hair color, ugly, tiling, duplicate, abstract, cartoon, distorted pupils, bad lighting, cropped, grainy, noise, poor quality, bad anatomy.";
    
    // --- Complexion Data and Prompt Database (remains the same) ---
    // ... (Your complexionData and promptDatabase arrays here) ...
    const complexionData = [
        { id: 'fair', name: 'Fair', color: '#F0E6D2' },
        { id: 'medium', name: 'Medium', color: '#E0C79A' },
        { id: 'olive', name: 'Olive', color: '#C0A88D' },
        { id: 'brown', name: 'Brown', color: '#966F53' },
        { id: 'dark_brown', name: 'Dark Brown', color: '#6A4A3C' },
        { id: 'deep', name: 'Deep', color: '#442C2E' },
    ];
    
    const promptDatabase = {
        male: {
            fair: [
                { name: 'Fringe', prompt: 'Photorealistic inpainting, perfect masking, medium forward fringe, light golden brown, 4K resolution.', img: '/styles/forward fringe.jpeg' },
                { name: 'Spiked Charm', prompt: 'Flawless composite, high-detail spiked texture, short cut with sharp fade, light brown color.', img: '/styles/spiked charm.jpeg' },
            ],
            medium: [
                { name: 'Wavy Quiff', prompt: 'Flawless composite, high volume wavy quiff, medium brown hair color, cinematic portrait lighting.', img: '/styles/wavy quiff.jpeg' },
                { name: 'Sleek Side Part', prompt: 'Seamless photo-merge, ultra-clean classic side-part, medium brown color, sharp definition.', img: '/styles/sleek side part.jpeg' },
            ],
            olive: [
                { name: 'Tousled Top', prompt: 'Perfectly masked, highly textured and tousled top with short sides, dark brown color, high resolution.', img: '/styles/tousled top.jpeg' },
                { name: 'Natural Curls', prompt: 'Soft texture natural curls, dark espresso brown color, ultra HD quality.', img: '/styles/natural curls.jpeg' },
            ],
            brown: [
                { name: 'High Top Fade', prompt: 'Ultra-realistic, sharp high-top fade, dark black color, high contrast lighting.', img: '/styles/high top fade.jpeg' },
                { name: 'Textured Scissor', prompt: 'Perfect composite, defined short texture on the fringe, high-contrast fade, dark black color.', img: '/styles/side swept scissor cut.jpeg' },
            ],
            dark_brown: [
                { name: 'High Top Fade', prompt: 'Ultra-realistic, sharp high-top fade, dark black color, high contrast lighting.', img: '/styles/high top fade.jpeg' },
                { name: 'Natural Curls', prompt: 'Soft texture natural curls, dark espresso brown color, ultra HD quality.', img: '/styles/natural curls.jpeg' },
            ],
            deep: [
                { name: 'High Top Fade', prompt: 'Ultra-realistic, sharp high-top fade, dark black color, high contrast lighting.', img: '/styles/high top fade.jpeg' },
                { name: 'Textured Scissor', prompt: 'Perfect composite, defined short texture on the fringe, high-contrast fade, dark black color.', img: '/styles/side swept scissor cut.jpeg' },
            ],
        },
        female: {
            fair: [ { name: 'Long Bob', prompt: 'Shoulder length layered bob, light blonde highlights.', img: '/styles/placeholder_bob.jpeg' }],
            deep: [ { name: 'Afro Puff', prompt: 'Voluminous afro puff hairstyle, natural black color, defined curls.', img: '/styles/placeholder_afro.jpeg' }],
        }
    };


    // --- Camera Initialization Function ---
    function startCamera() {
        if (cameraStarted) return;
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            statusMessage.textContent = "Attempting to access camera...";
            takeSelfieBtn.disabled = true;

            videoFeed.setAttribute('playsinline', ''); 

            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    videoFeed.srcObject = stream;
                    
                    videoFeed.style.display = 'block'; 
                    aiResultImg.style.display = 'none'; 
                    
                    return videoFeed.play(); 
                })
                .then(() => {
                    cameraStarted = true;
                    // Changed button content to reflect its new icon/role
                    takeSelfieBtn.textContent = "📷"; 
                    takeSelfieBtn.disabled = false;
                    statusMessage.textContent = "Camera ready. Tap the camera icon to capture!";
                })
                .catch(err => {
                    console.error("Camera access error (getUserMedia or play failed):", err);
                    takeSelfieBtn.disabled = false; 
                    // Changed button content to reflect its new icon/role
                    takeSelfieBtn.textContent = "❌";
                    statusMessage.textContent = "Error: Cannot access camera. Check browser permissions.";
                });
        }
    }
    
    // 🚨 INITIAL STATE SETUP
    // Set the button text to 'Start Camera' initially (non-circular state)
    takeSelfieBtn.textContent = "▶️ Start Camera"; 
    statusMessage.textContent = "Click 'Start Camera' to begin the virtual try-on.";
    tryOnBtn.style.display = 'none'; 
    videoFeed.style.display = 'none'; 
    tryOnBtn.disabled = true;

    // --- FILTER STEP 1: Gender Selection Logic (remains the same) ---
    document.querySelectorAll('.gender-option').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.gender-option').forEach(btn => btn.classList.remove('selected'));
            e.currentTarget.classList.add('selected');

            selectedGender = e.currentTarget.getAttribute('data-gender');
            
            selectedComplexion = null;
            galleryContainer.style.display = 'none';
            
            renderComplexionSelector();
        });
    });


    // --- FILTER STEP 2: Complexion Selector Generation (remains the same) ---
    function renderComplexionSelector() {
        // ... (function logic remains the same) ...
        complexionGroup.innerHTML = '';
        complexionSelector.style.display = 'block';

        complexionData.forEach(c => {
            const tile = document.createElement('div');
            tile.classList.add('complexion-tile');
            tile.setAttribute('data-complexion', c.id);
            tile.style.backgroundColor = c.color;
            
            const label = document.createElement('p');
            label.textContent = c.name;
            
            tile.appendChild(label);
            complexionGroup.appendChild(tile);
            
            tile.addEventListener('click', (e) => {
                document.querySelectorAll('.complexion-tile').forEach(t => t.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                
                selectedComplexion = e.currentTarget.getAttribute('data-complexion');
                
                renderFinalGallery();
            });
        });
        
        statusMessage.textContent = "2. Now, select the closest skin complexion match.";
    }


    // --- FINAL STEP 3: Render the Filtered Gallery (remains the same) ---
    function renderFinalGallery() {
        // ... (function logic remains the same) ...
        if (!selectedGender || !selectedComplexion) return;

        galleryContainer.innerHTML = '';
        
        const filteredStyles = promptDatabase[selectedGender] && promptDatabase[selectedGender][selectedComplexion] 
                             ? promptDatabase[selectedGender][selectedComplexion]
                             : [];
        
        if (filteredStyles.length === 0) {
            statusMessage.textContent = `No styles available for this selection yet. Please choose another option or contact the barbershop for more styles.`;
            galleryContainer.style.display = 'none';
            return;
        }

        filteredStyles.forEach(style => {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('style-option');
            optionDiv.setAttribute('data-prompt', style.prompt);
            optionDiv.setAttribute('data-name', style.name);

            const img = document.createElement('img');
            img.src = style.img; 
            img.alt = style.name;
            img.classList.add('style-thumbnail');

            const p = document.createElement('p');
            p.textContent = style.name; 

            optionDiv.appendChild(img);
            optionDiv.appendChild(p);
            galleryContainer.appendChild(optionDiv);
            
            optionDiv.addEventListener('click', handleStyleSelection);
        });

        galleryContainer.style.display = 'flex'; 
        statusMessage.textContent = "3. Select your final style and click 'Try On Selected Hairstyle'.";
    }

    // --- Style Selection Handler (remains the same) ---
    function handleStyleSelection(e) {
        // ... (function logic remains the same) ...
        document.querySelectorAll('.style-option').forEach(opt => opt.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        
        selectedPrompt = e.currentTarget.getAttribute('data-prompt');
        
        if (capturedImageBase64) {
            tryOnBtn.disabled = false;
            takeSelfieBtn.style.display = 'none';
            tryOnBtn.style.display = 'block';
            statusMessage.textContent = `Style selected: ${e.currentTarget.getAttribute('data-name')}. Click 'Try On Selected Hairstyle' above!`;
        } else {
            tryOnBtn.disabled = true;
            statusMessage.textContent = `Style selected. Click 'Start Camera' to take your selfie!`;
        }
    }


    // --- Capture Selfie/Camera Activation ---
    takeSelfieBtn.addEventListener('click', () => {
        // 🚨 NEW LOGIC: If camera hasn't started, start it first.
        if (!cameraStarted) {
            // Temporarily change button text for a clear call to action while loading
            takeSelfieBtn.textContent = "⌛"; 
            startCamera(); 
            return; 
        }
        
        // 🚨 Existing logic for taking a photo only runs if cameraStarted is true
        if (videoFeed.readyState !== 4) { 
            statusMessage.textContent = "Camera feed not ready yet. Please wait a moment.";
            return; 
        }
        
        // 1. Capture Logic
        canvas.width = videoFeed.videoWidth;
        canvas.height = videoFeed.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        capturedImageBase64 = dataUrl.split(',')[1]; 
        
        // 2. State Transition (Camera -> Captured Image)
        takeSelfieBtn.style.display = 'none'; 
        tryOnBtn.style.display = 'block'; 
        videoFeed.style.display = 'none'; 
        
        // 3. Display captured image
        aiResultImg.src = dataUrl;
        aiResultImg.style.display = 'block'; 

        // Check if a style is already selected (filters must be complete)
        if (selectedPrompt && selectedGender && selectedComplexion) {
            tryOnBtn.disabled = false; 
            statusMessage.textContent = "Selfie captured! Click 'Try On Selected Hairstyle' above.";
        } else {
            tryOnBtn.disabled = true; 
            statusMessage.textContent = "Selfie captured! Now, complete steps 1, 2, and 3 to select your style.";
        }
    });


    // --- Call Netlify Function for AI Processing (remains the same) ---
    tryOnBtn.addEventListener('click', async () => {
        // ... (function logic remains the same) ...
        if (!capturedImageBase64 || !selectedPrompt) {
            statusMessage.textContent = "Error: Please take a selfie AND select a style!";
            return;
        }

        statusMessage.textContent = `Applying your selected style... This may take a moment.`;
        tryOnBtn.disabled = true;
        spinner.style.display = 'inline-block'; 
        
        try {
            const response = await fetch('/.netlify/functions/tryon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseImage: capturedImageBase64,
                    prompt: `Edit the hair in this image using the following instruction: ${selectedPrompt}. Ensure the final result is photorealistic, seamlessly blended, and maintains the subject's face and original lighting.`,
                    negativePrompt: NEGATIVE_PROMPT 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            aiResultImg.src = `data:image/jpeg;base64,${data.generatedImageBase64}`;
            aiResultImg.style.display = 'block';
            statusMessage.textContent = `Done! Your new look is ready.`;

        } catch (error) {
            console.error('AI Processing Error:', error);
            statusMessage.textContent = `Error during AI try-on: ${error.message}. Please check your console/Netlify logs.`;
        } finally {
            tryOnBtn.disabled = true; 
            spinner.style.display = 'none'; 
            
            // State Transition (Result -> Ready to Take New Selfie)
            takeSelfieBtn.style.display = 'block';
            takeSelfieBtn.textContent = "▶️"; // Reset to the 'start camera' icon
            cameraStarted = false; 
            tryOnBtn.style.display = 'none';
        }
    });
});
