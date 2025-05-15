// ConfessionSays - Complete JavaScript

let confessions = [];
let tabletopInstance = null;
let currentlyExpandedCard = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme toggle
    initThemeToggle();
    
    // Initialize Google Sheets integration
    initGoogleSheets();
    
    // Initialize page-specific functionality
    if (document.getElementById('confession-container')) {
        // Feed page initialization
        initFeedPage();
    } else if (document.getElementById('featured-container')) {
        // Home page initialization
        initHomePage();
    }
    
    // Initialize city counters if they exist
    if (document.querySelector('.city-counters')) {
        initCityCounters();
    }
    
    // Initialize scroll event for inspiration banner
    initScrollEffects();
    
    // Initialize share modal
    initShareModal();
});

// Initialize Google Sheets integration
function initGoogleSheets() {
    const publicSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSJ_YlpuuPI8k9dk1l64KzKtenqdC2HqYW0zoaXMPFhKdt4d-dB-NY48cjKlhuk_HMRe0uWb8vEJeL9/pubhtml';
    
    tabletopInstance = Tabletop.init({
        key: publicSpreadsheetUrl,
        callback: function(data, tabletop) {
            // Process data from Google Sheets
            const approvedConfessions = tabletop.sheets('Approved').elements;
            updateConfessionsFromSheet(approvedConfessions);
        },
        simpleSheet: false,
        refreshInterval: 30000 // Refresh every 30 seconds
    });
}

// Update confessions from Google Sheets data
function updateConfessionsFromSheet(sheetData) {
    // Clear existing confessions
    const newConfessions = [];
    
    // Convert sheet data to our format
    sheetData.forEach((row, index) => {
        newConfessions.push({
            id: index + 1,
            postNumber: `CP${(index + 1).toString().padStart(4, '0')}`,
            content: row.Confession || '',
            likes: parseInt(row.Likes) || 0,
            timestamp: new Date(row.Timestamp || Date.now()).getTime(),
            location: row.Location || 'Unknown',
            age: row.Age || '',
            gender: row.Gender || 'Prefer not to say',
            userLiked: localStorage.getItem(`liked_${index + 1}`) === 'true'
        });
    });
    
    // Update the confessions array
    confessions = newConfessions;
    
    // Update the UI
    if (document.getElementById('confession-container')) {
        const activeView = document.querySelector('.btn-toggle.active')?.getAttribute('data-view');
        loadConfessions(activeView || 'trending');
    }
    
    if (document.getElementById('featured-container')) {
        loadFeaturedConfessions();
    }
}

// Theme Toggle Functionality
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    if (currentTheme === 'dark') {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (newTheme === 'dark') {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
}

// Home Page Initialization
function initHomePage() {
    // Confession Modal
    const confessionBtn = document.getElementById('confess-btn');
    const modal = document.getElementById('confession-modal');
    const closeBtn = document.querySelector('.close-btn');
    
    if (confessionBtn && modal) {
        confessionBtn.addEventListener('click', function() {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
        
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
        
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Form submission
    const confessionForm = document.getElementById('confession-form');
    if (confessionForm) {
        confessionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const content = document.getElementById('confession-content').value;
            const age = document.getElementById('age').value;
            const gender = document.getElementById('gender').value;
            const location = document.getElementById('location').value;
            
            // Validate required fields
            if (!content || !age) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Create new confession
            const newConfession = {
                id: confessions.length > 0 ? Math.max(...confessions.map(c => c.id)) + 1 : 1,
                postNumber: getNextPostNumber(),
                content: content,
                likes: 0,
                timestamp: Date.now(),
                location: location || 'Unknown',
                age: age,
                gender: gender || 'Prefer not to say',
                userLiked: false
            };
            
            // Add to beginning of confessions array
            confessions.unshift(newConfession);
            
            // Submit to Google Form
            submitToGoogleForm(content, age, gender, location);
            
            // Show success message
            alert('Thank you for your confession. It has been submitted anonymously.');
            
            // Reset form and close modal
            this.reset();
            if (modal) modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // If on feed page, reload confessions
            if (document.getElementById('confession-container')) {
                loadConfessions('newest');
            }
            
            // If on home page, reload featured confessions
            if (document.getElementById('featured-container')) {
                loadFeaturedConfessions();
            }
        });
    }
    
    // Load featured confessions
    loadFeaturedConfessions();
}

// Submit to Google Form
function submitToGoogleForm(content, age, gender, location) {
    const formData = new FormData();
    formData.append('entry.73006654', content); // Your Confession
    formData.append('entry.1153871815', age); // Age
    formData.append('entry.644513634', gender || 'Prefer not to say'); // Gender
    formData.append('entry.1040719456', location || ''); // Location
    formData.append('entry.1230027267', 'Agree'); // Terms Agreement
    
    fetch('https://docs.google.com/forms/u/0/d/e/1FAIpQLSd7GlD_cDhpGKS3bWmzZms0vYiD020nxzR0-gZ-LHxnr_YOzA/formResponse', {
        method: 'POST',
        mode: 'no-cors',
        body: formData
    }).catch(err => console.log('Form submission error:', err));
}

// Feed Page Initialization
function initFeedPage() {
    // Load confessions for feed page
    loadConfessions('trending');
    
    // View Toggle
    const viewToggles = document.querySelectorAll('.btn-toggle');
    
    viewToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            viewToggles.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const view = this.getAttribute('data-view');
            loadConfessions(view);
        });
    });
    
    // Initialize confession detail modal
    initConfessionDetailModal();
    
    // Load more button
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            const activeView = document.querySelector('.btn-toggle.active')?.getAttribute('data-view');
            loadMoreConfessions(activeView);
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // Show loading indicator
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            // Force refresh from Google Sheets
            if (tabletopInstance) {
                tabletopInstance.refreshData();
            }
            
            // Reset button after 1 second
            setTimeout(() => {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }, 1000);
        });
    }
}

