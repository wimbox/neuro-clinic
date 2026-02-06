/**
 * AppointmentManager: Handles scheduling logic, linking to SyncManager.
 */
/**
 * AppointmentManager: Handles scheduling logic, linking to SyncManager.
 */
class AppointmentManager {
    constructor() {
        this.sync = window.syncManager;
    }

    addAppointment(app) {
        // Find or Create patient entry first
        let patient = this.sync.getPatients().find(p => p.name === app.patientName);
        if (!patient) {
            patient = {
                id: crypto.randomUUID(),
                name: app.patientName,
                visits: [],
                createdAt: new Date().toISOString()
            };
            this.sync.upsertPatient(patient);
        }

        const appointment = {
            id: crypto.randomUUID(),
            patientId: patient.id,
            patientName: app.patientName,
            datetime: app.datetime,
            service: app.service,
            cost: parseFloat(app.cost || 0),
            paid: parseFloat(app.paid || 0),
            status: parseFloat(app.paid) >= parseFloat(app.cost) ? 'paid' : (parseFloat(app.paid) > 0 ? 'partial' : 'unpaid'),
            clinicId: this.sync.data.settings.activeClinicId || 'clinic-default',
            createdAt: new Date().toISOString()
        };

        this.sync.data.appointments.push(appointment);

        // Audit Log
        const currentUser = window.authManager?.currentUser?.username || 'System';
        this.sync.logAction(currentUser, 'ADD_APPOINTMENT', `إضافة موعد: ${appointment.patientName} - ${appointment.service} (${new Date(appointment.datetime).toLocaleString('ar-EG')})`);

        // Sync with Finance
        this.syncFinance(appointment);

        this.sync.saveLocal();
        return appointment;
    }

    updateAppointment(appData) {
        const index = this.sync.data.appointments.findIndex(a => a.id === appData.id);
        if (index === -1) return null;

        const oldApp = this.sync.data.appointments[index];
        const updatedApp = {
            ...oldApp,
            datetime: appData.datetime,
            service: appData.service,
            cost: parseFloat(appData.cost || 0),
            paid: parseFloat(appData.paid || 0),
            status: parseFloat(appData.paid) >= parseFloat(appData.cost) ? 'paid' : (parseFloat(appData.paid) > 0 ? 'partial' : 'unpaid')
        };

        this.sync.data.appointments[index] = updatedApp;

        // Audit Log
        const currentUser = window.authManager?.currentUser?.username || 'System';
        this.sync.logAction(currentUser, 'UPDATE_APPOINTMENT', `تعديل موعد: ${updatedApp.patientName} - ${updatedApp.service}`);

        // Sync with Finance
        this.syncFinance(updatedApp);

        this.sync.saveLocal();
        return updatedApp;
    }

    deleteAppointment(id) {
        const app = this.sync.data.appointments.find(a => a.id === id);
        if (app) {
            // Audit Log
            const currentUser = window.authManager?.currentUser?.username || 'System';
            this.sync.logAction(currentUser, 'DELETE_APPOINTMENT', `حذف موعد: ${app.patientName} (${new Date(app.datetime).toLocaleString('ar-EG')})`);

            // Remove linked finance transaction
            const txIndex = this.sync.data.finances.transactions.findIndex(t => t.appointmentId === id);
            if (txIndex > -1) {
                this.sync.data.finances.transactions.splice(txIndex, 1);
                // Recalculate ledger for this patient
                this.recalcPatientLedger(app.patientId);
            }
        }

        this.sync.data.appointments = this.sync.data.appointments.filter(a => a.id !== id);
        this.sync.saveLocal();
    }

    // --- Helper: Sync Appointment Payment to Finance Manager ---
    syncFinance(appointment) {
        const txs = this.sync.data.finances.transactions;
        const index = txs.findIndex(t => t.appointmentId === appointment.id);
        const paidAmount = parseFloat(appointment.paid || 0);

        if (paidAmount > 0) {
            const txData = {
                patientId: appointment.patientId,
                appointmentId: appointment.id, // Link to appointment
                type: 'income',
                amount: paidAmount,
                date: appointment.datetime || new Date().toISOString(), // Use appointment date
                description: `إيراد كشف: ${appointment.service} (${appointment.patientName})`,
                beneficiary: 'عيادة',
                clinicId: appointment.clinicId // Add clinicId to transaction
            };

            if (index > -1) {
                // Update existing transaction
                txs[index] = { ...txs[index], ...txData, id: txs[index].id }; // Preserve TX ID
            } else {
                // Create new transaction
                txData.id = crypto.randomUUID();
                txs.push(txData);
            }
        } else {
            // If paid is 0, remove transaction if it exists
            if (index > -1) {
                txs.splice(index, 1);
            }
        }

        // Always recalculate patient ledger to ensure accuracy
        this.recalcPatientLedger(appointment.patientId);
    }

    recalcPatientLedger(patientId) {
        if (!patientId || !this.sync.data.finances.ledger) return;

        // 1. Get all appointments and transactions for this patient
        const patientApps = this.sync.data.appointments.filter(a => a.patientId === patientId);
        const patientTxs = this.sync.data.finances.transactions.filter(t => t.patientId === patientId);

        // 2. Sum up
        let balance = 0;

        // Costs from appointments (Debit)
        patientApps.forEach(app => {
            balance -= parseFloat(app.cost || 0);
        });

        // Payments from transactions (Credit)
        patientTxs.forEach(t => {
            const amt = parseFloat(t.amount || 0);
            if (t.type === 'income') balance += amt;
            else balance -= amt; // In case of refunds/expenses linked to patient
        });

        // 3. Update Ledger
        this.sync.data.finances.ledger[patientId] = {
            balance: balance,
            lastUpdated: new Date().toISOString()
        };
    }
}

window.appointmentManager = new AppointmentManager();
