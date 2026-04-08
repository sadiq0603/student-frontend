const AdminViews = {
    renderDashboard: async (container) => {
        document.getElementById('page-title').textContent = 'Admin Dashboard';
        container.innerHTML = '<div class="text-gray-500">Loading Dashboard...</div>';
        
        try {
            const data = await api.reports.getOverall();
            const students = await api.students.getAll();
            
            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    ${Components.createDashboardCard('Total Students', data.totalStudents, 'users', 'blue')}
                    ${Components.createDashboardCard('Total Assessments', data.totalAssessments, 'file-text', 'purple')}
                    ${Components.createDashboardCard('Average Performance', data.overallAverage + '%', 'activity', 'green')}
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 bg-surface rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">Recent Students</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead class="text-xs text-gray-500 bg-gray-50 uppercase">
                                    <tr>
                                        <th class="px-4 py-3 rounded-tl-lg">Name</th>
                                        <th class="px-4 py-3">Email</th>
                                        <th class="px-4 py-3 rounded-tr-lg">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${students.slice(-5).reverse().map((s, i) => `
                                        <tr class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td class="px-4 py-3 font-medium text-gray-900">${s.name}</td>
                                            <td class="px-4 py-3 text-gray-500">${s.email}</td>
                                            <td class="px-4 py-3 text-gray-500">${s.grade}</td>
                                        </tr>
                                    `).join('')}
                                    ${students.length === 0 ? `<tr><td colspan="3" class="text-center py-6 text-gray-500">No students found</td></tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">Performance Overview</h3>
                        ${data.totalAssessments > 0 ? `
                        <div class="relative h-64 w-full">
                            <canvas id="admin-doughnut-chart"></canvas>
                        </div>
                        ` : '<div class="flex items-center justify-center h-48 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">No data available yet</div>'}
                    </div>
                </div>
            `;
            lucide.createIcons({ root: container });

            if (data.totalAssessments > 0) {
                const ctx = document.getElementById('admin-doughnut-chart').getContext('2d');
                const chart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: data.subjectPerformance.map(s => s.subject),
                        datasets: [{
                            data: data.subjectPerformance.map(s => s.average),
                            backgroundColor: ['#667eea', '#764ba2', '#22c55e', '#eab308', '#ef4444', '#3b82f6'],
                            borderWidth: 0,
                            cutout: '75%'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
                        }
                    }
                });
                window.activeCharts.push(chart);
            }
        } catch (e) {
            container.innerHTML = `<div class="text-error bg-error/10 p-4 rounded-xl border border-error/20">Error loading dashboard: ${e.message}</div>`;
        }
    },

    renderStudents: async (container) => {
        document.getElementById('page-title').textContent = 'Student Management';
        container.innerHTML = '<div class="text-gray-500">Loading Students...</div>';
        
        const loadTable = async () => {
            try {
                const students = await api.students.getAll();
                
                const groupedStudents = students.reduce((acc, student) => {
                    const grade = student.grade || 'Unassigned';
                    if (!acc[grade]) acc[grade] = [];
                    acc[grade].push(student);
                    return acc;
                }, {});

                const sortedGrades = Object.keys(groupedStudents).sort((a, b) => {
                    const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
                    const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
                    return numA - numB;
                });

                let contentHTML = `
                    <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 class="text-lg font-bold text-gray-800">All Students</h3>
                        <button id="add-student-btn" class="flex items-center gap-2 px-4 py-2 gradient-bg text-white rounded-xl hover-lift text-sm font-medium shadow-sm">
                            <i data-lucide="plus" class="w-4 h-4"></i> Add Student
                        </button>
                    </div>
                    <div class="overflow-x-auto">
                `;

                if (students.length === 0) {
                    contentHTML += `
                        <table class="w-full text-left text-sm">
                            <thead class="text-xs text-gray-500 bg-white uppercase border-b border-gray-100">
                                <tr>
                                    <th class="px-6 py-4">Name</th>
                                    <th class="px-6 py-4">Email</th>
                                    <th class="px-6 py-4">Grade</th>
                                    <th class="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colspan="4" class="text-center py-12 text-gray-500 bg-gray-50/30">No students found. Add one above.</td></tr>
                            </tbody>
                        </table>
                    `;
                } else {
                    contentHTML += `
                        <table class="w-full text-left text-sm">
                    `;
                    sortedGrades.forEach(grade => {
                        contentHTML += `
                            <thead class="text-xs text-gray-800 bg-gray-100 uppercase border-y border-gray-200">
                                <tr>
                                    <th colspan="3" class="px-6 py-3 font-bold text-gray-700">${grade}</th>
                                </tr>
                            </thead>
                            <thead class="text-xs text-gray-400 bg-white uppercase border-b border-gray-100">
                                <tr>
                                    <th class="px-6 py-3 w-1/3">Name</th>
                                    <th class="px-6 py-3 w-1/3">Email</th>
                                    <th class="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50">
                                ${groupedStudents[grade].map(s => `
                                    <tr class="hover:bg-gray-50/50 transition-colors">
                                        <td class="px-6 py-4 font-medium text-gray-900">${s.name}</td>
                                        <td class="px-6 py-4 text-gray-500">${s.email}</td>
                                        <td class="px-6 py-4 text-right space-x-2">
                                            <button class="edit-btn text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors" data-id="${s.id}"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                            <button class="delete-btn text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors" data-id="${s.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        `;
                    });
                    contentHTML += `
                        </table>
                    `;
                }
                contentHTML += `
                    </div>
                `;

                container.innerHTML = `
                    <div class="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        ${contentHTML}
                    </div>
                `;
                lucide.createIcons({ root: container });

                document.getElementById('add-student-btn').addEventListener('click', () => AdminViews.showStudentModal());
                
                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const student = students.find(st => st.id === btn.dataset.id);
                        if (student) AdminViews.showStudentModal(student);
                    });
                });

                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const student = students.find(st => st.id === btn.dataset.id);
                        if (student) AdminViews.showDeleteConf(student, loadTable);
                    });
                });

            } catch(e) {
                container.innerHTML = `<div class="text-error bg-error/10 p-4 rounded-xl border border-error/20">Error loading students: ${e.message}</div>`;
            }
        };

        await loadTable();
    },

    showStudentModal: (student = null) => {
        const isEdit = !!student;
        const formContent = `
            <form id="student-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" id="s-name" required value="${student ? student.name : ''}" class="block w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="s-email" required value="${student ? student.email : ''}" class="block w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${isEdit ? 'New Password (leave blank to keep)' : 'Password'}</label>
                    <input type="password" id="s-password" ${isEdit ? '' : 'required'} class="block w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                    <select id="s-grade" required class="block w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] outline-none bg-white">
                        <option value="Grade 9" ${student?.grade === 'Grade 9' ? 'selected' : ''}>Grade 9</option>
                        <option value="Grade 10" ${student?.grade === 'Grade 10' ? 'selected' : ''}>Grade 10</option>
                        <option value="Grade 11" ${student?.grade === 'Grade 11' ? 'selected' : ''}>Grade 11</option>
                        <option value="Grade 12" ${student?.grade === 'Grade 12' ? 'selected' : ''}>Grade 12</option>
                    </select>
                </div>
            </form>
        `;

        const actions = `
            <button id="cancel-modal" class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
            <button id="save-student" class="px-5 py-2 gradient-bg text-white rounded-xl hover-lift font-medium shadow-sm border border-transparent">
                ${isEdit ? 'Save Changes' : 'Create Student'}
            </button>
        `;

        const close = Components.showModal(isEdit ? 'Edit Student' : 'Add New Student', formContent, actions);

        document.getElementById('cancel-modal').addEventListener('click', close);
        document.getElementById('save-student').addEventListener('click', async () => {
            const btn = document.getElementById('save-student');
            const data = {
                name: document.getElementById('s-name').value,
                email: document.getElementById('s-email').value,
                grade: document.getElementById('s-grade').value
            };
            const pwd = document.getElementById('s-password').value;
            if (pwd) data.password = pwd;

            try {
                btn.disabled = true;
                btn.innerHTML = '<i class="w-5 h-5 animate-spin" data-lucide="loader-2"></i>';
                lucide.createIcons({root: btn});

                if (isEdit) {
                    await api.students.update(student.id, data);
                    Components.showToast('Student updated successfully');
                } else {
                    await api.students.create(data);
                    Components.showToast('Student created successfully');
                }
                close();
                App.route('#/admin/students');
            } catch (e) {
                Components.showToast(e.message, 'error');
                btn.disabled = false;
                btn.textContent = isEdit ? 'Save Changes' : 'Create Student';
            }
        });
    },

    showDeleteConf: (student, refreshFn) => {
        const content = `
            <div class="text-center">
                <div class="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-triangle" class="w-8 h-8"></i>
                </div>
                <p class="text-gray-600 mb-2">Are you sure you want to delete <strong>${student.name}</strong>?</p>
                <p class="text-xs text-gray-400">This action cannot be undone and will delete all their assessments.</p>
            </div>
        `;
        const actions = `
            <button id="cancel-del" class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
            <button id="confirm-del" class="px-5 py-2 bg-red-500 hover:bg-red-600 border border-transparent text-white rounded-xl hover-lift font-medium shadow-sm">
                Delete Student
            </button>
        `;
        const close = Components.showModal('Delete Confirmation', content, actions);
        document.getElementById('cancel-del').addEventListener('click', close);
        document.getElementById('confirm-del').addEventListener('click', async () => {
            try {
                await api.students.delete(student.id);
                Components.showToast('Student deleted');
                close();
                refreshFn();
            } catch (e) {
                Components.showToast(e.message, 'error');
            }
        });
    },

    renderAssessments: async (container) => {
        document.getElementById('page-title').textContent = 'Assessments';
        container.innerHTML = '<div class="text-gray-500">Loading...</div>';

        try {
            const students = await api.students.getAll();
            const assessments = await api.assessments.getAll();

            const subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science'];
            const types = ['Quiz', 'Test', 'Exam', 'Assignment', 'Project'];

            container.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-1">
                        <div class="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                            <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <i data-lucide="plus-circle" class="w-5 h-5 text-[#667eea]"></i> Add Assessment
                            </h3>
                            <form id="assessment-form" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Student</label>
                                    <select id="a-student" required class="block w-full px-3 py-2 border border-gray-200 rounded-xl outline-none bg-white">
                                        <option value="">Select Student...</option>
                                        ${students.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <select id="a-subject" required class="block w-full px-3 py-2 border border-gray-200 rounded-xl outline-none bg-white">
                                        ${subjects.map(sub => `<option value="${sub}">${sub}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select id="a-type" required class="block w-full px-3 py-2 border border-gray-200 rounded-xl outline-none bg-white">
                                        ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Score (0-100)</label>
                                    <input type="number" id="a-score" min="0" max="100" required class="block w-full px-3 py-2 border border-gray-200 rounded-xl outline-none py-2">
                                </div>
                                <button type="submit" class="w-full py-3 px-4 gradient-bg text-white font-medium rounded-xl hover-lift shadow-sm mt-2">
                                    Record Assessment
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    <div class="lg:col-span-2">
                        <div class="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
                            <h3 class="text-lg font-bold text-gray-800 mb-4">Recent Assessments</h3>
                            <div class="space-y-4">
                                ${assessments.slice(-10).reverse().map(a => {
                                    const st = students.find(s => s.id === a.studentId);
                                    const stName = st ? st.name : 'Unknown';
                                    return `
                                    <div class="p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                                        <div class="flex items-center gap-4">
                                            <div class="w-10 h-10 rounded-full bg-[#667eea]/10 text-[#667eea] flex items-center justify-center font-bold">
                                                ${a.score}
                                            </div>
                                            <div>
                                                <h4 class="font-bold text-gray-900">${stName}</h4>
                                                <p class="text-xs text-gray-500">${a.subject} • ${a.type}</p>
                                            </div>
                                        </div>
                                        <div>
                                            ${Components.createBadge(a.score)}
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
                                ${assessments.length === 0 ? `<div class="text-center py-12 text-gray-500 border border-dashed rounded-xl border-gray-200">No assessments recorded yet.</div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            lucide.createIcons({ root: container });

            document.getElementById('assessment-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    await api.assessments.create({
                        studentId: document.getElementById('a-student').value,
                        subject: document.getElementById('a-subject').value,
                        type: document.getElementById('a-type').value,
                        score: Number(document.getElementById('a-score').value)
                    });
                    Components.showToast('Assessment recorded successfully');
                    App.route('#/admin/assessments'); // redraw
                } catch(err) {
                    Components.showToast(err.message, 'error');
                }
            });

        } catch (e) {
            container.innerHTML = `<div class="text-error">Error: ${e.message}</div>`;
        }
    },

    renderReports: async (container) => {
        document.getElementById('page-title').textContent = 'Reports & Analytics';
        try {
            const r = await api.reports.getOverall();
            
            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    ${Components.createDashboardCard('Total Students', r.totalStudents, 'users', 'blue')}
                    ${Components.createDashboardCard('Total Assessments', r.totalAssessments, 'file-text', 'purple')}
                    ${Components.createDashboardCard('Overall Average', r.overallAverage + '%', 'activity', 'green')}
                    ${Components.createDashboardCard('Subjects', r.subjectsAnalyzed, 'book-open', 'orange')}
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div class="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-6">Subject Performance</h3>
                        <div class="space-y-4">
                            ${r.subjectPerformance.map(s => Components.createProgressBar(s.subject, s.average)).join('')}
                            ${r.subjectPerformance.length === 0 ? '<div class="text-center py-8 text-gray-400">No data available</div>' : ''}
                        </div>
                    </div>
                    
                    <div class="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-6">Performance Distribution</h3>
                        ${r.subjectPerformance.length > 0 ? `
                        <div class="relative h-64 w-full">
                            <canvas id="reports-bar-chart"></canvas>
                        </div>
                        ` : '<div class="text-center py-8 text-gray-400">No data available</div>'}
                    </div>
                </div>

                <div class="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="p-6 border-b border-gray-100">
                        <h3 class="text-lg font-bold text-gray-800">Student Performance Summary</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="text-xs text-gray-500 bg-gray-50 uppercase">
                                <tr>
                                    <th class="px-6 py-4 border-b">Name</th>
                                    <th class="px-6 py-4 border-b">Taken</th>
                                    <th class="px-6 py-4 border-b">Average</th>
                                    <th class="px-6 py-4 border-b">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${r.studentPerformance.map(s => `
                                    <tr class="hover:bg-gray-50/50 transition-colors">
                                        <td class="px-6 py-4 font-bold text-gray-900">${s.name}</td>
                                        <td class="px-6 py-4 text-gray-500">${s.assessmentsTaken}</td>
                                        <td class="px-6 py-4 text-gray-900 font-medium">${s.average}%</td>
                                        <td class="px-6 py-4">
                                            ${s.assessmentsTaken > 0 ? Components.createBadge(s.average) : '-'}
                                        </td>
                                    </tr>
                                `).join('')}
                                ${r.studentPerformance.length === 0 ? `<tr><td colspan="4" class="text-center py-8">No students found</td></tr>` : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            lucide.createIcons({ root: container });

            if (r.subjectPerformance.length > 0) {
                const ctx = document.getElementById('reports-bar-chart').getContext('2d');
                const chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: r.subjectPerformance.map(s => s.subject),
                        datasets: [{
                            label: 'Average Score',
                            data: r.subjectPerformance.map(s => s.average),
                            backgroundColor: '#667eea',
                            borderRadius: 6
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
        } catch(e) {
            container.innerHTML = `<div class="text-error">Error: ${e.message}</div>`;
        }
    },

    renderProfile: async (container) => {
        document.getElementById('page-title').textContent = 'Admin Profile';
        try {
            const p = await api.admin.getProfile();
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
                                        <p class="text-gray-500 flex items-center gap-1"><i data-lucide="shield" class="w-4 h-4"></i> System Administrator</p>
                                    </div>
                                </div>
                            </div>
                            
                            <form id="profile-form" class="space-y-6">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input type="text" id="p-name" value="${p.name}" required class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#667eea]">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input type="email" id="p-email" value="${p.email}" required class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#667eea]">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Change Password (leave blank to keep)</label>
                                    <input type="password" id="p-pwd" class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#667eea]" placeholder="••••••••">
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

            document.getElementById('profile-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = {
                    name: document.getElementById('p-name').value,
                    email: document.getElementById('p-email').value
                };
                const pwd = document.getElementById('p-pwd').value;
                if (pwd) data.password = pwd;

                try {
                    const res = await api.admin.updateProfile(data);
                    AppState.setUser(res.user);
                    App.renderShell(); // update navbar info
                    App.route('#/admin/profile'); // redraw
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

window.AdminViews = AdminViews;
