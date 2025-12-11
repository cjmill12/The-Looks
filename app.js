document.addEventListener('DOMContentLoaded', () => {
    // ... (DOM elements, constants, promptDatabase, helper functions remain the same) ...

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
    
    // Filter elements (using IDs for sections)
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

    // --- Helper function to manage filter collapse/expand state (RETAINED) ---
    function setFilterState(sectionElement, isExpanded) {
        sectionElement.classList.toggle('expanded', isExpanded);
        sectionElement.classList.toggle('collapsed', !isExpanded);
    }
    
    // --- Camera Initialization Function (MODIFIED TO UPDATE BUTTON) ---
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
                    // Change to the Capture icon after camera starts successfully
                    takeSelfieBtn.textContent = "📸"; 
                    takeSelfieBtn.disabled = false;
                    statusMessage.textContent = "Camera ready. Select your style and capture!";
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

    // --- INITIAL STATE SETUP (RETAINED) ---
    takeSelfieBtn.textContent = "▶️"; 
    statusMessage.textContent = "Select your Gender and Complexion to begin.";
    tryOnBtn.style.display = 'none'; 
    videoFeed.style.display = 'none'; 
    tryOnBtn.disabled = true;

    // ... (renderComplexionSelector, renderFinalGallery, filter selection logic REVERTED to last working version) ...


    // --- Style Selection Handler (MODIFIED FOR TWO-BUTTON WORKFLOW) ---
    function handleStyleSelection(e) {
        document.querySelectorAll('.style-option').forEach(opt => opt.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        
        selectedPrompt = e.currentTarget.getAttribute('data-prompt');
        setFilterState(galleryContainer, false); 
        
        // When a style is selected, re-evaluate button states
        if (capturedImageBase64) {
            // We have a photo, now we can Try On
            tryOnBtn.disabled = false;
            statusMessage.textContent = `Style selected: ${e.currentTarget.getAttribute('data-name')}. Click 'Try On Selected Hairstyle' above!`;
        } else {
            // We need to take a photo
            tryOnBtn.disabled = true;
            statusMessage.textContent = `Style selected. Click the camera icon (${cameraStarted ? '📸' : '▶️'}) to start your camera or take a selfie!`;
        }
    }


    // --- TAKE SELFIE BUTTON LOGIC (MODIFIED FOR 3-STATE FLOW) ---
    takeSelfieBtn.addEventListener('click', () => {
        // State 1: Start Camera (▶️ or 🔄 after result)
        if (takeSelfieBtn.textContent === "▶️" || takeSelfieBtn.textContent === "🔄") {
            // If the button is 🔄, clear the result image
            if (takeSelfieBtn.textContent === "🔄") {
                aiResultImg.src = ''; 
                capturedImageBase64 = null;
                tryOnBtn.style.display = 'none';
                tryOnBtn.disabled = true;
            }
            
            // Start the camera. startCamera() updates the button to 📸
            startCamera(); 
            return; 
        }

        // State 2: Capture Selfie (📸)
        if (takeSelfieBtn.textContent === "📸") {
            if (videoFeed.readyState !== 4) { 
                statusMessage.textContent = "Camera feed not ready yet. Please wait a moment.";
                return; 
            }
            
            // 1. Capture Logic (same as before)
            canvas.width = videoFeed.videoWidth;
            canvas.height = videoFeed.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            capturedImageBase64 = dataUrl.split(',')[1]; 
            
            // 2. State Transition (Camera -> Captured Image)
            videoFeed.style.display = 'none'; 
            aiResultImg.src = dataUrl;
            aiResultImg.style.display = 'block'; 
            
            // 3. Update Controls/Status
            takeSelfieBtn.textContent = '🔄'; // Change to Retake icon
            tryOnBtn.style.display = 'block'; // Show Generate button

            if (selectedPrompt) {
                tryOnBtn.disabled = false; 
                statusMessage.textContent = "Selfie captured! Click 'Try On Selected Hairstyle' or retake (🔄).";
            } else {
                tryOnBtn.disabled = true; 
                statusMessage.textContent = "Selfie captured! Now, please select your Inspiration style.";
                
                // Prompt user to select style
                document.querySelectorAll('.filter-section').forEach(s => setFilterState(s, false));
                setFilterState(galleryContainer, true);
            }
        }
    });

    // --- TRY ON BUTTON LOGIC (MODIFIED TO UPDATE TAKE BUTTON STATE ON SUCCESS) ---
    tryOnBtn.addEventListener('click', async () => {
        if (!capturedImageBase64 || !selectedPrompt) {
            statusMessage.textContent = "Error: Please take a selfie AND select a style!";
            return;
        }

        statusMessage.textContent = `Applying your selected style... This may take a moment.`;
        tryOnBtn.disabled = true;
        spinner.style.display = 'inline-block'; 
        
        try {
            // ... (Netlify function call remains the same) ...
            
            // --- SUCCESS BLOCK ---
            // Simulating successful result image update:
            // aiResultImg.src = `data:image/jpeg;base64,${data.generatedImageBase64}`;
            aiResultImg.style.display = 'block';

            // State Transition: Result is ready
            tryOnBtn.disabled = true; // Disable generate after success
            spinner.style.display = 'none'; 
            tryOnBtn.style.display = 'none'; // Hide Generate button
            
            takeSelfieBtn.style.display = 'block'; 
            takeSelfieBtn.textContent = "🔄"; // Button is now permanently 'Retake/Restart'
            
            statusMessage.textContent = `Done! Your new look is ready. Click the restart button (🔄) to take a new selfie.`;
            
        } catch (error) {
            // ... (Error handling remains the same) ...
        }
    });
});