// Initialize share modal
function initShareModal() {
    const shareModal = document.getElementById('share-modal');
    const shareClose = document.querySelector('.share-close');
    
    if (!shareModal) return;
    
    // Close modal
    shareClose.addEventListener('click', function() {
        shareModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    // Close when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === shareModal) {
            shareModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Handle share buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.share-btn')) {
            e.preventDefault();
            const card = e.target.closest('.confession-card');
            const confessionId = card.getAttribute('data-id');
            const currentUrl = window.location.href + '?confession=' + confessionId;
            
            shareModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Set up share buttons
            document.querySelectorAll('.share-option').forEach(option => {
                option.onclick = function() {
                    const platform = this.getAttribute('data-platform');
                    let shareUrl = '';
                    const shareText = "Check out this confession on ConfessionSays";
                    
                    if (platform === 'copy-link') {
                        navigator.clipboard.writeText(currentUrl)
                            .then(() => alert('Link copied to clipboard!'))
                            .catch(() => alert('Failed to copy link'));
                        return;
                    }
                    
                    switch(platform) {
                        case 'facebook':
                            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
                            break;
                        case 'twitter':
                            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
                            break;
                        case 'instagram':
                            shareUrl = `https://www.instagram.com/?url=${encodeURIComponent(currentUrl)}`;
                            break;
                    }
                    
                    if (shareUrl) {
                        window.open(shareUrl, '_blank');
                    }
                };
            });
        }
    });
}

