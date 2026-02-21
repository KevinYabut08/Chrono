// ==================== FIREBASE CONFIGURATION ====================
        // Replace this with your own Firebase config from the Firebase Console
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
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();

        // ==================== THEME MANAGEMENT ====================
        function setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('chrono_theme', theme);
            
            // Update active button
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent.includes(theme)) {
                    btn.classList.add('active');
                }
            });
        }

        // Load saved theme
        const savedTheme = localStorage.getItem('chrono_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update theme buttons to match saved theme
        document.querySelectorAll('.theme-btn').forEach(btn => {
            if (btn.textContent.includes(savedTheme)) {
                btn.classList.add('active');
            }
        });

        // ==================== DATA LAYER ====================
        let currentUser = null;
        let events = [];
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

        // ==================== AUTH STATE OBSERVER ====================
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in
                currentUser = user;
                
                // Load user data from Firestore
                await loadUserData(user.uid);
                
                // Show main app
                document.getElementById('authPage').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                
                // Update UI with user info
                updateUserUI();
                
                // Load data
                loadTimeline();
                loadUniverses();
                loadCapsules();
            } else {
                // User is signed out
                currentUser = null;
                document.getElementById('mainApp').style.display = 'none';
                document.getElementById('authPage').style.display = 'flex';
            }
        });

        // ==================== LOAD USER DATA FROM FIRESTORE ====================
        async function loadUserData(userId) {
            try {
                // Load events
                const eventsSnapshot = await db.collection('users').doc(userId).collection('events').get();
                events = [];
                eventsSnapshot.forEach(doc => {
                    events.push({ id: doc.id, ...doc.data() });
                });

                // Load capsules
                const capsulesSnapshot = await db.collection('users').doc(userId).collection('capsules').get();
                capsules = [];
                capsulesSnapshot.forEach(doc => {
                    capsules.push({ id: doc.id, ...doc.data() });
                });

                // If no events exist, create sample data
                if (events.length === 0) {
                    await createSampleData(userId);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
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

            try {
                await auth.signInWithEmailAndPassword(email, password);
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

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                
                // Update profile with name
                await userCredential.user.updateProfile({
                    displayName: name
                });

                // Create user document in Firestore
                await db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: Date.now()
                });

                showToast('account created', 'success');
            } catch (error) {
                errorEl.textContent = error.message;
                errorEl.classList.add('show');
            }
        }

        async function loginWithGoogle() {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            try {
                await auth.signInWithPopup(provider);
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        async function logout() {
            try {
                await auth.signOut();
                showToast('signed out', 'success');
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        // ==================== UI FUNCTIONS ====================
        function updateUserUI() {
            if (currentUser) {
                const name = currentUser.displayName || 'User';
                const email = currentUser.email || '';
                const initial = name.charAt(0).toUpperCase();
                
                document.getElementById('navName').textContent = name.split(' ')[0];
                document.getElementById('navAvatar').textContent = initial;
                document.getElementById('profileName').textContent = name;
                document.getElementById('profileEmail').textContent = email;
                document.getElementById('profileAvatar').textContent = initial;
                
                const joinDate = new Date(currentUser.metadata.creationTime);
                document.getElementById('profileDate').textContent = joinDate.getFullYear();
                
                // Update stats
                updateStats();
            }
        }

        function updateStats() {
            const userEvents = events.filter(e => e.userId === currentUser?.uid);
            const pastEvents = userEvents.filter(e => e.dimension === 'past').length;
            const futureEvents = userEvents.filter(e => e.dimension === 'future').length;
            
            document.getElementById('statEvents').textContent = userEvents.length;
            document.getElementById('profileEvents').textContent = userEvents.length;
            document.getElementById('quickStatsEvents').textContent = userEvents.length;
            document.getElementById('quickStatsPast').textContent = pastEvents;
            document.getElementById('quickStatsFuture').textContent = futureEvents;
            
            document.getElementById('statUniverses').textContent = universes.length;
            document.getElementById('profileUniverses').textContent = universes.length;
            
            document.getElementById('statCapsules').textContent = capsules.length;
            document.getElementById('profileCapsules').textContent = capsules.length;
        }

        function switchPage(page) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            event.currentTarget.classList.add('active');

            document.querySelectorAll('.page').forEach(p => {
                p.classList.remove('active');
            });
            
            document.getElementById(page + 'Page').classList.add('active');
            
            if (page === 'timeline') loadTimeline();
            if (page === 'universes') loadUniverses();
            if (page === 'capsules') loadCapsules();
        }

        // ==================== TIMELINE FUNCTIONS ====================
        function loadTimeline() {
            const container = document.getElementById('timelineEvents');
            const userEvents = events.filter(e => e.userId === currentUser?.uid);
            
            if (userEvents.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-timeline"></i>
                        <h3>no events yet</h3>
                        <p>click the + button to add your first timeline event</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = userEvents.sort((a, b) => b.year - a.year).map(event => `
                <div class="timeline-event">
                    <div class="event-card">
                        <div class="event-header">
                            <div class="event-date">
                                <i class="fas fa-calendar"></i>
                                ${event.year}
                            </div>
                            <div class="event-mood">
                                <i class="fas fa-${event.dimension === 'past' ? 'history' : event.dimension === 'future' ? 'rocket' : 'clock'}"></i>
                                ${event.dimension}
                            </div>
                        </div>
                        <div class="event-title">${event.title}</div>
                        <div class="event-description">${event.description}</div>
                        
                        ${event.dimension === 'future' ? `
                            <div class="probability-meter">
                                <div class="meter-label">
                                    <span>probability</span>
                                    <span>${event.probability}%</span>
                                </div>
                                <div class="meter-bar">
                                    <div class="meter-fill" style="width: ${event.probability}%;"></div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="event-actions">
                            <button class="event-btn" onclick="exploreAlternate('${event.id}')">
                                <i class="fas fa-code-branch"></i>
                                explore
                            </button>
                            <button class="event-btn" onclick="createParadox('${event.id}')">
                                <i class="fas fa-exclamation-triangle"></i>
                                paradox
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function loadUniverses() {
            const container = document.getElementById('universesGrid');
            
            container.innerHTML = universes.map(universe => `
                <div class="card" onclick="enterUniverse('${universe.name}')">
                    <div class="card-icon">
                        <i class="fas ${universe.icon}"></i>
                    </div>
                    <div class="card-title">${universe.name}</div>
                    <div class="card-description">${universe.description}</div>
                    <div class="card-meta">
                        <i class="fas fa-${universe.stability === 'stable' ? 'check-circle' : 'exclamation-circle'}" 
                           style="color: ${universe.stability === 'stable' ? 'var(--success)' : 'var(--warning)'};"></i>
                        ${universe.stability} · ${universe.divergence} divergence
                    </div>
                </div>
            `).join('');
        }

        function loadCapsules() {
            const container = document.getElementById('capsulesGrid');
            const currentYear = new Date().getFullYear();
            
            if (capsules.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-hourglass"></i>
                        <h3>no time capsules</h3>
                        <p>create a capsule to send a message to your future self</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = capsules.map(capsule => {
                const yearsLeft = capsule.openYear - currentYear;
                const isUnlocked = currentYear >= capsule.openYear;
                
                return `
                    <div class="card ${isUnlocked ? 'unlocked' : ''}" onclick="${isUnlocked ? `openCapsule('${capsule.id}')` : ''}">
                        <div class="card-icon">
                            <i class="fas fa-${isUnlocked ? 'lock-open' : 'lock'}"></i>
                        </div>
                        <div class="card-title">time capsule</div>
                        <div class="card-description">
                            ${capsule.isOpened ? capsule.message : 'sealed message'}
                        </div>
                        <div class="card-meta">
                            <i class="fas fa-hourglass"></i>
                            ${yearsLeft > 0 ? `opens in ${yearsLeft} years` : 'ready to open'}
                        </div>
                    </div>
                `;
            }).join('');
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
            
            document.querySelectorAll('.dimension-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            element.classList.add('selected');
        }

        async function createEvent() {
            const title = document.getElementById('eventTitle').value;
            const description = document.getElementById('eventDescription').value;
            const year = document.getElementById('eventYear').value;

            if (!title) {
                showToast('title is required', 'error');
                return;
            }

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
                showToast('event added to timeline', 'success');
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        // ==================== INTERACTION FUNCTIONS ====================
        async function exploreAlternate(eventId) {
            const event = events.find(e => e.id === eventId);
            
            if (event) {
                const newEvent = {
                    userId: currentUser.uid,
                    title: `${event.title} (alternate)`,
                    description: `a different path from: ${event.description}`,
                    year: event.year + 1,
                    dimension: 'future',
                    probability: Math.floor(Math.random() * 100),
                    createdAt: Date.now()
                };

                try {
                    const docRef = await db.collection('users').doc(currentUser.uid).collection('events').add(newEvent);
                    newEvent.id = docRef.id;
                    events.push(newEvent);
                    
                    updateStats();
                    loadTimeline();
                    showToast('alternate timeline created', 'success');
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }
        }

        async function createParadox(eventId) {
            showToast('⚠️ timeline paradox detected', 'warning');
            
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
                
                updateStats();
                loadTimeline();
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        function enterUniverse(universeName) {
            showToast(`entering ${universeName}...`, 'success');
        }

        async function openCapsule(capsuleId) {
            const capsule = capsules.find(c => c.id === capsuleId);
            
            if (capsule && !capsule.isOpened) {
                capsule.isOpened = true;
                
                try {
                    await db.collection('users').doc(currentUser.uid).collection('capsules').doc(capsuleId).update({
                        isOpened: true
                    });
                    
                    loadCapsules();
                    showToast(`📨 ${capsule.message}`, 'success');
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }
        }

        // ==================== UTILITY FUNCTIONS ====================
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            const toastMessage = document.getElementById('toastMessage');
            
            toast.className = 'toast ' + type;
            toastMessage.textContent = message;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }