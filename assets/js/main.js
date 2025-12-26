// Global variables
let videosData = [];
let videoViews = {};

// Initialize views from localStorage
function initViews() {
    const storedViews = localStorage.getItem('videoViews');
    if (storedViews) {
        videoViews = JSON.parse(storedViews);
    }
}

// Save views to localStorage
function saveViews() {
    localStorage.setItem('videoViews', JSON.stringify(videoViews));
}

// Increment view count
function incrementViews(videoId) {
    if (!videoViews[videoId]) {
        videoViews[videoId] = 0;
    }
    videoViews[videoId]++;
    saveViews();
    return videoViews[videoId];
}

// Get view count for a video
function getViews(videoId) {
    const storedViews = videoViews[videoId] || 0;
    // Get original views from video data
    const video = videosData.find(v => v.id == videoId);
    const originalViews = video ? (video.views || 0) : 0;
    return originalViews + storedViews;
}

// Load videos from JSON
async function loadVideos() {
    try {
        const response = await fetch('videos.json');
        const data = await response.json();
        videosData = data.videos || [];
        renderVideos();
    } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
        videosData = [];
        renderVideos();
    }
}

// Convert category to filter format
function categoryToFilter(category) {
    return category.toLowerCase().replace(/\s+/g, '-');
}

// Render featured videos
function renderFeaturedVideos() {
    const featuredSection = document.getElementById('featured-section');
    const featuredGrid = document.getElementById('featured-grid');
    
    if (!featuredGrid) return;
    
    const featured = videosData.filter(v => v.featured).slice(0, 3);
    
    if (featured.length === 0) {
        if (featuredSection) {
            featuredSection.style.display = 'none';
        }
        return;
    }
    
    if (featuredSection) {
        featuredSection.style.display = 'block';
    }
    
    featuredGrid.innerHTML = featured.map(video => createVideoCard(video, true)).join('');
    
    // Re-attach event listeners
    attachVideoCardListeners();
}

// Render videos by category
function renderVideosByCategory() {
    const container = document.getElementById('videos-container');
    if (!container) return;
    
    const categories = ['Aftermovie Evento', 'Aftermovie DJ', 'Vídeo Drop'];
    container.innerHTML = '';
    
    categories.forEach(category => {
        const categoryVideos = videosData.filter(v => v.category === category);
        
        if (categoryVideos.length === 0) return;
        
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.innerHTML = `
            <h2 class="category-title">
                <span class="category-icon">▶</span>
                ${escapeHtml(category)}
            </h2>
            <div class="videos-grid">
                ${categoryVideos.map(video => createVideoCard(video, false)).join('')}
            </div>
        `;
        container.appendChild(categorySection);
    });
    
    // Re-attach event listeners
    attachVideoCardListeners();
}

// Create video card HTML
function createVideoCard(video, isFeatured) {
    const views = getViews(video.id);
    const categoryFilter = categoryToFilter(video.category);
    const featuredClass = isFeatured ? ' featured' : '';
    
    return `
        <div class="video-card${featuredClass}" data-video-id="${video.id}" data-category="${categoryFilter}">
            <div class="video-thumbnail">
                ${video.thumbnail_url ? 
                    `<img src="${escapeHtml(video.thumbnail_url)}" alt="Thumbnail do vídeo: ${escapeHtml(video.title)}" loading="lazy" width="400" height="225">` :
                    `<div class="video-placeholder"></div>`
                }
                <div class="play-overlay">
                    <div class="play-button"></div>
                </div>
                ${isFeatured ? `<div class="video-category">${escapeHtml(video.category)}</div>` : ''}
                ${video.duration && !isFeatured ? `<div class="video-duration">${escapeHtml(video.duration)}</div>` : ''}
            </div>
            <div class="video-info">
                <h3>${escapeHtml(video.title)}</h3>
                ${video.description ? `<p>${escapeHtml(video.description.substring(0, isFeatured ? 100 : 80))}...</p>` : ''}
                ${!isFeatured ? `
                    <div class="video-stats">
                        <span class="views">
                            <svg class="views-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>${formatNumber(views)} visualizações</span>
                        </span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Render all videos
function renderVideos() {
    renderFeaturedVideos();
    renderVideosByCategory();
    
    // Update year in footer
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Attach event listeners to video cards
function attachVideoCardListeners() {
    const videoCards = document.querySelectorAll('.video-card');
    
    videoCards.forEach(card => {
        // Remove existing listeners by cloning
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
        
        // Add click listener
        newCard.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            if (videoId) {
                openVideoModal(videoId);
            }
        });
        
        // Keyboard support
        newCard.setAttribute('tabindex', '0');
        newCard.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const videoId = this.getAttribute('data-video-id');
                if (videoId) {
                    openVideoModal(videoId);
                }
            }
        });
    });
}

