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

    // Load saved settings from browser's local storage
    function loadSettings() {
        usernameInput.value = localStorage.getItem('github_username') || '';
        repoInput.value = localStorage.getItem('github_repo') || '';
        tokenInput.value = localStorage.getItem('github_token') || '';
    }

    // Save settings to local storage
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

    // Handle file selection (from click or drop)
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            uploadAndGenerateLink(file);
        }
    });

    // --- Core Upload Function ---

    async function uploadAndGenerateLink(file) {
        const username = usernameInput.value.trim();
        const repo = repoInput.value.trim();
        const token = tokenInput.value.trim();
        const fileName = encodeURIComponent(file.name);

        if (!username || !repo || !token) {
            showError("الرجاء إدخال جميع الإعدادات وحفظها أولاً.");
            return;
        }

        // Show loading state
        setLoading(true);
        hideError();
        resultCard.classList.add('hidden');

        try {
            // Convert file to Base64
            const content = await fileToBase64(file);
            const contentClean = content.split(',')[1]; // Remove the "data:..." part

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
                    branch: 'main' // Or 'master' if that's your default branch name
                })
            });

            const data = await response.json();

            if (response.ok) {
                // The direct link is in data.content.download_url
                displayResult(data.content.download_url);
            } else {
                // Show specific error from GitHub API
                throw new Error(data.message || "فشل الرفع. تأكدي من صحة المفتاح والمستودع.");
            }

        } catch (error) {
            showError(error.message);
        } finally {
            // Hide loading state
            setLoading(false);
        }
    }

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
            fileInput.value = ''; // Reset for next upload
        }
    }
    
    // Drag and Drop functionality
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

    // Copy button
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