// Fixed Confession Popup Bug and Improved Layout
function initConfessionDetailModal() {
    const detailModal = document.getElementById('confession-detail-modal');
    if (!detailModal) return;
    
    const detailClose = document.querySelector('.detail-close');
    
    // Function to open modal with confession data
    function openConfessionModal(confession) {
        // Check if all required elements exist before setting content
        const detailAgeGender = document.getElementById('detail-age-gender');
        const detailLocation = document.getElementById('detail-location');
        const fullContent = document.getElementById('confession-full-content');
        const likeCount = document.getElementById('detail-like-count');
        const postNumber = document.getElementById('detail-post-number');
        const likeBtn = document.getElementById('detail-like-btn');
        
        if (!detailAgeGender || !detailLocation || !fullContent || !likeCount || !postNumber || !likeBtn) {
            console.error('One or more required elements for the confession modal are missing');
            return;
        }

        // Populate modal
        detailAgeGender.textContent = `${confession.age} ${confession.gender.charAt(0)}`;
        detailLocation.textContent = confession.location;
        fullContent.textContent = confession.content;
        likeCount.textContent = confession.likes;
        postNumber.textContent = confession.postNumber;
        
        // Set like button state
        likeBtn.setAttribute('data-id', confession.id);
        likeBtn.classList.toggle('liked', confession.userLiked);
        likeBtn.innerHTML = confession.userLiked 
            ? `<i class="fas fa-heart"></i><span class="like-count">${confession.likes}</span>`
            : `<i class="far fa-heart"></i><span class="like-count">${confession.likes}</span>`;
        
        // Show modal
        detailModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    // Close detail modal
    function closeConfessionModal() {
        detailModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Open modal when confession card is clicked
    document.addEventListener('click', function(e) {
        const card = e.target.closest('.confession-card');
        if (card) {
            // Don't open if clicking on interactive elements
            if (e.target.closest('.like-btn, .share-btn')) {
                return;
            }
            
            // Get confession data
            const confessionId = parseInt(card.getAttribute('data-id'));
            const confession = confessions.find(c => c.id === confessionId);
            
            if (confession) {
                openConfessionModal(confession);
            }
        }
    });
    
    // Handle read more clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('read-more')) {
            e.stopPropagation();
            const card = e.target.closest('.confession-card');
            const confessionId = parseInt(card.getAttribute('data-id'));
            const confession = confessions.find(c => c.id === confessionId);
            
            if (confession) {
                openConfessionModal(confession);
            }
        }
    });
    
    // Close modal when X is clicked
    if (detailClose) {
        detailClose.addEventListener('click', closeConfessionModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === detailModal) {
            closeConfessionModal();
        }
    });
    
    // Handle like button in detail modal
    const detailLikeBtn = document.getElementById('detail-like-btn');
    if (detailLikeBtn) {
        detailLikeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.getAttribute('data-id'));
            const confession = confessions.find(c => c.id === id);
            
            if (confession) {
                // Toggle like status
                confession.userLiked = !confession.userLiked;
                confession.likes += confession.userLiked ? 1 : -1;
                
                // Save like status in localStorage
                localStorage.setItem(`liked_${id}`, confession.userLiked);
                
                // Update UI
                this.classList.toggle('liked', confession.userLiked);
                this.innerHTML = confession.userLiked 
                    ? `<i class="fas fa-heart"></i><span class="like-count">${confession.likes}</span>`
                    : `<i class="far fa-heart"></i><span class="like-count">${confession.likes}</span>`;
                
                // Update the like count in the detail modal
                const likeCountElement = document.getElementById('detail-like-count');
                if (likeCountElement) {
                    likeCountElement.textContent = confession.likes;
                }
                
                // Update like count in the confession card if visible
                const cardLikeCount = document.querySelector(`.confession-card[data-id="${id}"] .like-count`);
                if (cardLikeCount) {
                    cardLikeCount.textContent = confession.likes;
                }
                
                // Update like button in the confession card if visible
                const cardLikeBtn = document.querySelector(`.confession-card[data-id="${id}"] .like-btn`);
                if (cardLikeBtn) {
                    cardLikeBtn.classList.toggle('liked', confession.userLiked);
                    cardLikeBtn.innerHTML = confession.userLiked 
                        ? `<i class="fas fa-heart"></i><span class="like-count">${confession.likes}</span>`
                        : `<i class="far fa-heart"></i><span class="like-count">${confession.likes}</span>`;
                }
                
                // Re-sort if in trending view
                const activeView = document.querySelector('.btn-toggle.active')?.getAttribute('data-view');
                if (activeView === 'trending') {
                    loadConfessions('trending');
                }
            }
        });
    }
}

// City Counters Initialization
function initCityCounters() {
    const cityCounters = [
        { name: "Kathmandu", count: 1243 },
        { name: "Pokhara", count: 876 },
        { name: "Biratnagar", count: 543 },
        { name: "Chitwan", count: 432 },
        { name: "Butwal", count: 387 },
        { name: "Lalitpur", count: 110 }
    ];
    
    const container = document.querySelector('.city-counters');
    if (!container) return;
    
    container.innerHTML = '';
    
    cityCounters.forEach(city => {
        const counter = document.createElement('div');
        counter.className = 'city-counter';
        counter.innerHTML = `
            <div class="counter">0</div>
            <p>${city.name}</p>
        `;
        container.appendChild(counter);
    });
    
    // Initialize intersection observer for counter animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(document.querySelector('.stats'));
}

// Animate City Counters
function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    const speed = 100;
    
    counters.forEach(counter => {
        const target = parseInt(counter.parentElement.querySelector('p').textContent === "Kathmandu" ? 1243 :
                        counter.parentElement.querySelector('p').textContent === "Pokhara" ? 876 :
                        counter.parentElement.querySelector('p').textContent === "Biratnagar" ? 543 :
                        counter.parentElement.querySelector('p').textContent === "Chitwan" ? 432 :
                        counter.parentElement.querySelector('p').textContent === "Butwal" ? 387 : 110);
        
        const increment = target / speed;
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.ceil(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    });
}