// Custom Cursor (apenas desktop)
if (window.innerWidth > 768) {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    const cursorDot = document.createElement('div');
    cursorDot.className = 'custom-cursor-dot';
    document.body.appendChild(cursorDot);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        
        cursorDot.style.left = e.clientX + 'px';
        cursorDot.style.top = e.clientY + 'px';
    });

    // Cursor hover effects
    const hoverElements = document.querySelectorAll('a, button, .video-card, .nav-link, .btn-primary, .filter-btn');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        el.addEventListener('mousedown', () => cursor.classList.add('click'));
        el.addEventListener('mouseup', () => cursor.classList.remove('click'));
    });
}

// Scroll Progress Indicator
const scrollProgress = document.querySelector('.scroll-progress-bar');
window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.scrollY / windowHeight) * 100;
    if (scrollProgress) {
        scrollProgress.style.width = scrolled + '%';
    }
});

// Loading Screen
window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    
    const minLoadTime = 1500;
    const startTime = performance.now();
    
    const images = document.querySelectorAll('img');
    let imagesLoaded = 0;
    const totalImages = images.length;
    
    function checkLoading() {
        const elapsed = performance.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsed);
        
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 1300);
            }
        }, remainingTime);
    }
    
    if (totalImages === 0) {
        checkLoading();
    } else {
        images.forEach(img => {
            if (img.complete) {
                imagesLoaded++;
            } else {
                img.addEventListener('load', () => {
                    imagesLoaded++;
                    if (imagesLoaded === totalImages) {
                        checkLoading();
                    }
                });
                img.addEventListener('error', () => {
                    imagesLoaded++;
                    if (imagesLoaded === totalImages) {
                        checkLoading();
                    }
                });
            }
        });
        
        if (imagesLoaded === totalImages) {
            checkLoading();
        }
        
        setTimeout(() => {
            if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 1300);
            }
        }, 5000);
    }
});

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (hamburger) hamburger.classList.remove('active');
        if (navMenu) navMenu.classList.remove('active');
    });
});

// Video Modal
const modal = document.getElementById('videoModal');
const closeModal = document.querySelector('.close-modal');
const videoPlayer = document.getElementById('videoPlayer');
const videoDetails = document.getElementById('videoDetails');

// Function to open modal
function openVideoModal(videoId) {
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        loadVideo(videoId);
    }
}

// Close modal
if (closeModal) {
    closeModal.addEventListener('click', () => {
        closeVideoModal();
    });
    
    closeModal.setAttribute('tabindex', '0');
    closeModal.setAttribute('aria-label', 'Fechar modal de vídeo');
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeVideoModal();
    }
});

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display === 'block') {
        closeVideoModal();
    }
});

// Function to close modal
function closeVideoModal() {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        if (videoPlayer) {
            videoPlayer.innerHTML = '';
        }
        if (videoDetails) {
            videoDetails.innerHTML = '';
        }
    }
}

