// Global variables
let deferredPrompt = null;
const translations = {};

// Music player variables - shared between pages
let audioPlayer = null;
let playIcon = null;
let isPlaying = false;
let currentPlaylist = '';
let currentSongIndex = -1;
let playlists = {
    'arabic-nasheeds': [
        { path: 'playlists/arabic nasheeds/1.mp3', title: 'Arabic Nasheed 1', artist: 'Various Artists' },
        { path: 'playlists/arabic nasheeds/2.mp3', title: 'Arabic Nasheed 2', artist: 'Various Artists' },
        { path: 'playlists/arabic nasheeds/3.mp3', title: 'Arabic Nasheed 3', artist: 'Various Artists' },
        { path: 'playlists/arabic nasheeds/4.mp3', title: 'Arabic Nasheed 4', artist: 'Various Artists' },
        { path: 'playlists/arabic nasheeds/5.mp3', title: 'Arabic Nasheed 5', artist: 'Various Artists' },
        { path: 'playlists/arabic nasheeds/6.mp3', title: 'Arabic Nasheed 6', artist: 'Various Artists' },
        { path: 'playlists/arabic nasheeds/7.mp3', title: 'Arabic Nasheed 7', artist: 'Various Artists' }
    ],
    'malayalam-songs': [
        { path: 'playlists/malayalam songs/1.mp3', title: 'Malayalam Song 1', artist: 'Malayalam Artist' },
        { path: 'playlists/malayalam songs/2.mp3', title: 'Malayalam Song 2', artist: 'Malayalam Artist' }
    ],
    'workout-nasheeds': [
        { path: 'playlists/gym nasheeds/1.mp3', title: 'Workout Nasheed 1', artist: 'Workout Nasheed' },
        { path: 'playlists/gym nasheeds/2.mp3', title: 'Workout Nasheed 2', artist: 'Workout Nasheed' }
    ]
};

// Custom cursor variables
let cursor = null;
let cursorFollower = null;
let cursorVisible = false;
let cursorTimeout = null;

// Side menu elements
let menuToggle = null;
let sideMenu = null;
let sideMenuOverlay = null;
let themeOptions = null;
let languageOptions = null;

// Floating music player elements
let floatingPlayer = null;
let floatingAudioPlayer = null;
let floatingPlayIcon = null;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize elements
    initElements();
    
    // Load translations
    await loadTranslations();
    
    // Load saved settings
    loadTheme();
    loadLanguage();
    
    // Initialize features
    initCursor();
    setupSideMenu();
    setupPWA();
    setupScrollBehavior();
    setupFloatingMusicPlayer();
    setupScrollAnimations();
    
    // Check if we're on the read page and set up filters
    if (document.querySelector('.article-filters')) {
        setupArticleFilters();
    }
    
    // Check if we're on the playlist page
    if (document.getElementById('floating-audio-player')) {
        // We are on any page with a music player
        initFloatingMusicPlayer();
    }

    // Always play random music when launching the website
    playRandomSong();
});

// Initialize global element references
function initElements() {
    // Elements that exist on both pages
    cursor = document.querySelector('.cursor');
    cursorFollower = document.querySelector('.cursor-follower');
    menuToggle = document.getElementById('menu-toggle');
    sideMenu = document.getElementById('side-menu');
    sideMenuOverlay = document.getElementById('side-menu-overlay');
    themeOptions = document.querySelectorAll('.theme-option');
    languageOptions = document.querySelectorAll('.language-option');
    
    // Floating music player elements
    floatingPlayer = document.getElementById('floating-music-player');
    if (floatingPlayer) {
        floatingAudioPlayer = document.getElementById('floating-audio-player');
        floatingPlayIcon = document.getElementById('floating-play-icon');
    }
}

