const StudentViews = {
    renderDashboard: async (container) => {
        document.getElementById('page-title').textContent = 'My Dashboard';
        container.innerHTML = '<div class="text-gray-500">Loading Dashboard...</div>';
        
        try {
            const data = await api.reports.getStudent(AppState.user.id);
            const allAssessments = await api.assessments.getAll(AppState.user.id);
            
            container.innerHTML = `
                <div class="bg-surface p-6 rounded-2xl shadow-sm mb-8 border border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">Welcome back, ${AppState.user.name.split(' ')[0]}!</h2>
                        <p class="text-gray-500 mt-1">Here is the latest overview of your learning progress.</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    ${Components.createDashboardCard('Overall Average', data.overallAverage + '%', 'activity', 'green')}
                    ${Components.createDashboardCard('Assessments Taken', data.assessmentsCount, 'file-text', 'purple')}
                    ${Components.createDashboardCard('Subjects', data.subjectsCompleted, 'book-open', 'orange')}
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                        <h3 class="text-lg font-bold text-gray-800 mb-6">Subject Performance</h3>
                        ${data.subjectPerformance.length > 0 ? `
                        <div class="relative h-64 w-full">
                            <canvas id="student-bar-chart"></canvas>
                        </div>
                        ` : '<div class="text-center py-8 text-gray-400">No assessments taken yet</div>'}
                    </div>

                    <div class="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-6">Recent Activity</h3>
                        <div class="space-y-4">
                            ${allAssessments.slice(-5).reverse().map(a => `
                                <div class="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${a.score >= 70 ? 'bg-success/10 text-success' : a.score >= 50 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'}">
                                            ${a.score}
                                        </div>
                                        <div>
                                            <p class="font-bold text-sm text-gray-900">${a.subject}</p>
                                            <p class="text-xs text-gray-500">${a.type}</p>
                                        </div>
                                    </div>
                                    ${Components.createBadge(a.score)}
                                </div>
                            `).join('')}
                            ${allAssessments.length === 0 ? '<div class="text-center text-sm text-gray-400">No recent activity</div>' : ''}
                        </div>
                    </div>
                </div>
            `;
            lucide.createIcons({ root: container });

            if (data.subjectPerformance.length > 0) {
                const ctx = document.getElementById('student-bar-chart').getContext('2d');
                const chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.subjectPerformance.map(s => s.subject),
                        datasets: [{
                            label: 'Average Score',
                            data: data.subjectPerformance.map(s => s.average),
                            backgroundColor: '#667eea',
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { y: { beginAtZero: true, max: 100 } },
                        plugins: { legend: { display: false } }
                    }
                });
                window.activeCharts.push(chart);
            }
        } catch (e) {
            container.innerHTML = `<div class="text-error bg-error/10 p-4 rounded-xl border border-error/20">Error loading dashboard: ${e.message}</div>`;
        }
    },

    renderPerformance: async (container) => {
        document.getElementById('page-title').textContent = 'My Performance';
        try {
            const data = await api.reports.getStudent(AppState.user.id);
            
            // Calculate strengths and weaknesses
            const sortedByScore = [...data.subjectPerformance].sort((a, b) => b.average - a.average);
            const strongAreas = sortedByScore.filter(s => s.average >= 70);
            const weakAreas = sortedByScore.filter(s => s.average < 50);

            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    ${Components.createDashboardCard('Strong Areas', strongAreas.length, 'trending-up', 'success')}
                    ${Components.createDashboardCard('Areas to Improve', weakAreas.length, 'trending-down', 'error')}
                    ${Components.createDashboardCard('Overall Progress', data.overallAverage + '%', 'target', 'blue')}
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-6">Subject Progress Breakdown</h3>
                        <div class="space-y-5">
                            ${sortedByScore.map(s => Components.createProgressBar(s.subject, s.average)).join('')}
                            ${sortedByScore.length === 0 ? '<div class="text-center py-8 text-gray-400">No data available</div>' : ''}
                        </div>
                    </div>

                    <div class="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-6">Multi-Subject Analysis</h3>
                        ${data.subjectPerformance.length > 2 ? `
                        <div class="relative h-80 w-full flex justify-center">
                            <canvas id="radar-chart"></canvas>
                        </div>
                        ` : '<div class="flex items-center justify-center h-64 text-gray-400 text-sm">Need at least 3 subjects for radar analysis</div>'}
                    </div>
                </div>
            `;
            lucide.createIcons({ root: container });

            if (data.subjectPerformance.length > 2) {
                const ctx = document.getElementById('radar-chart').getContext('2d');
                const chart = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: data.subjectPerformance.map(s => s.subject),
                        datasets: [{
                            label: 'Performance',
                            data: data.subjectPerformance.map(s => s.average),
                            backgroundColor: 'rgba(102, 126, 234, 0.2)',
                            borderColor: '#667eea',
                            pointBackgroundColor: '#667eea',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: '#667eea'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { r: { min: 0, max: 100 } },
                        plugins: { legend: { display: false } }
                    }
                });
                window.activeCharts.push(chart);
            }

        } catch (e) {
            container.innerHTML = `<div class="text-error">Error: ${e.message}</div>`;
        }
    },

    renderProfile: async (container) => {
        document.getElementById('page-title').textContent = 'My Profile';
        try {
            // We can just use the user object in AppState but better to fetch fresh
            const students = await api.students.getAll();
            const p = students.find(s => s.id === AppState.user.id) || AppState.user;

            container.innerHTML = `
                <div class="max-w-2xl mx-auto">
                    <div class="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div class="h-32 bg-gradient-to-r from-[#667eea] to-[#764ba2]"></div>
                        <div class="px-8 pb-8">
                            <div class="-mt-12 flex justify-between items-end mb-8 border-b pb-8 border-gray-100">
                                <div class="flex items-end gap-6">
                                    <div class="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center text-3xl font-bold bg-gradient-to-tr from-[#667eea] to-[#764ba2] text-white">
                                        ${p.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div class="mb-2">
                                        <h2 class="text-2xl font-bold text-gray-900">${p.name}</h2>
                                        <p class="text-gray-500 flex items-center gap-1"><i data-lucide="book" class="w-4 h-4"></i> ${p.grade}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <form id="student-profile-form" class="space-y-6">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input type="text" id="sp-name" value="${p.name}" required class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#667eea]">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input type="email" id="sp-email" value="${p.email}" required class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#667eea]">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Change Password (leave blank to keep)</label>
                                    <input type="password" id="sp-pwd" class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#667eea]" placeholder="••••••••">
                                </div>
                                <div class="pt-4 flex justify-end">
                                    <button type="submit" class="px-6 py-3 gradient-bg text-white font-medium rounded-xl hover-lift shadow-sm">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            lucide.createIcons({ root: container });

            document.getElementById('student-profile-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = {
                    name: document.getElementById('sp-name').value,
                    email: document.getElementById('sp-email').value,
                };
                const pwd = document.getElementById('sp-pwd').value;
                if (pwd) data.password = pwd;

                try {
                    const res = await api.students.update(p.id, data);
                    AppState.setUser(res.student);
                    App.renderShell(); // update navbar info
                    App.route('#/student/profile'); // redraw
                    Components.showToast('Profile updated successfully');
                } catch(err) {
                    Components.showToast(err.message, 'error');
                }
            });

        } catch (e) {
            container.innerHTML = `<div class="text-error">Error: ${e.message}</div>`;
        }
    }
};

window.StudentViews = StudentViews;
