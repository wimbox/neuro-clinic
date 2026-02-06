/**
 * Neuro-Clinic Specialized Records Manager
 */
class NeuroRecords {
    constructor() {
        this.records = {}; // Format: { patientId: { exam: {}, seizures: [], reports: [] } }
        this.loadLocal();
    }

    loadLocal() {
        const data = localStorage.getItem('neuro_specialized_records');
        this.records = data ? JSON.parse(data) : {};
    }

    saveLocal() {
        localStorage.setItem('neuro_specialized_records', JSON.stringify(this.records));
    }

    getRecord(patientId) {
        if (!this.records[patientId]) {
            this.records[patientId] = {
                exam: this.getDefaultExam(),
                seizures: [],
                reports: []
            };
        }
        return this.records[patientId];
    }

    saveExam(patientId, examData) {
        const record = this.getRecord(patientId);
        record.exam = { ...record.exam, ...examData, updatedAt: new Date().toISOString() };
        this.saveLocal();
    }

    addSeizure(patientId, seizureData) {
        const record = this.getRecord(patientId);
        record.seizures.unshift({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            ...seizureData
        });
        this.saveLocal();
    }

    getDefaultExam() {
        return {
            cranialNerves: "Normal",
            motorPower: { ul: "5/5", ll: "5/5" },
            reflexes: "Normal",
            gait: "Normal",
            sensory: "Intact",
            coordination: "Normal"
        };
    }
}

const neuroRecords = new NeuroRecords();