// Load translations from JSON file
async function loadTranslations() {
    try {
        const response = await fetch('translations.json');
        if (response.ok) {
            const data = await response.json();
            Object.assign(translations, data);
        } else {
            console.error('Failed to load translations');
        }
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

// Initialize the custom cursor
function initCursor() {
    // Make sure cursor elements exist before proceeding
    cursor = document.querySelector('.cursor');
    cursorFollower = document.querySelector('.cursor-follower');
    
    if (!cursor || !cursorFollower) {
        console.error('Cursor elements not found in the DOM');
        return;
    }
    
    // Set initial state - hidden until mouse moves
    cursor.style.opacity = '0';
    cursorFollower.style.opacity = '0';
    cursorVisible = false;
    
    // Show cursor when the mouse moves
    document.addEventListener('mousemove', function(e) {
        // Make cursor visible immediately
        if (!cursorVisible) {
            cursor.style.opacity = '1';
            cursorFollower.style.opacity = '1';
            cursorVisible = true;
        }
        
        // Position the cursor elements
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        
        // Add slight delay to follower for nice effect
        setTimeout(function() {
            cursorFollower.style.left = e.clientX + 'px';
            cursorFollower.style.top = e.clientY + 'px';
        }, 50);
        
        // Reset inactivity timer
        clearTimeout(cursorTimeout);
        cursorTimeout = setTimeout(function() {
            cursor.style.opacity = '0';
            cursorFollower.style.opacity = '0';
            cursorVisible = false;
        }, 3000);
    });
    
    // Hide cursor on touch devices
    document.addEventListener('touchstart', function() {
        cursor.style.opacity = '0';
        cursorFollower.style.opacity = '0';
        cursorVisible = false;
    });
    
    // Cursor scaling for clicks
    document.addEventListener('mousedown', function() {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.7)';
        cursorFollower.style.transform = 'translate(-50%, -50%) scale(0.7)';
    });
    
    document.addEventListener('mouseup', function() {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorFollower.style.transform = 'translate(-50%, -50%) scale(1)';
    });
    
    // Handle cursor when leaving/entering window
    document.addEventListener('mouseleave', function() {
        cursor.style.opacity = '0';
        cursorFollower.style.opacity = '0';
        cursorVisible = false;
    });
    
    document.addEventListener('mouseenter', function(e) {
        cursor.style.opacity = '1';
        cursorFollower.style.opacity = '1';
        cursorVisible = true;
        
        // Position immediately on re-enter
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        cursorFollower.style.left = e.clientX + 'px';
        cursorFollower.style.top = e.clientY + 'px';
        
        // Reset the inactivity timer
        clearTimeout(cursorTimeout);
        cursorTimeout = setTimeout(function() {
            cursor.style.opacity = '0';
            cursorFollower.style.opacity = '0';
            cursorVisible = false;
        }, 3000);
    });
    
    // Add hover effect for clickable elements
    const clickables = document.querySelectorAll('a, button, .nav-item, .song-item, .theme-option, .language-option, .side-menu-item, .menu-toggle, .filter-btn');
    clickables.forEach(element => {
        element.addEventListener('mouseenter', function() {
            cursor.classList.add('cursor-hover');
            cursorFollower.classList.add('cursor-hover');
        });
        
        element.addEventListener('mouseleave', function() {
            cursor.classList.remove('cursor-hover');
            cursorFollower.classList.remove('cursor-hover');
        });
    });
    
    console.log('Cursor initialized successfully');
}

// Setup the side menu functionality
function setupSideMenu() {
    if (!menuToggle || !sideMenu || !sideMenuOverlay) return;
    
    // Toggle menu on same button click (open and close)
    menuToggle.addEventListener('click', toggleSideMenu);
    sideMenuOverlay.addEventListener('click', closeSideMenu);
    
    // Theme options
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            setTheme(theme);
            
            // Update active state
            themeOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Language options
    languageOptions.forEach(option => {
        option.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            setLanguage(lang);
            
            // Update active state
            languageOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Install button if available
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', () => {
            installApp();
            closeSideMenu();
        });
    }
}

function toggleSideMenu() {
    if (sideMenu.classList.contains('active')) {
        closeSideMenu();
    } else {
        openSideMenu();
    }
}

function openSideMenu() {
    sideMenu.classList.add('active');
    sideMenuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Change menu icon to X
    menuToggle.innerHTML = '<i class="fas fa-times"></i>';
}

function closeSideMenu() {
    sideMenu.classList.remove('active');
    sideMenuOverlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Change X icon back to bars
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
}

// Setup PWA functionality
function setupPWA() {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return; // Already installed, exit function
    }
    
    // Handle beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        
        // Show the install banner if it exists
        const installBanner = document.getElementById('install-banner');
        if (installBanner) {
            installBanner.classList.add('show');
            
            // Install banner button click
            const installBannerBtn = document.getElementById('install-banner-btn');
            if (installBannerBtn) {
                installBannerBtn.addEventListener('click', () => {
                    installApp();
                });
            }
            
            // Close install banner
            const installClose = document.getElementById('install-close');
            if (installClose) {
                installClose.addEventListener('click', () => {
                    installBanner.classList.remove('show');
                });
            }
        }
    });
    
    // Successfully installed
    window.addEventListener('appinstalled', (evt) => {
        if (document.getElementById('install-banner')) {
            document.getElementById('install-banner').classList.remove('show');
        }
        deferredPrompt = null;
    });
}

