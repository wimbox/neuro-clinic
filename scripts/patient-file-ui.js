/**
 * PatientFileUI: Manages the detailed patient view, editing, deletion, and individual ledger.
 */
class PatientFileUI {
    constructor() {
        this.modal = document.getElementById('patient-file-modal');
        this.form = document.getElementById('edit-patient-form');
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveChanges();
            });
        }

        const deleteBtn = document.getElementById('btn-delete-patient');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deletePatient());
        }

        const closeBtn = document.getElementById('btn-close-file');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        const addIncomeBtn = document.getElementById('btn-add-p-income');
        if (addIncomeBtn) {
            addIncomeBtn.addEventListener('click', () => this.addIncome());
        }

        const startPrescBtn = document.getElementById('btn-file-start-prescription');
        if (startPrescBtn) {
            startPrescBtn.addEventListener('click', () => this.startPrescription());
        }

        const uploadBtn = document.getElementById('btn-upload-doc');
        const fileInput = document.getElementById('doc-file-input');

        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.handleFileUpload(file);
                fileInput.value = ''; // Reset
            });
        }

        // Triple Input Logic (Edit) - Now Quadruple
        const editInputs = [
            document.getElementById('edit-name-1'),
            document.getElementById('edit-name-2'),
            document.getElementById('edit-name-3'),
            document.getElementById('edit-name-4')
        ];
        editInputs.forEach((input, idx) => {
            if (!input) return;
            input.onkeydown = (e) => {
                if (e.key === ' ' && input.value.trim().length > 0) {
                    e.preventDefault();
                    if (editInputs[idx + 1]) editInputs[idx + 1].focus();
                } else if (e.key === 'Backspace' && input.value.length === 0) {
                    if (editInputs[idx - 1]) editInputs[idx - 1].focus();
                }
            };
        });
    }

    open(patientId) {
        const patients = syncManager.getPatients();
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;

        this.currentPatientId = patientId;
        this.lastUploadedFile = null;
        this.pendingFileData = null; // New: Store base64 outside the DOM

        // Populate basic info
        document.getElementById('file-patient-name').textContent = `${patient.name}`;
        document.getElementById('file-patient-info').textContent = `كود: #${patient.patientCode || '---'} | ${patient.gender || 'غير محدد'}، ${patient.age || '--'} سنة | ${patient.phone || 'بدون هاتف'}`;

        // Populate edit form
        document.getElementById('edit-p-id').value = patient.id;
        const nameParts = (patient.name || "").split(" ");
        document.getElementById('edit-name-1').value = nameParts[0] || "";
        document.getElementById('edit-name-2').value = nameParts[1] || "";
        document.getElementById('edit-name-3').value = nameParts[2] || "";
        document.getElementById('edit-name-4').value = nameParts.slice(3).join(" ") || "";
        document.getElementById('edit-p-age').value = patient.age || '';
        document.getElementById('edit-p-phone').value = patient.phone || '';

        // Populate ledger
        this.updateLedgerView();

        // Populate documents
        this.renderDocuments();

        this.modal.style.display = 'flex';
    }

    renderDocuments() {
        if (!window.patientDocuments) return;

        const grid = document.getElementById('patient-docs-grid');
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
                <div class="doc-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; position: relative; transition: all 0.2s;">
                    <div style="text-align: center; margin-bottom: 10px;">
                        <i class="fa-solid ${cat.icon}" style="font-size: 2rem; color: ${cat.color};"></i>
                    </div>
                    <h4 style="color: #e2e8f0; font-size: 0.9rem; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 5px;" title="${doc.name}"></h4>
                    <p style="color: #94a3b8; font-size: 0.75rem; text-align: center;">${new Date(doc.uploadDate).toLocaleDateString()}</p>
                    
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

    compressImage(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

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
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showCategorySelector(name, size) {
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
        const actions = document.querySelector('.neuro-modal-actions');
        if (actions) actions.style.display = 'none';
    }

    async confirmUpload(name, type, size) {
        // Close modal
        const overlay = document.querySelector('.neuro-modal-overlay');
        if (overlay) overlay.remove();

        window.showNeuroToast('جاري الرفع المباشر للسحابة..', 'info');

        const data = this.pendingFileData; // Get the huge string from memory, not DOM

        await window.patientDocuments.addDocument(this.currentPatientId, {
            name: name,
            type: type,
            fileData: data,
            blob: this.lastUploadedFile,
            mimeType: data.split(';')[0].split(':')[1],
            size: size
        });

        this.renderDocuments();
        window.soundManager.playSuccess();
        window.showNeuroToast('تم الحفظ بنجاح (الرابط السحابي الذكي)');

        // Final cleanup
        this.lastUploadedFile = null;
        this.pendingFileData = null;
    }

    deleteDocument(docId) {
        showNeuroModal('تأكيد الحذف', 'هل أنت متأكد من حذف هذا المستند نهائياً؟', () => {
            window.patientDocuments.deleteDocument(this.currentPatientId, docId);
            this.renderDocuments();
            window.showNeuroToast('تم حذف المستند بنجاح');
        }, true);
    }

    viewDocument(docId) {
        const doc = window.patientDocuments.getDocument(this.currentPatientId, docId);
        if (!doc) return;

        const isImage = doc.mimeType.startsWith('image/');
        const isPDF = doc.mimeType === 'application/pdf';

        const fileUri = doc.cloudUrl || doc.fileData; // Unified URI
        if (!fileUri) {
            window.showNeuroToast('خطأ: لم يتم العثور على محتوى الملف محلياً أو سحابياً.', 'error');
            return;
        }

        let content = '';
        if (isImage) {
            content = `<img src="${fileUri}" style="max-width: 100%; max-height: 80vh; border-radius: 8px;">`;
        } else if (isPDF) {
            content = `<iframe src="${fileUri}" style="width: 100%; height: 80vh; border: none;"></iframe>`;
        } else {
            content = `<p style="text-align: center; padding: 20px;">لا يمكن عرض هذا الملف مباشرة. <a href="${fileUri}" download="${doc.name}" style="color: #00eaff;">تحميل الملف</a></p>`;
        }

        // Show in a large custom modal or reuse neuro modal with custom content
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);';

        overlay.innerHTML = `
            <div style="position: relative; max-width: 90vw; max-height: 90vh;">
                <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: -40px; right: 0; background: none; border: none; color: white; font-size: 2rem; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                ${content}
                <div style="text-align: center; margin-top: 10px; color: white;">${doc.name}</div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    updateLedgerView() {
        // Calculate True Balance based on Appointments (Costs) vs Transactions (Payments)
        const patientId = this.currentPatientId;
        const appointments = syncManager.data.appointments.filter(a => a.patientId === patientId);
        // Get INCOME transactions only (payments from patient). Expenses are internal/refunds, usually separate, but let's stick to simple logic first.
        const transactions = syncManager.data.finances.transactions.filter(t => t.patientId === patientId && t.type === 'income');

        let balance = 0;
        let ledgerItems = [];

        // 1. Add Charges (Services/Appointments)
        appointments.forEach(app => {
            const cost = parseFloat(app.cost || 0);
            if (cost > 0) {
                balance -= cost; // Debt
                ledgerItems.push({
                    date: app.datetime,
                    description: `خدمة: ${app.service}`,
                    amount: -cost,
                    type: 'charge'
                });
            }
        });

        // 2. Add Credits (Payments)
        transactions.forEach(tx => {
            const amount = parseFloat(tx.amount || 0);
            balance += amount; // Credit
            ledgerItems.push({
                date: tx.date,
                description: tx.description || 'دفعة نقدية',
                amount: amount,
                type: 'payment'
            });
        });

        // 3. Sort by Date (Oldest first for running balance? Or Newest first for display?)
        // Let's do Newest First for display
        ledgerItems.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 4. Update UI
        const balEl = document.getElementById('patient-ledger-balance');
        balEl.textContent = `${Math.abs(balance).toLocaleString()} EGP`;

        if (balance < 0) {
            balEl.style.color = '#ef4444'; // Red (Owes money)
            balEl.parentElement.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            balEl.parentElement.style.background = 'rgba(239, 68, 68, 0.1)';
            balEl.innerHTML += ` <span style="font-size:0.9rem; color:#fca5a5">(مديونية)</span>`;
        } else if (balance > 0) {
            balEl.style.color = '#10b981'; // Green (Has credit)
            balEl.parentElement.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            balEl.parentElement.style.background = 'rgba(16, 185, 129, 0.1)';
            balEl.innerHTML += ` <span style="font-size:0.9rem; color:#86efac">(رصيد له)</span>`;
        } else {
            balEl.style.color = '#94a3b8'; // Grey (Settled)
            balEl.parentElement.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            balEl.parentElement.style.background = 'rgba(255, 255, 255, 0.05)';
            balEl.innerHTML += ` <span style="font-size:0.9rem">(خالص)</span>`;
        }

        const list = document.getElementById('patient-transactions-list');
        list.innerHTML = ledgerItems.map(item => {
            const isCharge = item.type === 'charge';
            return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.95rem;">
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <span style="color: #e2e8f0; font-weight:600;">${item.description}</span>
                    <span style="color: #64748b; font-size:0.8rem;">${new Date(item.date).toLocaleDateString('ar-EG')}</span>
                </div>
                <span style="font-weight: 700; color: ${isCharge ? '#ef4444' : '#10b981'}; direction: ltr;">
                    ${isCharge ? '' : '+'}${item.amount.toLocaleString()}
                </span>
            </div>
        `;
        }).join('');

        if (ledgerItems.length === 0) {
            list.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding: 20px;">لا يوجد سجل مالي حالياً</p>';
        }
    }

    saveChanges() {
        const n1 = document.getElementById('edit-name-1').value.trim();
        const n2 = document.getElementById('edit-name-2').value.trim();
        const n3 = document.getElementById('edit-name-3').value.trim();
        const n4 = document.getElementById('edit-name-4').value.trim();

        if (!n1 || !n2 || !n3) {
            window.soundManager.playError();
            showNeuroModal('اسم ناقص', 'يرجى إكمال الاسم (3 أجزاء على الأقل) للتعديل.', null, false);
            return;
        }

        const fullName = [n1, n2, n3, n4].filter(part => part.length > 0).join(" ");

        const updated = {
            id: this.currentPatientId,
            name: fullName,
            age: document.getElementById('edit-p-age').value,
            phone: document.getElementById('edit-p-phone').value.trim()
        };

        if (!updated.phone || updated.phone.length < 7) {
            window.soundManager.playError();
            showNeuroModal('خطأ التحقق', 'يرجى إدخال رقم هاتف صحيح (7 أرقام على الأقل).', null, false);
            return;
        }

        // 1. Update Patient Registry
        syncManager.upsertPatient(updated);

        // 2. Propagate Name Change to Appointments (Fix for "Why didn't it change?")
        let appsUpdated = false;
        syncManager.data.appointments.forEach(app => {
            if (app.patientId === this.currentPatientId) {
                app.patientName = fullName;
                appsUpdated = true;
            }
        });

        // 3. Propagate Name Change to Financial Transactions (Beneficiary Name)
        syncManager.data.finances.transactions.forEach(tx => {
            if (tx.patientId === this.currentPatientId) {
                tx.beneficiary = fullName;
                // Optional: Update description if it contains the old name? 
                // Better to keep it simple to avoid breaking history descriptions too much.
                // We mainly care about the displayed "Beneficiary/Patient" column.
            }
        });

        if (appsUpdated) syncManager.saveLocal();

        // 4. Refresh Views
        this.open(this.currentPatientId); // Refresh Modal Header

        // Refresh All Dashboard Tables
        if (window.dashboardUI) {
            window.dashboardUI.renderPatientsManagement();
            if (window.dashboardUI.renderTodayAppointments) window.dashboardUI.renderTodayAppointments();
            if (window.dashboardUI.renderAllAppointments) window.dashboardUI.renderAllAppointments();
            window.dashboardUI.updateStats(); // To be safe
        }

        window.soundManager.playSuccess();
        showNeuroModal('تم الحفظ', 'تم تحديث بيانات المريض وتعميم الاسم الجديد على كافة السجلات والمواعيد.', null, false);
    }

    deletePatient() {
        window.soundManager.playBuzz();
        showNeuroModal('تحذير', 'هل أنت متأكد من حذف هذا المريض نهائياً؟ سيتم حذف كافة مواعيده وحساباته.', () => {
            syncManager.deletePatient(this.currentPatientId);
            this.close();
            window.dashboardUI.renderPatientsManagement();
            window.dashboardUI.updateStats();
            window.soundManager.playSuccess();
        }, true);
    }

    addIncome() {
        const amountInput = document.getElementById('add-p-income-amount');
        const amount = parseFloat(amountInput.value);

        if (!amount || isNaN(amount) || amount <= 0) {
            window.soundManager.playError();
            showNeuroModal('خطأ', 'يرجى إدخال مبلغ صحيح.', null, false);
            return;
        }

        const patient = syncManager.getPatients().find(p => p.id === this.currentPatientId);
        if (!patient) return;

        // 1. Add Global Transaction
        syncManager.addTransaction({
            patientId: this.currentPatientId,
            type: 'income',
            amount: amount,
            date: new Date().toISOString(),
            description: `دفعة حساب: ${patient.name}`,
            beneficiary: patient.name
        });

        // 2. Update Pending Appointments (Logic to fix "Outside/Inside" discrepancy)
        // Find unpaid or partial appointments for this patient
        const appointments = syncManager.data.appointments.filter(a =>
            a.patientId === this.currentPatientId &&
            (a.status === 'unpaid' || a.status === 'partial')
        );

        let remainingPayment = amount;

        // Sort by oldest first to pay off old debts
        appointments.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

        appointments.forEach(app => {
            if (remainingPayment <= 0) return;

            const cost = parseFloat(app.cost || 0);
            const paid = parseFloat(app.paid || 0);
            const needed = cost - paid;

            if (needed > 0) {
                const toPay = Math.min(remainingPayment, needed);
                app.paid = paid + toPay;
                remainingPayment -= toPay;

                // Update Status
                if (app.paid >= cost) {
                    app.status = 'paid';
                } else {
                    app.status = 'partial';
                }
            }
        });

        // Save changes to appointments
        syncManager.saveLocal();

        // 3. UI Feedback
        amountInput.value = '';
        this.updateLedgerView();
        window.dashboardUI.updateStats();

        // Refresh Dashboard Tables to reflect new statuses "Outside"
        if (window.dashboardUI.renderTodayAppointments) window.dashboardUI.renderTodayAppointments();
        if (window.dashboardUI.renderAllAppointments) window.dashboardUI.renderAllAppointments();

        window.soundManager.playSuccess();
        showNeuroModal('تم الحفظ', `تم إضافة مبلغ <strong>${amount} EGP</strong> لحساب المريض بنجاح، وتحديث حالة المواعيد المعلقة.`, null, false);
    }

    startPrescription() {
        // Store selected patient ID for the editor to pick up
        localStorage.setItem('selected_patient_id', this.currentPatientId);
        window.location.href = 'editor.html';
    }

    close() {
        this.modal.style.display = 'none';
    }
}

window.patientFileUI = new PatientFileUI();
