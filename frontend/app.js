// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Translations
const translations = {
    en: {
        diagnosis: 'Diagnosis',
        treatment: 'Treatment Plan',
        referral: 'Specialist Referral Needed',
        confidence: 'Confidence Score',
        medications: 'Medications',
        lifestyle: 'Lifestyle Advice',
        followUp: 'Follow-up',
        patientExplanation: 'Patient Explanation',
        differentialDiagnoses: 'Differential Diagnoses',
        immediateActions: 'Immediate Actions',
        redFlags: 'Warning Signs',
        drugInteractions: 'Drug Interactions',
        noDrugInteractions: 'No drug interactions detected'
    },
    hi: {
        diagnosis: 'निदान',
        treatment: 'उपचार योजना',
        referral: 'विशेषज्ञ रेफरल आवश्यक',
        confidence: 'विश्वास स्कोर',
        medications: 'दवाएं',
        lifestyle: 'जीवनशैली सलाह',
        followUp: 'फॉलो-अप',
        patientExplanation: 'रोगी स्पष्टीकरण',
        differentialDiagnoses: 'विभेदक निदान',
        immediateActions: 'तत्काल कार्रवाई',
        redFlags: 'चेतावनी संकेत',
        drugInteractions: 'दवा परस्पर क्रिया',
        noDrugInteractions: 'कोई दवा परस्पर क्रिया नहीं मिली'
    },
    ta: {
        diagnosis: 'நோய் கண்டறிதல்',
        treatment: 'சிகிச்சை திட்டம்',
        referral: 'நிபுணர் பரிந்துரை தேவை',
        confidence: 'நம்பிக்கை மதிப்பெண்',
        medications: 'மருந்துகள்',
        lifestyle: 'வாழ்க்கை முறை ஆலோசனை',
        followUp: 'பின்தொடர்தல்',
        patientExplanation: 'நோயாளி விளக்கம்',
        differentialDiagnoses: 'வேறுபாடு நோய் கண்டறிதல்',
        immediateActions: 'உடனடி நடவடிக்கைகள்',
        redFlags: 'எச்சரிக்கை அறிகுறிகள்',
        drugInteractions: 'மருந்து தொடர்புகள்',
        noDrugInteractions: 'மருந்து தொடர்புகள் இல்லை'
    },
    te: {
        diagnosis: 'రోగ నిర్ధారణ',
        treatment: 'చికిత్స ప్రణాళిక',
        referral: 'నిపుణుల సిఫార్సు అవసరం',
        confidence: 'విశ్వాస స్కోరు',
        medications: 'మందులు',
        lifestyle: 'జీవనశైలి సలహా',
        followUp: 'ఫాలో-అప్',
        patientExplanation: 'రోగి వివరణ',
        differentialDiagnoses: 'భేద నిర్ధారణలు',
        immediateActions: 'తక్షణ చర్యలు',
        redFlags: 'హెచ్చరిక సంకేతాలు',
        drugInteractions: 'ఔషధ పరస్పర చర్యలు',
        noDrugInteractions: 'ఔషధ పరస్పర చర్యలు లేవు'
    },
    bn: {
        diagnosis: 'রোগ নির্ণয়',
        treatment: 'চিকিৎসা পরিকল্পনা',
        referral: 'বিশেষজ্ঞ রেফারেল প্রয়োজন',
        confidence: 'আত্মবিশ্বাস স্কোর',
        medications: 'ওষুধ',
        lifestyle: 'জীবনযাত্রার পরামর্শ',
        followUp: 'ফলো-আপ',
        patientExplanation: 'রোগীর ব্যাখ্যা',
        differentialDiagnoses: 'ডিফারেনশিয়াল ডায়াগনোসিস',
        immediateActions: 'তাৎক্ষণিক পদক্ষেপ',
        redFlags: 'সতর্কতা চিহ্ন',
        drugInteractions: 'ড্রাগ ইন্টারঅ্যাকশন',
        noDrugInteractions: 'কোনো ড্রাগ ইন্টারঅ্যাকশন পাওয়া যায়নি'
    }
};

// State
let currentLanguage = 'en';
let currentPatientId = null;
let selectedSymptomsList = [];

// Common Symptoms List
const commonSymptomsList = [
    'Fever', 'Headache', 'Body ache', 'Fatigue', 'Nausea', 'Vomiting',
    'Diarrhea', 'Chest pain', 'Shortness of breath', 'Sore throat',
    'Runny nose', 'Cough', 'Chills', 'Dizziness'
];

