// App State Management
const AppState = {
    user: JSON.parse(localStorage.getItem('sloms_user')) || null,
    
    setUser(userData) {
        this.user = userData;
        if (userData) {
            localStorage.setItem('sloms_user', JSON.stringify(userData));
        } else {
            localStorage.removeItem('sloms_user');
        }
    },
    
    isLoggedIn() {
        return !!this.user;
    },
    
    isAdmin() {
        return this.user && this.user.role === 'admin';
    },

    isStudent() {
        return this.user && this.user.role === 'student';
    }
};

// Router & App Initialization
const App = {
    init() {
        this.checkAuth();
        this.setupNavigation();
    },

    checkAuth() {
        const path = window.location.hash || '#/';
        
        if (path === '#/' || path === '') {
            this.renderLandingPage();
        } else if (path === '#/login') {
            if (AppState.isLoggedIn()) {
                window.location.hash = AppState.isAdmin() ? '#/admin' : '#/student';
            } else {
                this.renderLoginPage();
            }
        } else {
            // Protected routes
            if (!AppState.isLoggedIn()) {
                window.location.hash = '#/login';
                return;
            }

            if (path.startsWith('#/admin') && !AppState.isAdmin()) {
                window.location.hash = '#/student';
                return;
            }

            if (path.startsWith('#/student') && !AppState.isStudent()) {
                window.location.hash = '#/admin';
                return;
            }

            // Valid session, render shell
            this.renderShell();
            
            // Route to specific view
            this.route(path);
        }
    },

    setupNavigation() {
        window.addEventListener('hashchange', () => {
            this.checkAuth();
        });

        // Setup logout global listener
        document.addEventListener('click', (e) => {
            const logoutBtn = e.target.closest('#logout-btn');
            if (logoutBtn) {
                AppState.setUser(null);
                window.location.hash = '#/';
                Components.showToast('Logged out successfully', 'info');
            }
        });
    },

    renderLandingPage() {
        document.getElementById('app-shell').classList.add('hidden');
        const fullPage = document.getElementById('full-page');
        fullPage.classList.remove('hidden');

        fullPage.innerHTML = `
            <div class="flex-1 flex flex-col pt-20 px-6 items-center justify-center bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10">
                <div class="text-center max-w-3xl">
                    <div class="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-200">
                        <i data-lucide="graduation-cap" class="w-5 h-5 text-primary-start text-[#667eea]"></i>
                        <span class="text-sm font-semibold text-gray-700">SLOMS Platform</span>
                    </div>
                    <h1 class="text-5xl md:text-6xl font-display font-bold text-gray-900 mb-6 leading-tight">
                        Student Learning Outcome <br/>
                        <span class="gradient-text">Management System</span>
                    </h1>
                    <p class="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                        A comprehensive educational platform for managing students, tracking assessments, and analyzing learning outcomes with modern analytics.
                    </p>
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="#/login" class="px-8 py-3 rounded-xl text-white font-medium hover-lift gradient-bg transition-colors w-full sm:w-auto text-center">
                            Get Started
                        </a>
                        <button onclick="document.getElementById('demo-creds').classList.toggle('hidden')" class="px-8 py-3 rounded-xl bg-white text-gray-700 font-medium hover-lift border border-gray-200 transition-colors w-full sm:w-auto text-center">
                            View Demo Credentials
                        </button>
                    </div>

                    <div id="demo-creds" class="hidden mt-8 p-6 bg-white rounded-2xl shadow-card border border-gray-100 text-left w-full max-w-md mx-auto">
                        <h3 class="font-bold text-gray-800 mb-4 border-b pb-2">Demo Admin Credentials</h3>
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-500">Email:</span>
                                <span class="font-mono text-gray-800 font-medium">sadiq123@gmail.com</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Password:</span>
                                <span class="font-mono text-gray-800 font-medium">sadiq@2007</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-20">
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover-lift relative overflow-hidden">
                        <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                            <i data-lucide="users"></i>
                        </div>
                        <h3 class="font-bold text-lg mb-2">Student Management</h3>
                        <p class="text-gray-500 text-sm">Easily track and manage student profiles, grades, and historical performance data.</p>
                    </div>
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover-lift">
                        <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                            <i data-lucide="line-chart"></i>
                        </div>
                        <h3 class="font-bold text-lg mb-2">Performance Analytics</h3>
                        <p class="text-gray-500 text-sm">Visualize assessment data with interactive charts and automated outcome measurements.</p>
                    </div>
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover-lift">
                        <div class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                            <i data-lucide="target"></i>
                        </div>
                        <h3 class="font-bold text-lg mb-2">Learning Outcomes</h3>
                        <p class="text-gray-500 text-sm">Set goals and monitor progress with color-coded status indicators and radar analysis.</p>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    renderLoginPage() {
        document.getElementById('app-shell').classList.add('hidden');
        const fullPage = document.getElementById('full-page');
        fullPage.classList.remove('hidden');

        fullPage.innerHTML = `
            <div class="flex-1 flex items-center justify-center bg-gray-50 p-6">
                <div class="w-full max-w-md bg-white rounded-3xl shadow-card p-8 border border-gray-100">
                    <div class="text-center mb-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg text-white mb-4 shadow-lg">
                            <i data-lucide="graduation-cap" class="w-8 h-8"></i>
                        </div>
                        <h2 class="text-2xl font-display font-bold text-gray-900">Welcome Back</h2>
                        <p class="text-sm text-gray-500 mt-1">Sign in to your account</p>
                    </div>

                    <form id="login-form" class="space-y-5">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i data-lucide="mail" class="w-5 h-5 text-gray-400"></i>
                                </div>
                                <input type="email" id="email" required class="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none transition-all outline-none" placeholder="you@example.com">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i data-lucide="lock" class="w-5 h-5 text-gray-400"></i>
                                </div>
                                <input type="password" id="password" required class="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none transition-all outline-none" placeholder="••••••••">
                            </div>
                        </div>
                        <button type="submit" id="login-btn" class="w-full py-3 px-4 gradient-bg text-white font-medium rounded-xl hover-lift focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#667eea] mt-4 flex justify-center items-center">
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        `;
        lucide.createIcons();

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('login-btn');
            const originalText = btn.innerHTML;
            
            try {
                btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>';
                btn.disabled = true;

                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                const res = await api.auth.login(email, password);
                
                AppState.setUser(res.user);
                Components.showToast(`Welcome back, ${res.user.name}!`);
                
                window.location.hash = AppState.isAdmin() ? '#/admin' : '#/student';
            } catch (error) {
                Components.showToast(error.message || 'Login failed', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
                lucide.createIcons({ root: btn });
            }
        });
    },

    renderShell() {
        document.getElementById('full-page').classList.add('hidden');
        document.getElementById('app-shell').classList.remove('hidden');

        // Populate User Info
        document.getElementById('user-name').textContent = AppState.user.name;
        document.getElementById('user-role').textContent = AppState.user.role;
        document.getElementById('user-avatar').textContent = AppState.user.name.charAt(0).toUpperCase();

        // Render Sidebar Navigation
        const nav = document.getElementById('sidebar-nav');
        let links = '';

        if (AppState.isAdmin()) {
            links = `
                <a href="#/admin" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors" data-path="#/admin">
                    <i data-lucide="layout-dashboard" class="w-5 h-5"></i> <span class="font-medium">Dashboard</span>
                </a>
                <a href="#/admin/students" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors" data-path="#/admin/students">
                    <i data-lucide="users" class="w-5 h-5"></i> <span class="font-medium">Students</span>
                </a>
                <a href="#/admin/assessments" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors" data-path="#/admin/assessments">
                    <i data-lucide="file-text" class="w-5 h-5"></i> <span class="font-medium">Assessments</span>
                </a>
                <a href="#/admin/reports" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors" data-path="#/admin/reports">
                    <i data-lucide="bar-chart-2" class="w-5 h-5"></i> <span class="font-medium">Reports</span>
                </a>
                <a href="#/admin/profile" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors" data-path="#/admin/profile">
                    <i data-lucide="user" class="w-5 h-5"></i> <span class="font-medium">Profile</span>
                </a>
            `;
        } else {
            links = `
                <a href="#/student" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors" data-path="#/student">
                    <i data-lucide="layout-dashboard" class="w-5 h-5"></i> <span class="font-medium">Dashboard</span>
                </a>
                <a href="#/student/performance" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors" data-path="#/student/performance">
                    <i data-lucide="target" class="w-5 h-5"></i> <span class="font-medium">My Performance</span>
                </a>
                <a href="#/student/profile" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors" data-path="#/student/profile">
                    <i data-lucide="user" class="w-5 h-5"></i> <span class="font-medium">Profile</span>
                </a>
            `;
        }
        
        links += `
            <div class="mt-8 pt-4 border-t border-gray-100">
                <button id="logout-btn" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
                    <i data-lucide="log-out" class="w-5 h-5"></i> <span class="font-medium">Logout</span>
                </button>
            </div>
        `;

        nav.innerHTML = links;
        this.updateActiveNavLink(window.location.hash);
        lucide.createIcons();
    },

    updateActiveNavLink(path) {
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.path === path) {
                link.classList.add('bg-[#667eea]/10', 'text-[#667eea]');
                link.classList.remove('text-gray-600');
            } else {
                link.classList.remove('bg-[#667eea]/10', 'text-[#667eea]');
                link.classList.add('text-gray-600');
            }
        });
    },

    route(path) {
        this.updateActiveNavLink(path);
        const content = document.getElementById('main-content');
        content.innerHTML = '<div class="flex items-center justify-center h-full"><i data-lucide="loader-2" class="w-8 h-8 animate-spin text-gray-400"></i></div>';
        lucide.createIcons();

        // Clear existing charts if any
        if (window.activeCharts) {
            window.activeCharts.forEach(c => c.destroy());
            window.activeCharts = [];
        } else {
            window.activeCharts = [];
        }

        setTimeout(() => {
            if (AppState.isAdmin()) {
                switch(path) {
                    case '#/admin': AdminViews.renderDashboard(content); break;
                    case '#/admin/students': AdminViews.renderStudents(content); break;
                    case '#/admin/assessments': AdminViews.renderAssessments(content); break;
                    case '#/admin/reports': AdminViews.renderReports(content); break;
                    case '#/admin/profile': AdminViews.renderProfile(content); break;
                    default: window.location.hash = '#/admin'; break;
                }
            } else {
                switch(path) {
                    case '#/student': StudentViews.renderDashboard(content); break;
                    case '#/student/performance': StudentViews.renderPerformance(content); break;
                    case '#/student/profile': StudentViews.renderProfile(content); break;
                    default: window.location.hash = '#/student'; break;
                }
            }
        }, 300); // Tiny delay for smooth transition feel
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
