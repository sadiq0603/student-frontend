const API_BASE_URL = '/api';

const api = {
    async request(endpoint, method = 'GET', body = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    auth: {
        login: (email, password) => api.request('/login', 'POST', { email, password })
    },

    admin: {
        getProfile: () => api.request('/admin'),
        updateProfile: (data) => api.request('/admin', 'PUT', data)
    },

    students: {
        getAll: () => api.request('/students'),
        create: (data) => api.request('/students', 'POST', data),
        update: (id, data) => api.request(`/students/${id}`, 'PUT', data),
        delete: (id) => api.request(`/students/${id}`, 'DELETE')
    },

    assessments: {
        getAll: (studentId = null) => {
            const query = studentId ? `?studentId=${studentId}` : '';
            return api.request(`/assessments${query}`);
        },
        create: (data) => api.request('/assessments', 'POST', data)
    },

    reports: {
        getOverall: () => api.request('/reports'),
        getStudent: (studentId) => api.request(`/reports?studentId=${studentId}`)
    }
};

window.api = api;
