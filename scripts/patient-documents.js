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
        if (window.syncManager?.data?.patientDocs) return window.syncManager.data.patientDocs;
        const data = localStorage.getItem('neuro-patient-documents');
        return data ? JSON.parse(data) : {};
    }

    /**
     * Save documents to localStorage
     */
    saveDocuments() {
        if (window.syncManager) {
            window.syncManager.data.patientDocs = this.documents;
            window.syncManager.saveLocal();
        } else {
            localStorage.setItem('neuro-patient-documents', JSON.stringify(this.documents));
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

        this.documents[patientId].unshift(doc); // Add to beginning for immediate visibility
        this.saveDocuments();

        // --- Cloud Sync: Firebase Storage ---
        if (typeof storage !== 'undefined' && storage && documentData.blob) {
            try {
                const storageRef = storage.ref(`documents/${patientId}/${doc.id}`);
                const snapshot = await storageRef.put(documentData.blob);
                const downloadURL = await snapshot.ref.getDownloadURL();

                // Update the actual object in the array
                const savedDoc = this.documents[patientId].find(d => d.id === doc.id);
                if (savedDoc) {
                    savedDoc.cloudUrl = downloadURL;
                    savedDoc.fileData = null; // Purge base64 only after cloud link is confirmed
                }

                this.saveDocuments();
                console.log("Documents Sync: Cloud storage upload success and local data updated.");

                // Trigger a UI update if the patient file is open
                if (window.patientFileUI && window.patientFileUI.currentPatientId === patientId) {
                    window.patientFileUI.renderDocuments();
                }
            } catch (err) {
                console.error("Documents Sync: Failed to upload to cloud storage.", err);
            }
        }

        return doc;
    }

    /**
     * Get category icon and label from type
     */
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

    /**
     * Get all documents for a patient
     */
    getPatientDocuments(patientId) {
        return this.documents[patientId] || [];
    }

    /**
     * Get documents filtered by type
     */
    getDocumentsByType(patientId, type) {
        const docs = this.getPatientDocuments(patientId);
        return docs.filter(d => d.type === type);
    }

    /**
     * Delete document
     */
    deleteDocument(patientId, documentId) {
        if (this.documents[patientId]) {
            this.documents[patientId] = this.documents[patientId].filter(d => d.id !== documentId);
            this.saveDocuments();
            return true;
        }
        return false;
    }

    /**
     * Get document by ID
     */
    getDocument(patientId, documentId) {
        const docs = this.getPatientDocuments(patientId);
        return docs.find(d => d.id === documentId);
    }

    /**
     * Get total storage size for a patient (in bytes)
     */
    getStorageSize(patientId) {
        const docs = this.getPatientDocuments(patientId);
        return docs.reduce((total, doc) => total + (doc.size || 0), 0);
    }

    /**
     * Format file size
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Global instance
window.patientDocuments = new PatientDocuments();