// Scroll Effects Initialization
function initScrollEffects() {
    const banner = document.getElementById('inspiration-banner');
    if (!banner) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                banner.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    observer.observe(banner);
}

// Load Featured Confessions (for home page)
function loadFeaturedConfessions() {
    const container = document.getElementById('featured-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Get top 3 trending confessions
    const featuredConfessions = [...confessions]
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 3);
    
    // Render featured confessions
    featuredConfessions.forEach(confession => {
        const card = document.createElement('div');
        card.className = 'confession-card';
        card.setAttribute('data-id', confession.id);
        card.innerHTML = `
            <div class="confession-header">
                <div class="user-avatar">
                    <div class="avatar-circle">A</div>
                    <span>Anonymous</span>
                </div>
                <div class="confession-meta">
                    <div>${confession.age} ${confession.gender.charAt(0)}</div>
                    <div>${confession.location}</div>
                </div>
            </div>
            <div class="confession-content">
                ${confession.content}
            </div>
            <div class="confession-footer">
                <button class="like-btn ${confession.userLiked ? 'liked' : ''}" data-id="${confession.id}">
                    <i class="${confession.userLiked ? 'fas' : 'far'} fa-heart"></i>
                    <span class="like-count">${confession.likes}</span>
                </button>
                <span class="confession-number">${confession.postNumber}</span>
                <button class="share-btn">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Initialize like button functionality
    initLikeButtons();
    
    // Initialize confession detail modal for featured confessions
    initConfessionDetailModal();
}

// Initialize like buttons functionality
function initLikeButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.like-btn')) {
            const likeBtn = e.target.closest('.like-btn');
            const id = parseInt(likeBtn.getAttribute('data-id'));
            const confession = confessions.find(c => c.id === id);
            
            if (confession) {
                // Toggle like status
                confession.userLiked = !confession.userLiked;
                confession.likes += confession.userLiked ? 1 : -1;
                
                // Save like status in localStorage
                localStorage.setItem(`liked_${id}`, confession.userLiked);
                
                // Update UI
                likeBtn.classList.toggle('liked', confession.userLiked);
                likeBtn.innerHTML = confession.userLiked 
                    ? `<i class="fas fa-heart"></i><span class="like-count">${confession.likes}</span>`
                    : `<i class="far fa-heart"></i><span class="like-count">${confession.likes}</span>`;
                
                // Update like button in detail modal if open
                const detailLikeBtn = document.getElementById('detail-like-btn');
                if (detailLikeBtn && parseInt(detailLikeBtn.getAttribute('data-id')) === id) {
                    detailLikeBtn.classList.toggle('liked', confession.userLiked);
                    detailLikeBtn.innerHTML = confession.userLiked 
                        ? `<i class="fas fa-heart"></i><span class="like-count">${confession.likes}</span>`
                        : `<i class="far fa-heart"></i><span class="like-count">${confession.likes}</span>`;
                }
                
                // Re-sort if in trending view
                const activeView = document.querySelector('.btn-toggle.active')?.getAttribute('data-view');
                if (activeView === 'trending') {
                    loadConfessions('trending');
                }
            }
        }
    });
}

// Load Confessions (for feed page)
function loadConfessions(view = 'trending', limit = null) {
    const container = document.getElementById('confession-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    let filteredConfessions = [...confessions];
    
    // Sort by view
    if (view === 'trending') {
        filteredConfessions.sort((a, b) => b.likes - a.likes);
        filteredConfessions = filteredConfessions.slice(0, limit || 6);
    } else {
        // Newest first
        filteredConfessions.sort((a, b) => b.timestamp - a.timestamp);
        filteredConfessions = filteredConfessions.slice(0, limit || 9);
    }
    
    // Render confessions
    filteredConfessions.forEach(confession => {
        const card = document.createElement('div');
        card.className = 'confession-card';
        card.setAttribute('data-id', confession.id);
        card.innerHTML = `
            <div class="confession-header">
                <div class="user-avatar">
                    <div class="avatar-circle">A</div>
                    <span>Anonymous</span>
                </div>
                <div class="confession-meta">
                    <div>${confession.age} ${confession.gender.charAt(0)}</div>
                    <div>${confession.location}</div>
                </div>
            </div>
            <div class="confession-content">
                ${confession.content}
            </div>
            <div class="confession-footer">
                <button class="like-btn ${confession.userLiked ? 'liked' : ''}" data-id="${confession.id}">
                    <i class="${confession.userLiked ? 'fas' : 'far'} fa-heart"></i>
                    <span class="like-count">${confession.likes}</span>
                </button>
                <span class="confession-number">${confession.postNumber}</span>
                <button class="share-btn">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
        
        // Add click event for expanding/collapsing
        card.addEventListener('click', function(e) {
            // Don't toggle if clicking on interactive elements
            if (e.target.closest('.like-btn, .share-btn')) {
                return;
            }
            
            // Collapse currently expanded card if any
            if (currentlyExpandedCard && currentlyExpandedCard !== this) {
                currentlyExpandedCard.classList.remove('expanded');
            }
            
            // Toggle current card
            this.classList.toggle('expanded');
            currentlyExpandedCard = this.classList.contains('expanded') ? this : null;
        });
    });
    
    // Initialize like button functionality
    initLikeButtons();
    
    // Show/hide load more button
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        if (view === 'trending') {
            loadMoreBtn.style.display = 'none';
        } else {
            const currentCount = document.querySelectorAll('.confession-card').length;
            loadMoreBtn.style.display = currentCount < confessions.length ? 'block' : 'none';
        }
    }
}

