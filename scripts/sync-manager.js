/**
 * SyncManager: Handles local data with background cloud sync preparation.
 * Supports CRUD operations with offline persistence.
 */

// --- إعدادات النظام (يمكنك التعديل من هنا مباشرة) ---
const GLOBAL_CONFIG = {
    STARTING_CODE: 0,
    CLINIC_NAME: 'الاسكندرية'
};
// -----------------------------------------------
class SyncManager {
    constructor() {
        this.DB_KEY = 'neuro_clinic_data_v1';
        // Force Reload Logic Fix
        this.data = this.loadLocal();
    }

    loadLocal() {
        const saved = localStorage.getItem(this.DB_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure settings and counter exist
            // Ensure clinics array exists with correct identity
            if (!parsed.clinics || parsed.clinics.length === 0) {
                parsed.clinics = [
                    {
                        id: 'clinic-default',
                        name: 'الاسكندرية',
                        isActive: true,
                        settings: { currency: 'EGP', timezone: 'Africa/Cairo', workingHours: { start: '09:00', end: '21:00' } }
                    },
                    {
                        id: 'clinic-shubrakhit',
                        name: 'شبراخيت',
                        isActive: true,
                        settings: { currency: 'EGP', timezone: 'Africa/Cairo', workingHours: { start: '09:00', end: '21:00' } }
                    }
                ];
            } else {
                // Fix names if they exist but are wrong
                const main = parsed.clinics.find(c => c.id === 'clinic-default');
                if (main) main.name = 'الاسكندرية';

                // Robust Check for Shubrakhit
                let shub = parsed.clinics.find(c => c.id === 'clinic-shubrakhit');
                if (!shub) {
                    // Try finding by name to prevent duplicates if ID was wrong
                    shub = parsed.clinics.find(c => c.name === 'شبراخيت');
                    if (shub) {
                        shub.id = 'clinic-shubrakhit'; // Fix ID
                    } else {
                        // Create New
                        parsed.clinics.push({
                            id: 'clinic-shubrakhit',
                            name: 'شبراخيت',
                            isActive: true,
                            settings: { currency: 'EGP', timezone: 'Africa/Cairo', workingHours: { start: '09:00', end: '21:00' } }
                        });
                    }
                } else {
                    // Ensure Name is Correct
                    shub.name = 'شبراخيت';
                }
            }

            // Persistence: Force save back to localStorage if we had to fix things
            localStorage.setItem(this.DB_KEY, JSON.stringify(parsed));

            if (parsed.settings.lastPatientCode === undefined) {
                parsed.settings.lastPatientCode = GLOBAL_CONFIG.STARTING_CODE;
            }

            // --- Migration for New Features (Users & Logs) ---
            if (!parsed.users) {
                parsed.users = [
                    { id: 'admin-001', username: 'admin', password: 'admin', role: 'admin', name: 'المدير العام', assignedClinics: ['clinic-default', 'clinic-shubrakhit'], defaultClinic: 'clinic-default' }
                ];
            } else {
                // Critical Fix: Ensure existing users have clinic assignments
                const clinicIds = parsed.clinics.map(c => c.id);
                parsed.users.forEach(u => {
                    if (!u.assignedClinics || u.assignedClinics.length === 0) {
                        u.assignedClinics = [...clinicIds];
                    }
                });

                // --- SECURITY EXCEPTION: Restrict 'Hind' to Alexandria Only ---
                const hindUser = parsed.users.find(u => u.name.includes('هند') || u.username === 'hind' || u.username === 'hand');
                if (hindUser) {
                    // Remove Shubrakhit from assigned clinics
                    hindUser.assignedClinics = hindUser.assignedClinics.filter(id => id !== 'clinic-shubrakhit');
                    // Ensure Alexandria is assigned
                    if (!hindUser.assignedClinics.includes('clinic-default')) {
                        hindUser.assignedClinics.push('clinic-default');
                    }
                }

                // --- SECURITY EXCEPTION: Restrict 'Sasha' to Alexandria Only ---
                const sashaUser = parsed.users.find(u => u.name.includes('صشة') || u.name.includes('صشه') || u.username === 'sasha');
                if (sashaUser) {
                    // Remove Shubrakhit from assigned clinics
                    sashaUser.assignedClinics = sashaUser.assignedClinics.filter(id => id !== 'clinic-shubrakhit');
                    // Ensure Alexandria is assigned
                    if (!sashaUser.assignedClinics.includes('clinic-default')) {
                        sashaUser.assignedClinics.push('clinic-default');
                    }
                }
                // -------------------------------------------------------------
            }
            if (!parsed.auditLog) parsed.auditLog = [];
            // --------------------------------------------------

            // --- Migration for Multi-Clinic Support ---
            if (!parsed.clinics) {
                // Create default clinic
                const defaultClinic = {
                    id: 'clinic-default',
                    name: GLOBAL_CONFIG.CLINIC_NAME || 'Neuro-Clinic',
                    address: '',
                    phone: '',
                    logo: null,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    settings: {
                        currency: 'EGP',
                        timezone: 'Africa/Cairo',
                        workingHours: { start: '09:00', end: '21:00' }
                    }
                };
                parsed.clinics = [defaultClinic];

                // Assign default clinic to all existing data
                parsed.patients.forEach(p => { if (!p.clinicId) p.clinicId = 'clinic-default'; });
                parsed.appointments.forEach(a => { if (!a.clinicId) a.clinicId = 'clinic-default'; });
                if (parsed.finances && parsed.finances.transactions) {
                    parsed.finances.transactions.forEach(t => { if (!t.clinicId) t.clinicId = 'clinic-default'; });
                }

                // Assign default clinic to all users
                parsed.users.forEach(u => {
                    if (!u.assignedClinics) u.assignedClinics = ['clinic-default'];
                    if (!u.defaultClinic) u.defaultClinic = 'clinic-default';
                });

                parsed.settings.activeClinicId = 'clinic-default';
            }
            // --------------------------------------------------

            // Migrate: Assign codes to patients who don't have one
            let changed = false;
            parsed.patients.forEach(p => {
                if (p.patientCode === undefined) {
                    parsed.settings.lastPatientCode++;
                    p.patientCode = parsed.settings.lastPatientCode;
                    changed = true;
                }
            });
            if (changed) {
                this.data = parsed;
                this.saveLocal();
            }
            return parsed;
        }

        // Default Structure
        return {
            clinics: [
                {
                    id: 'clinic-default',
                    name: GLOBAL_CONFIG.CLINIC_NAME || 'Neuro-Clinic',
                    address: '',
                    phone: '',
                    logo: null,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    settings: {
                        currency: 'EGP',
                        timezone: 'Africa/Cairo',
                        workingHours: { start: '09:00', end: '21:00' }
                    }
                }
            ],
            users: [
                {
                    id: 'admin-001',
                    username: 'admin',
                    password: 'admin',
                    role: 'admin',
                    name: 'المدير العام',
                    assignedClinics: ['clinic-default'],
                    defaultClinic: 'clinic-default'
                }
            ],
            auditLog: [], // { timestamp, user, action, details }
            patients: [],
            appointments: [],
            finances: {
                transactions: [],
                ledger: {}
            },
            settings: {
                clinicName: GLOBAL_CONFIG.CLINIC_NAME,
                lastSync: null,
                lastPatientCode: GLOBAL_CONFIG.STARTING_CODE,
                activeClinicId: 'clinic-default'
            }
        };
    }

