// ==================== FIREBASE CONFIGURATION ====================
const firebaseConfig = {
    apiKey: "AIzaSyCZv_7cAzKcGRkbEGxYh9tFILUAul6vNOM",
    authDomain: "chrono-f3e12.firebaseapp.com",
    projectId: "chrono-f3e12",
    storageBucket: "chrono-f3e12.firebasestorage.app",
    messagingSenderId: "251329141425",
    appId: "1:251329141425:web:22d5deaa3cf35696f66765",
    measurementId: "G-067K4PH5MQ"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;
let events = [];
let alternateEvents = [];
let universes = [
    {
        id: 1,
        name: 'alpha prime',
        description: 'the primary timeline where you exist',
        icon: 'fa-atom',
        stability: 'stable',
        divergence: '0%'
    },
    {
        id: 2,
        name: 'beta mirror',
        description: 'everything is reversed',
        icon: 'fa-mirror',
        stability: 'unstable',
        divergence: '15%'
    },
    {
        id: 3,
        name: 'gamma dreams',
        description: 'thoughts become reality instantly',
        icon: 'fa-moon',
        stability: 'fluctuating',
        divergence: '27%'
    },
    {
        id: 4,
        name: 'delta void',
        description: 'empty space between timelines',
        icon: 'fa-circle',
        stability: 'static',
        divergence: '42%'
    }
];

let capsules = [];
let selectedEventDimension = 'past';

// ==================== LOADING INDICATOR FUNCTIONS ====================
function showLoading(message = 'Loading...') {
    const loading = document.getElementById('loading');
    const loadingText = loading?.querySelector('p');
    if (loadingText) loadingText.textContent = message;
    if (loading) loading.classList.add('active');
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.remove('active');
}

// ==================== THEME MANAGEMENT ====================
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('chrono_theme', theme);

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(theme)) {
            btn.classList.add('active');
        }
    });
}

// Load saved theme
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('chrono_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.textContent.includes(savedTheme)) {
            btn.classList.add('active');
        }
    });
    
    addMobileNavigation();
    
    // Check AI status
    setTimeout(checkAIStatus, 1000);
});

// ==================== AI STATUS CHECK ====================
function checkAIStatus() {
    const aiStatus = document.getElementById('aiStatus');
    const aiStatusText = document.getElementById('aiStatusText');
    
    if (aiStatus && aiStatusText) {
        if (typeof puter !== 'undefined') {
            if (puter.ai) {
                aiStatus.classList.add('online');
                aiStatus.classList.remove('offline');
                aiStatusText.textContent = 'online ✨';
                console.log('✅ AI features available');
            } else {
                aiStatus.classList.add('offline');
                aiStatus.classList.remove('online');
                aiStatusText.textContent = 'needs login';
                console.log('⚠️ Puter loaded but AI not ready - may need login');
            }
        } else {
            aiStatus.classList.add('offline');
            aiStatus.classList.remove('online');
            aiStatusText.textContent = 'not loaded';
            console.log('❌ Puter.js not loaded');
        }
    }
}

// ==================== AUTH STATE OBSERVER ====================
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        console.log('✅ User signed in:', user.email);

        showLoading('loading your timeline...');
        await loadUserData(user.uid);
        hideLoading();

        document.getElementById('authPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';

        updateUserUI();
        loadTimeline();
        loadAlternatePaths();
        loadMemories();
        loadUniverses();
        loadCapsules();
    } else {
        currentUser = null;
        events = [];
        alternateEvents = [];
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('authPage').style.display = 'flex';
    }
});

// ==================== LOAD USER DATA ====================
async function loadUserData(userId) {
    try {
        const eventsSnapshot = await db.collection('users').doc(userId).collection('events').get();
        events = [];
        eventsSnapshot.forEach(doc => {
            events.push({ id: doc.id, ...doc.data() });
        });

        const alternateSnapshot = await db.collection('users').doc(userId).collection('alternateEvents').get();
        alternateEvents = [];
        alternateSnapshot.forEach(doc => {
            alternateEvents.push({ id: doc.id, ...doc.data() });
        });

        const capsulesSnapshot = await db.collection('users').doc(userId).collection('capsules').get();
        capsules = [];
        capsulesSnapshot.forEach(doc => {
            capsules.push({ id: doc.id, ...doc.data() });
        });

        if (events.length === 0) {
            await createSampleData(userId);
        }
        
        console.log('✅ Data loaded:', { events: events.length, alternate: alternateEvents.length, capsules: capsules.length });
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showToast('error loading data', 'error');
    }
}

// ==================== CREATE SAMPLE DATA ====================
async function createSampleData(userId) {
    const sampleEvents = [
        {
            title: 'first breath',
            description: 'the moment you entered this timeline',
            year: 1995,
            dimension: 'past',
            probability: 100,
            createdAt: Date.now() - 864000000
        },
        {
            title: 'quantum awakening',
            description: 'the day you discovered chrono',
            year: 2024,
            dimension: 'present',
            probability: 100,
            createdAt: Date.now() - 86400000
        },
        {
            title: 'first time travel',
            description: 'you will explore parallel timelines',
            year: 2025,
            dimension: 'future',
            probability: 78,
            createdAt: Date.now()
        }
    ];

    for (const event of sampleEvents) {
        await db.collection('users').doc(userId).collection('events').add(event);
        events.push(event);
    }
}

// ==================== AUTH FUNCTIONS ====================
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.error-message').forEach(e => e.classList.remove('show'));

    if (tab === 'login') {
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

async function loginWithEmail() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    if (!email || !password) {
        errorEl.textContent = 'email and password are required';
        errorEl.classList.add('show');
        return;
    }

    showToast('🔄 signing in...', 'success');
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showToast('✅ login successful', 'success');
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.add('show');
    }
}

async function registerWithEmail() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const errorEl = document.getElementById('registerError');

    if (!name || !email || !password) {
        errorEl.textContent = 'all fields are required';
        errorEl.classList.add('show');
        return;
    }

    showToast('🔄 creating account...', 'success');
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });

        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            createdAt: Date.now()
        });

        showToast('✅ account created', 'success');
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.add('show');
    }
}

