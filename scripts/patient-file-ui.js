/**
 * PatientFileUI: Manages the detailed patient view, editing, deletion, and individual ledger.
 */
class PatientFileUI {
    constructor() {
        this.modal = document.getElementById('patient-file-modal');
        this.init();
    }

    init() {
        const uploadBtn = document.getElementById('btn-upload-doc');
        const fileInput = document.getElementById('doc-file-input');

        if (uploadBtn && fileInput) {
            uploadBtn.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            };
        }
    }

    open(patientId) {
        const patients = syncManager.getPatientsByClinic();
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;

        this.currentPatientId = patientId;
        this.lastUploadedFile = null;
<<<<<<< HEAD
        this.pendingFileData = null;
=======
        this.pendingFileData = null; // New: Store base64 outside the DOM
>>>>>>> 096b4003d49e4534b8f534e1081d7cfe568c02bf

        document.getElementById('file-patient-name').textContent = `${patient.name}`;

        const infoEl = document.getElementById('file-patient-info');
        if (infoEl) {
            infoEl.textContent = `كود: #${patient.patientCode || '---'} | ${patient.gender || 'غير محدد'}، ${patient.age || '--'} سنة | ${patient.phone || 'بدون هاتف'}`;
        }

        // Populate edit fields
        const nameParts = (patient.name || "").split(" ");
        if (document.getElementById('edit-name-1')) document.getElementById('edit-name-1').value = nameParts[0] || "";
        if (document.getElementById('edit-name-2')) document.getElementById('edit-name-2').value = nameParts[1] || "";
        if (document.getElementById('edit-name-3')) document.getElementById('edit-name-3').value = nameParts[2] || "";
        if (document.getElementById('edit-p-age')) document.getElementById('edit-p-age').value = patient.age || '';
        if (document.getElementById('edit-p-phone')) document.getElementById('edit-p-phone').value = patient.phone || '';

        this.updateLedgerView();
        this.renderDocuments();

        if (this.modal) this.modal.style.display = 'flex';
    }

    renderDocuments() {
<<<<<<< HEAD
        // Find grid by both possible IDs to ensure compatibility
        const grid = document.getElementById('patient-docs-grid') || document.getElementById('file-docs-grid');
=======
        const grid = document.getElementById('file-docs-grid');
>>>>>>> 096b4003d49e4534b8f534e1081d7cfe568c02bf
        if (!grid) return;

        const docs = window.patientDocuments.getPatientDocuments(this.currentPatientId);

        if (docs.length === 0) {
            grid.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 20px; grid-column: 1/-1;">
                    <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
                    <p>لا توجد مستندات محفوظة لهذا المريض.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = docs.map(doc => {
            const cat = window.patientDocuments.getCategoryFromType(doc.type);
            return `
                <div class="doc-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; position: relative;">
                    <div style="text-align: center; margin-bottom: 10px;">
                        <i class="fa-solid ${cat.icon}" style="font-size: 2rem; color: ${cat.color};"></i>
                    </div>
                    <h4 style="color: #e2e8f0; font-size: 0.9rem; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${doc.name}</h4>
                    <div style="display: flex; gap: 5px; justify-content: center; margin-top: 10px;">
                        <button class="btn-neuro" onclick="window.patientFileUI.viewDocument('${doc.id}')" style="padding: 5px 10px; font-size: 0.8rem; background: rgba(59, 130, 246, 0.2); color: #3b82f6;">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn-neuro" onclick="window.patientFileUI.deleteDocument('${doc.id}')" style="padding: 5px 10px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); color: #ef4444;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    handleFileUpload(file) {
<<<<<<< HEAD
        if (file.type.startsWith('image/')) {
            window.showNeuroToast('جاري ضغط الصورة لزيادة السرعة..', 'info');
            this.compressImage(file, (compressedBlob) => {
                this.lastUploadedFile = compressedBlob;
                const reader = new FileReader();
                reader.onload = (re) => {
                    this.pendingFileData = re.target.result;
                    this.showCategorySelector(file.name, compressedBlob.size);
                };
                reader.readAsDataURL(compressedBlob);
            });
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.lastUploadedFile = file;
                this.pendingFileData = e.target.result;
                this.showCategorySelector(file.name, file.size);
            };
            reader.readAsDataURL(file);
        }
    }

=======
        // Use immediate object URL for faster processing instead of heavy DataURL if possible
        const objectUrl = URL.createObjectURL(file);

        // If it's an image, compress it first
        if (file.type.startsWith('image/')) {
            window.showNeuroToast('جاري ضغط الصورة لزيادة سرعة الرفع..', 'info');
            this.compressImage(file, (compressedBlob) => {
                this.lastUploadedFile = compressedBlob;
                const reader = new FileReader();
                reader.onload = (re) => {
                    this.pendingFileData = re.target.result; // Store here, not in HTML
                    this.showCategorySelector(file.name, compressedBlob.size);
                    URL.revokeObjectURL(objectUrl);
                };
                reader.readAsDataURL(compressedBlob);
            });
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.lastUploadedFile = file;
                this.pendingFileData = e.target.result; // Store here
                this.showCategorySelector(file.name, file.size);
                URL.revokeObjectURL(objectUrl);
            };
            reader.readAsDataURL(file);
        }
    }

>>>>>>> 096b4003d49e4534b8f534e1081d7cfe568c02bf
    compressImage(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
<<<<<<< HEAD
                const MAX = 1600;
                if (width > height && width > MAX) { height *= MAX / width; width = MAX; }
                else if (height > MAX) { width *= MAX / height; height = MAX; }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => callback(blob), 'image/jpeg', 0.7);
=======

                // Max dimensions for medical images (high enough for detail, small enough for speed)
                const MAX_WIDTH = 1600;
                const MAX_HEIGHT = 1600;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress as JPEG at 0.7 quality (excellent balance for X-rays)
                canvas.toBlob((blob) => {
                    callback(blob);
                }, 'image/jpeg', 0.7);
>>>>>>> 096b4003d49e4534b8f534e1081d7cfe568c02bf
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showCategorySelector(name, size) {
<<<<<<< HEAD
        const html = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button class="btn-neuro" onclick="window.patientFileUI.confirmUpload('${name}', 'xray', ${size})">أشعة X-Ray</button>
                <button class="btn-neuro" onclick="window.patientFileUI.confirmUpload('${name}', 'mri', ${size})">RM (MRI)</button>
                <button class="btn-neuro" onclick="window.patientFileUI.confirmUpload('${name}', 'ct', ${size})">أشعة مقطعية</button>
                <button class="btn-neuro" onclick="window.patientFileUI.confirmUpload('${name}', 'lab', ${size})">تحليل معملي</button>
                <button class="btn-neuro" onclick="window.patientFileUI.confirmUpload('${name}', 'report', ${size})">تقرير طبي</button>
                <button class="btn-neuro" onclick="window.patientFileUI.confirmUpload('${name}', 'other', ${size})">أخرى</button>
            </div>
        `;
        showNeuroModal('تصنيف الملف', 'اختر نوع المستند للرفع الفوري:', null, false);
        const modalMsg = document.querySelector('.neuro-modal-msg');
        if (modalMsg) modalMsg.innerHTML = html;
=======
        // We no longer pass 'data' (the huge string) through these buttons
        const categoryHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: center;">
                <button class="btn-neuro" onclick="window.patientFileUI.confirmUpload('${name}', 'xray', ${size})" style="justify-content: center;">أشعة X-Ray</button>
                <button class="btn-neuro" onclick="window.patientFileUI.confirmUpload('${name}', 'mri', ${size})" style="justify-content: center;">RM (MRI)</button>
                <button class="btn-neuro" onclick="window.patientFileUI.confirmUpload('${name}', 'ct', ${size})" style="justify-content: center;">أشعة مقطعية</button>
                <button class="btn-neuro" onclick="window.patientFileUI.confirmUpload('${name}', 'lab', ${size})" style="justify-content: center;">تحليل معملي</button>
                <button class="btn-neuro" onclick="window.patientFileUI.confirmUpload('${name}', 'report', ${size})" style="justify-content: center;">تقرير طبي</button>
                <button class="btn-neuro" onclick="window.patientFileUI.confirmUpload('${name}', 'other', ${size})" style="justify-content: center;">أخرى</button>
            </div>
        `;

        showNeuroModal('تصنيف الملف', 'تم ضغط الصورة بنجاح. اختر نوع المستند للرفع الفوري:', null, false);
        const modalMsg = document.querySelector('.neuro-modal-msg');
        if (modalMsg) {
            modalMsg.style.marginTop = '20px';
            modalMsg.innerHTML = categoryHTML;
        }
>>>>>>> 096b4003d49e4534b8f534e1081d7cfe568c02bf
        const actions = document.querySelector('.neuro-modal-actions');
        if (actions) actions.style.display = 'none';
    }

    async confirmUpload(name, type, size) {
<<<<<<< HEAD
=======
        // Close modal
>>>>>>> 096b4003d49e4534b8f534e1081d7cfe568c02bf
        const overlay = document.querySelector('.neuro-modal-overlay');
        if (overlay) overlay.remove();

        window.showNeuroToast('جاري الرفع المباشر للسحابة..', 'info');
<<<<<<< HEAD
        const data = this.pendingFileData; // Get the huge string from memory
=======

        const data = this.pendingFileData; // Get the huge string from memory, not DOM
>>>>>>> 096b4003d49e4534b8f534e1081d7cfe568c02bf

        // Safety Check: Prevent crash if data is missing
        if (!data) {
            window.showNeuroToast('خطأ: لم يتم تحميل الملف بشكل صحيح. حاول مرة أخرى.', 'error');
            return;
        }

        let mimeType = 'application/octet-stream';
        try {
            mimeType = data.split(';')[0].split(':')[1];
        } catch (e) {
            console.warn("Could not extract MIME type, using default.");
        }

        // Fire and forget - don't wait for cloud upload to render UI
        window.patientDocuments.addDocument(this.currentPatientId, {
            name: name,
            type: type,
            fileData: data,
            blob: this.lastUploadedFile,
<<<<<<< HEAD
            mimeType: mimeType,
=======
            mimeType: data.split(';')[0].split(':')[1],
>>>>>>> 096b4003d49e4534b8f534e1081d7cfe568c02bf
            size: size
        }).then(() => {
            console.log("Background upload task initiated");
        }).catch(err => console.error(err));

        // Render IMMEDIATELY regarding of cloud status
        this.renderDocuments();
        window.soundManager.playSuccess();
<<<<<<< HEAD
        window.showNeuroToast('تم الإضافة للأرشيف (جاري التزامن...)');
        this.lastUploadedFile = null; this.pendingFileData = null;
=======
        window.showNeuroToast('تم الحفظ بنجاح (الرابط السحابي الذكي)');

        // Final cleanup
        this.lastUploadedFile = null;
        this.pendingFileData = null;
>>>>>>> 096b4003d49e4534b8f534e1081d7cfe568c02bf
    }

    deleteDocument(docId) {
        window.soundManager.playDeleteWarning();
        showNeuroModal('تأكيد الحذف', 'هل أنت متأكد من حذف هذا المستند؟', () => {
            window.patientDocuments.deleteDocument(this.currentPatientId, docId);
            this.renderDocuments();
            window.showNeuroToast('تم الحذف');
        }, true);
    }

    viewDocument(docId) {
        const doc = window.patientDocuments.getDocument(this.currentPatientId, docId);
        if (!doc) return;
        const uri = doc.cloudUrl || doc.fileData;
        if (!uri) return window.showNeuroToast('الملف غير متوفر', 'error');

        const content = doc.mimeType.startsWith('image/') ?
            `<img src="${uri}" style="max-width: 100%; border-radius: 8px;">` :
            `<iframe src="${uri}" style="width: 100%; height: 80vh; border: none;"></iframe>`;

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);';
        overlay.innerHTML = `<div style="position: relative; max-width: 90vw; max-height: 90vh;">
            <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: -40px; right: 0; background: none; border: none; color: white; font-size: 2rem; cursor: pointer;">×</button>
            ${content}
        </div>`;
        document.body.appendChild(overlay);
    }

    updateLedgerView() {
        const balanceEl = document.getElementById('patient-ledger-balance');
        const listEl = document.getElementById('patient-transactions-list');
        if (!balanceEl || !listEl) return;

        const ledger = window.syncManager.data.finances.ledger[this.currentPatientId] || { balance: 0, history: [] };
        balanceEl.textContent = `${ledger.balance} EGP`;
        balanceEl.style.color = ledger.balance >= 0 ? '#10b981' : '#ef4444';

        const transactions = window.syncManager.getTransactionsByClinic().filter(t => t.patientId === this.currentPatientId);
        listEl.innerHTML = transactions.map(t => `
            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between;">
                <span style="color: ${t.type === 'income' ? '#10b981' : '#ef4444'}">${t.type === 'income' ? '+' : '-'}${t.amount}</span>
                <span style="color: #94a3b8; font-size: 0.8rem;">${t.details} (${t.date})</span>
            </div>
        `).join('');
    }

    close() { if (this.modal) this.modal.style.display = 'none'; }
}

window.patientFileUI = new PatientFileUI();

// --- Final Verification: Smart-Sync & Image Compression Engine Active (v2.0.1) ---
// Securely optimized for Neuro-Clinic