    // --- Audit Logging ---
    logAction(user, action, details) {
        const log = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            user: user, // username
            action: action, // e.g., 'DELETE_PATIENT', 'ADD_USER'
            details: details
        };
        this.data.auditLog.unshift(log); // Add to top
        // Limit log size to last 1000 actions to save space
        if (this.data.auditLog.length > 1000) this.data.auditLog.pop();
        this.saveLocal();
    }

    // --- Data Export & Backup ---
    exportPatientsCSV() {
        const patients = this.data.patients;
        if (patients.length === 0) return null;

        // CSV Header
        let csv = '\uFEFF'; // BOM for Excel Arabic support
        csv += "الكود,الاسم,السن,الهاتف,النوع,تاريخ التسجيل\n";

        // CSV Rows
        patients.forEach(p => {
            csv += `${p.patientCode},"${p.name}",${p.age},"${p.phone}",${p.gender},${new Date(p.createdAt).toLocaleDateString()}\n`;
        });

        return csv;
    }

    getBackupJSON() {
        return JSON.stringify(this.data, null, 2);
    }

    restoreBackup(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            // Basic Validation
            if (parsed.patients && parsed.users && parsed.settings) {
                this.data = parsed;
                this.saveLocal();
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    saveLocal() {
        localStorage.setItem(this.DB_KEY, JSON.stringify(this.data));
        this.triggerCloudSync();
    }

    // --- Patient Operations (CRUD) ---
    getPatients() { return this.data.patients; }

    upsertPatient(patient) {
        const currentUser = window.authManager?.currentUser?.username || 'System';
        const index = this.data.patients.findIndex(p => p.id === patient.id);
        if (index > -1) {
            const oldName = this.data.patients[index].name;
            this.data.patients[index] = { ...this.data.patients[index], ...patient, lastUpdated: new Date().toISOString() };
            this.logAction(currentUser, 'UPDATE_PATIENT', `تعديل بيانات المريض: ${oldName} (${patient.name})`);
        } else {
            const nextCode = (this.data.settings.lastPatientCode || 0) + 1;
            this.data.settings.lastPatientCode = nextCode;

            const newPatient = {
                id: crypto.randomUUID(),
                patientCode: nextCode,
                visits: [],
                createdAt: new Date().toISOString(),
                clinicId: this.data.settings.activeClinicId || 'clinic-default', // Auto-assign active clinic
                ...patient
            };
            this.data.patients.push(newPatient);
            this.logAction(currentUser, 'ADD_PATIENT', `إضافة مريض جديد: ${newPatient.name} (${newPatient.patientCode})`);
        }
        this.saveLocal();
    }

    deletePatient(id) {
        const currentUser = window.authManager?.currentUser?.username || 'System';
        const patient = this.data.patients.find(p => p.id === id);
        if (patient) {
            this.logAction(currentUser, 'DELETE_PATIENT', `حذف المريض: ${patient.name} (#${patient.patientCode})`);
            this.data.patients = this.data.patients.filter(p => p.id !== id);
            this.data.appointments = this.data.appointments.filter(a => a.patientId !== id);
            this.saveLocal();
        }
    }

    // --- Financial Operations ---
    addTransaction(tx) {
        const currentUser = window.authManager?.currentUser?.username || 'System';
        const transaction = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            clinicId: this.data.settings.activeClinicId || 'clinic-default', // Auto-assign active clinic
            ...tx
        };
        this.data.finances.transactions.push(transaction);

        // Update patient ledger
        if (tx.patientId) {
            if (!this.data.finances.ledger[tx.patientId]) {
                this.data.finances.ledger[tx.patientId] = { balance: 0 };
            }
            const amount = parseFloat(tx.amount);
            if (tx.type === 'income') this.data.finances.ledger[tx.patientId].balance += amount;
            else this.data.finances.ledger[tx.patientId].balance -= amount;
        }

        this.logAction(currentUser, tx.type === 'income' ? 'ADD_INCOME' : 'ADD_EXPENSE', `تسجيل ${tx.type === 'income' ? 'إيراد' : 'مصروف'}: ${tx.description} بقيمة ${tx.amount}`);
        this.saveLocal();
    }

    // --- User Management ---
    addUser(user) {
        const currentUser = window.authManager?.currentUser?.username || 'System';
        const newUser = {
            id: crypto.randomUUID(),
            ...user
        };
        this.data.users = this.data.users || [];
        this.data.users.push(newUser);
        this.logAction(currentUser, 'ADD_USER', `إضافة مستخدم جديد: ${user.name} (${user.username}) بصلاحية ${user.role}`);
        this.saveLocal();
    }

    updateUser(userId, updates) {
        const currentUser = window.authManager?.currentUser?.username || 'System';
        const index = this.data.users.findIndex(u => u.id === userId);
        if (index > -1) {
            const oldName = this.data.users[index].name;
            this.data.users[index] = { ...this.data.users[index], ...updates };
            this.logAction(currentUser, 'UPDATE_USER', `تعديل بيانات الموظف: ${oldName} (${this.data.users[index].name})`);
            this.saveLocal();
            return true;
        }
        return false;
    }

    deleteUser(userId) {
        const currentUser = window.authManager?.currentUser?.username || 'System';
        const user = this.data.users.find(u => u.id === userId);
        if (user) {
            if (user.role === 'admin' && this.data.users.filter(u => u.role === 'admin').length <= 1) {
                console.error("Cannot delete the last admin user.");
                return false;
            }
            this.logAction(currentUser, 'DELETE_USER', `حذف المستخدم: ${user.name} (${user.username})`);
            this.data.users = this.data.users.filter(u => u.id !== userId);
            this.saveLocal();
            return true;
        }
        return false;
    }

    changeUserPassword(userId, newPassword) {
        const currentUser = window.authManager?.currentUser?.username || 'System';
        const user = this.data.users.find(u => u.id === userId);
        if (user) {
            user.password = newPassword;
            this.logAction(currentUser, 'CHANGE_PASSWORD', `تعديل كلمة المرور للمستخدم: ${user.name} (${user.username})`);
            this.saveLocal();
            return true;
        }
        return false;
    }

    // --- Clinic Management ---
    getClinics() {
        // Self-Healing: Ensure Shubrakhit exists whenever clinics are accessed
        if (this.data.clinics && !this.data.clinics.find(c => c.id === 'clinic-shubrakhit' || c.name === 'شبراخيت')) {
            this.data.clinics.push({
                id: 'clinic-shubrakhit',
                name: 'شبراخيت',
                isActive: true,
                createdAt: new Date().toISOString(),
                settings: { currency: 'EGP', timezone: 'Africa/Cairo', workingHours: { start: '09:00', end: '21:00' } }
            });
            this.saveLocal(); // Force Save immediately
        }
        return this.data.clinics || [];
    }

    getActiveClinic() {
        const activeId = this.data.settings.activeClinicId || 'clinic-default';
        return this.data.clinics.find(c => c.id === activeId) || this.data.clinics[0];
    }

    setActiveClinic(clinicId) {
        const clinic = this.data.clinics.find(c => c.id === clinicId);
        if (clinic) {
            this.data.settings.activeClinicId = clinicId;
            this.saveLocal();
            return true;
        }
        return false;
    }

    addClinic(clinic) {
        const currentUser = window.authManager?.currentUser?.username || 'System';
        const newClinic = {
            id: crypto.randomUUID(),
            isActive: true,
            createdAt: new Date().toISOString(),
            settings: {
                currency: 'EGP',
                timezone: 'Africa/Cairo',
                workingHours: { start: '09:00', end: '21:00' }
            },
            ...clinic
        };
        this.data.clinics.push(newClinic);
        this.logAction(currentUser, 'ADD_CLINIC', `إضافة عيادة جديدة: ${clinic.name}`);
        this.saveLocal();
        return newClinic;
    }

    updateClinic(clinicId, updates) {
        const currentUser = window.authManager?.currentUser?.username || 'System';
        const index = this.data.clinics.findIndex(c => c.id === clinicId);
        if (index !== -1) {
            this.data.clinics[index] = { ...this.data.clinics[index], ...updates };
            this.logAction(currentUser, 'UPDATE_CLINIC', `تعديل بيانات العيادة: ${this.data.clinics[index].name}`);
            this.saveLocal();
            return true;
        }
        return false;
    }

    deleteClinic(clinicId) {
        const currentUser = window.authManager?.currentUser?.username || 'System';
        const clinic = this.data.clinics.find(c => c.id === clinicId);

        if (!clinic) return false;

        // Prevent deleting the last clinic
        if (this.data.clinics.length <= 1) {
            console.error("Cannot delete the last clinic.");
            return false;
        }

        // Check if clinic has data
        const hasPatients = this.data.patients.some(p => p.clinicId === clinicId);
        const hasAppointments = this.data.appointments.some(a => a.clinicId === clinicId);
        const hasTransactions = this.data.finances.transactions.some(t => t.clinicId === clinicId);

        if (hasPatients || hasAppointments || hasTransactions) {
            console.error("Cannot delete clinic with existing data. Please transfer or delete data first.");
            return { success: false, reason: 'has_data' };
        }

        this.logAction(currentUser, 'DELETE_CLINIC', `حذف العيادة: ${clinic.name}`);
        this.data.clinics = this.data.clinics.filter(c => c.id !== clinicId);

        // If deleted clinic was active, switch to first available
        if (this.data.settings.activeClinicId === clinicId) {
            this.data.settings.activeClinicId = this.data.clinics[0].id;
        }

        this.saveLocal();
        return { success: true };
    }

    // Get filtered data by active clinic
    getPatientsByClinic(clinicId = null) {
        const targetClinic = clinicId || this.data.settings.activeClinicId;
        return this.data.patients.filter(p => p.clinicId === targetClinic);
    }

    getAppointmentsByClinic(clinicId = null) {
        const targetClinic = clinicId || this.data.settings.activeClinicId;
        return this.data.appointments.filter(a => a.clinicId === targetClinic);
    }

    getTransactionsByClinic(clinicId = null) {
        const targetClinic = clinicId || this.data.settings.activeClinicId;
        return this.data.finances.transactions.filter(t => t.clinicId === targetClinic);
    }

    // --- Cloud Sync ---
    async triggerCloudSync() {
        if (typeof db === 'undefined' || !db) {
            console.log("Cloud sync: Firebase not initialized or configured.");
            return;
        }

        try {
            // Get current clinic ID for document partitioning (optional but better)
            const docId = 'clinic_master_data';

            console.log("Cloud sync: Syncing data to Firestore...");
            // Push the entire data object to Firestore
            // Note: firestore has a 1MB limit per document. If data grows too large, 
            // you'll need to split this into multiple documents.
            await db.collection('app_data').doc(docId).set({
                ...this.data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("Cloud sync: Success.");
        } catch (error) {
            console.error("Cloud sync failed:", error);
        }
    }

    /**
     * Downloads and merges data from cloud.
     * Caution: This currently overwrites local data.
     */
    async pullFromCloud() {
        if (typeof db === 'undefined' || !db) return false;

        try {
            const doc = await db.collection('app_data').doc('clinic_master_data').get();
            if (doc.exists) {
                const cloudData = doc.data();
                // Basic check: don't overwrite if cloudData is empty or invalid
                if (cloudData.patients) {
                    this.data = cloudData;
                    // Save to local without triggering recursive sync
                    localStorage.setItem(this.DB_KEY, JSON.stringify(this.data));
                    console.log("Cloud data pulled and applied successfully.");
                    return true;
                }
            }
        } catch (error) {
            console.error("Cloud pull failed:", error);
        }
        return false;
    }
}

window.syncManager = new SyncManager();
