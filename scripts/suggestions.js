
/* 
    Suggestion Manager
    Handles medicine autocomplete functionality in the main writing area.
*/

class SuggestionManager {
    constructor() {
        const meds = (typeof MEDICINE_DB !== 'undefined') ? MEDICINE_DB : [];
        const userMeds = (typeof USER_MEDICINES !== 'undefined') ? USER_MEDICINES : [];
        const freqs = (typeof FREQUENCY_DB !== 'undefined') ? FREQUENCY_DB : [];
        this.suggestions = [...meds, ...userMeds, ...freqs];
        this.activeArea = document.getElementById('main-content-area');
        this.popup = null;
        this.selectedIndex = 0;
        this.filteredList = [];
        this.isDoseMode = false;
        this.lastRange = null; // Store the range where the menu was triggered

        this.init();
    }

    init() {
        if (!this.activeArea) return;

        // Create popup element
        this.createPopup();

        // Listen for input events
        this.activeArea.addEventListener('input', (e) => this.handleInput(e));
        this.activeArea.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Hide popup on click elsewhere
        document.addEventListener('mousedown', (e) => {
            if (this.popup && !this.popup.contains(e.target) && e.target !== this.activeArea) {
                if (!this.activeArea.contains(e.target)) {
                    this.hidePopup();
                }
            }
        });
    }

    createPopup() {
        this.popup = document.createElement('div');
        this.popup.className = 'suggestion-popup';
        this.popup.style.display = 'none';
        document.body.appendChild(this.popup);
    }

