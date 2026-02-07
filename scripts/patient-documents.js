/**
 * Patient Documents Manager
 * Handles uploading, viewing, and organizing patient medical documents
 */
class PatientDocuments {
    constructor() {
        this.documents = this.loadDocuments();
    }

    /**
     * Load documents from localStorage
     */
    loadDocuments() {
        try {
            if (window.syncManager?.data?.patientDocs) return window.syncManager.data.patientDocs;
            const data = localStorage.getItem('neuro-patient-documents');
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error("Error loading documents:", e);
            return {}; // Fallback to empty object to prevent crash
        }
    }

    /**
     * Save documents to localStorage
     */
    saveDocuments() {
        try {
            if (window.syncManager) {
                window.syncManager.data.patientDocs = this.documents;
                // Attempt to save to SyncManager (which saves to LocalStorage)
                try {
                    window.syncManager.saveLocal();
                } catch (e) {
                    console.warn("Storage Quota Exceeded (SyncManager): Continuing in-memory...", e);
                    // System continues; data is safe in memory and will be synced to cloud
                }
            } else {
                localStorage.setItem('neuro-patient-documents', JSON.stringify(this.documents));
            }
        } catch (e) {
            console.warn("Storage Quota Exceeded (Direct): Continuing in-memory...", e);
        }
    }

    /**
     * Add document for a patient
     */
    async addDocument(patientId, documentData) {
        if (!this.documents[patientId]) {
            this.documents[patientId] = [];
        }

        const doc = {
            id: 'doc-' + Date.now(),
            patientId: patientId,
            name: documentData.name,
            type: documentData.type,
            category: this.getCategoryFromType(documentData.type),
            fileData: documentData.fileData,
            mimeType: documentData.mimeType,
            uploadDate: new Date().toISOString(),
            notes: documentData.notes || '',
            size: documentData.size || 0,
            cloudUrl: null
        };

<<<<<<< HEAD
        this.documents[patientId].unshift(doc);
=======
        this.documents[patientId].unshift(doc); // Add to beginning for immediate visibility
>>>>>>> 096b4003d49e4534b8f534e1081d7cfe568c02bf
        this.saveDocuments();

        // --- Cloud Sync: Firebase Storage ---
        if (typeof storage !== 'undefined' && storage && documentData.blob) {
            try {
                const storageRef = storage.ref(`documents/${patientId}/${doc.id}`);
                const snapshot = await storageRef.put(documentData.blob);
                const downloadURL = await snapshot.ref.getDownloadURL();

<<<<<<< HEAD
                const savedDoc = this.documents[patientId].find(d => d.id === doc.id);
                if (savedDoc) {
                    savedDoc.cloudUrl = downloadURL;
                    savedDoc.fileData = null;
                }

                this.saveDocuments();
                console.log("Documents Sync: Cloud storage upload success.");

=======
                // Update the actual object in the array
                const savedDoc = this.documents[patientId].find(d => d.id === doc.id);
                if (savedDoc) {
                    savedDoc.cloudUrl = downloadURL;
                    savedDoc.fileData = null; // Purge base64 only after cloud link is confirmed
                }

                this.saveDocuments();
                console.log("Documents Sync: Cloud storage upload success and local data updated.");

                // Trigger a UI update if the patient file is open
>>>>>>> 096b4003d49e4534b8f534e1081d7cfe568c02bf
                if (window.patientFileUI && window.patientFileUI.currentPatientId === patientId) {
                    window.patientFileUI.renderDocuments();
                }
            } catch (err) {
                console.error("Documents Sync: Failed to upload to cloud storage.", err);
            }
        }

        return doc;
    }

    getCategoryFromType(type) {
        const categories = {
            'xray': { icon: 'fa-x-ray', label: 'أشعة X-Ray', color: '#3b82f6' },
            'ct': { icon: 'fa-brain', label: 'أشعة CT', color: '#8b5cf6' },
            'mri': { icon: 'fa-magnet', label: 'أشعة MRI', color: '#ec4899' },
            'lab': { icon: 'fa-flask', label: 'تحليل معملي', color: '#10b981' },
            'report': { icon: 'fa-file-medical', label: 'تقرير طبي', color: '#f59e0b' },
            'other': { icon: 'fa-file', label: 'مستند آخر', color: '#64748b' }
        };
        return categories[type] || categories['other'];
    }

    getPatientDocuments(patientId) {
        return this.documents[patientId] || [];
    }

    deleteDocument(patientId, documentId) {
        if (this.documents[patientId]) {
            this.documents[patientId] = this.documents[patientId].filter(d => d.id !== documentId);
            this.saveDocuments();
            return true;
        }
        return false;
    }

    getDocument(patientId, documentId) {
        const docs = this.getPatientDocuments(patientId);
        return docs.find(d => d.id === documentId);
    }
}

window.patientDocuments = new PatientDocuments();