// DOM Elements
const languageSelect = document.getElementById('languageSelect');
const patientForm = document.getElementById('patientForm');
const symptomsForm = document.getElementById('symptomsForm');
const diagnoseBtn = document.getElementById('diagnoseBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const resultsContent = document.getElementById('resultsContent');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const historySection = document.getElementById('historySection');
const historyContent = document.getElementById('historyContent');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkServerStatus();
    setupEventListeners();
    renderCommonSymptoms();
});

// Event Listeners
function setupEventListeners() {
    languageSelect.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
    });

    symptomsForm.addEventListener('submit', handleDiagnosis);
}

// Check server status
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();

        if (data.status === 'healthy') {
            statusDot.classList.remove('offline');
            statusText.textContent = data.model_available
                ? 'AI Model Online - Ready for diagnosis'
                : 'Offline Mode - Using rule-based diagnosis';
        } else {
            throw new Error('Server unhealthy');
        }
    } catch (error) {
        statusDot.classList.add('offline');
        statusText.textContent = 'Server Offline - Please start the backend';
        console.error('Server status check failed:', error);
    }
}

// Handle diagnosis
async function handleDiagnosis(e) {
    e.preventDefault();

    // Get form data
    let patientId = document.getElementById('patientId').value;

    // Auto-generate Patient ID if missing
    if (!patientId) {
        patientId = `PID-${Date.now()}`;
        document.getElementById('patientId').value = patientId;
    }
    const patientName = document.getElementById('patientName').value;
    const age = parseInt(document.getElementById('age').value);
    const weight = parseFloat(document.getElementById('weight').value) || 60;
    const gender = document.getElementById('gender').value;
    const contact = document.getElementById('contact').value;
    const symptomsText = document.getElementById('symptoms').value;

    // Combine selected symptoms with detailed description
    const symptoms = [...selectedSymptomsList, symptomsText].filter(Boolean).join(', ');
    const medicalHistory = document.getElementById('medicalHistory').value;

    // Get vital signs
    const vitalSigns = {
        temperature: parseFloat(document.getElementById('temperature').value) || null,
        blood_pressure: document.getElementById('bloodPressure').value || null,
        heart_rate: parseInt(document.getElementById('heartRate').value) || null,
        oxygen_level: parseInt(document.getElementById('oxygenLevel').value) || null
    };

    // Validate required fields
    if (!symptoms.trim()) {
        alert('Please select symptoms or enter a description');
        return;
    }

    // Show loading
    showLoading(true);

    try {
        // Register patient if new
        if (patientId !== currentPatientId) {
            await registerPatient({
                patient_id: patientId,
                name: patientName,
                age: age,
                gender: gender,
                contact: contact
            });
            currentPatientId = patientId;
        }

        // Get diagnosis
        const diagnosisData = {
            patient_id: patientId,
            symptoms: symptoms,
            vital_signs: vitalSigns,
            medical_history: medicalHistory,
            language: currentLanguage,
            age: age,
            weight: weight,
            gender: gender
        };

        const response = await fetch(`${API_BASE_URL}/diagnose`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(diagnosisData)
        });

        const result = await response.json();

        if (result.status === 'success') {
            displayResults(result);
            loadPatientHistory(patientId);
        } else {
            throw new Error(result.message || 'Diagnosis failed');
        }

    } catch (error) {
        console.error('Diagnosis error:', error);
        displayError(error.message);
    } finally {
        showLoading(false);
    }
}

