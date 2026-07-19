/**
 * ============================================================
 *  1. STATE MANAGEMENT (store)
 *  ============================================================
 */
const Store = (() => {
    const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
    let supabaseClient = null;

    const userFromAuth = (authUser) => {
        const metadata = authUser?.user_metadata || {};
        const name = metadata.name || authUser?.email?.split('@')[0] || 'User';
        return {
            id: authUser.id,
            name,
            email: authUser.email,
            avatar: metadata.avatar || name.charAt(0).toUpperCase(),
            role: 'user',
            ...metadata
        };
    };

    const projectFromRow = (row) => ({
        ...(row.project || {}),
        id: row.id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    });

    const projectPayload = (project) => {
        const { id, createdAt, updatedAt, ...payload } = project;
        return payload;
    };

    const getClient = () => {
        if (!supabaseClient) throw new Error('Supabase client is not initialized. The configuration could not be loaded.');
        return supabaseClient;
    };

    const initializeSupabase = async () => {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await fetch('/api/config');
                if (!response.ok) {
                    throw new Error(`Configuration endpoint returned status ${response.status}`);
                }
                const config = await response.json();
                if (!config.supabaseUrl) {
                    throw new Error('Missing supabaseUrl in server configuration');
                }
                if (!config.supabasePublishableKey) {
                    throw new Error('Missing supabasePublishableKey in server configuration');
                }
                if (!window.supabase?.createClient) {
                    throw new Error('Supabase client library is not loaded. Please check your internet connection and refresh.');
                }
                supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey);
                return;
            } catch (error) {
                console.error(`Supabase initialization attempt ${attempt} failed:`, error);
                if (attempt < 3) {
                    await new Promise(r => setTimeout(r, 1000 * attempt));
                } else {
                    throw new Error(`Unable to initialize Supabase after 3 attempts: ${error.message}`);
                }
            }
        }
    };

    let state = {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        projects: [],
        dashboard: {
            totalProjects: 0,
            activeProjects: 0,
            completedProjects: 0,
            revenue: 0,
            clients: 0,
            recentActivity: [],
            chartData: { labels: [], values: [] }
        },
        _ui: {
            currentPage: 'home',
            toast: null,
            authError: '',
            orderFormSubmitting: false,
            profileEditMode: false
        }
    };

    const listeners = [];
    const clone = (obj) => JSON.parse(JSON.stringify(obj));

    const setState = (updates) => {
        const prev = clone(state);
        state = { ...state, ...updates };
        for (const key of Object.keys(updates)) {
            if (updates[key] && typeof updates[key] === 'object' && !Array.isArray(updates[key]) && updates[key] !== null) {
                state[key] = { ...(prev[key] || {}), ...updates[key] };
            }
        }
        if (updates._ui) {
            state._ui = { ...state._ui, ...updates._ui };
        }
        notify(prev, state);
    };

    const notify = (prev, curr) => {
        for (const fn of listeners) {
            try { fn(curr, prev); } catch (e) { console.warn('Store listener error:', e); }
        }
    };

    const computeDashboardStats = (projects) => {
        const total = projects.length;
        const active = projects.filter(p => p.status === 'active').length;
        const completed = projects.filter(p => p.status === 'completed').length;
        let revenue = 0;
        projects.forEach(p => {
            if (p.status === 'completed' && p.budget && typeof p.budget === 'number') {
                revenue += p.budget;
            }
        });
        const clients = total > 0 ? Math.floor(total * 0.55) + 3 : 0;
        const activity = [];
        projects.forEach((p, idx) => {
            const times = [
                `${Math.floor(Math.random() * 3 + 1)}h ago`,
                `${Math.floor(Math.random() * 5 + 1)}h ago`,
                `${Math.floor(Math.random() * 2 + 1)}d ago`,
                'just now'
            ];
            const actions = [
                `New project: ${p.title}`,
                `Updated ${p.title}`,
                `${p.title} ${p.status === 'active' ? 'started' : 'completed'}`
            ];
            const types = ['project', 'project', 'project'];
            const act = {
                action: actions[idx % actions.length],
                time: times[idx % times.length],
                type: types[idx % types.length]
            };
            activity.push(act);
        });
        activity.reverse();
        const recentActivity = activity.slice(0, 6);
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let values = days.map((_, i) => {
            const base = Math.floor(total / 7);
            const extra = (i < total % 7) ? 1 : 0;
            const rand = Math.floor(Math.random() * 2);
            return Math.max(0, base + extra + rand);
        });
        if (total === 0) {
            values = [0, 0, 0, 0, 0, 0, 0];
        }
        const chartValues = values.some(v => v > 0) ? values : [0, 0, 0, 0, 0, 0, 0];
        return {
            totalProjects: total,
            activeProjects: active,
            completedProjects: completed,
            revenue,
            clients,
            recentActivity,
            chartData: { labels: days, values: chartValues }
        };
    };

    const actions = {
        async login(email, password) {
            setState({ loading: true, _ui: { ...state._ui, authError: '' } });
            try {
                const normalizedEmail = normalizeEmail(email);
                if (!normalizedEmail || !password) throw new Error('Email and password required');
                const { data, error } = await getClient().auth.signInWithPassword({
                    email: normalizedEmail,
                    password
                });
                if (error) throw error;
                const user = userFromAuth(data.user);
                setState({
                    user,
                    token: data.session?.access_token || null,
                    isAuthenticated: true,
                    loading: false,
                    projects: [],
                    _ui: { ...state._ui, authError: '', profileEditMode: false }
                });
                await actions.fetchProjects();
                return { success: true, user };
            } catch (err) {
                setState({ loading: false, _ui: { ...state._ui, authError: err.message } });
                return { success: false, error: err.message };
            }
        },

        async register(name, email, password) {
            setState({ loading: true, _ui: { ...state._ui, authError: '' } });
            try {
                const normalizedEmail = normalizeEmail(email);
                if (!name || !normalizedEmail || !password) throw new Error('All fields required');
                if (password.length < 6) throw new Error('Password must be at least 6 characters');
                const { data, error } = await getClient().auth.signUp({
                    email: normalizedEmail,
                    password,
                    options: {
                        data: { name, avatar: name.charAt(0).toUpperCase() },
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;
                if (!data.session) {
                    setState({ loading: false });
                    return { success: true, requiresEmailConfirmation: true };
                }
                const user = userFromAuth(data.user);
                setState({
                    user,
                    token: data.session.access_token,
                    isAuthenticated: true,
                    loading: false,
                    projects: [],
                    _ui: { ...state._ui, authError: '', profileEditMode: false }
                });
                await actions.fetchProjects();
                return { success: true, user };
            } catch (err) {
                setState({ loading: false, _ui: { ...state._ui, authError: err.message } });
                return { success: false, error: err.message };
            }
        },

        async logout() {
            try { await getClient().auth.signOut(); } catch (_) {}
            setState({
                user: null,
                token: null,
                isAuthenticated: false,
                dashboard: {
                    totalProjects: 0,
                    activeProjects: 0,
                    completedProjects: 0,
                    revenue: 0,
                    clients: 0,
                    recentActivity: [],
                    chartData: { labels: [], values: [] }
                },
                _ui: { ...state._ui, profileEditMode: false }
            });
            return { success: true };
        },

        async loadAuth() {
            try {
                const { data, error } = await getClient().auth.getSession();
                if (error) throw error;
                if (!data.session?.user) return false;
                setState({
                    user: userFromAuth(data.session.user),
                    token: data.session.access_token,
                    isAuthenticated: true,
                    projects: []
                });
                await actions.fetchProjects();
                return true;
            } catch (error) {
                console.warn('Unable to restore session:', error.message);
            }
            return false;
        },

        async fetchProjects() {
            try {
                const { data, error } = await getClient()
                    .from('projects')
                    .select('id, project, created_at, updated_at')
                    .order('updated_at', { ascending: false });
                if (error) throw error;
                const projects = (data || []).map(projectFromRow);
                setState({ projects, loading: false });
                await actions.refreshDashboard();
                return projects;
            } catch (err) {
                setState({ loading: false });
                throw err;
            }
        },

        async refreshDashboard() {
            const projects = state.projects || [];
            const stats = computeDashboardStats(projects);
            setState({ dashboard: stats, loading: false });
            return stats;
        },

        async addProject(project) {
            try {
                await delay(300);
                const status = project.status || 'active';
                const newProj = {
                    ...project,
                    id: Date.now(),
                    status,
                    // A completed project is always fully complete, regardless of
                    // an imported or previously supplied progress value.
                    progress: status === 'completed' ? 100 :
                        (Number.isFinite(Number(project.progress)) ? Number(project.progress) : 10),
                    milestones: Array.isArray(project.milestones) ? project.milestones : [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    budget: typeof project.budget === 'number' ? project.budget :
                        (project.budget ? parseFloat(project.budget) : undefined)
                };
                const { data, error } = await getClient()
                    .from('projects')
                    .insert({ project: projectPayload(newProj) })
                    .select('id, project, created_at, updated_at')
                    .single();
                if (error) throw error;
                const savedProject = projectFromRow(data);
                setState({ projects: [savedProject, ...(state.projects || [])] });
                await actions.refreshDashboard();
                return { success: true, project: savedProject };
            } catch (err) {
                return { success: false, error: err.message };
            }
        },

        async updateProjectStatus(id, status) {
            try {
                await delay(250);
                const currentProject = (state.projects || []).find(project => project.id === id);
                if (!currentProject) throw new Error('Project not found');
                const updatedProject = {
                    ...currentProject,
                    status,
                    progress: status === 'completed' ? 100 : currentProject.progress,
                    updatedAt: new Date().toISOString()
                };
                const { data, error } = await getClient()
                    .from('projects')
                    .update({ project: projectPayload(updatedProject) })
                    .eq('id', id)
                    .select('id, project, created_at, updated_at')
                    .single();
                if (error) throw error;
                const savedProject = projectFromRow(data);
                const projects = (state.projects || []).map(project => project.id === id ? savedProject : project);
                setState({ projects });
                await actions.refreshDashboard();
                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        },

        async updateProject(id, updates) {
            try {
                const currentProject = (state.projects || []).find(project => project.id === id);
                if (!currentProject) throw new Error('Project not found');
                const mergedProject = { ...currentProject, ...updates, updatedAt: new Date().toISOString() };
                const updatedProject = mergedProject.status === 'completed'
                    ? { ...mergedProject, progress: 100 }
                    : mergedProject;
                const { data, error } = await getClient()
                    .from('projects')
                    .update({ project: projectPayload(updatedProject) })
                    .eq('id', id)
                    .select('id, project, created_at, updated_at')
                    .single();
                if (error) throw error;
                const savedProject = projectFromRow(data);
                const projects = (state.projects || []).map(project => project.id === id ? savedProject : project);
                setState({ projects });
                await actions.refreshDashboard();
                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        },

        async deleteProject(id) {
            try {
                await delay(250);
                const { error } = await getClient().from('projects').delete().eq('id', id);
                if (error) throw error;
                const projects = (state.projects || []).filter(p => p.id !== id);
                setState({ projects });
                await actions.refreshDashboard();
                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        },

        async updateUserProfile(updates) {
            try {
                const currentUser = state.user;
                if (!currentUser) throw new Error('Not authenticated');
                const updatedUser = { ...currentUser, ...updates };
                if (updates.name && updates.name !== currentUser.name) {
                    updatedUser.avatar = updates.name.charAt(0).toUpperCase();
                }
                const { email, password, id, role, ...profileMetadata } = updatedUser;
                const authUpdates = {
                    data: {
                        ...profileMetadata,
                        avatar: updatedUser.avatar
                    }
                };
                if (email && normalizeEmail(email) !== normalizeEmail(currentUser.email)) {
                    authUpdates.email = normalizeEmail(email);
                }
                if (password) authUpdates.password = password;
                const { data, error } = await getClient().auth.updateUser({
                    ...authUpdates
                });
                if (error) throw error;
                const savedUser = userFromAuth(data.user);
                setState({ user: savedUser });
                return { success: true, user: savedUser };
            } catch (err) {
                return { success: false, error: err.message };
            }
        },

        async placeOrder(orderData) {
            try {
                await delay(500);
                let budgetNum = 0;
                if (orderData.budget) {
                    const match = orderData.budget.match(/(\d[\d,]*)/);
                    if (match) {
                        budgetNum = parseFloat(match[1].replace(/,/g, ''));
                    } else {
                        budgetNum = 0;
                    }
                }
                const project = {
                    title: orderData.projectName || 'Ordered Project',
                    type: orderData.projectType || 'Custom Project',
                    desc: orderData.description || '',
                    status: 'active',
                    icon: 'fa-rocket',
                    budget: budgetNum,
                    timeline: orderData.timeline || 'Not specified',
                    clientName: orderData.clientName || '',
                    clientEmail: orderData.clientEmail || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                    ,progress: 10
                    ,milestones: [
                        { title: 'Project brief received', complete: true },
                        { title: 'Discovery & planning', complete: false },
                        { title: 'Delivery', complete: false }
                    ]
                };
                const result = await actions.addProject(project);
                if (result.success) {
                    const current = state.projects || [];
                    const stats = computeDashboardStats(current);
                    const activity = [
                        { action: `📦 New order: ${project.title} from ${orderData.clientName || 'a client'}`,
                            time: 'just now', type: 'order' },
                        ...(stats.recentActivity || [])
                    ].slice(0, 6);
                    setState({
                        dashboard: {
                            ...stats,
                            recentActivity: activity
                        }
                    });
                    return { success: true, project: result.project };
                }
                return result;
            } catch (err) {
                return { success: false, error: err.message };
            }
        }
    };

    const subscribe = (fn) => {
        listeners.push(fn);
        fn(state, null);
        return () => {
            const idx = listeners.indexOf(fn);
            if (idx > -1) listeners.splice(idx, 1);
        };
    };

    const getState = () => clone(state);
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    const init = async () => {
        await initializeSupabase();
        await actions.loadAuth();
    };

    return {
        getState,
        setState,
        subscribe,
        actions,
        init,
        computeDashboardStats,
        _state: state
    };
})();

/**
 * ============================================================
 *  2. ROUTER
 *  ============================================================
 */
const Router = (() => {
    const routes = {};
    let currentPath = '/';
    let currentParams = {};
    let notFound = null;
    let beforeHook = null;

    const add = (path, renderFn, options = {}) => {
        routes[path] = { render: renderFn, options };
    };

    const setNotFound = (fn) => { notFound = fn; };
    const setBefore = (fn) => { beforeHook = fn; };

    const navigate = (path, params = {}) => {
        let clean = path.startsWith('/') ? path : '/' + path;
        clean = clean.replace(/\/+/g, '/');
        if (clean === '//') clean = '/';
        const hash = '#' + clean + (params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '');
        if (window.location.hash !== hash) {
            window.location.hash = hash;
        } else {
            _render(clean, params);
        }
    };

    const _render = (path, params = {}) => {
        if (beforeHook) {
            const result = beforeHook(path, params);
            if (result === false) return;
            if (result && typeof result === 'string') {
                path = result;
            }
        }

        let route = routes[path];
        let renderFn = notFound;
        let actualParams = params;

        if (!route) {
            for (const [pattern, def] of Object.entries(routes)) {
                const patternParts = pattern.split('/').filter(Boolean);
                const pathParts = path.split('/').filter(Boolean);
                if (patternParts.length === pathParts.length) {
                    let match = true;
                    const extracted = {};
                    for (let i = 0; i < patternParts.length; i++) {
                        if (patternParts[i].startsWith(':')) {
                            extracted[patternParts[i].slice(1)] = pathParts[i];
                        } else if (patternParts[i] !== pathParts[i]) {
                            match = false;
                            break;
                        }
                    }
                    if (match) {
                        route = def;
                        renderFn = def.render;
                        actualParams = { ...params, ...extracted };
                        break;
                    }
                }
            }
        } else {
            renderFn = route.render;
        }

        currentPath = path;
        currentParams = actualParams;

        const container = document.getElementById('pageContent');
        if (!container) return;

        try {
            const result = renderFn ? renderFn(actualParams) :
                '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>Page not found</h4></div>';
            container.innerHTML = result;
        } catch (err) {
            console.error('Router render error:', err);
            container.innerHTML =
                `<div class="empty-state"><i class="fas fa-bug"></i><h4>Something went wrong</h4><p class="text-muted">${err.message}</p></div>`;
        }

        document.querySelectorAll('[data-nav]').forEach(el => {
            const navPath = el.getAttribute('data-nav');
            let isActive = false;
            if (navPath === path) isActive = true;
            else if (navPath === 'home' && (path === '/' || path === '/home')) isActive = true;
            else if (navPath === 'projects' && path.startsWith('/project/')) isActive = true;
            el.classList.toggle('active', isActive);
        });

        setTimeout(() => {
            const state = Store.getState();
            if (state.dashboard && state.dashboard.chartData) {
                const data = state.dashboard.chartData;
                if (data.labels && data.values && data.values.length) {
                    renderChart('dashChart', data.labels, data.values);
                }
            }
        }, 200);
    };

    const init = () => {
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1) || '/';
            const [path, query] = hash.split('?');
            const params = query ? Object.fromEntries(new URLSearchParams(query)) : {};
            _render(path || '/', params);
        });

        const hash = window.location.hash.slice(1) || '/';
        const [path, query] = hash.split('?');
        const params = query ? Object.fromEntries(new URLSearchParams(query)) : {};
        _render(path || '/', params);

        if (!window.location.hash) {
            navigate('/');
        }
    };

    const getCurrentPath = () => currentPath;
    const getCurrentParams = () => currentParams;

    return {
        add,
        setNotFound,
        setBefore,
        navigate,
        init,
        getCurrentPath,
        getCurrentParams,
        _render
    };
})();

/**
 * ============================================================
 *  3. TOAST SYSTEM
 *  ============================================================
 */
const Toast = (() => {
    const container = document.getElementById('toastContainer');

    const show = (message, type = 'info', title = '') => {
        const icons = {
            info: 'fa-circle-info',
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            warning: 'fa-triangle-exclamation'
        };
        const colors = {
            info: 'var(--primary)',
            success: 'var(--success)',
            error: 'var(--danger)',
            warning: 'var(--warning)'
        };
        const cls = type || 'info';
        const toast = document.createElement('div');
        toast.className = `toast ${cls}`;
        toast.innerHTML = `
            <div class="toast-icon" style="color:${colors[cls] || 'var(--primary)'}">
                <i class="fas ${icons[cls] || icons.info}"></i>
            </div>
            <div class="toast-body">
                <strong>${title || (cls.charAt(0).toUpperCase() + cls.slice(1))}</strong>
                <p>${message}</p>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 5000);
        return toast;
    };

    const success = (msg, title = 'Success') => show(msg, 'success', title);
    const error = (msg, title = 'Error') => show(msg, 'error', title);
    const warning = (msg, title = 'Warning') => show(msg, 'warning', title);
    const info = (msg, title = 'Info') => show(msg, 'info', title);

    return { show, success, error, warning, info };
})();

/**
 * ============================================================
 *  4. REUSABLE UI COMPONENTS
 *  ============================================================
 */
const Components = {
    statCard({ label, value, change, changeLabel, icon, color = 'var(--primary)' }) {
        const changeHtml = change !== undefined && change !== null ? `
            <span class="stat-change ${change >= 0 ? 'up' : 'down'}">
                ${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}% ${changeLabel || ''}
            </span>
        ` : '';
        return `
            <div class="stat-card" style="display:flex;align-items:center;gap:16px;">
                <div class="stat-icon" style="background:${color}22;color:${color};">${icon}</div>
                <div style="flex:1;">
                    <div class="stat-label">${label}</div>
                    <div class="stat-value">${value}</div>
                    ${changeHtml}
                </div>
            </div>
        `;
    },

    projectCard({ id, title, type, desc, status, icon, progress = 0, timeline }) {
        // Keep older saved projects accurate in the UI even before they are edited.
        const displayedProgress = status === 'completed'
            ? 100
            : Math.min(100, Math.max(0, Number(progress) || 0));
        const statusBadge = status === 'active' ?
            '<span class="badge badge-success">Active</span>' :
            '<span class="badge">Completed</span>';
        return `
            <div class="project-card" data-project-id="${id}">
                <div class="project-thumb"><i class="fas ${icon || 'fa-folder'}"></i></div>
                <div class="project-body">
                    <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
                        <h4>${title}</h4>
                        ${statusBadge}
                    </div>
                    <p>${desc || ''}</p>
                    <div class="project-meta">
                        <span><i class="fas fa-tag"></i> ${type || 'Project'}</span>
                        ${timeline ? `<span><i class="fas fa-calendar"></i> ${timeline}</span>` : ''}
                    </div>
                    <div class="project-progress" aria-label="${displayedProgress}% complete">
                        <div class="project-progress-label"><span>Project progress</span><strong>${displayedProgress}%</strong></div>
                        <div class="progress-track"><span style="width:${displayedProgress}%"></span></div>
                    </div>
                    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="btn btn-sm btn-primary project-view" data-id="${id}"><i class="fas fa-table"></i> View sheet</button>
                        ${status === 'active' ? `<button class="btn btn-sm btn-success project-complete" data-id="${id}">Complete</button>` : ''}
                        <button class="btn btn-sm btn-danger project-delete" data-id="${id}">Delete</button>
                    </div>
                </div>
            </div>
        `;
    },

    activityItem({ action, time, type }) {
        const icons = {
            project: 'fa-folder',
            payment: 'fa-credit-card',
            client: 'fa-user',
            design: 'fa-palette',
            order: 'fa-shopping-cart'
        };
        const colors = {
            project: 'var(--primary)',
            payment: 'var(--success)',
            client: '#8b5cf6',
            design: '#f59e0b',
            order: '#0ea56a'
        };
        const icon = icons[type] || 'fa-clock';
        const color = colors[type] || 'var(--text-muted)';
        return `
            <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
                <i class="fas ${icon}" style="color:${color};width:20px;"></i>
                <span style="flex:1;font-size:0.9rem;">${action}</span>
                <span style="font-size:0.75rem;color:var(--text-muted);">${time}</span>
            </div>
        `;
    },

    loading() {
        return `<div class="loading-overlay"><span class="spinner"></span> Loading...</div>`;
    },

    empty({ icon = 'fa-inbox', title = 'Nothing here yet', desc = 'Add your first item to get started.' } = {}) {
        return `
            <div class="empty-state">
                <i class="fas ${icon}"></i>
                <h4>${title}</h4>
                <p class="text-muted">${desc}</p>
            </div>
        `;
    },

    chartCanvas(id = 'chartCanvas', labels = [], values = []) {
        return `
            <div class="chart-wrapper">
                <canvas id="${id}" width="600" height="200"></canvas>
            </div>
        `;
    },

    authForm({ mode = 'login', error = '' } = {}) {
        const isLogin = mode === 'login';
        const title = isLogin ? 'Welcome back' : 'Create an account';
        const sub = isLogin ? 'Log in to access your dashboard and projects.' :
            'Start managing your projects with Korir Digital.';
        const btnText = isLogin ? 'Log In' : 'Create Account';
        const switchText = isLogin ? "Don't have an account?" : "Already have an account?";
        const switchLink = isLogin ? 'Register' : 'Log In';
        const switchPath = isLogin ? '/register' : '/login';

        return `
            <div class="auth-page">
                <aside class="auth-showcase"><div class="auth-showcase-inner"><div class="eyebrow"><span></span> Korir Digital</div><h2>${isLogin ? 'Good to see you<br><em>again.</em>' : 'Make your next<br><em>move</em> matter.'}</h2><p>${isLogin ? 'Pick up where you left off and keep every project moving.' : 'A calmer place to manage your requests, progress, and project details.'}</p><div class="auth-showcase-note"><i class="fas fa-sparkles"></i><span>Clear process. Thoughtful work.</span></div></div></aside>
                <div class="card auth-card">
                    <h2>${title}</h2>
                    <p class="sub">${sub}</p>
                    ${error ? `<div style="background:#fde8e8;color:#991b1b;padding:10px 14px;border-radius:var(--radius-sm);margin-bottom:16px;font-size:0.9rem;">${error}</div>` : ''}
                    <form id="authForm" data-mode="${mode}">
                        ${!isLogin ? `
                            <div class="form-group">
                                <label>Full Name <span class="req">*</span></label>
                                <input type="text" id="authName" class="form-control" placeholder="Your Name" required />
                            </div>
                        ` : ''}
                        <div class="form-group">
                            <label>Email Address <span class="req">*</span></label>
                            <input type="email" id="authEmail" class="form-control" placeholder="you@example.com" required />
                        </div>
                        <div class="form-group">
                            <label>Password <span class="req">*</span></label>
                            <input type="password" id="authPassword" class="form-control" placeholder="${isLogin ? 'Enter your password' : 'Min 4 characters'}" required minlength="4" />
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-lg" id="authSubmit">
                            ${btnText}
                        </button>
                    </form>
                    <div class="auth-divider">or</div>
                    <div class="auth-switch">
                        ${switchText} <a data-nav="${switchPath}">${switchLink}</a>
                    </div>
                </div>
            </div>
        `;
    },

    orderFormModal({ planName = 'Growth', planPrice = 'Ksh 70,000' } = {}) {
        const budgetOptions = [
            { label: 'Ksh 25,000 – 50,000', value: 25000 },
            { label: 'Ksh 50,000 – 100,000', value: 50000 },
            { label: 'Ksh 100,000 – 200,000', value: 100000 },
            { label: 'Ksh 200,000+', value: 200000 },
        ];
        const budgetOptionsHtml = budgetOptions.map(b =>
            `<option value="${b.value}">${b.label}</option>`
        ).join('');

        return `
            <div class="modal-overlay" id="orderModal">
                <div class="modal-box">
                    <button class="modal-close-top" data-modal-close="orderModal">&times;</button>
                    <h3 style="margin-bottom:4px;">📋 Order: ${planName}</h3>
                    <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:16px;">${planPrice} · Fill in the details below to start your project.</p>
                    <form id="orderForm">
                        <div class="form-group">
                            <label>Project Name <span class="req">*</span></label>
                            <input type="text" id="orderProjectName" class="form-control" placeholder="e.g. My Business Website" required />
                        </div>
                        <div class="form-group">
                            <label>Project Type</label>
                            <select id="orderProjectType" class="form-control">
                                <option value="Web Development">Web Development</option>
                                <option value="Mobile App">Mobile App</option>
                                <option value="E-commerce">E-commerce</option>
                                <option value="Booking System">Booking System</option>
                                <option value="Portfolio">Portfolio</option>
                                <option value="Custom">Custom</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Description <span class="req">*</span></label>
                            <textarea id="orderDescription" class="form-control" placeholder="Briefly describe your project..." rows="3" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Budget Range</label>
                            <select id="orderBudget" class="form-control">
                                ${budgetOptionsHtml}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Timeline</label>
                            <select id="orderTimeline" class="form-control">
                                <option value="1-2 weeks">1-2 weeks</option>
                                <option value="3-4 weeks" selected>3-4 weeks</option>
                                <option value="1-2 months">1-2 months</option>
                                <option value="3+ months">3+ months</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Your Name <span class="req">*</span></label>
                            <input type="text" id="orderClientName" class="form-control" placeholder="Your full name" required />
                        </div>
                        <div class="form-group">
                            <label>Email Address <span class="req">*</span></label>
                            <input type="email" id="orderClientEmail" class="form-control" placeholder="you@example.com" required />
                        </div>
                        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap;">
                            <button type="button" class="btn btn-outline" data-modal-close="orderModal">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="orderSubmitBtn">
                                <i class="fas fa-paper-plane"></i> Place Order
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
};

/**
 * ============================================================
 *  5. PAGE RENDERERS
 *  ============================================================
 */

function renderHome() {
    const state = Store.getState();
    const isAuth = state.isAuthenticated;
    const user = state.user;

    return `
        <div class="studio-home">
            <section class="hero container">
                <div class="hero-copy">
                    <div class="eyebrow"><span></span> Independent digital studio</div>
                    <h1>Make your next<br><em>move</em> matter.</h1>
                    <p>We shape useful digital products, thoughtful brands, and smoother back-office systems for ambitious businesses.</p>
                    <div class="hero-actions">
                        <a href="#" data-nav="${isAuth ? '/projects' : '/register'}" class="btn btn-primary btn-lg">Start a project <i class="fas fa-arrow-up-right-from-square"></i></a>
                        <a href="#" data-nav="/services" class="text-link">Explore what we do <i class="fas fa-arrow-right"></i></a>
                    </div>
                    ${isAuth ? `<p class="welcome-note">Welcome back, ${user?.name || 'there'} — <a href="#" data-nav="/dashboard">view your workspace</a>.</p>` : ''}
                </div>
                <div class="hero-art" aria-hidden="true">
                    <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
                    <div class="art-label label-top">01 / STRATEGY</div>
                    <div class="art-label label-bottom">NAIROBI · KE</div>
                    <div class="hero-monogram">K<span>.</span></div>
                    <div class="art-card"><span>Built with</span><strong>clarity + care</strong></div>
                </div>
            </section>
            <section class="trust-strip"><div class="container"><span>Digital experiences</span><i></i><span>Operational support</span><i></i><span>Brands with direction</span></div></section>
            <section class="process-section"><div class="container process-layout"><div><div class="eyebrow"><span></span> A simpler process</div><h2>Good work needs a clear way forward.</h2></div><div class="process-list"><div><b>01</b><span><strong>Understand</strong> We get close to the problem before proposing a solution.</span></div><div><b>02</b><span><strong>Make</strong> We design, build, and keep you in the loop throughout.</span></div><div><b>03</b><span><strong>Move</strong> You launch with something considered, practical, and ready to grow.</span></div></div></div></section>
            <section class="home-cta container"><div><span class="eyebrow"><span></span> Your next chapter</span><h2>Have an idea worth making real?</h2><p>Tell us where you want to go. We’ll help you create the digital path there.</p></div><a href="#" data-nav="${isAuth ? '/projects' : '/register'}" class="btn btn-light btn-lg">Let’s begin <i class="fas fa-arrow-right"></i></a></section>
        </div>
    `;

    return `
        <div class="container">
            <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:16px;margin-bottom:8px;">
                <div>
                    <h1 class="page-title">Digital work built around what your business runs on.</h1>
                    <p class="page-sub" style="max-width:620px;">Software development, virtual assistance, and graphic design under one roof — so your website, admin, and brand visuals all match.</p>
                </div>
                ${!isAuth ? `
                    <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    </div>
                ` : `
                    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                        <span style="font-weight:500;">👋 ${user?.name || 'User'}</span>
                        <a href="#" data-nav="/dashboard" class="btn btn-primary">Go to Dashboard</a>
                    </div>
                `}
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;margin:32px 0;">
                ${['Software Development','Virtual Assistance','Graphic Design'].map(s => `
                    <div class="card" style="text-align:center;padding:24px 20px;">
                        <i class="fas ${s === 'Software Development' ? 'fa-code' : s === 'Virtual Assistance' ? 'fa-headset' : 'fa-palette'}" style="font-size:2rem;color:var(--primary);margin-bottom:8px;"></i>
                        <h4 style="font-size:0.95rem;">${s}</h4>
                        <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;">${s === 'Software Development' ? 'Custom web apps & sites' : s === 'Virtual Assistance' ? 'Admin & client support' : 'Brand identity & design'}</p>
                    </div>
                `).join('')}
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:16px;">
                <div class="card">
                    <h3 style="margin-bottom:8px;">📊 Quick Stats</h3>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                        <div><span class="stat-label">Projects</span><div style="font-size:1.4rem;font-weight:700;">${(state.projects || []).length || '0'}</div></div>
                        <div><span class="stat-label">Clients</span><div style="font-size:1.4rem;font-weight:700;">${state.dashboard?.clients || '0'}</div></div>
                        <div><span class="stat-label">Revenue</span><div style="font-size:1.4rem;font-weight:700;">Ksh ${(state.dashboard?.revenue || 0).toLocaleString()}</div></div>
                        <div><span class="stat-label">Active</span><div style="font-size:1.4rem;font-weight:700;">${state.dashboard?.activeProjects || '0'}</div></div>
                    </div>
                </div>
                <div class="card">
                    <h3 style="margin-bottom:8px;">🚀 Quick Actions</h3>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <a href="#" data-nav="/projects" class="btn btn-outline btn-block"><i class="fas fa-folder"></i> View Projects</a>
                        <a href="#" data-nav="/dashboard" class="btn btn-outline btn-block"><i class="fas fa-chart-line"></i> Dashboard</a>
                    </div>
                </div>
            </div>

            <div style="margin-top:32px;padding:24px;background:var(--surface-alt);border-radius:var(--radius);border:1px solid var(--border);">
                <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:space-between;">
                    <div>
                        <h4 style="font-size:1rem;">💡 Need something built?</h4>
                        <p style="font-size:0.9rem;color:var(--text-secondary);">Tell us about your project and we'll get back within 24h.</p>
                    </div>
                    <a href="#" data-nav="/projects" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Start a project</a>
                </div>
            </div>
        </div>
    `;
}

function renderServices() {
    const state = Store.getState();
    const actionPath = state.isAuthenticated ? '/projects' : '/register';
    const offerings = [
        { number: '01', icon: 'fa-laptop-code', title: 'Websites & web apps', text: 'High-performing websites, client portals, booking systems, and tools that make work feel lighter.', list: ['Discovery & strategy', 'UX/UI design', 'Development & launch'] },
        { number: '02', icon: 'fa-list-check', title: 'Virtual assistance', text: 'Hands-on operational support that keeps customers cared for and your priorities moving.', list: ['Inbox & calendar support', 'Client coordination', 'Research & administration'] },
        { number: '03', icon: 'fa-wand-magic-sparkles', title: 'Brand & visual design', text: 'Identity systems and everyday assets that help your business look as considered as it is.', list: ['Brand identity', 'Social media assets', 'Campaign & print design'] }
    ];
    return `
        <div class="services-page">
            <section class="services-hero"><div class="container"><div class="eyebrow"><span></span> What we can do</div><h1>Useful work.<br><em>Beautifully</em> made.</h1><p>Choose a focused service or bring us the bigger picture. We pair creative thinking with practical delivery.</p></div></section>
            <section class="offerings container">
                ${offerings.map(item => `<article class="offering-row"><div class="offering-number">${item.number}</div><div class="offering-icon"><i class="fas ${item.icon}"></i></div><div class="offering-copy"><h2>${item.title}</h2><p>${item.text}</p></div><ul>${item.list.map(point => `<li><i class="fas fa-check"></i>${point}</li>`).join('')}</ul><a href="#" data-nav="${actionPath}" class="round-arrow" aria-label="Start a ${item.title} project"><i class="fas fa-arrow-up-right-from-square"></i></a></article>`).join('')}
            </section>
            <section class="service-note"><div class="container"><div><div class="eyebrow"><span></span> Made to fit</div><h2>Not every brief comes in a neat box.</h2></div><p>We can combine services into a tailored scope that meets your business where it is now — and makes room for what comes next.</p></div></section>
            <section class="home-cta container"><div><span class="eyebrow"><span></span> Let’s work together</span><h2>Ready when you are.</h2><p>Tell us about your goals and we’ll help choose the right starting point.</p></div><a href="https://wa.me/254726605919" target="_blank" rel="noopener noreferrer" class="btn btn-light btn-lg">Start a conversation <i class="fab fa-whatsapp"></i></a></section>
        </div>
    `;
}

function renderDashboard() {
    const state = Store.getState();
    if (!state.isAuthenticated) {
        return `
            <div class="container">
                <div class="card" style="text-align:center;padding:48px 24px;">
                    <i class="fas fa-lock" style="font-size:2.6rem;color:var(--text-muted);margin-bottom:12px;"></i>
                    <h3>Please log in to view your dashboard</h3>
                    <p class="text-muted">You need to be authenticated to access this page.</p>
                    <div style="margin-top:16px;display:flex;gap:12px;justify-content:center;">
                        <a href="#" data-nav="/login" class="btn btn-primary">Log In</a>
                        <a href="#" data-nav="/register" class="btn btn-outline">Sign Up</a>
                    </div>
                </div>
            </div>
        `;
    }

    const dash = state.dashboard || {};
    const loading = state.loading;
    const projects = state.projects || [];
    const user = state.user;

    if (loading && !dash.totalProjects && projects.length === 0) {
        return `<div class="container">${Components.loading()}</div>`;
    }

    const stats = Store.computeDashboardStats(projects);

    const statItems = [
        { label: 'Total Projects', value: stats.totalProjects || 0, change: null,
            icon: '<i class="fas fa-folder"></i>', color: 'var(--primary)' },
        { label: 'Active Projects', value: stats.activeProjects || 0, change: null,
            icon: '<i class="fas fa-play"></i>', color: 'var(--success)' },
        { label: 'Revenue (Ksh)', value: (stats.revenue || 0).toLocaleString(), change: null,
            icon: '<i class="fas fa-credit-card"></i>', color: '#f59e0b' },
        { label: 'Clients', value: stats.clients || 0, change: null, icon: '<i class="fas fa-users"></i>',
            color: '#8b5cf6' },
    ];

    const activities = (stats.recentActivity || []).slice(0, 5);
    const chartData = stats.chartData || { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [
            0, 0, 0, 0, 0, 0, 0
        ] };

    const hasProjects = projects.length > 0;

    return `
        <div class="container">
            <div class="portal-page-hero dashboard-page-hero" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
                <div>
                    <h1 class="page-title">📊 Dashboard</h1>
                    <p class="page-sub">Welcome back, ${user?.name || 'User'}! Here's what's happening. <span class="last-updated">(auto-refreshes)</span></p>
                </div>
                <button class="btn btn-outline btn-sm" id="refreshDashboard"><i class="fas fa-sync"></i> Refresh</button>
            </div>

            <div class="grid-4" style="margin-bottom:24px;">
                ${statItems.map(s => Components.statCard(s)).join('')}
            </div>

            <div class="grid-2" style="margin-bottom:24px;">
                <div class="chart-container">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <h4 style="font-size:0.95rem;">📈 Weekly Activity</h4>
                        <span style="font-size:0.75rem;color:var(--text-muted);">Last 7 days</span>
                    </div>
                    ${Components.chartCanvas('dashChart', chartData.labels, chartData.values)}
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3>🕐 Recent Activity</h3>
                        <span style="font-size:0.75rem;color:var(--text-muted);">Live</span>
                    </div>
                    ${activities.length ? activities.map(a => Components.activityItem(a)).join('') :
                        Components.empty({ icon: 'fa-clock', title: 'No recent activity', desc: 'Activity will appear here as you work.' })}
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>📋 Quick Project Overview</h3>
                    <a href="#" data-nav="/projects" style="font-size:0.85rem;">View all →</a>
                </div>
                ${hasProjects ? `
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
                        ${projects.slice(0,4).map(p => `
                            <div style="background:var(--surface-alt);border-radius:var(--radius-sm);padding:12px 16px;border:1px solid var(--border);cursor:pointer;" onclick="Router.navigate('/project/${p.id}')">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <span style="font-weight:500;font-size:0.85rem;">${p.title}</span>
                                    <span class="badge ${p.status === 'active' ? 'badge-success' : ''}">${p.status}</span>
                                </div>
                                <span style="font-size:0.75rem;color:var(--text-muted);">${p.type || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : Components.empty({ icon: 'fa-folder-open', title: 'No projects yet', desc: 'Create your first project to get started.' })}
            </div>
        </div>
    `;
}

function renderProjects() {
    const state = Store.getState();
    if (!state.isAuthenticated) {
        return `
            <div class="container">
                <div class="card" style="text-align:center;padding:48px 24px;">
                    <i class="fas fa-lock" style="font-size:2.6rem;color:var(--text-muted);margin-bottom:12px;"></i>
                    <h3>Please log in to view projects</h3>
                    <p class="text-muted">You need to be authenticated to access this page.</p>
                    <div style="margin-top:16px;display:flex;gap:12px;justify-content:center;">
                        <a href="#" data-nav="/login" class="btn btn-primary">Log In</a>
                        <a href="#" data-nav="/register" class="btn btn-outline">Sign Up</a>
                    </div>
                </div>
            </div>
        `;
    }

    const projects = state.projects || [];
    const loading = state.loading;

    if (loading && !projects.length) {
        return `<div class="container">${Components.loading()}</div>`;
    }

    const hasProjects = projects.length > 0;

    return `
        <div class="container">
            <div class="portal-page-hero projects-page-hero" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
                <div>
                    <h1 class="page-title">📁 Projects</h1>
                    <p class="page-sub">Manage your projects and track their status.</p>
                </div>
                <button class="btn btn-primary" id="showAddProject"><i class="fas fa-plus"></i> Start a project</button>
            </div>

            <div class="projects-summary-strip">
                <div><span>All projects</span><strong>${projects.length}</strong></div>
                <div><span>Active</span><strong>${projects.filter(project => project.status === 'active').length}</strong></div>
                <div><span>Completed</span><strong>${projects.filter(project => project.status === 'completed').length}</strong></div>
                <p>Use the project sheet to review progress or upload your latest Excel tracker.</p>
            </div>

            ${hasProjects ? `
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
                    <button class="btn btn-sm btn-outline filter-btn active" data-filter="all">All</button>
                    <button class="btn btn-sm btn-outline filter-btn" data-filter="active">Active</button>
                    <button class="btn btn-sm btn-outline filter-btn" data-filter="completed">Completed</button>
                </div>
            ` : ''}

            ${hasProjects ? `
                <div class="project-grid" id="projectGrid">
                    ${projects.map(p => Components.projectCard(p)).join('')}
                </div>
            ` : Components.empty({ icon: 'fa-folder-open', title: 'No projects yet', desc: 'Click "New Project" to create your first one.' })}
        </div>
    `;
}

function renderProjectDetail(params) {
    const state = Store.getState();
    if (!state.isAuthenticated) {
        return `
            <div class="container">
                <div class="card" style="text-align:center;padding:48px 24px;">
                    <i class="fas fa-lock" style="font-size:2.6rem;color:var(--text-muted);margin-bottom:12px;"></i>
                    <h3>Please log in to view project details</h3>
                    <div style="margin-top:16px;"><a href="#" data-nav="/login" class="btn btn-primary">Log In</a></div>
                </div>
            </div>
        `;
    }

    const id = parseInt(params.id);
    if (!id) {
        return `
            <div class="container">
                <div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>Invalid project</h4></div>
            </div>
        `;
    }

    const project = state.projects.find(p => p.id === id);
    if (!project) {
        return `
            <div class="container">
                <div class="empty-state"><i class="fas fa-folder-open"></i><h4>Project not found</h4>
                <p class="text-muted">The project you're looking for doesn't exist.</p>
                <a href="#" data-nav="/projects" class="btn btn-primary" style="margin-top:12px;">← Back to Projects</a>
                </div>
            </div>
        `;
    }

    const statusDot = project.status === 'active' ? 'active' : 'completed';
    const statusLabel = project.status === 'active' ? 'Active' : 'Completed';
    const budgetDisplay = project.budget ? `Ksh ${project.budget.toLocaleString()}` : 'Not specified';

    return `
        <div class="container">
            <a href="#" data-nav="/projects" class="back-link"><i class="fas fa-arrow-left"></i> Back to Projects</a>

            <div class="card">
                <div class="project-detail-header">
                    <div class="detail-icon"><i class="fas ${project.icon || 'fa-folder'}"></i></div>
                    <div class="detail-title">
                        <h2>${project.title}</h2>
                        <div class="sub">
                            <span class="status-dot ${statusDot}"></span>
                            <span class="badge ${project.status === 'active' ? 'badge-success' : ''}">${statusLabel}</span>
                            <span style="margin-left:12px;color:var(--text-muted);">${project.type || 'Project'}</span>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${project.status === 'active' ? `<button class="btn btn-sm btn-success project-complete" data-id="${project.id}">Mark Complete</button>` : ''}
                        <button class="btn btn-sm btn-danger project-delete" data-id="${project.id}">Delete</button>
                    </div>
                </div>

                <div style="border-top:1px solid var(--border);padding-top:20px;margin-top:4px;">
                    <p style="font-size:1rem;color:var(--text-secondary);">${project.desc || 'No description provided.'}</p>
                </div>

                <div class="detail-meta-grid">
                    <div class="meta-item">
                        <div class="label">Status</div>
                        <div class="value"><span class="status-dot ${statusDot}"></span> ${statusLabel}</div>
                    </div>
                    <div class="meta-item">
                        <div class="label">Type</div>
                        <div class="value">${project.type || 'Not specified'}</div>
                    </div>
                    <div class="meta-item">
                        <div class="label">Budget</div>
                        <div class="value">${budgetDisplay}</div>
                    </div>
                    <div class="meta-item">
                        <div class="label">Created</div>
                        <div class="value">${project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    <div class="meta-item">
                        <div class="label">Last Updated</div>
                        <div class="value">${project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    ${project.timeline ? `
                        <div class="meta-item">
                            <div class="label">Timeline</div>
                            <div class="value">${project.timeline}</div>
                        </div>
                    ` : ''}
                    ${project.clientName ? `
                        <div class="meta-item">
                            <div class="label">Client</div>
                            <div class="value">${project.clientName}</div>
                        </div>
                    ` : ''}
                    ${project.clientEmail ? `
                        <div class="meta-item">
                            <div class="label">Client Email</div>
                            <div class="value">${project.clientEmail}</div>
                        </div>
                    ` : ''}
                </div>

                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;border-top:1px solid var(--border);padding-top:20px;">
                    <button class="btn btn-outline" onclick="Router.navigate('/projects')"><i class="fas fa-arrow-left"></i> All Projects</button>
                    <button class="btn btn-outline" id="refreshProjectDetail"><i class="fas fa-sync"></i> Refresh</button>
                </div>
            </div>
        </div>
    `;
}

function renderPricing() {
    const state = Store.getState();
    const isAuth = state.isAuthenticated;
    const selectedService = state._ui?.pricingService || 'digital';
    const services = {
        digital: { icon: 'fa-laptop-code', label: 'Websites & web apps', intro: 'High-performing websites, client portals, booking systems, and tools that make work feel lighter.', plans: [
            { name: 'Starter', price: 'Ksh 25,000', desc: 'Landing page or single-purpose site', features: ['Mobile-responsive', 'Contact form', 'Basic SEO'], popular: false },
            { name: 'Growth', price: 'Ksh 70,000', desc: 'Multi-page business site or web app', features: ['Custom booking forms', 'CMS integration', 'Analytics'], popular: true },
            { name: 'Pro', price: 'Ksh 200,000+', desc: 'Custom web application', features: ['Backend integration', 'API integrations', 'Ongoing support'], popular: false }
        ] },
        assistant: { icon: 'fa-list-check', label: 'Virtual assistance', intro: 'Hands-on operational support that keeps customers cared for and your priorities moving.', plans: [
            { name: 'Essential', price: 'Ksh 15,000', desc: 'For focused admin support each month', features: ['Up to 10 support hours', 'Inbox & calendar support', 'Weekly check-in'], popular: false },
            { name: 'Momentum', price: 'Ksh 35,000', desc: 'Flexible support for growing operations', features: ['Up to 30 support hours', 'Client coordination', 'Research & administration'], popular: true },
            { name: 'Dedicated', price: 'Custom quote', desc: 'A tailored operational support partner', features: ['Dedicated support plan', 'Priority turnaround', 'Monthly reporting'], popular: false }
        ] },
        brand: { icon: 'fa-wand-magic-sparkles', label: 'Brand & visual design', intro: 'Identity systems and everyday assets that help your business look as considered as it is.', plans: [
            { name: 'Foundation', price: 'Ksh 20,000', desc: 'A focused visual refresh for your business', features: ['Logo refinement', 'Colour & type direction', 'Social profile assets'], popular: false },
            { name: 'Identity', price: 'Ksh 55,000', desc: 'A complete visual identity for a clear launch', features: ['Primary logo suite', 'Brand guidelines', 'Social media templates'], popular: true },
            { name: 'Campaign', price: 'Custom quote', desc: 'Creative direction for a major launch or campaign', features: ['Campaign concept', 'Marketing assets', 'Print-ready artwork'], popular: false }
        ] }
    };
    const currentService = services[selectedService] || services.digital;
    const plans = currentService.plans;

    return `
        <div class="container">
            <div style="text-align:center;margin-bottom:32px;">
                <h1 class="page-title">💰 Pricing</h1>
                <p class="page-sub">Plans that scale with your project. Pick the tier that fits your scope.</p>
            </div>

            <div class="pricing-service-picker" role="tablist" aria-label="Choose a service">
                ${Object.entries(services).map(([key, service]) => `<button type="button" class="pricing-service-tab ${key === selectedService ? 'active' : ''}" data-pricing-service="${key}" role="tab" aria-selected="${key === selectedService}"><i class="fas ${service.icon}"></i><span>${service.label}</span></button>`).join('')}
            </div>
            <div class="pricing-service-summary"><div class="pricing-service-icon"><i class="fas ${currentService.icon}"></i></div><div><span class="eyebrow"><span></span> Selected service</span><h2>${currentService.label}</h2><p>${currentService.intro}</p></div><span class="pricing-from">From <strong>${plans[0].price}</strong></span></div>

            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;">
                ${plans.map(p => `
                    <div class="card" style="${p.popular ? 'border-color:var(--primary);position:relative;' : ''}">
                        ${p.popular ? `<span style="position:absolute;top:-10px;right:20px;background:var(--primary);color:#fff;padding:2px 16px;border-radius:100px;font-size:0.7rem;font-weight:600;">Most Requested</span>` : ''}
                        <h3 style="font-size:1.2rem;">${p.name}</h3>
                        <div style="font-size:1.8rem;font-weight:700;margin:8px 0 4px;">${p.price}</div>
                        <p style="color:var(--text-secondary);font-size:0.9rem;">${p.desc}</p>
                        <ul style="margin:16px 0;list-style:none;padding:0;">
                            ${p.features.map(f => `<li style="padding:4px 0;font-size:0.9rem;"><i class="fas fa-circle-check" style="color:var(--success);margin-right:8px;"></i>${f}</li>`).join('')}
                        </ul>
                        <button class="btn ${p.popular ? 'btn-primary' : 'btn-outline'} btn-block order-plan-btn" 
                                data-plan="${p.name}" data-price="${p.price}">
                            <i class="fas fa-shopping-cart"></i> Choose ${p.name}
                        </button>
                    </div>
                `).join('')}
            </div>

            <div style="margin-top:32px;padding:24px;background:var(--surface-alt);border-radius:var(--radius);text-align:center;border:1px solid var(--border);">
                <p style="color:var(--text-secondary);font-size:0.95rem;">Have something bigger — or smaller — in mind? 
                    <a href="#" data-nav="${isAuth ? '/projects' : '/register'}" style="font-weight:600;">Let's talk</a> 
                    and we'll quote it properly.
                </p>
            </div>
        </div>
    `;
}

function renderLogin() {
    const state = Store.getState();
    if (state.isAuthenticated) {
        setTimeout(() => Router.navigate('/dashboard'), 100);
        return `<div class="container"><div class="loading-overlay">Already logged in, redirecting...</div></div>`;
    }
    const error = state._ui?.authError || '';
    return Components.authForm({ mode: 'login', error });
}

function renderRegister() {
    const state = Store.getState();
    if (state.isAuthenticated) {
        setTimeout(() => Router.navigate('/dashboard'), 100);
        return `<div class="container"><div class="loading-overlay">Already logged in, redirecting...</div></div>`;
    }
    const error = state._ui?.authError || '';
    return Components.authForm({ mode: 'register', error });
}

function renderProfile() {
    const state = Store.getState();
    if (!state.isAuthenticated) {
        return `
            <div class="container">
                <div class="card" style="text-align:center;padding:48px 24px;">
                    <i class="fas fa-lock" style="font-size:2.6rem;color:var(--text-muted);margin-bottom:12px;"></i>
                    <h3>Please log in to view your profile</h3>
                    <div style="margin-top:16px;"><a href="#" data-nav="/login" class="btn btn-primary">Log In</a></div>
                </div>
            </div>
        `;
    }

    const user = state.user;
    const projects = state.projects || [];
    const editMode = state._ui?.profileEditMode || false;

    if (editMode) {
        return `
            <div class="container" style="max-width:920px;">
                <h1 class="page-title">👤 Edit Profile</h1>
                <p class="page-sub">Update your account details.</p>
                <div class="card">
                    <form id="profileEditForm">
                        <div class="form-group">
                            <label>Full Name <span class="req">*</span></label>
                            <input type="text" id="profileEditName" class="form-control" value="${user?.name || ''}" required />
                        </div>
                        <div class="form-group">
                            <label>Email Address <span class="req">*</span></label>
                            <input type="email" id="profileEditEmail" class="form-control" value="${user?.email || ''}" required />
                        </div>
                        <div class="profile-form-grid">
                            <div class="form-group">
                                <label>Phone number</label>
                                <input type="tel" id="profileEditPhone" class="form-control" value="${user?.phone || ''}" placeholder="+254 700 000 000" />
                            </div>
                            <div class="form-group">
                                <label>Business / organisation</label>
                                <input type="text" id="profileEditCompany" class="form-control" value="${user?.company || ''}" placeholder="Your business name" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>About you or your business</label>
                            <textarea id="profileEditBio" class="form-control" rows="3" placeholder="A short description to help us understand your work.">${user?.bio || ''}</textarea>
                        </div>
                        <label class="profile-toggle"><input type="checkbox" id="profileEmailUpdates" ${user?.emailUpdates !== false ? 'checked' : ''} /><span></span> Send me project updates by email</label>
                        <div class="form-group">
                            <label>New Password <span style="font-weight:400;color:var(--text-muted);font-size:0.75rem;">(leave blank to keep current)</span></label>
                            <input type="password" id="profileEditPassword" class="form-control" placeholder="Enter new password" minlength="4" />
                        </div>
                        <div class="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" id="profileEditPasswordConfirm" class="form-control" placeholder="Confirm new password" />
                        </div>
                        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
                            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Changes</button>
                            <button type="button" class="btn btn-outline" id="profileCancelEdit"><i class="fas fa-times"></i> Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    return `
        <div class="container profile-page" style="max-width:920px;">
            <h1 class="page-title">👤 Profile</h1>
            <div class="profile-page-heading"><div><p class="page-sub">Your account details and settings.</p></div><button class="btn btn-primary" id="profileEditToggle"><i class="fas fa-pen"></i> Edit Profile</button></div>
            <div class="profile-layout">
            <div class="card profile-summary-card">
                <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:20px;">
                    <div class="profile-avatar-large">${user?.avatar || user?.name?.charAt(0) || 'U'}</div>
                    <div>
                        <h3 style="font-size:1.2rem;">${user?.name || 'User'}</h3>
                        <p style="color:var(--text-secondary);">${user?.email || 'No email'}</p>
                        ${user?.company ? `<p class="profile-company"><i class="fas fa-building"></i> ${user.company}</p>` : '<p class="profile-company muted">Add your business details</p>'}
                        <span class="badge">${user?.role || 'user'}</span>
                    </div>
                </div>
                <div style="border-top:1px solid var(--border);padding-top:16px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                        <div><span class="stat-label">Member since</span><div style="font-weight:500;">2026</div></div>
                        <div><span class="stat-label">Projects</span><div style="font-weight:500;">${projects.length}</div></div>
                    </div>
                </div>
                <div class="profile-edit-actions">
                    <button class="btn btn-outline" id="profileRefresh"><i class="fas fa-sync"></i> Refresh Data</button>
                    <button class="btn btn-danger" id="profileLogout"><i class="fas fa-sign-out-alt"></i> Logout</button>
                </div>
            </div>
            <aside class="profile-side-stack">
                <div class="card profile-insight-card"><span class="stat-label">Workspace activity</span><strong>${projects.filter(p => p.status === 'active').length} active project${projects.filter(p => p.status === 'active').length === 1 ? '' : 's'}</strong><p>Keep your project details up to date so progress stays clear.</p><a href="#" data-nav="/projects">View projects <i class="fas fa-arrow-right"></i></a></div>
                <div class="card profile-contact-card"><i class="fas fa-shield-halved"></i><div><strong>Account preferences</strong><p>Email updates are ${user?.emailUpdates !== false ? 'on' : 'off'}. Edit your profile to update this.</p></div></div>
            </aside>
            </div>
        </div>
    `;
}

/**
 * ============================================================
 *  6. ROUTE REGISTRATION
 *  ============================================================
 */
Router.add('/', renderHome);
Router.add('/home', renderHome);
Router.add('/services', renderServices);
Router.add('/dashboard', renderDashboard);
Router.add('/projects', renderProjects);
Router.add('/project/:id', renderProjectDetail);
Router.add('/pricing', renderPricing);
Router.add('/login', renderLogin);
Router.add('/register', renderRegister);
Router.add('/profile', renderProfile);

Router.setNotFound((params) => `
    <section class="not-found-page container">
        <div class="not-found-copy">
            <div class="eyebrow"><span></span> Error 404</div>
            <h1>Looks like this<br><em>path</em> ends here.</h1>
            <p>The page you’re looking for doesn’t exist, has moved, or is still taking shape.</p>
            <div class="not-found-actions"><a href="#" data-nav="/" class="btn btn-primary btn-lg">Go Home <i class="fas fa-arrow-right"></i></a><a href="#" data-nav="/services" class="text-link">Explore our services</a></div>
        </div>
        <div class="not-found-art" aria-hidden="true"><span>4</span><i class="fas fa-location-arrow"></i><span>4</span><small>WRONG TURN / RIGHT IDEA</small></div>
    </section>
`);

Router.setBefore((path, params) => {
    const state = Store.getState();
    const protectedPaths = ['/dashboard', '/projects', '/profile'];
    if (path.startsWith('/project/') && !state.isAuthenticated) {
        Toast.warning('Please log in to view project details.', 'Authentication Required');
        return '/login';
    }
    if (protectedPaths.includes(path) && !state.isAuthenticated) {
        Toast.warning('Please log in to access this page.', 'Authentication Required');
        return '/login';
    }
    if ((path === '/login' || path === '/register') && state.isAuthenticated) {
        return '/dashboard';
    }
    return path;
});

/**
 * ============================================================
 *  7. EVENT BINDING
 *  ============================================================
 */
function bindEvents() {
    document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-nav]');
        if (el) {
            e.preventDefault();
            const path = el.getAttribute('data-nav');
            Router.navigate(path);
            document.getElementById('navLinks')?.classList.remove('open');
        }
    });

    document.getElementById('mobileToggleSpa')?.addEventListener('click', () => {
        document.getElementById('navLinks')?.classList.toggle('open');
    });

    document.addEventListener('submit', async (e) => {
        const form = e.target.closest('#authForm');
        if (!form) return;
        e.preventDefault();

        const mode = form.getAttribute('data-mode') || 'login';
        const email = document.getElementById('authEmail')?.value.trim();
        const password = document.getElementById('authPassword')?.value;
        const name = document.getElementById('authName')?.value.trim();

        Store.setState({ _ui: { ...Store.getState()._ui, authError: '' } });

        let result;
        if (mode === 'login') {
            result = await Store.actions.login(email, password);
        } else {
            result = await Store.actions.register(name || email?.split('@')[0], email, password);
        }

        if (result.success) {
            if (result.requiresEmailConfirmation) {
                Toast.success('Check your email to confirm your account, then log in.', 'Confirm your email');
                Router.navigate('/login');
                return;
            }
            Toast.success(`Welcome ${result.user?.name || 'User'}!`, 'Authentication Successful');
            await Store.actions.refreshDashboard();
            Router.navigate('/dashboard');
        } else {
            const errorMsg = result.error || 'Something went wrong. Please try again.';
            Toast.error(errorMsg, 'Authentication Failed');
            Store.setState({ _ui: { ...Store.getState()._ui, authError: errorMsg } });
            Router._render(Router.getCurrentPath());
        }
    });

    document.addEventListener('click', async (e) => {
        if (e.target.closest('#logoutBtn') || e.target.closest('#profileLogout')) {
            e.preventDefault();
            await Store.actions.logout();
            Toast.success('You have been logged out.', 'Goodbye');
            Router.navigate('/');
        }
    });

    document.addEventListener('click', async (e) => {
        if (e.target.closest('#refreshDashboard')) {
            await Store.actions.fetchProjects();
            await Store.actions.refreshDashboard();
            Toast.success('Dashboard data refreshed.', 'Updated');
            Router._render(Router.getCurrentPath());
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('#showAddProject')) {
            showProjectRequestModal();
        }
    });

    document.addEventListener('click', async (e) => {
        const target = e.target.closest('.project-view, .project-complete, .project-delete');
        if (!target) return;

        const id = parseInt(target.getAttribute('data-id'));
        if (!id) return;

        if (target.classList.contains('project-delete')) {
            if (confirm('Delete this project?')) {
                const result = await Store.actions.deleteProject(id);
                if (result.success) {
                    Toast.success('Project deleted.', 'Removed');
                    await Store.actions.refreshDashboard();
                    Router._render(Router.getCurrentPath());
                } else {
                    Toast.error(result.error || 'Failed to delete.', 'Error');
                }
            }
        } else if (target.classList.contains('project-complete')) {
            const result = await Store.actions.updateProjectStatus(id, 'completed');
            if (result.success) {
                Toast.success('Project marked as completed.', 'Done');
                await Store.actions.refreshDashboard();
                Router._render(Router.getCurrentPath());
            } else {
                Toast.error(result.error || 'Failed to update.', 'Error');
            }
        } else if (target.classList.contains('project-view')) {
            showProjectProgressSheet(id);
        }
    });

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        const filter = btn.getAttribute('data-filter');
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const grid = document.getElementById('projectGrid');
        if (!grid) return;
        const cards = grid.querySelectorAll('.project-card');
        cards.forEach(card => {
            const statusEl = card.querySelector('.badge');
            const status = statusEl?.textContent?.toLowerCase() || '';
            if (filter === 'all' || status === filter) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });

    document.addEventListener('click', (e) => {
        const close = e.target.closest('[data-modal-close]');
        if (close) {
            const modalId = close.getAttribute('data-modal-close');
            document.getElementById(modalId)?.remove();
        }
        if (e.target.classList.contains('modal-overlay')) {
            e.target.remove();
        }
    });

    document.addEventListener('click', async (e) => {
        if (e.target.closest('#profileRefresh')) {
            await Store.actions.fetchProjects();
            await Store.actions.refreshDashboard();
            Toast.success('Profile data refreshed.', 'Updated');
            Router._render(Router.getCurrentPath());
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('#profileEditToggle')) {
            Store.setState({ _ui: { ...Store.getState()._ui, profileEditMode: true } });
            Router._render(Router.getCurrentPath());
        }
        if (e.target.closest('#profileCancelEdit')) {
            Store.setState({ _ui: { ...Store.getState()._ui, profileEditMode: false } });
            Router._render(Router.getCurrentPath());
        }
    });

    document.addEventListener('submit', async (e) => {
        const form = e.target.closest('#profileEditForm');
        if (!form) return;
        e.preventDefault();

        const name = document.getElementById('profileEditName')?.value.trim();
        const email = document.getElementById('profileEditEmail')?.value.trim();
        const phone = document.getElementById('profileEditPhone')?.value.trim();
        const company = document.getElementById('profileEditCompany')?.value.trim();
        const bio = document.getElementById('profileEditBio')?.value.trim();
        const emailUpdates = document.getElementById('profileEmailUpdates')?.checked;
        const password = document.getElementById('profileEditPassword')?.value;
        const passwordConfirm = document.getElementById('profileEditPasswordConfirm')?.value;

        if (!name || !email) {
            Toast.error('Name and email are required.', 'Error');
            return;
        }

        if (password && password !== passwordConfirm) {
            Toast.error('Passwords do not match.', 'Error');
            return;
        }

        if (password && password.length < 4) {
            Toast.error('Your new password must be at least 4 characters.', 'Password too short');
            return;
        }

        const updates = { name, email, phone, company, bio, emailUpdates };
        if (password) {
            updates.password = password;
            updates.passwordUpdatedAt = new Date().toISOString();
        }

        const result = await Store.actions.updateUserProfile(updates);
        if (result.success) {
            Toast.success('Profile updated successfully!', 'Saved');
            Store.setState({ _ui: { ...Store.getState()._ui, profileEditMode: false } });
            Router._render(Router.getCurrentPath());
        } else {
            Toast.error(result.error || 'Failed to update profile.', 'Error');
        }
    });

    document.addEventListener('click', (e) => {
        const serviceTab = e.target.closest('.pricing-service-tab');
        if (serviceTab) {
            const service = serviceTab.getAttribute('data-pricing-service');
            Store.setState({ _ui: { ...Store.getState()._ui, pricingService: service } });
            Router._render('/pricing');
        }
    });

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.order-plan-btn');
        if (btn) {
            e.preventDefault();
            const plan = btn.getAttribute('data-plan') || 'Growth';
            const price = btn.getAttribute('data-price') || 'Ksh 70,000';
            showOrderModal(plan, price);
        }
    });

    document.addEventListener('submit', async (e) => {
        const form = e.target.closest('#orderForm');
        if (!form) return;
        e.preventDefault();

        const submitBtn = document.getElementById('orderSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;"></span> Placing...';

        const projectName = document.getElementById('orderProjectName')?.value.trim();
        const projectType = document.getElementById('orderProjectType')?.value;
        const description = document.getElementById('orderDescription')?.value.trim();
        const budget = document.getElementById('orderBudget')?.value;
        const timeline = document.getElementById('orderTimeline')?.value;
        const clientName = document.getElementById('orderClientName')?.value.trim();
        const clientEmail = document.getElementById('orderClientEmail')?.value.trim();

        if (!projectName || !description || !clientName || !clientEmail) {
            Toast.error('Please fill in all required fields.', 'Error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Place Order';
            return;
        }

        const result = await Store.actions.placeOrder({
            projectName,
            projectType,
            description,
            budget: budget ? parseFloat(budget) : 0,
            timeline,
            clientName,
            clientEmail
        });

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Place Order';

        if (result.success) {
            Toast.success(`Order for "${projectName}" placed successfully!`, 'Order Confirmed');
            document.getElementById('orderModal')?.remove();
            const state = Store.getState();
            if (state.isAuthenticated) {
                await Store.actions.refreshDashboard();
                Router.navigate('/dashboard');
            } else {
                Toast.info('Create an account to track your project.', 'Welcome!');
                Router.navigate('/register');
            }
        } else {
            Toast.error(result.error || 'Failed to place order. Please try again.', 'Error');
        }
    });

    document.addEventListener('click', async (e) => {
        if (e.target.closest('#refreshProjectDetail')) {
            await Store.actions.fetchProjects();
            await Store.actions.refreshDashboard();
            Toast.success('Project details refreshed.', 'Updated');
            Router._render(Router.getCurrentPath());
        }
    });
}

/**
 * ============================================================
 *  8. MODALS
 *  ============================================================
 */

function showProjectProgressSheet(id) {
    const project = Store.getState().projects.find(item => item.id === id);
    if (!project) {
        Toast.error('This project could not be found.', 'Unavailable');
        return;
    }
    const modalId = 'projectProgressSheet';
    document.getElementById(modalId)?.remove();
    const isComplete = project.status === 'completed';
    const milestones = project.milestones?.length ? project.milestones : [
        { title: 'Project brief received', complete: true },
        { title: 'Discovery & planning', complete: (project.progress || 0) >= 35 },
        { title: 'Design & delivery', complete: isComplete }
    ];
    const progress = isComplete ? 100 : Math.min(100, Number(project.progress) || 0);
    const rows = [
        ['Project', project.title],
        ['Status', isComplete ? 'Completed' : 'Active'],
        ['Progress', `${progress}%`],
        ['Service / type', project.type || 'Not specified'],
        ['Timeline', project.timeline || 'Not specified'],
        ['Budget', project.budget ? `Ksh ${Number(project.budget).toLocaleString()}` : 'Not specified'],
        ['Created', project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'],
        ['Last updated', project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A']
    ];
    const uploadedRows = Array.isArray(project.sheetRows) ? project.sheetRows.slice(0, 100).map(row => (Array.isArray(row) ? row.slice(0, 12) : [row])) : [];
    const uploadedSheet = uploadedRows.length ? `
        <div class="uploaded-sheet-section"><div class="sheet-section-title"><span>Uploaded spreadsheet</span><small>${project.sheetFileName || 'Imported file'} · ${uploadedRows.length} rows</small></div><div class="sheet-scroll imported-sheet-scroll"><table class="project-sheet uploaded-sheet"><tbody>${uploadedRows.map(row => `<tr>${row.map(cell => `<td>${String(cell ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>` : '';
    const html = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-box progress-sheet-box">
                <button class="modal-close-top" data-modal-close="${modalId}">&times;</button>
                <div class="sheet-toolbar"><div><span class="eyebrow"><span></span> Project spreadsheet</span><h3>${project.title}</h3><p><span class="sheet-status ${isComplete ? 'complete' : 'active'}"></span>${isComplete ? 'Completed project' : 'Active project'} · ${progress}% complete</p></div><div class="sheet-actions"><label class="btn btn-outline btn-sm sheet-upload-btn"><i class="fas fa-upload"></i> Upload Excel<input type="file" id="projectSheetUpload" accept=".xlsx,.xls,.csv" hidden /></label><button class="btn btn-outline btn-sm" id="exportProjectSheet"><i class="fas fa-file-excel"></i> Export for Excel</button></div></div>
                <div class="sheet-scroll"><table class="project-sheet"><thead><tr><th>Field</th><th>Details</th></tr></thead><tbody>${rows.map(([field, value]) => `<tr><td>${field}</td><td>${value}</td></tr>`).join('')}</tbody></table></div>
                <div class="sheet-milestones"><div class="sheet-section-title">Delivery progress <span>${progress}%</span></div><div class="sheet-progress"><span style="width:${progress}%"></span></div><table class="project-sheet milestone-sheet"><thead><tr><th>Milestone</th><th>Status</th></tr></thead><tbody>${milestones.map((milestone, index) => `<tr><td>${String(index + 1).padStart(2, '0')} · ${milestone.title}</td><td><span class="milestone-status ${milestone.complete ? 'complete' : 'pending'}">${milestone.complete ? 'Complete' : 'In progress'}</span></td></tr>`).join('')}</tbody></table></div>
                ${uploadedSheet}
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('projectSheetUpload').addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const extension = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();
        reader.onload = async (loadEvent) => {
            try {
                if (typeof XLSX === 'undefined') throw new Error('Spreadsheet support is still loading. Please try again in a moment.');
                let importedRows;
                if (extension === 'csv') {
                    const workbook = XLSX.read(loadEvent.target.result, { type: 'string' });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    importedRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                } else {
                    const workbook = XLSX.read(loadEvent.target.result, { type: 'array' });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    importedRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                }
                if (!importedRows?.length) throw new Error('The selected spreadsheet is empty.');
                const result = await Store.actions.updateProject(id, { sheetFileName: file.name, sheetRows: importedRows.slice(0, 100).map(row => row.slice(0, 12)) });
                if (!result.success) throw new Error(result.error || 'Could not save the spreadsheet.');
                Toast.success(`${file.name} was added to this project.`, 'Spreadsheet uploaded');
                showProjectProgressSheet(id);
            } catch (error) {
                Toast.error(error.message || 'Could not read this spreadsheet.', 'Upload failed');
            }
        };
        if (extension === 'csv') reader.readAsText(file); else reader.readAsArrayBuffer(file);
    });
    document.getElementById('exportProjectSheet').addEventListener('click', () => {
        const finalRows = [
            ['PROJECT PROGRESS SHEET'],
            [],
            ...rows,
            [],
            ['MILESTONE', 'STATUS'],
            ...milestones.map((milestone, index) => [`${index + 1}. ${milestone.title}`, milestone.complete ? 'Complete' : 'In progress']),
            ...(uploadedRows.length ? [[], ['UPLOADED SPREADSHEET', project.sheetFileName || 'Imported file'], ...uploadedRows] : [])
        ];
        const safeName = project.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'project';
        if (typeof XLSX !== 'undefined') {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(finalRows);
            worksheet['!cols'] = [{ wch: 30 }, { wch: 42 }, { wch: 24 }, { wch: 24 }, { wch: 24 }];
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Project progress');
            XLSX.writeFile(workbook, `${safeName}-final-progress.xlsx`);
            Toast.success('Your final Excel sheet, including uploaded data, was downloaded.', 'Export ready');
            return;
        }
        const csv = finalRows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${safeName}-final-progress.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        Toast.success('Your final progress sheet was downloaded.', 'Export ready');
    });
}

function showProjectRequestModal() {
    const modalId = 'projectRequestModal';
    document.getElementById(modalId)?.remove();
    const user = Store.getState().user || {};
    const services = [
        { id: 'digital', number: '01', icon: 'fa-code', title: 'Digital products', text: 'Websites, portals, and custom tools designed around how your team actually works.', type: 'Digital Product', project: 'What would you like to build?', options: ['Business website', 'Online store', 'Client portal', 'Booking system', 'Custom web app'], preference: 'What matters most for this project?', preferenceOptions: ['A polished new look', 'More leads or sales', 'Saving time with automation', 'A clearer client experience'] },
        { id: 'assistant', number: '02', icon: 'fa-headset', title: 'Virtual assistance', text: 'Reliable admin, client coordination, and operations support that creates breathing room.', type: 'Virtual Assistance', project: 'What support would help most?', options: ['Email & calendar', 'Client support', 'Research & data entry', 'Social media support', 'Ongoing admin'], preference: 'How much support do you need?', preferenceOptions: ['A one-off task', 'A few hours each week', 'Regular ongoing support', 'Not sure yet'] },
        { id: 'brand', number: '03', icon: 'fa-pen-ruler', title: 'Brand & design', text: 'Clear visual identities and creative assets made to earn attention and build trust.', type: 'Brand & Design', project: 'What are you looking for?', options: ['Logo & brand identity', 'Social media graphics', 'Marketing materials', 'Presentation design', 'Website visuals'], preference: 'What is your main goal?', preferenceOptions: ['Launch a new business', 'Refresh an existing brand', 'Promote a campaign', 'Create consistent visuals'] }
    ];
    const serviceCards = services.map(service => `<button type="button" class="request-service-card" data-request-service="${service.id}"><span class="request-number">${service.number}</span><i class="fas ${service.icon}"></i><h4>${service.title}</h4><p>${service.text}</p></button>`).join('');
    const html = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-box project-request-box">
                <button class="modal-close-top" data-modal-close="${modalId}">&times;</button>
                <div class="request-progress"><span class="is-active" data-step-dot="1">1. Choose a service</span><i></i><span data-step-dot="2">2. Tell us about it</span></div>
                <div id="requestStepOne"><div class="request-heading"><div class="eyebrow"><span></span> Start a project</div><h3>What can we help with?</h3><p>Choose the service that best fits your request. You can add more detail next.</p></div><div class="request-service-grid">${serviceCards}</div></div>
                <form id="projectRequestForm" class="hidden">
                    <input type="hidden" id="requestService" />
                    <div class="request-heading"><button type="button" class="request-back" id="requestBack"><i class="fas fa-arrow-left"></i> Change service</button><div class="eyebrow"><span></span> Your request</div><h3 id="requestFormTitle">Tell us about your project</h3><p>We’ll use this to shape the right scope and next steps.</p></div>
                    <div class="request-form-grid">
                        <div class="form-group"><label>Project or business name <span class="req">*</span></label><input id="requestProjectName" class="form-control" required placeholder="e.g. Kipepeo Coffee" /></div>
                        <div class="form-group"><label id="requestProjectLabel">Project type</label><select id="requestProjectType" class="form-control"></select></div>
                        <div class="form-group"><label id="requestPreferenceLabel">Your preference</label><select id="requestPreference" class="form-control"></select></div>
                        <div class="form-group"><label>Ideal timeline</label><select id="requestTimeline" class="form-control"><option>As soon as possible</option><option selected>Within 2–4 weeks</option><option>Within 1–2 months</option><option>I’m flexible</option></select></div>
                        <div class="form-group"><label>Estimated budget</label><select id="requestBudget" class="form-control"><option value="Ksh 25,000 – 50,000">Ksh 25,000 – 50,000</option><option value="Ksh 50,000 – 100,000">Ksh 50,000 – 100,000</option><option value="Ksh 100,000 – 200,000">Ksh 100,000 – 200,000</option><option value="Ksh 200,000+">Ksh 200,000+</option><option value="Not sure yet">Not sure yet</option></select></div>
                        <div class="form-group"><label>Your name <span class="req">*</span></label><input id="requestClientName" class="form-control" required value="${user.name || ''}" placeholder="Your full name" /></div>
                        <div class="form-group"><label>Email address <span class="req">*</span></label><input id="requestClientEmail" type="email" class="form-control" required value="${user.email || ''}" placeholder="you@example.com" /></div>
                        <div class="form-group request-full"><label>Anything else we should know?</label><textarea id="requestDescription" class="form-control" rows="4" placeholder="Tell us about your goals, audience, useful links, or anything else that will help."></textarea></div>
                    </div>
                    <div class="request-submit"><span>Your request will be added to Projects and prepared as an email brief.</span><button type="submit" class="btn btn-primary" id="requestSubmit"><i class="fas fa-envelope"></i> Submit by email</button></div>
                </form>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    let selectedService;
    const setService = (id) => {
        selectedService = services.find(service => service.id === id);
        if (!selectedService) return;
        document.getElementById('requestService').value = selectedService.id;
        document.getElementById('requestFormTitle').textContent = selectedService.title;
        document.getElementById('requestProjectLabel').textContent = selectedService.project;
        document.getElementById('requestPreferenceLabel').textContent = selectedService.preference;
        document.getElementById('requestProjectType').innerHTML = selectedService.options.map(option => `<option>${option}</option>`).join('');
        document.getElementById('requestPreference').innerHTML = selectedService.preferenceOptions.map(option => `<option>${option}</option>`).join('');
        document.getElementById('requestStepOne').classList.add('hidden');
        document.getElementById('projectRequestForm').classList.remove('hidden');
        document.querySelector('[data-step-dot="1"]').classList.remove('is-active');
        document.querySelector('[data-step-dot="2"]').classList.add('is-active');
    };
    document.querySelectorAll('[data-request-service]').forEach(card => card.addEventListener('click', () => setService(card.dataset.requestService)));
    document.getElementById('requestBack').addEventListener('click', () => {
        document.getElementById('projectRequestForm').classList.add('hidden');
        document.getElementById('requestStepOne').classList.remove('hidden');
        document.querySelector('[data-step-dot="2"]').classList.remove('is-active');
        document.querySelector('[data-step-dot="1"]').classList.add('is-active');
    });
    document.getElementById('projectRequestForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!selectedService) return;
        const submit = document.getElementById('requestSubmit');
        submit.disabled = true;
        submit.innerHTML = '<span class="spinner" style="width:16px;height:16px;"></span> Sending...';
        const projectType = document.getElementById('requestProjectType').value;
        const preference = document.getElementById('requestPreference').value;
        const description = document.getElementById('requestDescription').value.trim();
        const orderData = {
            projectName: document.getElementById('requestProjectName').value.trim(),
            projectType: `${selectedService.type} · ${projectType}`,
            description: `${preference ? `Priority: ${preference}. ` : ''}${description}`.trim(),
            budget: document.getElementById('requestBudget').value,
            timeline: document.getElementById('requestTimeline').value,
            clientName: document.getElementById('requestClientName').value.trim(),
            clientEmail: document.getElementById('requestClientEmail').value.trim()
        };
        const emailSubject = `New project request — ${orderData.projectName}`;
        const emailBody = [
            'NEW PROJECT REQUEST',
            '',
            `Service: ${selectedService.title}`,
            `Project / business: ${orderData.projectName}`,
            `Requested work: ${projectType}`,
            `Client priority: ${preference}`,
            `Timeline: ${orderData.timeline}`,
            `Budget: ${orderData.budget}`,
            '',
            `Client name: ${orderData.clientName}`,
            `Client email: ${orderData.clientEmail}`,
            '',
            'Additional notes:',
            description || 'None provided.'
        ].join('\n');
        const result = await Store.actions.placeOrder(orderData);
        if (result.success) {
            window.location.href = `mailto:iamkorir200@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
            Toast.success('Your request is in Projects and your email brief is ready to send.', 'Request submitted');
            document.getElementById(modalId)?.remove();
            await Store.actions.refreshDashboard();
            Router._render(Router.getCurrentPath());
        } else {
            submit.disabled = false;
            submit.innerHTML = '<i class="fas fa-envelope"></i> Submit by email';
            Toast.error(result.error || 'Could not submit the request.', 'Try again');
        }
    });
}

function showAddProjectModal() {
    const modalId = 'addProjectModal';
    document.getElementById(modalId)?.remove();

    const html = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-box">
                <button class="modal-close-top" data-modal-close="${modalId}">&times;</button>
                <h3 style="margin-bottom:4px;">➕ New Project</h3>
                <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:16px;">Fill in the details to create a new project.</p>
                <form id="addProjectForm">
                    <div class="form-group">
                        <label>Project Title <span class="req">*</span></label>
                        <input type="text" id="newProjectTitle" class="form-control" placeholder="e.g. My Awesome Project" required />
                    </div>
                    <div class="form-group">
                        <label>Category / Type</label>
                        <input type="text" id="newProjectType" class="form-control" placeholder="e.g. Web · Portfolio" />
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="newProjectDesc" class="form-control" placeholder="Brief description..." rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Icon (FontAwesome class)</label>
                        <input type="text" id="newProjectIcon" class="form-control" placeholder="fa-laptop" value="fa-folder" />
                    </div>
                    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap;">
                        <button type="button" class="btn btn-outline" data-modal-close="${modalId}">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Project</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    const form = document.getElementById('addProjectForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('newProjectTitle')?.value.trim();
            if (!title) {
                Toast.error('Project title is required.', 'Error');
                return;
            }
            const type = document.getElementById('newProjectType')?.value.trim() || 'Project';
            const desc = document.getElementById('newProjectDesc')?.value.trim() || '';
            const icon = document.getElementById('newProjectIcon')?.value.trim() || 'fa-folder';

            const result = await Store.actions.addProject({ title, type, desc, icon });
            if (result.success) {
                Toast.success(`Project "${title}" created!`, 'Added');
                document.getElementById(modalId)?.remove();
                await Store.actions.refreshDashboard();
                Router._render(Router.getCurrentPath());
            } else {
                Toast.error(result.error || 'Failed to create project.', 'Error');
            }
        });
    }
}

function showOrderModal(planName, planPrice) {
    const modalId = 'orderModal';
    document.getElementById(modalId)?.remove();

    const state = Store.getState();
    const user = state.user;

    const html = Components.orderFormModal({ planName, planPrice });
    document.body.insertAdjacentHTML('beforeend', html);

    if (user) {
        const nameField = document.getElementById('orderClientName');
        const emailField = document.getElementById('orderClientEmail');
        if (nameField) nameField.value = user.name || '';
        if (emailField) emailField.value = user.email || '';
    }
}

/**
 * ============================================================
 *  9. CHART RENDERER
 *  ============================================================
 */
function renderChart(canvasId, labels, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    setTimeout(() => {
        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        if (!container) return;
        const width = container.clientWidth - 48;
        const height = 200;
        canvas.width = width * 2;
        canvas.height = height * 2;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(2, 2);

        const pad = { top: 20, bottom: 30, left: 30, right: 20 };
        const chartW = width - pad.left - pad.right;
        const chartH = height - pad.top - pad.bottom;

        const maxVal = Math.max(...values, 1);

        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(width - pad.right, y);
            ctx.stroke();
        }

        const barWidth = Math.min(chartW / values.length * 0.6, 40);
        const gap = chartW / values.length;

        const hasData = values.some(v => v > 0);

        if (!hasData) {
            ctx.fillStyle = '#8896a8';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No activity yet', width / 2, height / 2 + 6);
            return;
        }

        values.forEach((val, idx) => {
            const x = pad.left + idx * gap + (gap - barWidth) / 2;
            const barH = (val / maxVal) * chartH * 0.85;
            const y = pad.top + chartH - barH;

            const grad = ctx.createLinearGradient(x, y, x, pad.top + chartH);
            grad.addColorStop(0, '#1a5cff');
            grad.addColorStop(1, '#6a8eff');
            ctx.fillStyle = grad;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(x, y, barWidth, barH, 4);
            } else {
                ctx.rect(x, y, barWidth, barH);
            }
            ctx.fill();

            ctx.fillStyle = '#8896a8';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[idx] || '', x + barWidth / 2, pad.top + chartH + 20);
        });

        values.forEach((val, idx) => {
            if (val === 0) return;
            const x = pad.left + idx * gap + gap / 2;
            const barH = (val / maxVal) * chartH * 0.85;
            const y = pad.top + chartH - barH - 6;
            ctx.fillStyle = '#0b1a2f';
            ctx.font = '600 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(val, x, y);
        });

    }, 80);
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (r > w / 2) r = w / 2;
        if (r > h / 2) r = h / 2;
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

/**
 * ============================================================
 *  10. STORE SUBSCRIPTION — REACTIVE UI
 *  ============================================================
 */
Store.subscribe((state, prev) => {
    const isAuth = state.isAuthenticated;
    const authBtns = document.getElementById('navAuthButtons');
    const userMenu = document.getElementById('navUserMenu');
    const userName = document.getElementById('navUserName');
    const avatar = document.getElementById('navAvatar');

    if (isAuth) {
        authBtns?.classList.add('hidden');
        userMenu?.classList.remove('hidden');
        userMenu.style.display = 'flex';
        if (userName) userName.textContent = state.user?.name || 'User';
        if (avatar) avatar.textContent = state.user?.avatar || state.user?.name?.charAt(0) || 'U';
    } else {
        authBtns?.classList.remove('hidden');
        userMenu?.classList.add('hidden');
        userMenu.style.display = 'none';
    }

    if (prev && prev.isAuthenticated !== isAuth) {
        const path = Router.getCurrentPath();
        const protectedPaths = ['/dashboard', '/projects', '/profile'];
        if (!isAuth && (protectedPaths.includes(path) || path.startsWith('/project/'))) {
            Router.navigate('/');
        }
        if (isAuth && (path === '/login' || path === '/register')) {
            Router.navigate('/dashboard');
        }
    }

    if (state.dashboard && state.dashboard.chartData) {
        const data = state.dashboard.chartData;
        if (data.labels && data.values && data.values.length) {
            renderChart('dashChart', data.labels, data.values);
        }
    }

    if (prev && prev.projects !== state.projects) {
        const path = Router.getCurrentPath();
        if (path === '/dashboard' || path === '/projects' || path.startsWith('/project/')) {
            Router._render(path);
        }
    }
});

/**
 * ============================================================
 *  11. INITIALIZATION
 *  ============================================================
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Store.init();
    } catch (error) {
        console.error('Unable to initialize Supabase:', error);
        const errorMsg = error.message || 'Authentication is temporarily unavailable.';
        let userMessage = '<strong>Configuration Error</strong><br>' + errorMsg;
        if (errorMsg.includes('not loaded') || errorMsg.includes('network') || errorMsg.includes('fetch')) {
            userMessage += '<br><br><small>Please check your internet connection and refresh the page.</small>';
        } else if (errorMsg.includes('Missing') || errorMsg.includes('configuration')) {
            userMessage += '<br><br><small>Please contact the site administrator.</small>';
        }
        const errDiv = document.createElement('div');
        errDiv.style.cssText = 'padding:20px;background:#fde8e8;color:#991b1b;margin:20px;border-radius:8px;max-width:600px;';
        errDiv.innerHTML = userMessage;
        const appRoot = document.getElementById('appRoot');
        if (appRoot) {
            appRoot.insertBefore(errDiv, appRoot.firstChild);
        }
    }
    Router.init();
    bindEvents();

    setTimeout(() => {
        const state = Store.getState();
        if (state.dashboard && state.dashboard.chartData) {
            const data = state.dashboard.chartData;
            if (data.labels && data.values && data.values.length) {
                renderChart('dashChart', data.labels, data.values);
            }
        }
    }, 400);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const state = Store.getState();
            if (state.dashboard && state.dashboard.chartData) {
                const data = state.dashboard.chartData;
                if (data.labels && data.values && data.values.length) {
                    renderChart('dashChart', data.labels, data.values);
                }
            }
        }, 300);
    });

    console.log('🚀 Korir Digital SPA initialized.');
    console.log('📦 State:', Store.getState());
});

window.__KORIR = { Store, Router, Toast, Components, renderChart };