function installApp() {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
        
        // Hide the install banner if it exists
        const installBanner = document.getElementById('install-banner');
        if (installBanner) {
            installBanner.classList.remove('show');
        }
    });
}

// Scroll behavior for navigation and scroll-to-top button
function setupScrollBehavior() {
    let lastScrollTop = 0;
    const navbar = document.querySelector('.bottom-nav');
    const scrollTopBtn = document.querySelector('.scroll-top');
    
    if (!navbar || !scrollTopBtn) return;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Hide/show navbar
        if (scrollTop > lastScrollTop && scrollTop > 200) {
            // Scrolling down
            navbar.classList.add('hidden');
        } else {
            // Scrolling up
            navbar.classList.remove('hidden');
        }
        
        // Show/hide scroll to top button
        if (scrollTop > 500) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Scroll to top when button is clicked
    scrollTopBtn.addEventListener('click', scrollToTop);
}

// Theme management
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update active state in side menu
    document.querySelectorAll('.theme-option').forEach(option => {
        if (option.getAttribute('data-theme') === theme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Function to load theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const theme = savedTheme || 'dark'; // Set dark as default if no theme is saved
    
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update active state in side menu
    document.querySelectorAll('.theme-option').forEach(option => {
        if (option.getAttribute('data-theme') === theme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Language management
function setLanguage(lang) {
    document.body.setAttribute('lang', lang);
    localStorage.setItem('language', lang);
    
    // Update active state in side menu
    document.querySelectorAll('.language-option').forEach(option => {
        if (option.getAttribute('data-lang') === lang) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Update UI to show the selected language's content
    const allLangElements = document.querySelectorAll('[data-lang]');
    allLangElements.forEach(el => {
        if (el.getAttribute('data-lang') === lang) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
    
    // Set RTL direction for Arabic
    if (lang === 'ar') {
        document.body.style.direction = 'rtl';
        document.body.style.textAlign = 'right';
    } else {
        document.body.style.direction = 'ltr';
        document.body.style.textAlign = 'left';
    }
}

function loadLanguage() {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
        document.body.setAttribute('lang', savedLanguage);
        
        // Update active state in side menu
        document.querySelectorAll('.language-option').forEach(option => {
            if (option.getAttribute('data-lang') === savedLanguage) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
        
        // Apply language-specific display settings
        const allLangElements = document.querySelectorAll('[data-lang]');
        allLangElements.forEach(el => {
            if (el.getAttribute('data-lang') === savedLanguage) {
                el.style.display = 'block';
            } else {
                el.style.display = 'none';
            }
        });
        
        // Set RTL direction for Arabic
        if (savedLanguage === 'ar') {
            document.body.style.direction = 'rtl';
            document.body.style.textAlign = 'right';
        } else {
            document.body.style.direction = 'ltr';
            document.body.style.textAlign = 'left';
        }
    }
}

// Navigation functions
function navigateTo(target) {
    switch(target) {
        case 'home':
            window.location.href = 'index.html';
            break;
        case 'playlist':
            window.location.href = 'Playlists.html';
            break;
        case 'read':
            window.location.href = 'read.html';
            break;
    }
}

function scrollToTop() {
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// Set up the floating music player
function setupFloatingMusicPlayer() {
    if (!floatingPlayer) return;
    
    // Get control elements
    const minimizeBtn = floatingPlayer.querySelector('.minimize-player');
    const closeBtn = floatingPlayer.querySelector('.close-player');
    const playerHeader = floatingPlayer.querySelector('.player-header');
    
    // Set up event listeners for controls
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', toggleMinimizePlayer);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closePlayer);
    }
    
    // Make player draggable
    if (playerHeader) {
        playerHeader.addEventListener('mousedown', startDragging);
        document.addEventListener('mousemove', dragPlayer);
        document.addEventListener('mouseup', stopDragging);
        
        // For touch devices
        playerHeader.addEventListener('touchstart', startDraggingTouch);
        document.addEventListener('touchmove', dragPlayerTouch);
        document.addEventListener('touchend', stopDragging);
    }
    
    // Initially hide the player until music starts
    floatingPlayer.classList.add('hidden');
}

function toggleMinimizePlayer() {
    if (!floatingPlayer) return;
    floatingPlayer.classList.toggle('minimized');
}

function closePlayer() {
    if (!floatingPlayer || !floatingAudioPlayer) return;
    
    // Pause music and hide player
    floatingAudioPlayer.pause();
    isPlaying = false;
    floatingPlayer.classList.add('hidden');
    
    // Update play icon
    if (floatingPlayIcon) {
        floatingPlayIcon.classList.remove('fa-pause');
        floatingPlayIcon.classList.add('fa-play');
    }
    
    // Clear the current song index
    currentSongIndex = -1;
    
    // Remove from localStorage
    localStorage.removeItem('musicState');
}

function startDragging(e) {
    if (!floatingPlayer) return;
    e.preventDefault();
    
    isDragging = true;
    
    // Get current player position
    const rect = floatingPlayer.getBoundingClientRect();
    
    // Calculate the offset between mouse position and player top-left corner
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    
    // Change cursor style
    document.body.style.cursor = 'grabbing';
}

function startDraggingTouch(e) {
    if (!floatingPlayer || e.touches.length !== 1) return;
    
    isDragging = true;
    
    // Get current player position
    const rect = floatingPlayer.getBoundingClientRect();
    
    // Calculate the offset between touch position and player top-left corner
    dragOffsetX = e.touches[0].clientX - rect.left;
    dragOffsetY = e.touches[0].clientY - rect.top;
}

function dragPlayer(e) {
    if (!isDragging || !floatingPlayer) return;
    
    // Calculate new position
    const x = e.clientX - dragOffsetX;
    const y = e.clientY - dragOffsetY;
    
    // Apply constraints to keep player within viewport
    const maxX = window.innerWidth - floatingPlayer.offsetWidth;
    const maxY = window.innerHeight - floatingPlayer.offsetHeight;
    
    const constrainedX = Math.max(0, Math.min(x, maxX));
    const constrainedY = Math.max(0, Math.min(y, maxY));
    
    // Update player position
    floatingPlayer.style.left = constrainedX + 'px';
    floatingPlayer.style.top = constrainedY + 'px';
    floatingPlayer.style.right = 'auto';
    floatingPlayer.style.bottom = 'auto';
}

function dragPlayerTouch(e) {
    if (!isDragging || !floatingPlayer || e.touches.length !== 1) return;
    
    // Calculate new position
    const x = e.touches[0].clientX - dragOffsetX;
    const y = e.touches[0].clientY - dragOffsetY;
    
    // Apply constraints to keep player within viewport
    const maxX = window.innerWidth - floatingPlayer.offsetWidth;
    const maxY = window.innerHeight - floatingPlayer.offsetHeight;
    
    const constrainedX = Math.max(0, Math.min(x, maxX));
    const constrainedY = Math.max(0, Math.min(y, maxY));
    
    // Update player position
    floatingPlayer.style.left = constrainedX + 'px';
    floatingPlayer.style.top = constrainedY + 'px';
    floatingPlayer.style.right = 'auto';
    floatingPlayer.style.bottom = 'auto';
    
    // Prevent page scrolling
    e.preventDefault();
}

function stopDragging() {
    isDragging = false;
    document.body.style.cursor = '';
}

// Always play random music when the website is launched
function playRandomMusic() {
    if (floatingAudioPlayer) {
        // If we're already on a page with a music player, play random music
        playRandomSong();
    } else {
        // Set a flag to play music on playlist page
        localStorage.setItem('playRandomOnLoad', 'true');
    }
}

// Initialize floating music player
function initFloatingMusicPlayer() {
    // Check if we have the audio player
    if (!floatingAudioPlayer) return;
    
    // Set up audio player events
    floatingAudioPlayer.addEventListener('timeupdate', updateFloatingProgress);
    floatingAudioPlayer.addEventListener('ended', songEnded);
    
    // Continue playing previous song if any
    restorePreviousPlayback();
}

// Restore previous playback state
function restorePreviousPlayback() {
    const musicState = JSON.parse(localStorage.getItem('musicState'));
    if (musicState && musicState.isPlaying) {
        // Find the playlist and song index
        for (const playlistId in playlists) {
            const songIndex = playlists[playlistId].findIndex(song => song.path === musicState.songPath);
            if (songIndex !== -1) {
                // Play the song
                currentPlaylist = playlistId;
                currentSongIndex = songIndex;
                
                const song = playlists[playlistId][songIndex];
                playSong(song.path, song.title, song.artist);
                
                // Set the current time if provided
                if (musicState.currentTime) {
                    floatingAudioPlayer.currentTime = musicState.currentTime;
                }
                
                break;
            }
        }
    }
}

// Play a random song
function playRandomSong() {
    // Select a random playlist
    const playlistKeys = Object.keys(playlists);
    const randomPlaylistKey = playlistKeys[Math.floor(Math.random() * playlistKeys.length)];
    
    // Select a random song from the playlist
    const randomPlaylist = playlists[randomPlaylistKey];
    const randomSongIndex = Math.floor(Math.random() * randomPlaylist.length);
    const randomSong = randomPlaylist[randomSongIndex];
    
    // Play the random song
    playSong(randomSong.path, randomSong.title, randomSong.artist);
}

// Play a specific song
function playSong(path, title, artist) {
    if (!floatingAudioPlayer || !floatingPlayer) return;
    
    // Show the player if it's hidden
    floatingPlayer.classList.remove('hidden');
    floatingPlayer.classList.remove('minimized');
    
    // Find which playlist and index the song is in
    for (const playlistId in playlists) {
        const songIndex = playlists[playlistId].findIndex(song => song.path === path);
        if (songIndex !== -1) {
            currentPlaylist = playlistId;
            currentSongIndex = songIndex;
            break;
        }
    }
    
    // Set up the audio player
    floatingAudioPlayer.src = path;
    
    // Update song title and artist in the player
    const titleElement = document.getElementById('floating-song-title');
    if (titleElement) {
        titleElement.textContent = title;
    }
    
    const artistElement = document.getElementById('floating-song-artist');
    if (artistElement) {
        artistElement.textContent = artist;
    }
    
    // Start playing
    floatingAudioPlayer.play()
        .then(() => {
            // Successfully playing
            isPlaying = true;
            
            if (floatingPlayIcon) {
                floatingPlayIcon.classList.remove('fa-play');
                floatingPlayIcon.classList.add('fa-pause');
            }
            
            // Save the current playback state
            savePlaybackState();
        })
        .catch(error => {
            console.error('Error playing audio:', error);
        });
    
    // Update cover icon based on playlist
    updateCoverIcon();
    
    // Also update any song list UI if we're on the playlist page
    highlightCurrentSong();
}

// Update the cover icon based on current playlist
function updateCoverIcon() {
    const coverElement = document.querySelector('.player-cover');
    if (!coverElement) return;
    
    if (currentPlaylist === 'arabic-nasheeds') {
        coverElement.innerHTML = '<i class="fas fa-mosque"></i>';
    } else if (currentPlaylist === 'malayalam-songs') {
        coverElement.innerHTML = '<i class="fas fa-music"></i>';
    } else if (currentPlaylist === 'workout-nasheeds') {
        coverElement.innerHTML = '<i class="fas fa-dumbbell"></i>';
    }
}

// Toggle play/pause
function togglePlayPause() {
    if (!floatingAudioPlayer) return;
    
    if (currentSongIndex === -1 && Object.keys(playlists).length > 0) {
        // If no song is selected, play a random one
        playRandomSong();
        return;
    }
    
    if (isPlaying) {
        floatingAudioPlayer.pause();
        
        if (floatingPlayIcon) {
            floatingPlayIcon.classList.remove('fa-pause');
            floatingPlayIcon.classList.add('fa-play');
        }
        
        isPlaying = false;
    } else {
        floatingAudioPlayer.play();
        
        if (floatingPlayIcon) {
            floatingPlayIcon.classList.remove('fa-play');
            floatingPlayIcon.classList.add('fa-pause');
        }
        
        isPlaying = true;
    }
    
    // Save the current playback state
    savePlaybackState();
}

// Play the next song in the playlist
function playNext() {
    if (currentSongIndex === -1 || !currentPlaylist) return;
    
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= playlists[currentPlaylist].length) {
        nextIndex = 0; // Loop back to the beginning
    }
    
    const nextSong = playlists[currentPlaylist][nextIndex];
    playSong(nextSong.path, nextSong.title, nextSong.artist);
}

// Play the previous song in the playlist
function playPrevious() {
    if (currentSongIndex === -1 || !currentPlaylist) return;
    
    // If at the beginning of the song, go to previous song, otherwise restart current song
    if (floatingAudioPlayer.currentTime > 3) {
        floatingAudioPlayer.currentTime = 0;
        return;
    }
    
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) {
        prevIndex = playlists[currentPlaylist].length - 1; // Loop to the end
    }
    
    const prevSong = playlists[currentPlaylist][prevIndex];
    playSong(prevSong.path, prevSong.title, prevSong.artist);
}

// When song ends, play the next one
function songEnded() {
    playNext();
}

// Update the progress bar in the floating player
function updateFloatingProgress() {
    if (!floatingAudioPlayer) return;
    
    const progressBar = document.getElementById('floating-progress-bar');
    if (!progressBar) return;
    
    const duration = floatingAudioPlayer.duration;
    const currentTime = floatingAudioPlayer.currentTime;
    
    if (duration) {
        // Update progress bar
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        // Save the current playback state periodically (every 5 seconds)
        if (Math.floor(currentTime) % 5 === 0) {
            savePlaybackState();
        }
    }
}

// Save the current playback state to localStorage
function savePlaybackState() {
    if (currentSongIndex === -1 || !floatingAudioPlayer || !currentPlaylist) return;
    
    const currentSong = playlists[currentPlaylist][currentSongIndex];
    const musicState = {
        isPlaying: isPlaying,
        songPath: currentSong.path,
        currentTime: floatingAudioPlayer.currentTime,
        duration: floatingAudioPlayer.duration,
        title: currentSong.title,
        artist: currentSong.artist,
        playlist: currentPlaylist
    };
    
    localStorage.setItem('musicState', JSON.stringify(musicState));
}

// Highlight the currently playing song if on playlist page
function highlightCurrentSong() {
    // Remove highlight from all songs
    const songItems = document.querySelectorAll('.song-item');
    if (!songItems.length) return; // Not on playlist page
    
    songItems.forEach(item => {
        item.classList.remove('playing');
    });
    
    // Add highlight to current song if we're on the playlist page
    if (currentSongIndex !== -1 && currentPlaylist) {
        const playlistElement = document.getElementById(currentPlaylist);
        if (playlistElement) {
            const songElements = playlistElement.querySelectorAll('.song-item');
            if (songElements[currentSongIndex]) {
                songElements[currentSongIndex].classList.add('playing');
            }
        }
    }
}

// Switch between playlists
function switchPlaylist(element, playlistId) {
    // Update active tab
    const tabs = document.querySelectorAll('.playlist-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    element.classList.add('active');
    
    // Show selected playlist
    const playlistContents = document.querySelectorAll('.playlist-content');
    playlistContents.forEach(playlist => {
        playlist.classList.remove('active');
    });
    document.getElementById(playlistId).classList.add('active');
    
    // Update current playlist
    currentPlaylist = playlistId;
    
    // Highlight current song if it's in this playlist
    highlightCurrentSong();
}

// Setup article filters on read page
function setupArticleFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const articleCards = document.querySelectorAll('.article-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Get filter value
            const filter = btn.getAttribute('data-filter');
            
            // Filter articles
            articleCards.forEach(card => {
                if (filter === 'all' || card.classList.contains(filter)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// Setup scroll animations
function setupScrollAnimations() {
    // Add scroll-animate class to elements we want to animate
    const sections = document.querySelectorAll('section, .ramadan-campaign, .playlist-section, .articles-section');
    sections.forEach(section => {
        section.classList.add('scroll-animate');
    });
    
    const headings = document.querySelectorAll('h1, h2, h3');
    headings.forEach(heading => {
        heading.classList.add('scroll-animate');
        heading.classList.add('fade-in-up');
    });
    
    const cards = document.querySelectorAll('.article-card, .song-item');
    cards.forEach((card, index) => {
        card.classList.add('scroll-animate');
        // Alternate between left and right animations
        if (index % 2 === 0) {
            card.classList.add('fade-in-left');
        } else {
            card.classList.add('fade-in-right');
        }
    });
    
    const logos = document.querySelectorAll('.logo, .ramadan-logo');
    logos.forEach(logo => {
        logo.classList.add('scroll-animate');
        logo.classList.add('zoom-in');
    });
    
    // Check elements visibility on page load
    checkVisibility();
    
    // Check elements visibility on scroll
    window.addEventListener('scroll', checkVisibility);
}

// Check if elements are visible in viewport
function checkVisibility() {
    const animatedElements = document.querySelectorAll('.scroll-animate');
    
    animatedElements.forEach(element => {
        // Calculate element position relative to viewport
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        
        // If element is in viewport
        if (rect.top <= windowHeight * 0.85) {
            element.classList.add('visible');
        }
    });
}