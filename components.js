const Components = {
    // Top-level Toast Notification
    showToast: (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast flex items-center p-4 mb-4 text-sm rounded-lg shadow-card bg-surface border-l-4 ${
            type === 'success' ? 'border-success text-success' : 
            type === 'error' ? 'border-error text-error' : 
            'border-warning text-warning'
        }`;
        
        const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
        
        toast.innerHTML = `
            <i data-lucide="${iconName}" class="w-5 h-5 mr-3"></i>
            <div>${message}</div>
        `;
        
        container.appendChild(toast);
        lucide.createIcons({ root: toast });

        // Auto remove
        setTimeout(() => {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    },

    // Dashboard Overview Card
    createDashboardCard: (title, value, icon, colorClass, subtitle = '') => {
        return `
            <div class="bg-surface rounded-2xl p-6 shadow-sm border border-gray-100 hover-lift">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-500 mb-1">${title}</p>
                        <h3 class="text-2xl font-bold text-gray-800">${value}</h3>
                        ${subtitle ? `<p class="text-xs text-gray-400 mt-1">${subtitle}</p>` : ''}
                    </div>
                    <div class="w-12 h-12 rounded-full flex items-center justify-center bg-${colorClass}/10 text-${colorClass}">
                        <i data-lucide="${icon}" class="w-6 h-6"></i>
                    </div>
                </div>
            </div>
        `;
    },

    // Progress bar function that determines color based on value
    createProgressBar: (label, value) => {
        let colorClass = 'bg-error'; // < 50
        if (value >= 70) {
            colorClass = 'bg-success';
        } else if (value >= 50) {
            colorClass = 'bg-warning';
        }

        return `
            <div class="mb-4">
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">${label}</span>
                    <span class="text-sm font-medium text-gray-700">${value}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div class="${colorClass} h-2.5 rounded-full progress-fill" style="width: ${value}%"></div>
                </div>
            </div>
        `;
    },

    // Modal dialog framework
    showModal: (title, content, actions = '') => {
        const container = document.getElementById('modal-container');
        
        const modalContent = `
            <div class="bg-surface rounded-2xl shadow-card w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                <div class="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 class="text-lg font-bold text-gray-800">${title}</h3>
                    <button id="close-modal-btn" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto">
                    ${content}
                </div>
                ${actions ? `
                <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                    ${actions}
                </div>
                ` : ''}
            </div>
        `;
        
        container.innerHTML = modalContent;
        container.classList.remove('hidden');
        container.classList.add('flex');
        lucide.createIcons({ root: container });

        // Close logic
        const closeBtn = document.getElementById('close-modal-btn');
        const closeModal = () => {
            container.classList.add('hidden');
            container.classList.remove('flex');
            container.innerHTML = '';
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        return closeModal;
    },

    // Close Modal API
    closeModal: () => {
        const container = document.getElementById('modal-container');
        container.classList.add('hidden');
        container.classList.remove('flex');
        container.innerHTML = '';
    },

    // Status Badge generator
    createBadge: (score) => {
        if (score >= 70) return `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-success/10 text-success border border-success/20">Excellent</span>`;
        if (score >= 50) return `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-warning/10 text-warning border border-warning/20">Average</span>`;
        return `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-error/10 text-error border border-error/20">Needs Improvement</span>`;
    }
};

window.Components = Components;