    saveCurrentRange() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            this.lastRange = selection.getRangeAt(0).cloneRange();
        }
    }

    handleInput(e) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const node = range.startContainer;

        let text = "";
        let offset = 0;

        // Handle text nodes or elements
        if (node.nodeType === Node.TEXT_NODE) {
            text = node.textContent;
            offset = range.startOffset;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Some browsers put selection in element offset
            text = node.innerText || "";
            offset = text.length;
        } else {
            return;
        }

        // Find relevant text segment
        const lastSeparator = text.lastIndexOf(' - ', offset - 1);
        const lastNewLine = text.lastIndexOf('\n', offset - 1);

        let startPos = 0;
        if (lastSeparator > lastNewLine) {
            startPos = lastSeparator + 3;
            this.isDoseMode = true;
        } else {
            startPos = lastNewLine === -1 ? 0 : lastNewLine + 1;
            this.isDoseMode = false;
        }

        const query = text.substring(startPos, offset).trim();

        // Trigger suggestion list
        if (query.length >= 2) {
            let pool = [];
            if (this.isDoseMode) {
                pool = (typeof FREQUENCY_DB !== 'undefined') ? FREQUENCY_DB : [];
            } else {
                const meds = (typeof MEDICINE_DB !== 'undefined') ? MEDICINE_DB : [];
                const userMeds = (typeof USER_MEDICINES !== 'undefined') ? USER_MEDICINES : [];
                pool = Array.from(new Set([...meds, ...userMeds]));
            }

            this.filteredList = pool.filter(item =>
                item.toLowerCase().includes(query.toLowerCase())
            );

            if (this.filteredList.length > 0) {
                this.saveCurrentRange(); // Save exactly where we are
                this.showPopup();
                this.renderSuggestions(query);
                this.updatePopupPosition(range);
            } else {
                this.hidePopup();
            }
        } else {
            this.hidePopup();
        }
    }

    handleKeyDown(e) {
        if (this.popup.style.display === 'none') return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % this.filteredList.length;
                this.highlightItem(this.selectedIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex - 1 + this.filteredList.length) % this.filteredList.length;
                this.highlightItem(this.selectedIndex);
                break;
            case 'Enter':
            case 'Tab':
                e.preventDefault();
                this.selectItem(this.filteredList[this.selectedIndex]);
                break;
            case 'Escape':
                this.hidePopup();
                break;
        }
    }

    sanitizeText(text) {
        if (!text) return "";
        // Clean leading/trailing quotes, commas, and whitespace
        return text.replace(/^["'\s,]+|["'\s,]+$/g, '').trim();
    }

    renderSuggestions(query) {
        this.popup.innerHTML = '';
        if (this.isDoseMode) {
            this.popup.innerHTML = '<div style="padding:6px 12px; font-size:13px; font-weight:600; color:#475569; background:#f1f5f9; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between;"><span>Select Dosage</span><span>اختر الجرعة</span></div>';
        }

        this.selectedIndex = 0;

        this.filteredList.slice(0, 15).forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            if (this.isDoseMode) div.classList.add('dosage-item');

            if (query) {
                const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${escapedQuery})`, 'i');
                div.innerHTML = item.replace(regex, '<strong>$1</strong>');
            } else {
                div.textContent = item;
            }

            if (index === 0) div.classList.add('selected');

            // IMPORTANT: use mousedown + preventDefault to keep editor focus
            div.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Ensure we use the saved range
                this.selectItem(item);
            });

            this.popup.appendChild(div);
        });
    }

    highlightItem(index) {
        const items = this.popup.querySelectorAll('.suggestion-item');
        items.forEach((item, i) => {
            if (i === index) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            }
            else item.classList.remove('selected');
        });
    }

    selectItem(text) {
        // Use the saved range if possible, fallback to current selection
        let range = this.lastRange;
        const selection = window.getSelection();

        if (!range && selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
        }

        if (!range) return;

        const node = range.startContainer;
        const currentText = (node.nodeType === Node.TEXT_NODE) ? node.textContent : "";
        const offset = range.startOffset;

        // Determine replacement start point
        const lastSeparator = currentText.lastIndexOf(' - ', offset - 1);
        const lastNewLine = currentText.lastIndexOf('\n', offset - 1);

        let startPos = 0;
        if (lastSeparator > lastNewLine) {
            startPos = lastSeparator + 3;
        } else {
            startPos = lastNewLine === -1 ? 0 : lastNewLine + 1;
        }

        // Apply replacement with sanitation
        try {
            const cleanText = this.sanitizeText(text);

            if (node.nodeType === Node.TEXT_NODE) {
                range.setStart(node, startPos);
                range.setEnd(node, offset);
                range.deleteContents();

                const newTextNode = document.createTextNode(cleanText);
                range.insertNode(newTextNode);

                range.setStartAfter(newTextNode);
                range.setEndAfter(newTextNode);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // Fallback for element nodes (rare in typing)
                const newTextNode = document.createTextNode(cleanText);
                range.insertNode(newTextNode);
                range.setStartAfter(newTextNode);
                range.setEndAfter(newTextNode);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } catch (e) {
            console.error("Selection replacement failed:", e);
        }

        // Logic for following dosage menu
        const meds = (typeof MEDICINE_DB !== 'undefined') ? MEDICINE_DB : [];
        const userMeds = (typeof USER_MEDICINES !== 'undefined') ? USER_MEDICINES : [];
        const isMedicine = meds.includes(text) || userMeds.includes(text);

        if (isMedicine) {
            const spaceNode = document.createTextNode(" - ");
            range.insertNode(spaceNode);
            range.setStartAfter(spaceNode);
            range.setEndAfter(spaceNode);
            selection.removeAllRanges();
            selection.addRange(range);

            this.saveCurrentRange();
            this.isDoseMode = true;

            setTimeout(() => {
                const newRange = document.createRange();
                newRange.selectNode(spaceNode);
                const rect = newRange.getBoundingClientRect();
                this.showDoseSuggestions(rect);
            }, 50);
        } else {
            this.hidePopup();
            this.isDoseMode = false;
        }

        // Ensure editor gets focus back
        this.activeArea.focus();
    }

    showDoseSuggestions(rect) {
        const freqs = (typeof FREQUENCY_DB !== 'undefined') ? FREQUENCY_DB : [];
        if (freqs.length === 0) {
            this.hidePopup();
            return;
        }

        this.filteredList = freqs;
        this.isDoseMode = true;
        this.renderSuggestions("");
        this.showPopup();
        this.updatePopupPosition(rect);
    }

    updatePopupPosition(rect) {
        if (!rect) return;
        let finalRect = rect;
        if (typeof rect.getBoundingClientRect === 'function') {
            finalRect = rect.getBoundingClientRect();
        }
        this.popup.style.top = `${finalRect.bottom + window.scrollY + 5}px`;
        this.popup.style.left = `${finalRect.left + window.scrollX}px`;
    }

    showPopup() {
        this.popup.style.display = 'block';
    }

    hidePopup() {
        this.popup.style.display = 'none';
        this.selectedIndex = 0;
        this.lastRange = null;
    }
}

// Initialize on load
window.addEventListener('load', () => {
    new SuggestionManager();
});
