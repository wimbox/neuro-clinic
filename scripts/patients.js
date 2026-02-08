/**
 * PatientManager Compatibility Layer
 * Redirects requests to the new SyncManager.
 */
class PatientManager {
    constructor() {
        this.sync = window.syncManager;
    }

    get patients() {
        return this.sync.getPatients();
    }

    // Picks up the ID from localStorage set by the Dashboard
    // UPDATED: Now also checks URL parameters for direct linking
    getSelectedPatient() {
        // 1. Try URL Parameter first (Stronger)
        const urlParams = new URLSearchParams(window.location.search);
        const urlId = urlParams.get('patientId');
        if (urlId) {
            return this.patients.find(p => p.id === urlId);
        }

        // 2. Fallback to LocalStorage (Legacy / Default)
        const id = localStorage.getItem('selected_patient_id');
        if (id) {
            return this.patients.find(p => p.id === id);
        }
        return null;
    }

    // For backward compatibility with existing code
    save() {
        this.sync.saveLocal();
    }
}

// Ensure SyncManager is loaded before this
if (!window.syncManager) {
    console.error("SyncManager not found. Loading local patients.js as fallback.");
}

window.patientManager = new PatientManager();