async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    showToast('🔄 connecting to google...', 'success');
    try {
        await auth.signInWithPopup(provider);
        showToast('✅ login successful', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function logout() {
    showToast('🔄 signing out...', 'success');
    try {
        await auth.signOut();
        showToast('👋 signed out', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==================== UI FUNCTIONS ====================
function updateUserUI() {
    if (currentUser) {
        const name = currentUser.displayName || 'User';
        const initial = name.charAt(0).toUpperCase();

        document.getElementById('navName').textContent = name.split(' ')[0];
        document.getElementById('navAvatar').textContent = initial;
        document.getElementById('profileName').textContent = name;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profileAvatar').textContent = initial;

        const joinDate = new Date(currentUser.metadata.creationTime);
        document.getElementById('profileDate').textContent = joinDate.getFullYear();

        updateStats();
    }
}

function updateStats() {
    const pastEvents = events.filter(e => e.dimension === 'past').length;
    const futureEvents = events.filter(e => e.dimension === 'future').length;

    document.getElementById('statEvents').textContent = events.length;
    document.getElementById('profileEvents').textContent = events.length;
    document.getElementById('quickStatsEvents').textContent = events.length;
    document.getElementById('quickStatsPast').textContent = pastEvents;
    document.getElementById('quickStatsFuture').textContent = futureEvents;
    document.getElementById('statUniverses').textContent = universes.length;
    document.getElementById('profileUniverses').textContent = universes.length;
    document.getElementById('statCapsules').textContent = capsules.length;
    document.getElementById('profileCapsules').textContent = capsules.length;
}

function switchPage(page) {
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Find the clicked element and mark it active
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    
    document.getElementById(page + 'Page').classList.add('active');

    showLoading(`loading ${page}...`);
    
    setTimeout(() => {
        if (page === 'timeline') loadTimeline();
        if (page === 'alternate') loadAlternatePaths();
        if (page === 'memories') loadMemories();
        if (page === 'universes') loadUniverses();
        if (page === 'capsules') loadCapsules();
        hideLoading();
    }, 300);
}

// ==================== TIMELINE FUNCTIONS ====================
function loadTimeline() {
    const container = document.getElementById('timelineEvents');
    const userEvents = events.filter(e => e.userId === currentUser?.uid);

    if (userEvents.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-timeline"></i><h3>no events yet</h3><p>click the + button to add your first timeline event</p></div>`;
        return;
    }

    container.innerHTML = userEvents.sort((a, b) => b.year - a.year).map(event => `
        <div class="timeline-event">
            <div class="event-card">
                <div class="event-header">
                    <div class="event-date"><i class="fas fa-calendar"></i> ${event.year}</div>
                    <div class="event-mood"><i class="fas fa-${event.dimension === 'past' ? 'history' : event.dimension === 'future' ? 'rocket' : 'clock'}"></i> ${event.dimension}</div>
                </div>
                <div class="event-title">${event.title}</div>
                <div class="event-description">${event.description}</div>
                ${event.dimension === 'future' ? `
                    <div class="probability-meter">
                        <div class="meter-label"><span>probability</span><span>${event.probability}%</span></div>
                        <div class="meter-bar"><div class="meter-fill" style="width: ${event.probability}%;"></div></div>
                    </div>
                ` : ''}
                <div class="event-actions">
                    <button class="event-btn" onclick="exploreAlternate('${event.id}')"><i class="fas fa-code-branch"></i> explore</button>
                    <button class="event-btn" onclick="createParadox('${event.id}')"><i class="fas fa-exclamation-triangle"></i> paradox</button>
                    <button class="event-btn" onclick="deleteEvent('${event.id}')" style="color: var(--error);"><i class="fas fa-trash"></i> delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== MEMORIES ====================
function loadMemories() {
    const container = document.getElementById('memoriesGrid');
    const pastEvents = events.filter(e => e.dimension === 'past');

    if (pastEvents.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-clock"></i><h3>no memories yet</h3><p>past events will appear here</p></div>`;
        return;
    }

    container.innerHTML = pastEvents.map(event => `
        <div class="card memory-card" onclick="viewMemory('${event.id}')">
            <div class="card-icon"><i class="fas fa-clock"></i></div>
            <div class="card-title">${event.title}</div>
            <div class="card-description">${event.description.substring(0, 60)}${event.description.length > 60 ? '...' : ''}</div>
            <div class="card-meta">
                <i class="fas fa-calendar"></i> ${event.year}
            </div>
        </div>
    `).join('');
}

// ==================== MEMORY DETAIL FUNCTIONS ====================

// Store current selected memory
let currentSelectedMemory = null;

// View memory details
function viewMemory(eventId) {
    console.log('📖 Viewing memory:', eventId);
    
    const memory = events.find(e => e.id === eventId);
    if (!memory) {
        showToast('Memory not found', 'error');
        return;
    }
    
    currentSelectedMemory = memory;
    
    // Populate modal
    document.getElementById('memoryDetailTitle').textContent = memory.title;
    document.getElementById('memoryDetailYear').innerHTML = `<i class="fas fa-calendar"></i> ${memory.year}`;
    document.getElementById('memoryDetailDescription').textContent = memory.description;
    
    const createdDate = new Date(memory.createdAt || Date.now());
    document.getElementById('memoryDetailCreated').textContent = timeAgo(createdDate.getTime());
    
    // Set up action buttons with correct memory ID
    document.getElementById('memoryExploreBtn').setAttribute('onclick', `exploreFromMemory('${memory.id}')`);
    document.getElementById('memoryDeleteBtn').setAttribute('onclick', `deleteMemory('${memory.id}')`);
    
    // Show modal
    document.getElementById('memoryDetailModal').classList.add('active');
}

// Close memory modal
function closeMemoryModal() {
    document.getElementById('memoryDetailModal').classList.remove('active');
    currentSelectedMemory = null;
}

// Explore from memory (create alternate path)
async function exploreFromMemory(memoryId) {
    closeMemoryModal();
    await exploreAlternate(memoryId);
}

// Delete memory
async function deleteMemory(memoryId) {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    
    closeMemoryModal();
    await deleteEvent(memoryId);
}

// Time ago helper function (add this if you don't have it)
function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (let [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return interval + ' ' + unit + (interval === 1 ? '' : 's') + ' ago';
        }
    }
    
    return 'just now';
}

// ==================== UNIVERSES ====================
function loadUniverses() {
    const container = document.getElementById('universesGrid');
    container.innerHTML = universes.map(universe => `
        <div class="card" onclick="enterUniverse('${universe.name}')">
            <div class="card-icon"><i class="fas ${universe.icon}"></i></div>
            <div class="card-title">${universe.name}</div>
            <div class="card-description">${universe.description}</div>
            <div class="card-meta">
                <i class="fas fa-${universe.stability === 'stable' ? 'check-circle' : 'exclamation-circle'}" style="color: ${universe.stability === 'stable' ? 'var(--success)' : 'var(--warning)'};"></i>
                ${universe.stability} · ${universe.divergence} divergence
            </div>
        </div>
    `).join('');
}

// ==================== CAPSULES ====================
function loadCapsules() {
    const container = document.getElementById('capsulesGrid');
    const currentYear = new Date().getFullYear();

    if (capsules.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-hourglass"></i><h3>no time capsules</h3><p>create a capsule to send a message to your future self</p></div>`;
        return;
    }

    container.innerHTML = capsules.map(capsule => {
        const yearsLeft = capsule.openYear - currentYear;
        const isUnlocked = currentYear >= capsule.openYear;

        return `
            <div class="card ${isUnlocked ? 'unlocked' : ''}" onclick="${isUnlocked ? `openCapsule('${capsule.id}')` : ''}">
                <div class="card-icon"><i class="fas fa-${isUnlocked ? 'lock-open' : 'lock'}"></i></div>
                <div class="card-title">time capsule</div>
                <div class="card-description">${capsule.isOpened ? capsule.message : 'sealed message'}</div>
                <div class="card-meta"><i class="fas fa-hourglass"></i> ${yearsLeft > 0 ? `opens in ${yearsLeft} years` : 'ready to open'}</div>
            </div>
        `;
    }).join('');
}

// ==================== CAPSULE FUNCTIONS ====================
function openCapsuleModal() {
    document.getElementById('createCapsuleModal').classList.add('active');
}

function closeCapsuleModal() {
    document.getElementById('createCapsuleModal').classList.remove('active');
    document.getElementById('capsuleMessage').value = '';
    document.getElementById('capsuleYears').value = '10';
}

async function createCapsule() {
    const message = document.getElementById('capsuleMessage').value;
    const years = document.getElementById('capsuleYears').value;

    if (!message) {
        showToast('message is required', 'error');
        return;
    }

    if (!currentUser) {
        showToast('please login first', 'error');
        return;
    }

    showToast('🔄 sealing your capsule...', 'success');
    showLoading('creating time capsule...');

    const newCapsule = {
        userId: currentUser.uid,
        message: message,
        sendYear: new Date().getFullYear(),
        openYear: new Date().getFullYear() + parseInt(years),
        isOpened: false,
        createdAt: Date.now()
    };

    try {
        const docRef = await db.collection('users').doc(currentUser.uid).collection('capsules').add(newCapsule);
        newCapsule.id = docRef.id;
        capsules.push(newCapsule);

        closeCapsuleModal();
        loadCapsules();
        hideLoading();
        showToast('✅ time capsule created!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        showToast(error.message, 'error');
    }
}

async function openCapsule(capsuleId) {
    const capsule = capsules.find(c => c.id === capsuleId);
    
    if (capsule && !capsule.isOpened) {
        showToast('🔄 opening capsule...', 'success');
        showLoading('opening time capsule...');
        
        capsule.isOpened = true;
        
        try {
            await db.collection('users').doc(currentUser.uid).collection('capsules').doc(capsuleId).update({
                isOpened: true
            });
            
            loadCapsules();
            hideLoading();
            showToast(`📨 ${capsule.message}`, 'success');
        } catch (error) {
            hideLoading();
            console.error('Error:', error);
            showToast(error.message, 'error');
        }
    }
}

// ==================== MODAL FUNCTIONS ====================
function openCreateModal() {
    document.getElementById('createModal').classList.add('active');
}

function closeCreateModal() {
    document.getElementById('createModal').classList.remove('active');
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDescription').value = '';
    document.getElementById('eventYear').value = '2024';
}

function selectEventDimension(dimension, element) {
    selectedEventDimension = dimension;
    document.querySelectorAll('.dimension-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
}

// ==================== CREATE EVENT ====================
async function createTimelineEvent() {
    const title = document.getElementById('eventTitle').value;
    let description = document.getElementById('eventDescription').value;
    const year = document.getElementById('eventYear').value;

    if (!title) {
        showToast('title is required', 'error');
        return;
    }

    if (!currentUser) {
        showToast('please login first', 'error');
        return;
    }

    // Get the button
    const generateBtn = document.querySelector('#createModal .btn:last-child');
    const originalText = generateBtn.innerHTML;
    
    // If description is empty, try AI generation
    if (!description && isPuterAvailable()) {
        try {
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI thinking...';
            generateBtn.disabled = true;
            
            showToast('✨ AI is writing a description...', 'success');
            description = await generateAIDescription(title, year, selectedEventDimension);
            
            if (description) {
                document.getElementById('eventDescription').value = description;
                showToast('✅ AI description generated!', 'success');
            }
        } catch (error) {
            console.error('AI generation failed:', error);
            showToast('AI generation failed, using default', 'warning');
        } finally {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    }

    showToast('🔄 adding event...', 'success');
    showLoading('creating timeline event...');

    const newEvent = {
        userId: currentUser.uid,
        title: title,
        description: description || 'a moment in time',
        year: parseInt(year) || new Date().getFullYear(),
        dimension: selectedEventDimension,
        probability: selectedEventDimension === 'future' ? Math.floor(Math.random() * 50) + 50 : 100,
        createdAt: Date.now()
    };

    try {
        const docRef = await db.collection('users').doc(currentUser.uid).collection('events').add(newEvent);
        newEvent.id = docRef.id;
        events.push(newEvent);

        closeCreateModal();
        updateStats();
        loadTimeline();
        loadMemories();
        hideLoading();
        showToast('✅ event added to timeline', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        showToast(error.message, 'error');
    }
}

// ==================== DELETE EVENT ====================
async function deleteEvent(eventId) {
    if (!confirm('are you sure you want to delete this event?')) return;

    showToast('🔄 deleting event...', 'success');
    showLoading('deleting event...');

    try {
        await db.collection('users').doc(currentUser.uid).collection('events').doc(eventId).delete();
        events = events.filter(e => e.id !== eventId);
        
        updateStats();
        loadTimeline();
        loadMemories();
        hideLoading();
        showToast('✅ event deleted', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error deleting:', error);
        showToast(error.message, 'error');
    }
}

async function deleteAlternateEvent(eventId) {
    if (!confirm('Are you sure you want to discard this alternate path?')) return;
    
    showToast('🔄 discarding path...', 'success');
    showLoading('discarding alternate path...');
    
    try {
        await db.collection('users').doc(currentUser.uid).collection('alternateEvents').doc(eventId).delete();
        alternateEvents = alternateEvents.filter(e => e.id !== eventId);
        loadAlternatePaths();
        hideLoading();
        showToast('✅ alternate path discarded', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error deleting:', error);
        showToast(error.message, 'error');
    }
}

// ==================== AI-POWERED EXPLORE ALTERNATE ====================
async function exploreAlternate(eventId) {
    console.log('🌌 Exploring alternate for event:', eventId);
    
    const event = events.find(e => e.id === eventId);
    if (!event) {
        console.error('Event not found:', eventId);
        return;
    }

    if (!currentUser) {
        showToast('please login first', 'error');
        return;
    }

    showToast('Generating a rich alternate reality...', 'success');
    showLoading('Creating an alternate reality...');

    let alternateTitle = `What if you made a different choice?`;
    let alternateDescription = `Exploring an alternate path from: ${event.title}`;
    let divergence = Math.floor(Math.random() * 70) + 20;
    let probability = Math.floor(Math.random() * 80) + 10;
    
    // Store AI-generated content
    let aiGeneratedEvents = [];
    let aiGeneratedOutcomes = [];
    let aiGeneratedLesson = "";

    // Try to generate AI content if available
    if (isPuterAvailable()) {
        try {
            const prompt = `Based on this real event: "${event.title}: ${event.description}" (Year: ${event.year})
            
            Create a rich alternate reality where things turned out differently.
            
            Return a JSON object with:
            1. title: A compelling "what if" title (max 10 words)
            2. description: What actually happened in this alternate reality (2-3 sentences)
            3. events: 3 future events that would occur in this timeline, each with year and description 
               Format: [{"year": 2026, "description": "..."}]
            4. outcomes: 4 different life outcomes with icon name and text 
               Possible icons: rocket, heart, location-dot, brain, briefcase, users, graduation-cap, globe, money-bill, home
               Format: [{"icon": "rocket", "text": "..."}]
            5. lesson: A meaningful life lesson this teaches (1 sentence)
            
            Return ONLY valid JSON, no other text.`;
            
            const response = await puter.ai.chat(prompt);
            const aiContent = extractTextFromPuterResponse(response);
            
            try {
                const parsed = JSON.parse(aiContent);
                alternateTitle = parsed.title || alternateTitle;
                alternateDescription = parsed.description || alternateDescription;
                aiGeneratedEvents = parsed.events || [];
                aiGeneratedOutcomes = parsed.outcomes || [];
                aiGeneratedLesson = parsed.lesson || "";
                
                console.log('✅ AI generated content:', parsed);
            } catch (e) {
                console.log('Could not parse AI response as JSON, using fallback');
                // Use fallback generation
                const fallback = generateFallbackReality(event);
                aiGeneratedEvents = fallback.events;
                aiGeneratedOutcomes = fallback.outcomes;
                aiGeneratedLesson = fallback.lesson;
            }
        } catch (error) {
            console.log('AI generation failed, using fallback');
            const fallback = generateFallbackReality(event);
            aiGeneratedEvents = fallback.events;
            aiGeneratedOutcomes = fallback.outcomes;
            aiGeneratedLesson = fallback.lesson;
        }
    } else {
        // Use fallback if AI not available
        const fallback = generateFallbackReality(event);
        aiGeneratedEvents = fallback.events;
        aiGeneratedOutcomes = fallback.outcomes;
        aiGeneratedLesson = fallback.lesson;
    }

    const alternateEvent = {
        userId: currentUser.uid,
        title: alternateTitle,
        description: alternateDescription,
        year: event.year + Math.floor(Math.random() * 10) - 5,
        originalEventId: event.id,
        dimension: 'future',
        probability: probability,
        divergence: divergence,
        createdAt: Date.now(),
        // Store AI-generated content in the database
        aiEvents: aiGeneratedEvents,
        aiOutcomes: aiGeneratedOutcomes,
        aiLesson: aiGeneratedLesson,
        hasAI: isPuterAvailable() // Flag to indicate if this was AI-generated
    };

    try {
        // Add to Firestore
        const docRef = await db.collection('users').doc(currentUser.uid).collection('alternateEvents').add(alternateEvent);
        alternateEvent.id = docRef.id;
        
        // Add to local array
        alternateEvents.push(alternateEvent);
        
        console.log('✅ Alternate event created with ID:', docRef.id);
        console.log('Total alternate events now:', alternateEvents.length);
        
        hideLoading();
        
        const message = isPuterAvailable() ? '🤖 AI-generated alternate reality created!' : '🌌 Alternate reality created!';
        showToast(message, 'success');
        
        // Navigate to alternate paths page
        console.log('🔄 Navigating to alternate page...');
        
        // Update navigation UI without relying on event
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Activate alternate page
        document.getElementById('alternatePage').classList.add('active');
        
        // Mark the alternate menu item as active
        document.querySelectorAll('.menu-item').forEach(item => {
            if (item.textContent.includes('alternate paths')) {
                item.classList.add('active');
            }
        });
        
        // Also activate the nav-link for alternate if it exists
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.textContent.includes('universes')) {
                // Don't activate universes
            } else if (link.textContent.includes('capsules')) {
                // Don't activate capsules
            } else if (link.textContent.includes('timeline')) {
                // Don't activate timeline
            }
        });
        
        // Load alternate paths
        loadAlternatePaths();
        
        showToast('📂 Showing your new alternate reality', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('Error creating alternate event:', error);
        showToast(error.message, 'error');
    }
}

// ==================== FALLBACK GENERATION (when AI fails) ====================
function generateFallbackReality(event) {
    const year = event.year || 2024;
    const events = [];
    for (let i = 1; i <= 3; i++) {
        events.push({
            year: year + i * 2,
            description: generateFallbackEventDescription(i)
        });
    }
    
    const outcomes = [
        { icon: 'briefcase', text: 'Your career path would have been completely different' },
        { icon: 'heart', text: 'You would have met different people along the way' },
        { icon: 'location-dot', text: 'You might be living in a different place' },
        { icon: 'brain', text: 'You would have learned different life lessons' }
    ];
    
    const lessons = [
        "Every choice leads to a different version of yourself.",
        "The path not taken reveals what you truly value.",
        "Your choices define you, but alternatives help you understand yourself better.",
        "There's no right or wrong path - just different journeys."
    ];
    
    return {
        events: events,
        outcomes: outcomes,
        lesson: lessons[Math.floor(Math.random() * lessons.length)]
    };
}

function generateFallbackEventDescription(index) {
    const descriptions = [
        "A major turning point in this alternate timeline",
        "Life takes an unexpected direction",
        "Everything changes from this moment forward"
    ];
    return descriptions[index % descriptions.length];
}

// ==================== ENHANCED ALTERNATE PATHS DISPLAY ====================
function loadAlternatePaths() {
    const container = document.getElementById('alternateEvents');
    
    if (!container) {
        console.error('❌ Alternate events container not found');
        return;
    }
    
    if (alternateEvents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-code-branch" style="font-size: 4rem; color: var(--secondary);"></i>
                <h3>no alternate paths yet</h3>
                <p>click "explore" on any timeline event to see what could have been</p>
                <div style="margin-top: 2rem;">
                    <button class="btn" onclick="switchPage('timeline')" style="width: auto; padding: 0.75rem 2rem;">
                        <i class="fas fa-arrow-left"></i>
                        go to timeline
                    </button>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = alternateEvents.map(event => {
        // Use AI-generated content if available, otherwise use fallback
        const displayEvents = event.aiEvents && event.aiEvents.length > 0 
            ? event.aiEvents 
            : generateFallbackEvents(event);
            
        const displayOutcomes = event.aiOutcomes && event.aiOutcomes.length > 0 
            ? event.aiOutcomes 
            : generateFallbackOutcomes();
            
        const displayLesson = event.aiLesson || generateFallbackLesson();
        
        const hasAI = event.hasAI || false;
        
        return `
            <div class="alternate-path-card ${hasAI ? 'ai-generated' : ''}">
                ${hasAI ? '<div></div>' : ''}
                
                <div class="alternate-header">
                    <div class="alternate-title">
                        <i class="fas fa-code-branch" style="color: var(--secondary);"></i>
                        <h3>${event.title}</h3>
                    </div>
                    <div class="divergence-badge" style="background: ${getDivergenceColor(event.divergence)};">
                        ${event.divergence}% divergent
                    </div>
                </div>
                
                <div class="alternate-description">
                    <p>${event.description}</p>
                </div>
                
                <div class="probability-meter">
                    <div class="meter-label">
                        <span>reality probability</span>
                        <span>${event.probability}%</span>
                    </div>
                    <div class="meter-bar">
                        <div class="meter-fill" style="width: ${event.probability}%; background: var(--secondary);"></div>
                    </div>
                </div>
                
                <div class="alternate-timeline">
                    <h4>📅 What would have happened:</h4>
                    ${renderAlternateEvents(displayEvents)}
                </div>
                
                <div class="alternate-outcomes">
                    <h4>🎭 Different outcomes:</h4>
                    <ul class="outcomes-list">
                        ${displayOutcomes.map(outcome => `
                            <li>
                                <i class="fas fa-${outcome.icon}" style="color: ${outcome.color || 'var(--primary)'};"></i>
                                <span>${outcome.text}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="alternate-lessons">
                    <h4>💭 What this teaches you:</h4>
                    <p>${displayLesson}</p>
                </div>
                
                <div class="alternate-actions">
                    <button class="event-btn" onclick="exploreDeeper('${event.id}')" style="background: var(--secondary); color: white;">
                        <i class="fas fa-search"></i>
                        explore deeper
                    </button>
                    <button class="event-btn" onclick="mergeReality('${event.id}')" style="background: var(--primary); color: white;">
                        <i class="fas fa-merge"></i>
                        merge insights
                    </button>
                    <button class="event-btn" onclick="deleteAlternateEvent('${event.id}')" style="color: var(--error);">
                        <i class="fas fa-trash"></i>
                        discard
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Fallback generators for display
function generateFallbackEvents(event) {
    const events = [];
    const year = event.year || 2024;
    for (let i = 1; i <= 3; i++) {
        events.push({
            year: year + i * 2,
            description: generateFallbackEventDescription(i)
        });
    }
    return events;
}

function generateFallbackOutcomes() {
    return [
        { icon: 'briefcase', color: 'var(--success)', text: 'Your career would have taken a different path' },
        { icon: 'heart', color: 'var(--accent)', text: 'Different relationships would have formed' },
        { icon: 'location-dot', color: 'var(--primary)', text: 'You might be living somewhere else' },
        { icon: 'brain', color: 'var(--secondary)', text: 'You would have learned different lessons' }
    ];
}

function generateFallbackLesson() {
    const lessons = [
        "Every choice leads to a different version of yourself. This alternate path shows you what you valued at that moment.",
        "The path not taken isn't necessarily better or worse - just different. It reveals your priorities at the time.",
        "This alternate reality highlights the courage it took to make your original choice.",
        "Seeing this path helps you appreciate the unique journey you're on.",
        "Your choices define you, but exploring alternatives helps you understand yourself better."
    ];
    return lessons[Math.floor(Math.random() * lessons.length)];
}

// Get color based on divergence
function getDivergenceColor(divergence) {
    if (divergence < 30) return 'var(--success)';
    if (divergence < 60) return 'var(--warning)';
    return 'var(--error)';
}

// Render alternate timeline events
function renderAlternateEvents(events) {
    if (!events || events.length === 0) {
        return '<p>No events in this timeline</p>';
    }
    
    return events.map(event => `
        <div class="alternate-event">
            <span class="event-year">${event.year || '?'}</span>
            <div class="event-details">
                <p>${event.description || event.title || 'An important moment'}</p>
            </div>
        </div>
    `).join('');
}

// Explore deeper into an alternate path
async function exploreDeeper(eventId) {
    const event = alternateEvents.find(e => e.id === eventId);
    if (!event) return;
    
    showToast('🔍 Diving deeper into this reality...', 'success');
    showLoading('exploring deeper reality...');

    // Create an even more detailed alternate path
    const deeperEvent = {
        userId: currentUser.uid,
        title: `🔮 Deeper: ${event.title}`,
        description: `A more detailed exploration of: ${event.description}`,
        year: (event.year || 2024) + 5,
        originalEventId: event.id,
        dimension: 'future',
        probability: Math.floor(Math.random() * 50),
        divergence: Math.min(100, (event.divergence || 50) + 20),
        createdAt: Date.now(),
        // Inherit AI content from parent
        aiEvents: event.aiEvents,
        aiOutcomes: event.aiOutcomes,
        aiLesson: event.aiLesson,
        hasAI: event.hasAI
    };

    try {
        const docRef = await db.collection('users').doc(currentUser.uid).collection('alternateEvents').add(deeperEvent);
        deeperEvent.id = docRef.id;
        alternateEvents.push(deeperEvent);
        
        hideLoading();
        showToast('✨ Deeper reality revealed!', 'success');
        
        // Automatically navigate to alternate paths page
        setTimeout(() => {
            // Navigate to alternate paths page
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            
            document.getElementById('alternatePage').classList.add('active');
            
            document.querySelectorAll('.menu-item').forEach(item => {
                if (item.textContent.includes('alternate paths')) {
                    item.classList.add('active');
                }
            });
            
            loadAlternatePaths();
            showToast('📂 Showing deeper reality', 'success');
        }, 1500);
        
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        showToast(error.message, 'error');
    }
}

// Merge insights from alternate path
async function mergeReality(eventId) {
    const event = alternateEvents.find(e => e.id === eventId);
    if (!event) {
        showToast('alternate path not found', 'error');
        return;
    }
    
    showToast('🧠 Merging insights from this reality...', 'success');
    showLoading('merging insights...');
    
    // Create a reflection event in main timeline
    const insightEvent = {
        userId: currentUser.uid,
        title: '💭 Alternate reality insight',
        description: `Reflecting on: ${event.title}. This taught me that ${generateInsight()}`,
        year: new Date().getFullYear(),
        dimension: 'present',
        probability: 100,
        createdAt: Date.now()
    };
    
    try {
        // First, add the insight to main timeline
        const docRef = await db.collection('users').doc(currentUser.uid).collection('events').add(insightEvent);
        insightEvent.id = docRef.id;
        events.push(insightEvent);
        
        // Then, delete the alternate path
        await db.collection('users').doc(currentUser.uid).collection('alternateEvents').doc(eventId).delete();
        
        // Remove from local array
        alternateEvents = alternateEvents.filter(e => e.id !== eventId);
        
        // Refresh both views
        loadAlternatePaths();
        loadTimeline();
        updateStats();
        
        hideLoading();
        showToast('✅ Insight added and alternate path merged!', 'success');
        
        // Ask if user wants to see the new insight
        setTimeout(() => {
            if (confirm('View your new insight in the main timeline?')) {
                // Navigate to timeline
                document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                
                document.getElementById('timelinePage').classList.add('active');
                
                document.querySelectorAll('.menu-item').forEach(item => {
                    if (item.textContent.includes('main timeline')) {
                        item.classList.add('active');
                    }
                });
                
                loadTimeline();
            }
        }, 1500);
        
    } catch (error) {
        hideLoading();
        console.error('Error merging reality:', error);
        showToast(error.message, 'error');
    }
}

// Generate insight based on alternate path
function generateInsight() {
    const insights = [
        "every choice I make creates a different version of me",
        "I should be more grateful for the path I'm on",
        "there's value in exploring different possibilities",
        "my current path has its own unique beauty",
        "the road not taken isn't always better"
    ];
    return insights[Math.floor(Math.random() * insights.length)];
}

// ==================== CREATE PARADOX ====================
async function createParadox(eventId) {
    showToast('⚠️ timeline paradox detected', 'warning');
    showLoading('creating paradox...');

    const paradoxEvent = {
        userId: currentUser.uid,
        title: '⚠️ timeline paradox',
        description: 'you created a paradox by interacting with your own timeline',
        year: new Date().getFullYear(),
        dimension: 'present',
        probability: 0,
        createdAt: Date.now()
    };

    try {
        const docRef = await db.collection('users').doc(currentUser.uid).collection('events').add(paradoxEvent);
        paradoxEvent.id = docRef.id;
        events.push(paradoxEvent);
        loadTimeline();
        updateStats();
        hideLoading();
        showToast('⚠️ paradox created!', 'warning');
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        showToast(error.message, 'error');
    }
}

// ==================== PUTER.AI INTEGRATION ====================
function isPuterAvailable() {
    const available = typeof puter !== 'undefined' && puter.ai !== undefined;
    console.log('🔍 Puter.ai available:', available);
    return available;
}

// Generate description with better error handling
async function generateAIDescription(title, year, dimension) {
    if (!isPuterAvailable()) {
        console.log('Puter.ai not available - cannot generate description');
        showToast('AI not available - please check Puter login', 'warning');
        return null;
    }
    
    try {
        console.log('🎨 Generating AI description for:', title);
        
        const prompt = `Create a poetic, meaningful description for this timeline event:
        Title: "${title}"
        Year: ${year}
        Type: ${dimension} event (${dimension === 'past' ? 'already happened' : dimension === 'future' ? 'future goal' : 'present moment'})
        
        Make it personal, reflective, and 1-2 sentences long. Don't use quotes in the response.`;
        
        const response = await puter.ai.chat(prompt);
        console.log('✅ AI response received:', response);
        
        // Extract text from response
        const extractedText = extractTextFromPuterResponse(response);
        return extractedText ? extractedText.trim() : null;
    } catch (error) {
        console.error('❌ AI Description Error:', error);
        return null;
    }
}

// Suggest events by mood with better error handling
async function suggestEventsByMood(mood) {
    if (!isPuterAvailable()) {
        console.log('Puter.ai not available');
        return [];
    }
    
    try {
        console.log('💭 Getting suggestions for mood:', mood);
        
        const prompt = `Suggest 3 meaningful timeline events someone feeling "${mood}" might want to document.
        Format each exactly like this:
        Title: [short title] - [brief description]
        
        Make them personal and specific.`;
        
        const response = await puter.ai.chat(prompt);
        console.log('✅ AI suggestions received:', response);
        
        // Extract text from response
        const responseText = extractTextFromPuterResponse(response);
        
        if (!responseText) return [];
        
        // Parse the response
        const suggestions = [];
        const lines = responseText.split('\n').filter(line => line.trim().length > 0);
        
        for (const line of lines) {
            if (line.includes('-')) {
                const parts = line.split('-');
                let title = parts[0].replace('Title:', '').trim();
                let description = parts[1].trim();
                
                // Clean up title
                title = title.replace(/^["'\s]+|["'\s]+$/g, '');
                
                suggestions.push({ title, description });
            }
        }
        
        return suggestions.length ? suggestions : [
            { title: 'a moment of gratitude', description: 'feeling thankful for the little things' },
            { title: 'new beginning', description: 'starting a fresh chapter' },
            { title: 'unexpected joy', description: 'a surprise that made me smile' }
        ];
    } catch (error) {
        console.error('❌ AI Suggestions Error:', error);
        return [];
    }
}

// Show AI suggestions with loading state
async function showAISuggestions() {
    const aiButton = event.currentTarget;
    const originalHtml = aiButton.innerHTML;
    
    if (!isPuterAvailable()) {
        showToast('Please log in to Puter first', 'warning');
        // Try to trigger Puter login
        if (typeof puter !== 'undefined') {
            try {
                await puter.ui.alert('Please log in to Puter to use AI features');
            } catch (e) {
                console.log('Puter login triggered');
            }
        }
        return;
    }
    
    // Show loading state
    aiButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    aiButton.disabled = true;
    showToast('✨ AI is thinking...', 'success');
    
    const moods = ['grateful', 'excited', 'thoughtful', 'nostalgic', 'hopeful', 'adventurous'];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    
    try {
        const suggestions = await suggestEventsByMood(randomMood);
        
        if (suggestions.length > 0) {
            const suggestion = suggestions[0];
            document.getElementById('eventTitle').value = suggestion.title;
            document.getElementById('eventDescription').value = suggestion.description;
            showToast('✨ AI suggestion ready!', 'success');
        } else {
            // Fallback suggestions
            const fallbacks = [
                { title: 'a moment of gratitude', description: 'feeling thankful for the little things' },
                { title: 'new beginning', description: 'starting a fresh chapter' },
                { title: 'unexpected joy', description: 'a surprise that made me smile' }
            ];
            const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            document.getElementById('eventTitle').value = fallback.title;
            document.getElementById('eventDescription').value = fallback.description;
            showToast('using default suggestion', 'success');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('failed to get suggestions', 'error');
    } finally {
        // Reset button
        aiButton.innerHTML = originalHtml;
        aiButton.disabled = false;
    }
}

/**
 * Extract text from Puter response (handles different formats)
 */
function extractTextFromPuterResponse(response) {
    if (!response) return null;
    
    console.log('Extracting from response type:', typeof response);
    
    // Path 1: response.message.content (most common)
    if (response.message && response.message.content) {
        console.log('✅ Found message.content');
        return response.message.content;
    }
    
    // Path 2: response.message (if it's a string)
    if (response.message && typeof response.message === 'string') {
        console.log('✅ Found message string');
        return response.message;
    }
    
    // Path 3: response.choices[0].message.content (OpenAI format)
    if (response.choices && response.choices[0] && response.choices[0].message) {
        console.log('✅ Found choices format');
        return response.choices[0].message.content;
    }
    
    // Path 4: response.text
    if (response.text) {
        console.log('✅ Found text property');
        return response.text;
    }
    
    // Path 5: response.content
    if (response.content) {
        console.log('✅ Found content property');
        return response.content;
    }
    
    // Path 6: response as string
    if (typeof response === 'string') {
        console.log('✅ Found direct string');
        return response;
    }
    
    console.log('❌ No extractable text found');
    return null;
}

// Add this function to manually trigger Puter login
async function loginToPuter() {
    if (typeof puter === 'undefined') {
        showToast('Puter.js not loaded', 'error');
        return;
    }
    
    try {
        showToast('Connecting to Puter...', 'success');
        // This will trigger Puter's auth flow
        await puter.ui.alert('Welcome to Chrono AI! Please log in to use AI features.');
        setTimeout(checkAIStatus, 2000);
    } catch (error) {
        console.error('Puter login error:', error);
        showToast('Failed to connect to Puter', 'error');
    }
}

/**
 * Main function to enhance capsule message with AI
 */
async function enhanceCapsuleMessageWithAI() {
    console.log('🎯 Enhance button clicked');
    
    // Get the message input
    const messageInput = document.getElementById('capsuleMessage');
    const yearsInput = document.getElementById('capsuleYears');
    
    // Check if message input exists
    if (!messageInput) {
        console.error('❌ Capsule message input not found');
        alert('Error: Message input not found. Please refresh the page.');
        return;
    }
    
    // Get the message text
    const originalMessage = messageInput.value.trim();
    
    if (!originalMessage) {
        showToast('Please write a message first', 'warning');
        messageInput.focus();
        return;
    }
    
    // Check if Puter is available
    if (!isPuterAvailable()) {
        showToast('AI features not available', 'warning');
        
        // Try to initialize Puter
        if (typeof puter !== 'undefined') {
            try {
                showToast('Connecting to AI...', 'success');
                await puter.ui.alert('Welcome to Chrono AI! Please log in to use AI features.');
                setTimeout(() => {
                    if (isPuterAvailable()) {
                        showToast('✅ AI connected! Try again', 'success');
                    }
                }, 2000);
            } catch (e) {
                console.log('Puter connection triggered');
            }
        } else {
            showToast('Puter.js not loaded', 'error');
        }
        return;
    }
    
    // Get years value
    const years = yearsInput ? parseInt(yearsInput.value) || 10 : 10;
    const currentYear = new Date().getFullYear();
    const futureYear = currentYear + years;
    
    // Get the button and show loading state
    const enhanceBtn = document.getElementById('enhanceAIBtn') || event?.currentTarget;
    let originalBtnText = 'Enhance';
    
    if (enhanceBtn) {
        originalBtnText = enhanceBtn.innerHTML;
        enhanceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> enhancing...';
        enhanceBtn.disabled = true;
    }
    
    showToast('✨ AI is thinking...', 'success');
    
    try {
        // Create the prompt
        const prompt = `You are a thoughtful AI assistant for a time capsule app. 
        Improve this message someone is writing to their future self (will open in ${years} years, in ${futureYear}):
        
        Original message: "${originalMessage}"
        
        Make it more meaningful, reflective, and personal. Keep the core sentiment but enhance it.
        Return ONLY the enhanced message as plain text, no explanations, no quotes, no extra text.
        The message should be 2-3 sentences maximum.`;
        
        console.log('📤 Sending to AI:', prompt);
        
        // Call Puter.ai
        const response = await puter.ai.chat(prompt);
        console.log('📥 AI response:', response);
        
        // Extract the text from response
        let enhancedMessage = extractTextFromPuterResponse(response);
        
        // Clean up the message
        if (enhancedMessage) {
            // Remove any quotes
            enhancedMessage = enhancedMessage.replace(/^["']|["']$/g, '');
            // Trim whitespace
            enhancedMessage = enhancedMessage.trim();
            
            // Update the input
            messageInput.value = enhancedMessage;
            showToast('✅ Message enhanced!', 'success');
        } else {
            // Fallback enhancements if AI fails
            const fallbacks = [
                "Remember this moment, it shaped who you become. Keep pushing forward, your future self is counting on you. You've got this!",
                "This is just the beginning. Every step you take leads to amazing places. Trust the journey.",
                "Future you will look back and smile at this moment. Keep going, you're doing great things!"
            ];
            const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            messageInput.value = originalMessage + ' ' + randomFallback;
            showToast('Using default enhancement', 'success');
        }
        
    } catch (error) {
        console.error('❌ AI Error:', error);
        showToast('AI enhancement failed: ' + error.message, 'error');
        
        // Simple fallback
        const simpleEnhancements = [
            " Keep being awesome!",
            " Your future self is proud of you.",
            " This moment matters more than you know."
        ];
        const random = simpleEnhancements[Math.floor(Math.random() * simpleEnhancements.length)];
        messageInput.value = originalMessage + random;
    } finally {
        // Reset button
        if (enhanceBtn) {
            enhanceBtn.innerHTML = originalBtnText;
            enhanceBtn.disabled = false;
        }
    }
}

// ==================== UTILITY FUNCTIONS ====================
function enterUniverse(universeName) {
    showToast(`entering ${universeName}...`, 'success');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toast.className = 'toast ' + type;
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==================== MOBILE NAVIGATION ====================
function addMobileNavigation() {
    if (!document.querySelector('.mobile-nav')) {
        const mobileNav = document.createElement('div');
        mobileNav.className = 'mobile-nav';
        mobileNav.innerHTML = `
            <div class="mobile-nav-item active" onclick="switchPageMobile('timeline')">
                <i class="fas fa-stream"></i><span>timeline</span>
            </div>
            <div class="mobile-nav-item" onclick="switchPageMobile('universes')">
                <i class="fas fa-globe"></i><span>universes</span>
            </div>
            <div class="mobile-nav-item" onclick="switchPageMobile('capsules')">
                <i class="fas fa-hourglass"></i><span>capsules</span>
            </div>
            <div class="mobile-nav-item" onclick="toggleMobileSidebar()">
                <i class="fas fa-bars"></i><span>menu</span>
            </div>
        `;
        document.getElementById('mainApp').appendChild(mobileNav);
    }

    if (!document.querySelector('.mobile-sidebar')) {
        const overlay = document.createElement('div');
        overlay.className = 'mobile-sidebar-overlay';
        overlay.id = 'mobileSidebarOverlay';
        overlay.onclick = closeMobileSidebar;
        document.body.appendChild(overlay);

        const sidebar = document.createElement('div');
        sidebar.className = 'mobile-sidebar';
        sidebar.id = 'mobileSidebar';
        sidebar.innerHTML = `
            <div class="mobile-sidebar-header">
                <h3>menu</h3>
                <i class="fas fa-times mobile-sidebar-close" onclick="closeMobileSidebar()"></i>
            </div>
            <div class="sidebar-section">
                <div class="menu-item" onclick="switchPageMobile('timeline'); closeMobileSidebar()"><i class="fas fa-stream"></i>main timeline</div>
                <div class="menu-item" onclick="switchPageMobile('alternate'); closeMobileSidebar()"><i class="fas fa-code-branch"></i>alternate paths</div>
                <div class="menu-item" onclick="switchPageMobile('memories'); closeMobileSidebar()"><i class="fas fa-clock"></i>memories</div>
                <div class="menu-item" onclick="switchPageMobile('universes'); closeMobileSidebar()"><i class="fas fa-globe"></i>universes</div>
                <div class="menu-item" onclick="switchPageMobile('capsules'); closeMobileSidebar()"><i class="fas fa-hourglass"></i>capsules</div>
                <div class="menu-item" onclick="switchPageMobile('profile'); closeMobileSidebar()"><i class="fas fa-user"></i>profile</div>
                <div class="menu-item" onclick="logout(); closeMobileSidebar()"><i class="fas fa-sign-out"></i>sign out</div>
            </div>
        `;
        document.body.appendChild(sidebar);
    }
}

function toggleMobileSidebar() {
    document.getElementById('mobileSidebar').classList.toggle('active');
    document.getElementById('mobileSidebarOverlay').classList.toggle('active');
}

function closeMobileSidebar() {
    document.getElementById('mobileSidebar').classList.remove('active');
    document.getElementById('mobileSidebarOverlay').classList.remove('active');
}

function switchPageMobile(page) {
    document.querySelectorAll('.mobile-nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    const clickedItem = event.currentTarget;
    clickedItem.classList.add('active');
    
    document.getElementById(page + 'Page').classList.add('active');

    showLoading(`loading ${page}...`);
    
    setTimeout(() => {
        if (page === 'timeline') loadTimeline();
        if (page === 'alternate') loadAlternatePaths();
        if (page === 'memories') loadMemories();
        if (page === 'universes') loadUniverses();
        if (page === 'capsules') loadCapsules();
        hideLoading();
    }, 300);
}

// ==================== FAB MENU FUNCTIONS ====================
function toggleFabMenu() {
    const options = document.getElementById('fabOptions');
    const fab = document.querySelector('.fab');
    options.classList.toggle('show');
    fab.classList.toggle('active');
    
    // Optional: Add haptic feedback on mobile
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(10);
    }
}

// Close FAB menu when clicking outside
document.addEventListener('click', function(event) {
    const fabContainer = document.querySelector('.fab-container');
    const options = document.getElementById('fabOptions');
    const fab = document.querySelector('.fab');
    
    if (fabContainer && !fabContainer.contains(event.target) && options && options.classList.contains('show')) {
        options.classList.remove('show');
        fab.classList.remove('active');
    }
});

// Close FAB menu on scroll (optional)
window.addEventListener('scroll', function() {
    const options = document.getElementById('fabOptions');
    const fab = document.querySelector('.fab');
    if (options && options.classList.contains('show')) {
        options.classList.remove('show');
        fab.classList.remove('active');
    }
});

// ==================== ENHANCED PARALLEL UNIVERSES ====================
function loadUniverses() {
    const container = document.getElementById('universesGrid');
    
    // Get current universe from localStorage or default to 'alpha prime'
    const currentUniverse = localStorage.getItem('chrono_current_universe') || 'alpha prime';
    
    container.innerHTML = universes.map(universe => {
        const isActive = universe.name === currentUniverse;
        
        return `
            <div class="universe-card ${isActive ? 'active-universe' : ''}" onclick="selectUniverse('${universe.name}')">
                <div class="universe-icon">
                    <i class="fas ${universe.icon}"></i>
                </div>
                <div class="universe-name">${universe.name}</div>
                <div class="universe-description">${universe.description}</div>
                <div class="universe-meta">
                    <span class="universe-stability ${universe.stability}">
                        <i class="fas fa-${universe.stability === 'stable' ? 'check-circle' : 'exclamation-circle'}"></i>
                        ${universe.stability}
                    </span>
                    <span class="universe-divergence">${universe.divergence} divergence</span>
                </div>
                ${isActive ? '<div class="active-badge"><i class="fas fa-check"></i> Current Universe</div>' : ''}
            </div>
        `;
    }).join('');
    
    // Update theme based on selected universe
    updateUniverseTheme(currentUniverse);
}

// Select a different universe
function selectUniverse(universeName) {
    console.log('🌌 Selecting universe:', universeName);
    
    // Save to localStorage
    localStorage.setItem('chrono_current_universe', universeName);
    
    // Show toast notification
    showToast(`🌌 Entering ${universeName}...`, 'success');
    
    // Reload universes to update active state
    loadUniverses();
    
    // Update theme based on selected universe
    updateUniverseTheme(universeName);
    
    // Apply universe effects to other parts of the app
    applyUniverseEffects(universeName);
}

// Update theme based on selected universe
function updateUniverseTheme(universeName) {
    const root = document.documentElement;
    
    // Remove any existing universe classes
    document.body.classList.remove('universe-alpha', 'universe-beta', 'universe-gamma', 'universe-delta');
    
    // Add class for current universe
    switch(universeName) {
        case 'alpha prime':
            document.body.classList.add('universe-alpha');
            root.style.setProperty('--primary', '#3b82f6');
            root.style.setProperty('--secondary', '#6c6cf0');
            break;
        case 'beta mirror':
            document.body.classList.add('universe-beta');
            // Reverse colors? Add custom effects
            root.style.setProperty('--primary', '#70c8b0');
            root.style.setProperty('--secondary', '#6c6cf0');
            break;
        case 'gamma dreams':
            document.body.classList.add('universe-gamma');
            // Dreamy colors
            root.style.setProperty('--primary', '#b088e0');
            root.style.setProperty('--secondary', '#ec4899');
            break;
        case 'delta void':
            document.body.classList.add('universe-delta');
            // Void colors - more monochrome
            root.style.setProperty('--primary', '#8e8e9a');
            root.style.setProperty('--secondary', '#5e5e6a');
            break;
    }
}

// Apply universe effects to other parts of the app
function applyUniverseEffects(universeName) {
    // Change timeline line color based on universe
    const timelineLine = document.querySelector('.timeline-line');
    if (timelineLine) {
        switch(universeName) {
            case 'alpha prime':
                timelineLine.style.background = 'linear-gradient(to bottom, transparent, var(--secondary), var(--secondary), transparent)';
                break;
            case 'beta mirror':
                timelineLine.style.background = 'linear-gradient(to bottom, transparent, #70c8b0, #70c8b0, transparent)';
                break;
            case 'gamma dreams':
                timelineLine.style.background = 'linear-gradient(to bottom, transparent, #b088e0, #b088e0, transparent)';
                break;
            case 'delta void':
                timelineLine.style.background = 'linear-gradient(to bottom, transparent, #8e8e9a, #8e8e9a, transparent)';
                break;
        }
    }
    
    // Show different welcome messages based on universe
    const messages = {
        'alpha prime': 'Welcome to your home timeline',
        'beta mirror': 'Everything is reversed here...',
        'gamma dreams': 'Your thoughts shape reality',
        'delta void': 'The space between timelines...'
    };
    
    // Store universe preference for other functions
    currentUniverse = universeName;
}

// Get current universe
function getCurrentUniverse() {
    return localStorage.getItem('chrono_current_universe') || 'alpha prime';
}