document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const githubCard = document.getElementById('github-card');
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.querySelector('.file-drop-area');
    const resultCard = document.getElementById('result-card');
    const resultTextarea = document.getElementById('result');
    const copyBtn = document.getElementById('copy-btn');
    const errorMessage = document.getElementById('error-message');
    const uploadStepTitle = document.getElementById('upload-step-title');

    let currentMode = 'github';

    // --- Event Listeners ---

    // Switch between modes (GitHub vs Base64)
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentMode = e.target.value;
            updateUIVisibility();
        });
    });

    // Handle file selection
    fileInput.addEventListener('change', handleFile);

    // Handle file drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
    });
    dropArea.addEventListener('drop', (e) => {
        fileInput.files = e.dataTransfer.files;
        handleFile();
    }, false);

    // Copy button functionality
    copyBtn.addEventListener('click', () => {
        resultTextarea.select();
        navigator.clipboard.writeText(resultTextarea.value);
        copyBtn.textContent = '✅';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.textContent = '📋';
            copyBtn.classList.remove('copied');
        }, 1500);
    });

    // --- Core Functions ---

    function updateUIVisibility() {
        resultCard.classList.add('hidden');
        errorMessage.classList.add('hidden');
        if (currentMode === 'github') {
            githubCard.classList.remove('hidden');
            uploadStepTitle.textContent = "2. اختر الملف لتوليد الرابط";
        } else {
            githubCard.classList.add('hidden');
            uploadStepTitle.textContent = "اختر الملف لتحويله إلى Base64";
        }
    }

    function handleFile() {
        const file = fileInput.files[0];
        if (!file) return;

        hideError();

        if (currentMode === 'github') {
            generateGitHubLink(file);
        } else {
            generateBase64Link(file);
        }
    }

    function generateGitHubLink(file) {
        const username = document.getElementById('username').value.trim();
        const repo = document.getElementById('repo').value.trim();

        if (!username || !repo) {
            showError("الرجاء إدخال اسم المستخدم والمستودع في GitHub.");
            return;
        }

        const fileName = encodeURIComponent(file.name);
        const link = `https://{username}.github.io/{repo}/${fileName}`;
        
        displayResult(link);
    }

    function generateBase64Link(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            displayResult(reader.result);
        };
        reader.onerror = () => {
            showError("حدث خطأ أثناء قراءة الملف.");
        };
    }

    // --- UI Helper Functions ---

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function displayResult(content) {
        resultCard.classList.remove('hidden');
        resultTextarea.value = content;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        resultCard.classList.add('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Initial setup
    updateUIVisibility();
});