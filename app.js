document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM elements
    const videoFeed = document.getElementById('video-feed');
    const aiResultImg = document.getElementById('ai-result');
    const canvas = document.getElementById('hidden-canvas');
    const centralViewport = document.getElementById('central-viewport');
    const statusMessage = document.getElementById('status-message');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Controls
    const captureBtn = document.getElementById('capture-btn');
    const generateBtn = document.getElementById('generate-btn');

    // Filter elements
    const genderPill = document.getElementById('gender-button-mobile');
    const complexionPill = document.getElementById('complexion-button-mobile');

    // Filter Content Wrappers
    const filterWrapper = document.getElementById('filter-selection-wrapper');
    const genderContent = document.getElementById('gender-selector');
    const complexionContent = document.getElementById('complexion-selector');
    const complexionGroup = document.getElementById('complexion-options-group');
    
    // Inspiration Toggle and Gallery
    const inspirationToggle = document.getElementById('inspiration-toggle');
    const galleryContainer = document.getElementById('hairstyle-gallery'); 

    // State tracking variables
    let capturedImageBase64 = null; 
    let selectedPrompt = null; 
    let cameraStarted = false; 
    let selectedGender = null;
    let selectedComplexion = null;
    let activeFilterContent = null; 

    // --- Complexion Data and Prompt Database (Simplified for brevity) ---
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
                { name: 'Fringe', prompt: 'medium forward fringe, light golden brown', img: '/styles/forward fringe.jpeg' },
                { name: 'Spiked', prompt: 'spiked texture, short cut, light brown', img: '/styles/spiked charm.jpeg' },
            ],
            medium: [
                { name: 'Wavy Quiff', prompt: 'high volume wavy quiff, medium brown', img: '/styles/wavy quiff.jpeg' },
                { name: 'Side Part', prompt: 'classic side-part, medium brown', img: '/styles/sleek side part.jpeg' },
            ],
            deep: [
                { name: 'High Fade', prompt: 'sharp high-top fade, dark black color', img: '/styles/high top fade.jpeg' },
                { name: 'Natural Curls', prompt: 'soft texture natural curls, dark espresso', img: '/styles/natural curls.jpeg' },
            ],
        },
        female: {
            fair: [ { name: 'Long Bob', prompt: 'Shoulder length layered bob, light blonde highlights.', img: '/styles/placeholder_bob.jpeg' }],
            deep: [ { name: 'Afro Puff', prompt: 'Voluminous afro puff hairstyle, natural black color, defined curls.', img: '/styles/placeholder_afro.jpeg' }],
        }
    };


    // --- Helper Functions ---
    function toggleFilterContent(contentElement) {
        if (activeFilterContent === contentElement) {
            filterWrapper.style.display = 'none';
            contentElement.classList.add('hidden');
            activeFilterContent = null;
        } else {
            document.querySelectorAll('.selector-content').forEach(c => c.classList.add('hidden'));
            filterWrapper.style.display = 'block';
            contentElement.classList.remove('hidden');
            activeFilterContent = contentElement;
        }
        inspirationToggle.classList.add('collapsed');
        inspirationToggle.classList.remove('expanded');
        galleryContainer.style.display = 'none';
    }
    
    function updatePillState() {
        if (selectedGender) {
            genderPill.classList.add('selected');
            genderPill.textContent = selectedGender === 'male' ? 'M' : 'F';
        } else {
            genderPill.classList.remove('selected');
            genderPill.textContent = 'M/F';
        }

        if (selectedComplexion) {
            complexionPill.classList.add('selected');
        } else {
            complexionPill.classList.remove('selected');
        }
    }

    function startCamera() {
        if (cameraStarted) return;
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            statusMessage.textContent = "Attempting to access camera...";
            captureBtn.disabled = true;

            navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }) 
                .then(stream => {
                    videoFeed.srcObject = stream;
                    centralViewport.classList.add('active'); 
                    videoFeed.style.display = 'block'; 
                    aiResultImg.style.display = 'none'; 
                    return videoFeed.play(); 
                })
                .then(() => {
                    cameraStarted = true;
                    captureBtn.textContent = "📸"; 
                    captureBtn.disabled = false;
                    statusMessage.textContent = "Camera ready. Select your style and capture!";
                })
                .catch(err => {
                    console.error("Camera access error:", err);
                    captureBtn.disabled = false; 
                    captureBtn.textContent = "❌";
                    statusMessage.textContent = "Error: Cannot access camera. Check browser permissions.";
                    centralViewport.classList.remove('active'); 
                });
        }
    }

    function renderComplexionSelector() {
        complexionGroup.innerHTML = ''; 
        complexionData.forEach(c => {
            const tile = document.createElement('div');
            tile.classList.add('complexion-tile');
            tile.setAttribute('data-complexion', c.id);
            tile.style.backgroundColor = c.color;
            complexionGroup.appendChild(tile);
            tile.addEventListener('click', (e) => {
                complexionGroup.querySelectorAll('.complexion-tile').forEach(t => t.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                selectedComplexion = e.currentTarget.getAttribute('data-complexion');
                updatePillState();
                renderFinalGallery();
                toggleFilterContent(complexionContent);
                inspirationToggle.click(); 
            });
        });
    }

    function renderFinalGallery() {
        const galleryOptionsGroup = galleryContainer.querySelector('.filter-options-group');
        galleryOptionsGroup.innerHTML = ''; 
        if (!selectedGender || !selectedComplexion) { galleryOptionsGroup.innerHTML = '<p style="text-align: center; width: 100%; color: #666;">Complete the steps above to see styles.</p>'; return; }
        
        const filteredStyles = promptDatabase[selectedGender] && promptDatabase[selectedGender][selectedComplexion] 
                             ? promptDatabase[selectedGender][selectedComplexion]
                             : [];
        
        if (filteredStyles.length === 0) { galleryOptionsGroup.innerHTML = '<p style="text-align: center; width: 100%; color: #666;">No styles found for this combination.</p>'; return; }

        filteredStyles.forEach(style => {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('style-option');
            optionDiv.setAttribute('data-prompt', style.prompt);
            optionDiv.setAttribute('data-name', style.name);

            const img = document.createElement('img');
            img.src = style.img; 
            img.alt = style.name;
            img.classList.add('style-thumbnail');

            optionDiv.appendChild(img);
            galleryOptionsGroup.appendChild(optionDiv);
            optionDiv.addEventListener('click', handleStyleSelection);
        });
        
        const genderText = selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1);
        const complexionText = selectedComplexion.charAt(0).toUpperCase() + selectedComplexion.slice(1);
        document.getElementById('inspiration-toggle-header').querySelector('span').textContent = `Inspiration (${genderText} - ${complexionText})`;
    }

    function handleStyleSelection(e) {
        document.querySelectorAll('.style-option').forEach(opt => opt.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        selectedPrompt = e.currentTarget.getAttribute('data-prompt');
        inspirationToggle.classList.remove('expanded');
        inspirationToggle.classList.add('collapsed');
        galleryContainer.style.display = 'none';

        captureBtn.classList.remove('hidden-btn');
        captureBtn.textContent = cameraStarted ? '📸' : '▶️';
        generateBtn.classList.add('hidden-btn');
        
        statusMessage.textContent = `Style selected: ${e.currentTarget.getAttribute('data-name')}. Tap the camera button to capture your selfie.`;
    }

    // --- INITIAL STATE SETUP AND EVENT LISTENERS ---
    
    captureBtn.textContent = "▶️"; 
    generateBtn.classList.add('hidden-btn'); 
    statusMessage.textContent = "Select your Gender (M/F) and Complexion (🎨) to begin.";
    filterWrapper.style.display = 'none';
    inspirationToggle.classList.add('collapsed');
    inspirationToggle.classList.remove('expanded');
    galleryContainer.style.display = 'none'; 
    
    renderComplexionSelector(); 
    renderFinalGallery(); 
    
    genderPill.addEventListener('click', () => { toggleFilterContent(genderContent); statusMessage.textContent = "Select a style gender (Male or Female) below."; });
    complexionPill.addEventListener('click', () => {
        if (!selectedGender) { statusMessage.textContent = "Please select a Gender first!"; genderPill.click(); return; }
        toggleFilterContent(complexionContent);
        statusMessage.textContent = "Select your desired complexion below.";
    });
    genderContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('gender-option')) {
            genderContent.querySelectorAll('.gender-option').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedGender = e.target.getAttribute('data-gender');
            selectedComplexion = null; 
            selectedPrompt = null; 
            updatePillState();
            toggleFilterContent(genderContent); 
            complexionPill.click(); 
            statusMessage.textContent = "Gender set. Now select your Complexion (🎨)";
        }
    });
    inspirationToggle.addEventListener('click', () => {
        if (!selectedGender || !selectedComplexion) { statusMessage.textContent = "Please select Gender (M/F) and Complexion (🎨) first!"; return; }
        const isExpanded = inspirationToggle.classList.contains('expanded');
        inspirationToggle.classList.toggle('expanded', !isExpanded);
        inspirationToggle.classList.toggle('collapsed', isExpanded);
        filterWrapper.style.display = 'none'; 
        activeFilterContent = null;
        galleryContainer.style.display = isExpanded ? 'none' : 'block';
        if (!isExpanded) { statusMessage.textContent = "Select an inspiration style from the gallery below."; }
    });

    // --- 4. BUTTON LISTENERS (THE CORE FUNCTIONALITY) ---

    // 1. CAPTURE / START CAMERA / RESTART
    captureBtn.addEventListener('click', () => {
        if (!selectedPrompt) { statusMessage.textContent = "Please select a style from the Inspiration gallery first!"; inspirationToggle.click(); return; }

        if (!cameraStarted) {
            startCamera(); 
            return; 
        }
        
        // State: Live Camera -> Capture Selfie (📸 button)
        if (videoFeed.style.display === 'block' && captureBtn.textContent === '📸') {
            
            // Capture Logic
            canvas.width = videoFeed.videoWidth;
            canvas.height = videoFeed.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            capturedImageBase64 = dataUrl.split(',')[1]; 
            
            // State Transition: Captured Image
            videoFeed.style.display = 'none'; 
            aiResultImg.src = dataUrl; 
            aiResultImg.style.display = 'block'; 
            
            captureBtn.textContent = '🔄'; 
            generateBtn.classList.remove('hidden-btn'); 
            
            statusMessage.textContent = "Selfie captured! Tap the sparkle button (✨) to 'Try On'.";
            
        } 
        
        // State: AI Result -> Restart Camera (🔄 button)
        else if (captureBtn.textContent === '🔄') {
            capturedImageBase64 = null;
            videoFeed.style.display = 'block';
            aiResultImg.src = ''; 
            aiResultImg.style.display = 'none';
            
            captureBtn.textContent = '📸'; 
            generateBtn.classList.add('hidden-btn'); 
            
            statusMessage.textContent = "Camera ready for a new look! Select a style and capture!";
        }
    });
    
    // 2. GENERATE / TRY ON
    generateBtn.addEventListener('click', () => {
        if (generateBtn.classList.contains('hidden-btn')) return;

        // State: Captured Image -> AI Processing (✨ button)
        statusMessage.textContent = `Applying your selected style... This may take a moment.`;
        captureBtn.disabled = true;
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳'; 
        
        loadingOverlay.classList.remove('hidden-btn');
        
        // ** Simulating the AI call **
        setTimeout(() => {
            
            // --- SUCCESS BLOCK (Simple Image Swap) ---
            const styleImgElement = document.querySelector('.style-option.selected .style-thumbnail');
            if (styleImgElement) {
                // *** REVERTED LOGIC ***: Use the exact source of the thumbnail.
                // This confirms the state transition works, even if the image is wrong.
                aiResultImg.src = styleImgElement.src; 
            }
            
            loadingOverlay.classList.add('hidden-btn');

            // State Transition: AI Result Ready
            generateBtn.textContent = '✨'; 
            generateBtn.classList.add('hidden-btn'); 
            captureBtn.disabled = false;
            captureBtn.textContent = "🔄"; 
            
            statusMessage.textContent = `Done! Your new look is ready. Tap the restart button (🔄) to take a new selfie.`;
            
        }, 3000);
    });
});