// Register patient
async function registerPatient(patientData) {
    try {
        const response = await fetch(`${API_BASE_URL}/patient/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(patientData)
        });

        const result = await response.json();

        if (result.status !== 'success' && !result.message.includes('already exists')) {
            console.warn('Patient registration warning:', result.message);
        }
    } catch (error) {
        console.error('Patient registration error:', error);
    }
}

// Display results
function displayResults(result) {
    const { diagnosis, drug_interactions, dosage_recommendations } = result;
    const t = translations[currentLanguage];

    let html = '<div class="diagnosis-result">';

    // Confidence Score
    html += `
        <div class="confidence-score">
            <div style="flex: 1;">
                <strong>${t.confidence}</strong>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${(diagnosis.confidence_score * 100).toFixed(0)}%"></div>
                </div>
            </div>
            <span style="font-weight: 600; font-size: 1.2rem;">${(diagnosis.confidence_score * 100).toFixed(0)}%</span>
        </div>
    `;

    // Primary Diagnosis
    html += `
        <div class="diagnosis-card">
            <h4>🎯 ${t.diagnosis}</h4>
            <p style="font-size: 1.2rem; font-weight: 600; color: var(--primary-light);">
                ${diagnosis.primary_diagnosis}
            </p>
        </div>
    `;

    // Referral Badge
    if (diagnosis.referral_needed) {
        html += `
            <div class="alert alert-danger">
                <span class="alert-icon">⚠️</span>
                <div>
                    <strong>${t.referral}</strong>
                    <p>Specialty: ${diagnosis.referral_specialty || 'General Physician'}</p>
                </div>
            </div>
        `;
    }

    // Red Flags
    if (diagnosis.red_flags && diagnosis.red_flags.length > 0) {
        html += `
            <div class="alert alert-warning">
                <span class="alert-icon">🚨</span>
                <div>
                    <strong>${t.redFlags}</strong>
                    <ul style="margin: 0.5rem 0 0 1.5rem;">
                        ${diagnosis.red_flags.map(flag => `<li>${flag}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // Immediate Actions
    if (diagnosis.immediate_actions && diagnosis.immediate_actions.length > 0) {
        html += `
            <div class="diagnosis-card">
                <h4>⚡ ${t.immediateActions}</h4>
                <ul class="differential-list">
                    ${diagnosis.immediate_actions.map(action => `
                        <li class="differential-item">${action}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Differential Diagnoses
    if (diagnosis.differential_diagnoses && diagnosis.differential_diagnoses.length > 0) {
        html += `
            <div class="diagnosis-card">
                <h4>🔍 ${t.differentialDiagnoses}</h4>
                <ul class="differential-list">
                    ${diagnosis.differential_diagnoses.map(diff => `
                        <li class="differential-item">
                            <strong>${diff.condition}</strong> 
                            (${(diff.probability * 100).toFixed(0)}%)
                            <br>
                            <small style="color: var(--text-muted);">${diff.reasoning}</small>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Treatment Protocol
    if (diagnosis.treatment_protocol) {
        html += `<div class="diagnosis-card treatment-section">`;
        html += `<h4>💊 ${t.treatment}</h4>`;

        // Medications
        if (diagnosis.treatment_protocol.medications && diagnosis.treatment_protocol.medications.length > 0) {
            html += `
                <div style="margin-bottom: 1rem;">
                    <strong>${t.medications}:</strong>
                    <ul class="medication-list">
                        ${diagnosis.treatment_protocol.medications.map(med => `
                            <li class="medication-item">
                                <div>
                                    <div class="medication-name">${med.name}</div>
                                    <div class="medication-dosage">
                                        ${med.dosage} - ${med.frequency} for ${med.duration}
                                    </div>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        // Dosage Recommendations
        if (dosage_recommendations && dosage_recommendations.length > 0) {
            html += `
                <div style="margin-bottom: 1rem;">
                    <strong>Age-Adjusted Dosages:</strong>
                    <ul class="medication-list">
                        ${dosage_recommendations.map(rec => `
                            <li class="medication-item">
                                <div>
                                    <div class="medication-name">${rec.medication}</div>
                                    <div class="medication-dosage">
                                        ${rec.recommended_dosage} (${rec.age_category})
                                    </div>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        // Lifestyle Advice
        if (diagnosis.treatment_protocol.lifestyle_advice && diagnosis.treatment_protocol.lifestyle_advice.length > 0) {
            html += `
                <div style="margin-bottom: 1rem;">
                    <strong>${t.lifestyle}:</strong>
                    <ul style="margin: 0.5rem 0 0 1.5rem; color: var(--text-secondary);">
                        ${diagnosis.treatment_protocol.lifestyle_advice.map(advice => `<li>${advice}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Follow-up
        if (diagnosis.treatment_protocol.follow_up) {
            html += `
                <div>
                    <strong>${t.followUp}:</strong> 
                    <span style="color: var(--accent-color);">${diagnosis.treatment_protocol.follow_up}</span>
                </div>
            `;
        }

        html += `</div>`;
    }

    // Drug Interactions
    if (drug_interactions && drug_interactions.length > 0) {
        html += `
            <div class="alert alert-warning">
                <span class="alert-icon">⚠️</span>
                <div>
                    <strong>${t.drugInteractions}</strong>
                    <ul style="margin: 0.5rem 0 0 1.5rem;">
                        ${drug_interactions.map(interaction => `
                            <li>
                                <strong>${interaction.drugs.join(' + ')}</strong>
                                <br>
                                <small>Severity: ${interaction.severity.toUpperCase()}</small>
                                <br>
                                <small>${interaction.description}</small>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="alert alert-success">
                <span class="alert-icon">✅</span>
                <div><strong>${t.noDrugInteractions}</strong></div>
            </div>
        `;
    }

    // Patient Explanation
    if (diagnosis.patient_explanation) {
        html += `
            <div class="diagnosis-card">
                <h4>👨‍⚕️ ${t.patientExplanation}</h4>
                <p style="line-height: 1.8; color: var(--text-secondary);">
                    ${diagnosis.patient_explanation}
                </p>
            </div>
        `;
    }

    html += '</div>';

    resultsContent.innerHTML = html;
}

// Display error
function displayError(message) {
    resultsContent.innerHTML = `
        <div class="alert alert-danger">
            <span class="alert-icon">❌</span>
            <div>
                <strong>Error</strong>
                <p>${message}</p>
                <p style="margin-top: 0.5rem; font-size: 0.9rem;">
                    The system is operating in offline mode. Please check your connection or ensure the backend server is running.
                </p>
            </div>
        </div>
    `;
}

// Load patient history
async function loadPatientHistory(patientId) {
    try {
        const response = await fetch(`${API_BASE_URL}/patient/history/${patientId}`);
        const result = await response.json();

        if (result.status === 'success' && result.history.length > 0) {
            displayHistory(result.history);
        }
    } catch (error) {
        console.error('Failed to load patient history:', error);
    }
}

// Display history
function displayHistory(history) {
    historySection.style.display = 'block';

    let html = '';
    history.forEach((record, index) => {
        if (index < 5) { // Show only last 5 records
            const diagnosis = record.diagnosis;
            html += `
                <div class="history-item">
                    <div class="history-date">${new Date(record.date).toLocaleString()}</div>
                    <div><strong>Symptoms:</strong> ${record.symptoms}</div>
                    <div><strong>Diagnosis:</strong> ${diagnosis.primary_diagnosis}</div>
                    <div><strong>Confidence:</strong> ${(record.confidence_score * 100).toFixed(0)}%</div>
                    ${record.referral_needed ? '<div style="color: var(--danger-color);">⚠️ Referral Needed</div>' : ''}
                </div>
            `;
        }
    });

    historyContent.innerHTML = html;
}

// Show/hide loading
function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('active');
        diagnoseBtn.disabled = true;
    } else {
        loadingOverlay.classList.remove('active');
        diagnoseBtn.disabled = false;
    }
}

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Symptom Checker Logic
function renderCommonSymptoms() {
    const container = document.getElementById('commonSymptoms');
    container.innerHTML = commonSymptomsList.map(symptom => `
        <div class="symptom-chip ${selectedSymptomsList.includes(symptom) ? 'active' : ''}" 
             onclick="toggleSymptom('${symptom}')">
            ${symptom}
        </div>
    `).join('');
}

function toggleSymptom(symptom) {
    if (selectedSymptomsList.includes(symptom)) {
        removeSymptom(symptom);
    } else {
        addSymptom(symptom);
    }
}

function addSymptom(symptom) {
    if (!selectedSymptomsList.includes(symptom)) {
        selectedSymptomsList.push(symptom);
        renderSelectedSymptoms();
        renderCommonSymptoms();
    }
}

function removeSymptom(symptom) {
    selectedSymptomsList = selectedSymptomsList.filter(s => s !== symptom);
    renderSelectedSymptoms();
    renderCommonSymptoms();
}

function renderSelectedSymptoms() {
    const container = document.getElementById('selectedSymptoms');
    container.innerHTML = selectedSymptomsList.map(symptom => `
        <div class="symptom-tag">
            ${symptom}
            <span class="remove-btn" onclick="removeSymptom('${symptom}')">×</span>
        </div>
    `).join('');
}

// Expose functions to global scope for onclick handlers
window.toggleSymptom = toggleSymptom;
window.removeSymptom = removeSymptom;
