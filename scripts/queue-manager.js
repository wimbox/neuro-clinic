/**
 * Queue Manager
 * Handles patient flow, status updates, and waiting time estimation
 */
class QueueManager {
    constructor() {
        this.queue = this.loadQueue();
        // Average consultation time in minutes (default 15 if not enough data)
        this.avgConsultationTime = 15;
        this.calculateAvgTime();
    }

    loadQueue() {
        const q = localStorage.getItem('neuro-clinic-queue');
        return q ? JSON.parse(q) : [];
    }

    saveQueue() {
        localStorage.setItem('neuro-clinic-queue', JSON.stringify(this.queue));
        // Broadcast change for other windows (like TV display)
        localStorage.setItem('neuro-queue-updated', Date.now());
    }

    /**
     * Add patient to queue (Check-in)
     */
    checkIn(appointmentId, patientName, patientCode) {
        // Prevent duplicates
        if (this.queue.find(q => q.appointmentId === appointmentId && q.status !== 'completed' && q.status !== 'cancelled')) {
            return false; // Already in queue
        }

        const entry = {
            id: 'q-' + Date.now(),
            appointmentId: appointmentId,
            patientName: patientName,
            patientCode: patientCode,
            status: 'waiting', // waiting, in-progress, completed, cancelled
            checkInTime: Date.now(),
            startTime: null,
            endTime: null
        };

        this.queue.push(entry);
        this.saveQueue();
        return entry;
    }

    /**
     * Update status (e.g., waiting -> in-progress)
     */
    updateStatus(queueId, newStatus) {
        const item = this.queue.find(q => q.id === queueId);
        if (!item) return false;

        const oldStatus = item.status;
        item.status = newStatus;

        if (newStatus === 'in-progress') {
            item.startTime = Date.now();
            // If another patient was in progress, complete them?
            // Optionally auto-complete previous
            this.queue.forEach(q => {
                if (q.id !== queueId && q.status === 'in-progress') {
                    q.status = 'completed';
                    q.endTime = Date.now();
                }
            });
        } else if (newStatus === 'completed') {
            item.endTime = Date.now();
            this.calculateAvgTime(); // Recalculate stats
        }

        this.saveQueue();
        return true;
    }

    /**
     * Get active queue
     */
    getActiveQueue() {
        // Filter out completed/cancelled items from TODAY (or keep them for history)
        // For display, we mostly need waiting + current
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        return this.queue.filter(q => {
            // Only show items created today or still active
            const isToday = new Date(q.checkInTime) >= startOfDay;
            return isToday && q.status !== 'cancelled' && q.status !== 'completed';
        }).sort((a, b) => a.checkInTime - b.checkInTime); // FIFO
    }

    /**
     * Get currently serving patient
     */
    getCurrentPatient() {
        return this.queue.find(q => q.status === 'in-progress');
    }

    /**
     * Get completed patients (Today)
     */
    getCompletedToday() {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return this.queue.filter(q => {
            const isToday = new Date(q.checkInTime) >= startOfDay;
            return isToday && q.status === 'completed';
        });
    }

    /**
     * Calculate estimated waiting time for a specific queue item
     */
    getEstimatedWaitCallback(queueId) {
        const active = this.getActiveQueue();
        const index = active.findIndex(q => q.id === queueId);

        if (index === -1) return 0; // Not found or already done

        // If it's the first one and currently in progress, wait time is 0 (or remaining of avg)
        if (active[index].status === 'in-progress') return 0;

        // Count how many are before this one
        // If someone is in progress, they count as partial
        // Simple heuristic: (Position in Line) * AvgTime

        return index * this.avgConsultationTime;
    }

    /**
     * Calculate average consultation time based on history
     */
    calculateAvgTime() {
        const completed = this.queue.filter(q => q.status === 'completed' && q.startTime && q.endTime);
        if (completed.length < 5) return; // Keep default if not enough data

        let totalDuration = 0;
        completed.forEach(c => {
            let duration = (c.endTime - c.startTime) / 1000 / 60; // in minutes
            // Filter out outliers (> 60 mins or < 2 mins)
            if (duration > 2 && duration < 60) {
                totalDuration += duration;
            }
        });

        if (completed.length > 0) {
            this.avgConsultationTime = Math.round(totalDuration / completed.length) || 15;
        }
    }

    /**
     * Remove from queue
     */
    removeFromQueue(queueId) {
        this.queue = this.queue.filter(q => q.id !== queueId);
        this.saveQueue();
    }

    /**
     * Reset Queue (End of Day)
     * Moves current queue to history or just clears old active ones
     */
    resetQueue() {
        // Mark all 'waiting' as 'cancelled' or purge
        // For this simple implementation, we assume restart
        // Real implementation might archive
    }
}

// Global Instance
window.queueManager = new QueueManager();
