document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const usernameInput = document.getElementById('username');
    const repoInput = document.getElementById('repo');
    const tokenInput = document.getElementById('token');
    const saveSettingsBtn = document.getElementById('save-settings');
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.querySelector('.file-drop-area');
    const resultCard = document.getElementById('result-card');
    const resultTextarea = document.getElementById('result');
    const copyBtn = document.getElementById('copy-btn');
    const errorMessage = document.getElementById('error-message');
    const loader = document.getElementById('loader');
    const dropIcon = document.getElementById('drop-icon');
    const dropText = document.getElementById('drop-text');
    
    // History Modal Elements
    const historyBtn = document.getElementById('history-btn');
    const historyModal = document.getElementById('history-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const historyListContainer = document.getElementById('history-list-container');

    const HISTORY_KEY = 'github_upload_history';

    // --- Settings Functions ---
    function loadSettings() {
        usernameInput.value = localStorage.getItem('github_username') || '';
        repoInput.value = localStorage.getItem('github_repo') || '';
        tokenInput.value = localStorage.getItem('github_token') || '';
    }

    saveSettingsBtn.addEventListener('click', () => {
        localStorage.setItem('github_username', usernameInput.value.trim());
        localStorage.setItem('github_repo', repoInput.value.trim());
        localStorage.setItem('github_token', tokenInput.value.trim());
        saveSettingsBtn.textContent = 'تم الحفظ!';
        saveSettingsBtn.classList.add('saved');
        setTimeout(() => {
            saveSettingsBtn.textContent = 'حفظ';
            saveSettingsBtn.classList.remove('saved');
        }, 2000);
    });

    // --- Core Upload Function ---
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            uploadAndGenerateLink(file);
        }
    });

    async function uploadAndGenerateLink(file) {
        const username = usernameInput.value.trim();
        const repo = repoInput.value.trim();
        const token = tokenInput.value.trim();
        const fileName = encodeURIComponent(file.name);

        if (!username || !repo || !token) {
            showError("الرجاء إدخال جميع الإعدادات وحفظها أولاً.");
            return;
        }

        setLoading(true);
        hideError();
        resultCard.classList.add('hidden');

        try {
            const content = await fileToBase64(file);
            const contentClean = content.split(',')[1];
            const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${fileName}`;
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `feat: upload ${file.name} via tool`,
                    content: contentClean,
                    branch: 'main'
                })
            });

            const data = await response.json();

            if (response.ok) {
                const downloadUrl = data.content.download_url;
                displayResult(downloadUrl);
                saveToHistory(file.name, downloadUrl);
            } else {
                throw new Error(data.message || "فشل الرفع. تأكدي من صحة المفتاح والمستودع.");
            }

        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    }

    // --- History Functions ---
    function getHistory() {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        return historyJson ? JSON.parse(historyJson) : [];
    }

    function saveToHistory(fileName, url) {
        const history = getHistory();
        const newEntry = { name: fileName, url: url, date: new Date().toISOString() };
        // Add new entry to the beginning of the array
        history.unshift(newEntry);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }

    function deleteFromHistory(index) {
        const history = getHistory();
        history.splice(index, 1); // Remove item at the given index
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        renderHistory(); // Re-render the list
    }

    function renderHistory() {
        const history = getHistory();
        historyListContainer.innerHTML = ''; // Clear previous list

        if (history.length === 0) {
            historyListContainer.innerHTML = '<p>لا يوجد ملفات مرفوعة في السجل بعد.</p>';
            return;
        }

        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span class="history-item-name" title="${item.name}">${item.name}</span>
                <div class="history-item-actions">
                    <button class="copy-link-btn" title="نسخ الرابط">📋</button>
                    <button class="delete-history-btn" title="حذف من السجل">🗑️</button>
                </div>
            `;
            
            // Event listener for copying link
            historyItem.querySelector('.copy-link-btn').addEventListener('click', (e) => {
                navigator.clipboard.writeText(item.url);
                e.target.textContent = '✅';
                setTimeout(() => { e.target.textContent = '📋'; }, 1500);
            });

            // Event listener for deleting entry
            historyItem.querySelector('.delete-history-btn').addEventListener('click', () => {
                deleteFromHistory(index);
            });

            historyListContainer.appendChild(historyItem);
        });
    }

    historyBtn.addEventListener('click', () => {
        renderHistory();
        historyModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        historyModal.classList.add('hidden');
    });

    // Close modal if clicked outside the content area
    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.classList.add('hidden');
        }
    });

    // --- Helper Functions ---
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    function setLoading(isLoading) {
        if (isLoading) {
            loader.classList.remove('hidden');
            dropIcon.classList.add('hidden');
            dropText.textContent = 'جاري الرفع...';
            fileInput.disabled = true;
        } else {
            loader.classList.add('hidden');
            dropIcon.classList.remove('hidden');
            dropText.textContent = 'اسحبي الملف إلى هنا أو اضغطي للاختيار';
            fileInput.disabled = false;
            fileInput.value = '';
        }
    }
    
    // Drag and Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
    });
    dropArea.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if(file) uploadAndGenerateLink(file);
    }, false);

    // Main Copy button
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(resultTextarea.value);
        copyBtn.textContent = '✅';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.textContent = '📋';
            copyBtn.classList.remove('copied');
        }, 1500);
    });
    
    function displayResult(content) {
        resultCard.classList.remove('hidden');
        resultTextarea.value = content;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Initial load
    loadSettings();
});