// Load video function
function loadVideo(videoId) {
    if (!videoPlayer) return;
    
    // Show loading state
    videoPlayer.innerHTML = `
        <div class="video-loading">
            <div class="video-loading-spinner"></div>
            <p>Carregando vídeo...</p>
        </div>
    `;
    
    if (videoDetails) {
        videoDetails.innerHTML = '';
    }
    
    // Find video in data
    const video = videosData.find(v => v.id == videoId);
    
    if (!video) {
        videoPlayer.innerHTML = `
            <div class="video-error">
                <div class="video-error-icon">⚠️</div>
                <h3>Erro ao carregar vídeo</h3>
                <p>Vídeo não encontrado.</p>
                <button onclick="closeVideoModal()" style="margin-top: 1rem; padding: 10px 20px; background: transparent; color: var(--green); border: 2px solid var(--green); cursor: pointer; border-radius: 5px;">Fechar</button>
            </div>
        `;
        return;
    }
    
    // Increment views
    const views = incrementViews(videoId);
    
    // Create video element
    let videoHTML = '';
    if (video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be')) {
        const ytVideoId = extractYouTubeId(video.video_url);
        if (ytVideoId) {
            videoHTML = `<iframe src="https://www.youtube.com/embed/${ytVideoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${escapeHtml(video.title)}"></iframe>`;
        } else {
            videoHTML = `<div class="video-error"><p>URL do YouTube inválida</p></div>`;
        }
    } else if (video.video_url.includes('vimeo.com')) {
        const vimeoVideoId = extractVimeoId(video.video_url);
        if (vimeoVideoId) {
            videoHTML = `<iframe src="https://player.vimeo.com/video/${vimeoVideoId}?autoplay=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${escapeHtml(video.title)}"></iframe>`;
        } else {
            videoHTML = `<div class="video-error"><p>URL do Vimeo inválida</p></div>`;
        }
    } else {
        videoHTML = `<video controls autoplay><source src="${escapeHtml(video.video_url)}" type="video/mp4">Seu navegador não suporta vídeos HTML5.</video>`;
    }
    
    videoPlayer.innerHTML = videoHTML;
    
    // Update video details
    if (videoDetails) {
        videoDetails.innerHTML = `
            <h3>${escapeHtml(video.title)}</h3>
            ${video.description ? `<p>${escapeHtml(video.description)}</p>` : ''}
            <div style="margin-top: 1rem; color: #888;">
                <span>📁 ${escapeHtml(video.category)}</span>
                ${video.duration ? ` | <span>⏱ ${escapeHtml(video.duration)}</span>` : ''}
                <span> | <svg class="views-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> ${formatNumber(views)} visualizações</span>
            </div>
        `;
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format number with thousands separator
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Extract YouTube video ID
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Extract Vimeo video ID
function extractVimeoId(url) {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        if (navbar) navbar.style.boxShadow = 'none';
    } else {
        if (navbar) navbar.style.boxShadow = '0 2px 20px rgba(0, 255, 136, 0.1)';
    }
    
    lastScroll = currentScroll;
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe video cards after rendering
function observeVideoCards() {
    document.querySelectorAll('.video-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Category Filters
const filterButtons = document.querySelectorAll('.filter-btn');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        
        const filter = button.getAttribute('data-filter');
        const allVideoCards = document.querySelectorAll('.video-card');
        
        allVideoCards.forEach(card => {
            if (filter === 'all') {
                card.classList.remove('hidden');
                card.style.animation = 'fadeInScale 0.5s ease-out';
            } else {
                const cardCategory = card.getAttribute('data-category');
                if (cardCategory === filter) {
                    card.classList.remove('hidden');
                    card.style.animation = 'fadeInScale 0.5s ease-out';
                } else {
                    card.classList.add('hidden');
                }
            }
        });
    });
});

// Smooth Scroll with easing
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - 80;
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition;
            const duration = 1000;
            let start = null;
            
            function easeInOutCubic(t) {
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            }
            
            function animation(currentTime) {
                if (start === null) start = currentTime;
                const timeElapsed = currentTime - start;
                const progress = Math.min(timeElapsed / duration, 1);
                const ease = easeInOutCubic(progress);
                
                window.scrollTo(0, startPosition + distance * ease);
                
                if (timeElapsed < duration) {
                    requestAnimationFrame(animation);
                }
            }
            
            requestAnimationFrame(animation);
        }
    });
});

// Parallax effect for hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        const heroContent = hero.querySelector('.hero-content');
        if (heroContent && scrolled < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
            heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
        }
    }
});

// Enhanced microinteractions
document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Initialize everything
initViews();
loadVideos().then(() => {
    observeVideoCards();
});