// Load More Confessions
function loadMoreConfessions(view = 'newest') {
    const container = document.getElementById('confession-container');
    if (!container) return;
    
    let filteredConfessions = [...confessions];
    filteredConfessions.sort((a, b) => b.timestamp - a.timestamp);
    
    const currentCount = document.querySelectorAll('.confession-card').length;
    const nextConfessions = filteredConfessions.slice(currentCount, currentCount + 9);
    
    // Render additional confessions
    nextConfessions.forEach(confession => {
        const card = document.createElement('div');
        card.className = 'confession-card';
        card.setAttribute('data-id', confession.id);
        card.innerHTML = `
            <div class="confession-header">
                <div class="user-avatar">
                    <div class="avatar-circle">A</div>
                    <span>Anonymous</span>
                </div>
                <div class="confession-meta">
                    <div>${confession.age} ${confession.gender.charAt(0)}</div>
                    <div>${confession.location}</div>
                </div>
            </div>
            <div class="confession-content">
                ${confession.content}
            </div>
            <div class="confession-footer">
                <button class="like-btn ${confession.userLiked ? 'liked' : ''}" data-id="${confession.id}">
                    <i class="${confession.userLiked ? 'fas' : 'far'} fa-heart"></i>
                    <span class="like-count">${confession.likes}</span>
                </button>
                <span class="confession-number">${confession.postNumber}</span>
                <button class="share-btn">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
        
        // Add click event for expanding/collapsing
        card.addEventListener('click', function(e) {
            // Don't toggle if clicking on interactive elements
            if (e.target.closest('.like-btn, .share-btn')) {
                return;
            }
            
            // Collapse currently expanded card if any
            if (currentlyExpandedCard && currentlyExpandedCard !== this) {
                currentlyExpandedCard.classList.remove('expanded');
            }
            
            // Toggle current card
            this.classList.toggle('expanded');
            currentlyExpandedCard = this.classList.contains('expanded') ? this : null;
        });
    });
    
    // Initialize like button functionality for new cards
    initLikeButtons();
    
    // Show/hide load more button
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        const newCount = document.querySelectorAll('.confession-card').length;
        loadMoreBtn.style.display = newCount < confessions.length ? 'block' : 'none';
    }
}

// Generate next confession post number
function getNextPostNumber() {
    if (confessions.length === 0) return "CP0001";
    
    const lastNumber = parseInt(confessions[0].postNumber.replace('CP', ''));
    return `CP${(lastNumber + 1).toString().padStart(4, '0')}`;
}

// Sample Data (will be replaced by Google Sheets data)
let sampleConfessions = [
    {
        id: 1,
        postNumber: "CP0001",
        content: "22M Kathmandu: I pretend to have allergies to avoid foods I dislike at family gatherings. My mom thinks I'm allergic to tomatoes, eggs, and mushrooms now. I just really don't like the texture but don't want to seem picky.",
        likes: 45,
        timestamp: Date.now() - 3600000 * 5,
        location: "Kathmandu",
        age: "22",
        gender: "Male",
        userLiked: false
    },
    {
        id: 2,
        postNumber: "CP0002",
        content: "19F Pokhara: I have a secret Instagram account where I post poetry. No one in my family knows because they think writing is a waste of time. I've gained 2k followers and recently got approached by a small publisher, but I'm too scared to tell anyone.",
        likes: 89,
        timestamp: Date.now() - 3600000 * 12,
        location: "Pokhara",
        age: "19",
        gender: "Female",
        userLiked: false
    },
    {
        id: 3,
        postNumber: "CP0003",
        content: "25M Biratnagar: I dropped out of engineering college after first year but still pretend to go to classes. I work at a cafe and take online courses in design. My parents would be devastated if they found out.",
        likes: 127,
        timestamp: Date.now() - 3600000 * 24,
        location: "Biratnagar",
        age: "25",
        gender: "Male",
        userLiked: false
    },
    {
        id: 4,
        postNumber: "CP0004",
        content: "17F Chitwan: I'm in love with my best friend who's a girl. We've been secretly dating for 8 months. My parents are very conservative and would never accept this. Sometimes I feel so trapped and alone.",
        likes: 203,
        timestamp: Date.now() - 3600000 * 36,
        location: "Chitwan",
        age: "17",
        gender: "Female",
        userLiked: false
    },
    {
        id: 5,
        postNumber: "CP0005",
        content: "28M Butwal: I've been pretending to be happy in my arranged marriage. We have nothing in common and I feel like I'm living with a roommate. But divorce would bring shame to both families so I just keep smiling.",
        likes: 156,
        timestamp: Date.now() - 3600000 * 48,
        location: "Butwal",
        age: "28",
        gender: "Male",
        userLiked: false
    },
    {
        id: 6,
        postNumber: "CP0006",
        content: "21F Lalitpur: I secretly send money to my boyfriend's family because his dad lost his job. My parents would kill me if they knew I was dating, let alone supporting his family. But I love him and want to help.",
        likes: 72,
        timestamp: Date.now() - 3600000 * 8,
        location: "Lalitpur",
        age: "21",
        gender: "Female",
        userLiked: false
    },
    {
        id: 7,
        postNumber: "CP0007",
        content: "20M Kathmandu: I failed three subjects last semester but photoshopped my grade sheet to show my parents. Now I'm terrified they'll find out when I can't graduate on time.",
        likes: 98,
        timestamp: Date.now() - 3600000 * 72,
        location: "Kathmandu",
        age: "20",
        gender: "Male",
        userLiked: false
    },
    {
        id: 8,
        postNumber: "CP0008",
        content: "23F Pokhara: I'm dating two guys at the same time and neither knows about the other. I feel terrible but I can't choose between them.",
        likes: 65,
        timestamp: Date.now() - 3600000 * 60,
        location: "Pokhara",
        age: "23",
        gender: "Female",
        userLiked: false
    },
    {
        id: 9,
        postNumber: "CP0009",
        content: "19M Biratnagar: I pretend to go to temple every morning but actually go to a cyber cafe to play games. My parents think I'm very religious.",
        likes: 112,
        timestamp: Date.now() - 3600000 * 84,
        location: "Biratnagar",
        age: "19",
        gender: "Male",
        userLiked: false
    },
    {
        id: 10,
        postNumber: "CP0010",
        content: "24F Chitwan: I secretly smoke cigarettes but my family thinks I hate smoking. I have to chew gum and use perfume to hide the smell.",
        likes: 87,
        timestamp: Date.now() - 3600000 * 96,
        location: "Chitwan",
        age: "24",
        gender: "Female",
        userLiked: false
    },
    {
        id: 11,
        postNumber: "CP0011",
        content: "26M Butwal: I lost my job 3 months ago but still dress up and leave home every day like I'm going to work. I spend the day in parks and libraries applying for new jobs.",
        likes: 143,
        timestamp: Date.now() - 3600000 * 108,
        location: "Butwal",
        age: "26",
        gender: "Male",
        userLiked: false
    },
    {
        id: 12,
        postNumber: "CP0012",
        content: "18F Lalitpur: I have an OnlyFans account to pay for college. My conservative family would disown me if they found out.",
        likes: 201,
        timestamp: Date.now() - 3600000 * 120,
        location: "Lalitpur",
        age: "18",
        gender: "Female",
        userLiked: false
    },
    {
        id: 13,
        postNumber: "CP0013",
        content: "20F Lalitpur: Testing",
        likes: 21,
        timestamp: Date.now() - 3600000 * 120,
        location: "Lalitpur",
        age: "18",
        gender: "Female",
        userLiked: false
    }
];

// Initialize with sample data if no Google Sheets data is available
if (confessions.length === 0) {
    confessions = sampleConfessions;
}