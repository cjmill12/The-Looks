document.addEventListener('DOMContentLoaded', () => {
    // [ ... All the same variable declarations and helper functions ... ]
    
    // --- Complexion Data and Prompt Database (MUST USE HYPHENS IN IMG PATHS NOW) ---
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
                // 🚨 NOTE: IMG PATHS HERE MUST BE RENAMED WITH HYPHENS:
                { name: 'Fringe', prompt: 'medium forward fringe, light golden brown', img: 'styles/forward-fringe.jpeg' },
                { name: 'Spiked', prompt: 'spiked texture, short cut, light brown', img: 'styles/spiked-charm.jpeg' },
            ],
            medium: [
                { name: 'Wavy Quiff', prompt: 'high volume wavy quiff, medium brown', img: 'styles/wavy-quiff.jpeg' },
                { name: 'Side Part', prompt: 'classic side-part, medium brown', img: 'styles/sleek-side-part.jpeg' },
            ],
            deep: [
                { name: 'High Fade', prompt: 'sharp high-top fade, dark black color', img: 'styles/high-top-fade.jpeg' },
                { name: 'Natural Curls', prompt: 'soft texture natural curls, dark espresso', img: 'styles/natural-curls.jpeg' },
            ],
        },
        female: {
            fair: [ { name: 'Long Bob', prompt: 'Shoulder length layered bob, light blonde highlights.', img: 'styles/placeholder-bob.jpeg' }],
            deep: [ { name: 'Afro Puff', prompt: 'Voluminous afro puff hairstyle, natural black color, defined curls.', img: 'styles/placeholder-afro.jpeg' }],
        }
    };

    // [ ... All other helper functions remain the same ... ]


    // --- 4. BUTTON LISTENERS (THE CORE FUNCTIONALITY) ---

    // [ ... Capture Button Listener remains the same ... ]
    
    // 2. GENERATE / TRY ON
    generateBtn.addEventListener('click', () => {
        if (generateBtn.classList.contains('hidden-btn')) return;

        statusMessage.textContent = `Applying your selected style... This may take a moment.`;
        captureBtn.disabled = true;
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳'; 
        
        loadingOverlay.classList.remove('hidden-btn');
        
        // ** Simulating the AI call **
        setTimeout(() => {
            
            // --- SUCCESS BLOCK (Image Swap: FINAL FIX FOR PATHING) ---
            const styleImgElement = document.querySelector('.style-option.selected .style-thumbnail');
            if (styleImgElement) {
                // Get the current source path (e.g., styles/sleek-side-part.jpeg)
                let originalSrc = styleImgElement.src;

                // 🚨 CRITICAL FINAL FIX: Replace 'styles/' with 'styles/result_'
                // This assumes your thumbnail paths are now hypenated.
                const newSrc = originalSrc.replace('styles/', 'styles/result_');
                
                // Force the final result image source swap here.
                aiResultImg.src = newSrc; 
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

    // [ ... The rest of the event listeners and initial setup remain the same ... ]
});
