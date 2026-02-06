/**
 * Prescription Templates Manager
 * Manages saving, loading, and applying prescription templates
 */
class PrescriptionTemplates {
    constructor() {
        this.templates = this.loadTemplates();
    }

    /**
     * Load templates from local storage
     */
    loadTemplates() {
        const data = localStorage.getItem('neuro-prescription-templates');
        return data ? JSON.parse(data) : [];
    }

    /**
     * Save templates to local storage
     */
    saveTemplates() {
        localStorage.setItem('neuro-prescription-templates', JSON.stringify(this.templates));
    }

    /**
     * Add a new template
     */
    addTemplate(name, content, notes = '') {
        const template = {
            id: 'tpl-' + Date.now(),
            name: name.trim(),
            content: content.trim(),
            notes: notes.trim(),
            createdAt: new Date().toISOString(),
            usageCount: 0
        };

        this.templates.push(template);
        this.saveTemplates();
        return template;
    }

    /**
     * Get all templates
     */
    getAll() {
        return this.templates.sort((a, b) => b.usageCount - a.usageCount);
    }

    /**
     * Get template by ID
     */
    getById(id) {
        return this.templates.find(t => t.id === id);
    }

    /**
     * Update template
     */
    updateTemplate(id, updates) {
        const template = this.getById(id);
        if (template) {
            Object.assign(template, updates);
            this.saveTemplates();
            return true;
        }
        return false;
    }

    /**
     * Delete template
     */
    deleteTemplate(id) {
        const index = this.templates.findIndex(t => t.id === id);
        if (index !== -1) {
            this.templates.splice(index, 1);
            this.saveTemplates();
            return true;
        }
        return false;
    }

    /**
     * Increment usage count
     */
    incrementUsage(id) {
        const template = this.getById(id);
        if (template) {
            template.usageCount++;
            this.saveTemplates();
        }
    }

    /**
     * Search templates
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.templates.filter(t =>
            t.name.toLowerCase().includes(lowerQuery) ||
            t.content.toLowerCase().includes(lowerQuery) ||
            (t.notes && t.notes.toLowerCase().includes(lowerQuery))
        );
    }
}

// Initialize global instance
window.prescriptionTemplates = new PrescriptionTemplates();
