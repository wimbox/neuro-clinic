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

        // Close Button
        const closeBtn = document.getElementById('btn-close-file');
        if (closeBtn) {
            closeBtn.onclick = () => this.close();
        }

        // Start Prescription Button
        const startPrescriptionBtn = document.getElementById('btn-file-start-prescription');
        if (startPrescriptionBtn) {
            startPrescriptionBtn.onclick = () => {
                if (this.currentPatientId) {
                    window.location.href = `editor.html?patientId=${this.currentPatientId}`;
                }
            };
        }

        // Delete Patient Button
        const deleteBtn = document.getElementById('btn-delete-patient');
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                if (!this.currentPatientId) return;

                window.soundManager.playDeleteWarning();
                window.showNeuroModal('تأكيد الحذف', 'هل أنت متأكد من حذف هذا المريض نهائياً مع كافة سجلاته الطبية والمالية؟', () => {
                    window.syncManager.deletePatient(this.currentPatientId);
                    this.close();
                    if (window.navigation) window.navigation.switchView('patients');
                    window.showNeuroToast('تم حذف المريض وسجلاته بنجاح');
                }, true);
            };
        }

        // Edit Patient Form
        const editForm = document.getElementById('edit-patient-form');
        if (editForm) {
            editForm.onsubmit = (e) => {
                e.preventDefault();
                if (!this.currentPatientId) return;

                const n1 = document.getElementById('edit-name-1').value.trim();
                const n2 = document.getElementById('edit-name-2').value.trim();
                const n3 = document.getElementById('edit-name-3').value.trim();
                const n4 = document.getElementById('edit-name-4').value.trim();

                if (!n1 || !n2 || !n3) {
                    window.soundManager.playError();
                    window.showNeuroToast('يرجى إدخال الاسم الثلاثي على الأقل', 'error');
                    return;
                }

                const fullName = [n1, n2, n3, n4].filter(part => part.length > 0).join(" ");

                const patientData = {
                    id: this.currentPatientId,
                    name: fullName,
                    age: document.getElementById('edit-p-age').value,
                    phone: document.getElementById('edit-p-phone').value.trim()
                };

                window.syncManager.upsertPatient(patientData);
                window.soundManager.playSuccess();
                window.showNeuroToast('تم تحديث بيانات المريض بنجاح');

                // Refresh local UI
                document.getElementById('file-patient-name').textContent = fullName;
                this.open(this.currentPatientId);
            };
        }

        // Add Income Button (Ledger)
        const addIncomeBtn = document.getElementById('btn-add-p-income');
        const incomeInput = document.getElementById('add-p-income-amount');
        if (addIncomeBtn && incomeInput) {
            addIncomeBtn.onclick = () => {
                const amount = parseFloat(incomeInput.value);
                if (isNaN(amount) || amount <= 0) {
                    window.soundManager.playError();
                    return;
                }

                window.syncManager.addTransaction({
                    patientId: this.currentPatientId,
                    type: 'income',
                    amount: amount,
                    description: 'تحصيل نقدي (عن طريق ملف المريض)',
                    beneficiary: 'Clinic'
                });

                incomeInput.value = '';
                this.updateLedgerView();
                window.soundManager.playSuccess();
                window.showNeuroToast('تم تسجيل المبلغ في حساب المريض');
            };

            incomeInput.onkeydown = (e) => {
                if (e.key === 'Enter') addIncomeBtn.click();
            };
        }
    }

    open(patientId) {
        const patients = syncManager.getPatientsByClinic();
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;

        this.currentPatientId = patientId;
        this.lastUploadedFile = null;
        this.pendingFileData = null;

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
        if (document.getElementById('edit-name-4')) document.getElementById('edit-name-4').value = nameParts.slice(3).join(" ") || "";

        if (document.getElementById('edit-p-age')) document.getElementById('edit-p-age').value = patient.age || '';
        if (document.getElementById('edit-p-phone')) document.getElementById('edit-p-phone').value = patient.phone || '';

        this.updateLedgerView();
        this.renderDocuments();

        if (this.modal) this.modal.style.display = 'flex';
    }

    renderDocuments() {
        // Find grid by both possible IDs to ensure compatibility
        const grid = document.getElementById('patient-docs-grid') || document.getElementById('file-docs-grid');
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

    compressImage(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX = 1600;
                if (width > height && width > MAX) { height *= MAX / width; width = MAX; }
                else if (height > MAX) { width *= MAX / height; height = MAX; }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => callback(blob), 'image/jpeg', 0.7);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showCategorySelector(name, size) {
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
        const actions = document.querySelector('.neuro-modal-actions');
        if (actions) actions.style.display = 'none';
    }

    async confirmUpload(name, type, size) {
        const overlay = document.querySelector('.neuro-modal-overlay');
        if (overlay) overlay.remove();

        window.showNeuroToast('جاري الرفع المباشر للسحابة..', 'info');
        const data = this.pendingFileData; // Get the huge string from memory

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
            mimeType: mimeType,
            size: size
        }).then(() => {
            console.log("Background upload task initiated");
        }).catch(err => console.error(err));

        // Render IMMEDIATELY regarding of cloud status
        this.renderDocuments();
        window.soundManager.playSuccess();
        window.showNeuroToast('تم الإضافة للأرشيف (جاري التزامن...)');
        this.lastUploadedFile = null; this.pendingFileData = null;
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
