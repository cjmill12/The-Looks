document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM elements
    const videoFeed = document.getElementById('video-feed');
    const aiResultImg = document.getElementById('ai-result');
    const canvas = document.getElementById('hidden-canvas');
    const centralViewport = document.getElementById('central-viewport');
    
    // Buttons and Controls
    const takeSelfieBtn = document.getElementById('take-selfie-btn');
    const tryOnBtn = document.getElementById('try-on-btn');
    const spinner = document.getElementById('loading-spinner');
    
    const statusMessage = document.getElementById('status-message');
    
    // Filter elements 
    const genderSelector = document.getElementById('gender-selector');
    const complexionSelector = document.getElementById('complexion-selector');
    const complexionGroup = document.getElementById('complexion-options-group');
    const galleryContainer = document.getElementById('hairstyle-gallery');
    
    // State tracking variables
    let capturedImageBase64 = null; 
    let selectedPrompt = null; 
    let cameraStarted = false; 
    let selectedGender = null;
    let selectedComplexion = null;

    // --- CONSTANTS ---
    const NEGATIVE_PROMPT = "extra fingers, blurry, low resolution, bad hands, deformed face, mask artifact, bad blending, unnatural hair hair color, ugly, tiling, duplicate, abstract, cartoon, distorted pupils, bad lighting, cropped, grainy, noise, poor quality, bad anatomy.";
    
    // --- Complexion Data and Prompt Database (No Change) ---
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


    // 🚨 REMOVED: setFilterState function (No more collapse)
    // 🚨 REMOVED: Click listener for toggling collapse (No more collapse)


    // --- Camera Initialization Function (No change) ---
    function startCamera() {
        if (cameraStarted) return;
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            statusMessage.textContent = "Attempting to access camera...";
            takeSelfieBtn.disabled = true;

            videoFeed.setAttribute('playsinline', ''); 

            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    videoFeed.srcObject = stream;
                    
                    centralViewport.classList.add('active'); 
                    videoFeed.style.display = 'block'; 
                    aiResultImg.style.display = 'none'; 
                    
                    return videoFeed.play(); 
                })
                .then(() => {
                    cameraStarted = true;
                    takeSelfieBtn.textContent = "📸"; 
                    takeSelfieBtn.disabled = false;
                    statusMessage.textContent = "Camera ready. Tap the camera icon to capture!";
                })
                .catch(err => {
                    console.error("Camera access error (getUserMedia or play failed):", err);
                    takeSelfieBtn.disabled = false; 
                    takeSelfieBtn.textContent = "❌";
                    statusMessage.textContent = "Error: Cannot access camera. Check browser permissions.";
                    centralViewport.classList.remove('active'); 
                });
        }
    }

    // --- INITIAL STATE SETUP ---
    // 🚨 REMOVED: Initial collapse state setup. All steps are visible by default via CSS.

    takeSelfieBtn.textContent = "▶️"; 
    statusMessage.textContent = "1. Select your style category, 2. complexion, and 3. hairstyle, then take a selfie.";
    tryOnBtn.style.display = 'none'; 
    videoFeed.style.display = 'none'; 
    tryOnBtn.disabled = true;

    // 🚨 Run Step 2 and 3 rendering on load to ensure Step 3 elements exist for selection
    renderComplexionSelector(); 
    // Note: renderFinalGallery needs selection data, so it won't run fully here.


    // --- FILTER STEP 1: Gender Selection Logic ---
    document.querySelectorAll('.gender-option').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.gender-option').forEach(btn => btn.classList.remove('selected'));
            e.currentTarget.classList.add('selected');

            selectedGender = e.currentTarget.getAttribute('data-gender');
            
            selectedComplexion = null;
            selectedPrompt = null; 
            
            // Re-render Step 2 tiles (Complexion) to clear selection
            renderComplexionSelector();
            
            // Re-render Step 3 gallery to clear old styles
            renderFinalGallery();
            
            statusMessage.textContent = "1. Category selected. Now choose your 2. complexion and 3. hairstyle.";
        });
    });


    // --- FILTER STEP 2: Complexion Selector Generation ---
    function renderComplexionSelector() {
        complexionGroup.innerHTML = ''; // Clear previous tiles
        // 🚨 NO MORE setFilterState CALLS HERE

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
                
                // RENDER STEP 3 (Gallery) based on new selection
                renderFinalGallery();

                statusMessage.textContent = "2. Complexion selected. Now choose your 3. hairstyle.";
            });
        });
        
    }


    // --- FINAL STEP 3: Render the Filtered Gallery ---
    function renderFinalGallery() {
        const galleryOptionsGroup = galleryContainer.querySelector('.filter-options-group');
        galleryOptionsGroup.innerHTML = ''; // Clear previous gallery styles
        
        // Only render styles if both gender and complexion are selected
        if (!selectedGender || !selectedComplexion) {
            galleryOptionsGroup.innerHTML = '<p style="text-align: center; width: 100%; margin-top: 15px;">Please complete Steps 1 & 2 first.</p>';
            return;
        }
        
        const filteredStyles = promptDatabase[selectedGender] && promptDatabase[selectedGender][selectedComplexion] 
                             ? promptDatabase[selectedGender][selectedComplexion]
                             : [];
        
        if (filteredStyles.length === 0) {
            statusMessage.textContent = `No styles available for this selection yet. Please choose another option.`;
            galleryOptionsGroup.innerHTML = '<p style="text-align: center; width: 100%; margin-top: 15px;">No styles found.</p>';
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
            galleryOptionsGroup.appendChild(optionDiv);
            
            optionDiv.addEventListener('click', handleStyleSelection);
        });

        statusMessage.textContent = "3. Select your final style and click 'Try On Selected Hairstyle'.";
    }

    // --- Style Selection Handler ---
    function handleStyleSelection(e) {
        document.querySelectorAll('.style-option').forEach(opt => opt.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        
        selectedPrompt = e.currentTarget.getAttribute('data-prompt');
        
        // Show the Try On button if selfie is taken, otherwise keep instructions
        if (capturedImageBase64) {
            tryOnBtn.disabled = false;
            takeSelfieBtn.style.display = 'none';
            tryOnBtn.style.display = 'block';
            statusMessage.textContent = `Style selected: ${e.currentTarget.getAttribute('data-name')}. Click 'Try On Selected Hairstyle' above!`;
        } else {
            tryOnBtn.disabled = true;
            statusMessage.textContent = `Style selected. Click the Play icon to start your camera!`;
        }
    }


    // --- Capture Selfie/Camera Activation & AI Processing (No functional change) ---
    takeSelfieBtn.addEventListener('click', () => {
        if (!cameraStarted) {
            takeSelfieBtn.textContent = "⏳"; 
            startCamera(); 
            return; 
        }
        
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

        // Check if a style is selected
        if (selectedPrompt) {
            tryOnBtn.disabled = false; 
            statusMessage.textContent = "Selfie captured! Click 'Try On Selected Hairstyle' above.";
        } else {
            tryOnBtn.disabled = true; 
            statusMessage.textContent = "Selfie captured! Now, complete steps 1, 2, and 3 to select your style.";
        }
    });

    tryOnBtn.addEventListener('click', async () => {
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
            takeSelfieBtn.textContent = "▶️"; 
            cameraStarted = false; 
            tryOnBtn.style.display = 'none';
            centralViewport.classList.remove('active'); 
        }
    });
});
