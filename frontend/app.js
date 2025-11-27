// API Configuration
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
    ? 'http://localhost:5000/api'
    : '/api';

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

    // Prepare diagnosis data (outside try block so it's accessible in catch)
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

    try {
        // Try to register patient if new (non-blocking)
        if (patientId !== currentPatientId) {
            try {
                await registerPatient({
                    patient_id: patientId,
                    name: patientName,
                    age: age,
                    gender: gender,
                    contact: contact
                });
                currentPatientId = patientId;
            } catch (regError) {
                console.warn('Patient registration failed (offline mode):', regError);
                // Continue with diagnosis even if registration fails
            }
        }

        // Get diagnosis from backend
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
            // Try to load history, but don't fail if it doesn't work
            try {
                await loadPatientHistory(patientId);
            } catch (histError) {
                console.warn('Could not load patient history:', histError);
            }
        } else {
            throw new Error(result.message || 'Diagnosis failed');
        }

    } catch (error) {
        console.error('Diagnosis error:', error);
        // Try offline diagnosis as fallback
        console.log('🔄 Switching to offline diagnosis mode...');
        try {
            const offlineResult = performOfflineDiagnosis(diagnosisData);
            displayResults(offlineResult);
            displayOfflineNotice();
        } catch (offlineError) {
            console.error('Offline diagnosis also failed:', offlineError);
            displayError(error.message);
        }
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

    // Primary Diagnosis Card
    html += `
        <div class="diagnosis-card">
            <div class="section-title">Primary Diagnosis</div>
            <div class="primary-diagnosis">
                ${diagnosis.primary_diagnosis}
            </div>
            
            <div class="confidence-section">
                <div class="confidence-label">${t.confidence}</div>
                <div class="confidence-bar-bg">
                    <div class="confidence-fill" style="width: ${(diagnosis.confidence_score * 100).toFixed(0)}%"></div>
                </div>
                <div style="font-weight: 700; color: var(--primary-dark);">${(diagnosis.confidence_score * 100).toFixed(0)}%</div>
            </div>

            ${diagnosis.referral_needed ? `
                <div class="alert-box alert-danger">
                    <span style="font-size: 1.2rem;">⚠️</span>
                    <div>
                        <strong>${t.referral}</strong>
                        <p>Recommended Specialty: ${diagnosis.referral_specialty || 'General Physician'}</p>
                    </div>
                </div>
            ` : ''}

            ${diagnosis.red_flags && diagnosis.red_flags.length > 0 ? `
                <div class="alert-box alert-warning">
                    <span style="font-size: 1.2rem;">🚨</span>
                    <div>
                        <strong>${t.redFlags}</strong>
                        <ul style="margin-top: 0.5rem; padding-left: 1.2rem;">
                            ${diagnosis.red_flags.map(flag => `<li>${flag}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    // Immediate Actions
    if (diagnosis.immediate_actions && diagnosis.immediate_actions.length > 0) {
        html += `
            <div class="diagnosis-card">
                <h4>⚡ ${t.immediateActions}</h4>
                <ul class="action-list">
                    ${diagnosis.immediate_actions.map(action => `
                        <li class="action-item">
                            <span class="action-icon">✓</span>
                            <span>${action}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Treatment Protocol
    if (diagnosis.treatment_protocol) {
        html += `<div class="diagnosis-card">`;
        html += `<h4>💊 ${t.treatment}</h4>`;

        // Medications
        if (diagnosis.treatment_protocol.medications && diagnosis.treatment_protocol.medications.length > 0) {
            html += `
                <div style="margin-top: 1rem;">
                    <div class="section-title">${t.medications}</div>
                    <div class="medication-list">
                        ${diagnosis.treatment_protocol.medications.map(med => `
                            <div class="medication-item">
                                <span class="med-name">${med.name}</span>
                                <span class="med-details">${med.dosage} • ${med.frequency} • ${med.duration}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Dosage Recommendations (if available)
        if (dosage_recommendations && dosage_recommendations.length > 0) {
            html += `
                <div style="margin-top: 1rem;">
                    <div class="section-title">Pediatric/Geriatric Adjustments</div>
                    <div class="medication-list">
                        ${dosage_recommendations.map(rec => `
                            <div class="medication-item" style="border-left-color: var(--primary);">
                                <span class="med-name">${rec.medication}</span>
                                <span class="med-details">Rec: ${rec.recommended_dosage} (${rec.age_category})</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Lifestyle Advice
        if (diagnosis.treatment_protocol.lifestyle_advice && diagnosis.treatment_protocol.lifestyle_advice.length > 0) {
            html += `
                <div style="margin-top: 1.5rem;">
                    <div class="section-title">${t.lifestyle}</div>
                    <ul class="action-list">
                        ${diagnosis.treatment_protocol.lifestyle_advice.map(advice => `
                            <li class="action-item">
                                <span class="action-icon" style="color: var(--primary);">•</span>
                                <span>${advice}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        html += `</div>`;
    }

    // Differential Diagnoses
    if (diagnosis.differential_diagnoses && diagnosis.differential_diagnoses.length > 0) {
        html += `
            <div class="diagnosis-card">
                <h4>🔍 ${t.differentialDiagnoses}</h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${diagnosis.differential_diagnoses.map(diff => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg-body); border-radius: var(--radius-sm);">
                            <span style="font-weight: 500;">${diff.condition}</span>
                            <span style="font-size: 0.85rem; background: white; padding: 0.2rem 0.5rem; border-radius: 99px; border: 1px solid var(--border-light);">
                                ${(diff.probability * 100).toFixed(0)}% Match
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Patient Explanation
    if (diagnosis.patient_explanation) {
        html += `
            <div class="diagnosis-card" style="background: var(--primary-soft); border-color: var(--primary-light);">
                <h4>🗣️ ${t.patientExplanation}</h4>
                <p style="margin-top: 0.5rem; color: var(--text-body); font-style: italic;">
                    "${diagnosis.patient_explanation}"
                </p>
            </div>
        `;
    }

    // Print Button
    html += `
        <button onclick="window.print()" class="btn" style="background: white; border: 1px solid var(--border-light); color: var(--text-body); margin-top: 1rem;">
            🖨️ Print Diagnosis Report
        </button>
    `;

    html += '</div>';

    resultsContent.innerHTML = html;

    // Scroll to results on mobile
    if (window.innerWidth < 900) {
        resultsContent.scrollIntoView({ behavior: 'smooth' });
    }
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

// ============ OFFLINE DIAGNOSIS FUNCTIONALITY ============

function performOfflineDiagnosis(diagnosisData) {
    const { symptoms, vital_signs, medical_history, language, age, weight, gender } = diagnosisData;
    const symptomsLower = symptoms.toLowerCase();

    // Initialize diagnosis structure
    let diagnosis = {
        primary_diagnosis: 'General Malaise - Requires Examination',
        confidence_score: 0.3,
        differential_diagnoses: [],
        immediate_actions: ['Monitor vital signs', 'Ensure patient comfort', 'Maintain hydration'],
        treatment_protocol: {
            medications: [],
            lifestyle_advice: ['Adequate rest', 'Drink plenty of fluids', 'Maintain hygiene'],
            follow_up: '24-48 hours or if symptoms worsen'
        },
        referral_needed: false,
        referral_specialty: '',
        red_flags: [],
        patient_explanation: 'Based on the symptoms, please rest and monitor your condition. Consult a doctor if symptoms persist or worsen.'
    };

    // Get vital signs with safe defaults
    const temp = parseFloat(vital_signs.temperature) || 0;
    const bp = vital_signs.blood_pressure || '';
    const hr = parseInt(vital_signs.heart_rate) || 0;
    const o2 = parseInt(vital_signs.oxygen_level) || 0;

    // Check for emergency conditions first
    if (temp > 104 || (o2 && o2 < 90) || hr > 120) {
        diagnosis.primary_diagnosis = 'Medical Emergency';
        diagnosis.confidence_score = 0.9;
        diagnosis.referral_needed = true;
        diagnosis.referral_specialty = 'Emergency Medicine';
        diagnosis.red_flags = ['Critical vital signs', 'Immediate medical attention required'];
        diagnosis.immediate_actions = ['URGENT: Transfer to hospital immediately', 'Monitor continuously', 'Keep patient stable'];
        diagnosis.patient_explanation = 'This is a medical emergency. Please seek immediate hospital care.';
        return formatOfflineResult(diagnosis, language);
    }

    // Fever-related conditions
    if (hasFeverSymptoms(symptomsLower)) {
        if (temp > 103) {
            diagnosis.primary_diagnosis = 'High Fever - Possible Severe Infection';
            diagnosis.confidence_score = 0.75;
            diagnosis.referral_needed = true;
            diagnosis.referral_specialty = 'General Medicine';
            diagnosis.red_flags = ['High temperature (>103°F)', 'Risk of complications'];
            diagnosis.immediate_actions = [
                'Tepid sponging to reduce fever',
                'Administer antipyretics',
                'Monitor temperature every 2 hours',
                'Ensure adequate hydration'
            ];
            diagnosis.treatment_protocol.medications = [
                { name: 'Paracetamol', dosage: '500-1000mg', frequency: 'Every 6 hours', duration: '3-5 days' },
                { name: 'ORS', dosage: '200-400ml', frequency: 'After each episode of sweating', duration: 'Until fever subsides' }
            ];

            // Check for dengue/malaria symptoms
            if (symptomsLower.includes('joint pain') || symptomsLower.includes('rash') || symptomsLower.includes('bleeding')) {
                diagnosis.differential_diagnoses.push({
                    condition: 'Dengue Fever',
                    probability: 0.6,
                    reasoning: 'High fever with joint pain/rash suggests dengue'
                });
                diagnosis.immediate_actions.push('Blood test for dengue/malaria recommended');
            }

            if (symptomsLower.includes('chills') || symptomsLower.includes('shivering') || symptomsLower.includes('sweating')) {
                diagnosis.differential_diagnoses.push({
                    condition: 'Malaria',
                    probability: 0.5,
                    reasoning: 'Fever with chills and sweating pattern'
                });
                diagnosis.immediate_actions.push('Blood smear for malaria parasites');
            }
        } else if (temp >= 100) {
            diagnosis.primary_diagnosis = 'Fever - Likely Viral Infection';
            diagnosis.confidence_score = 0.7;
            diagnosis.treatment_protocol.medications = [
                { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6-8 hours', duration: '3-5 days' }
            ];
            diagnosis.differential_diagnoses.push({
                condition: 'Viral Fever',
                probability: 0.7,
                reasoning: 'Moderate fever without severe symptoms'
            });
        }
    }

    // Respiratory symptoms
    if (hasRespiratorySymptoms(symptomsLower)) {
        if (symptomsLower.includes('difficulty breathing') || symptomsLower.includes('chest pain') || symptomsLower.includes('shortness of breath')) {
            diagnosis.primary_diagnosis = 'Lower Respiratory Tract Infection - Possible Pneumonia';
            diagnosis.confidence_score = 0.7;
            diagnosis.referral_needed = true;
            diagnosis.referral_specialty = 'Pulmonology/General Medicine';
            diagnosis.red_flags = ['Breathing difficulty', 'Possible pneumonia'];
            diagnosis.treatment_protocol.medications = [
                { name: 'Amoxicillin', dosage: '500mg', frequency: '3 times daily', duration: '5-7 days' },
                { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours for fever', duration: '3-5 days' }
            ];
        } else {
            diagnosis.primary_diagnosis = 'Upper Respiratory Tract Infection (Common Cold)';
            diagnosis.confidence_score = 0.75;
            diagnosis.treatment_protocol.medications = [
                { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '3-5 days' },
                { name: 'Steam inhalation', dosage: '2-3 times', frequency: 'Daily', duration: '5 days' }
            ];
            diagnosis.differential_diagnoses.push({
                condition: 'Common Cold',
                probability: 0.8,
                reasoning: 'Typical cold symptoms without severe features'
            });
        }
    }

    // Gastrointestinal symptoms
    if (hasGISymptoms(symptomsLower)) {
        diagnosis.primary_diagnosis = 'Acute Gastroenteritis';
        diagnosis.confidence_score = 0.75;
        diagnosis.immediate_actions = [
            'Start ORS immediately',
            'Monitor for dehydration signs',
            'Avoid solid food initially',
            'Maintain hand hygiene'
        ];
        diagnosis.treatment_protocol.medications = [
            { name: 'ORS (Oral Rehydration Solution)', dosage: '200-400ml', frequency: 'After each loose stool', duration: 'Until diarrhea stops' },
            { name: 'Zinc supplements', dosage: '20mg', frequency: 'Once daily', duration: '10-14 days' }
        ];
        diagnosis.treatment_protocol.lifestyle_advice = [
            'Drink plenty of fluids (ORS, coconut water, rice water)',
            'Eat bland foods (rice, banana, toast)',
            'Avoid dairy, spicy, and oily foods',
            'Maintain strict hand hygiene'
        ];

        if (symptomsLower.includes('blood') || symptomsLower.includes('severe')) {
            diagnosis.referral_needed = true;
            diagnosis.red_flags = ['Blood in stool', 'Severe dehydration risk'];
            diagnosis.treatment_protocol.medications.push(
                { name: 'Antibiotic (Ciprofloxacin)', dosage: '500mg', frequency: 'Twice daily', duration: '3-5 days' }
            );
        }
    }

    // Headache
    if (hasHeadacheSymptoms(symptomsLower)) {
        if (symptomsLower.includes('severe') || symptomsLower.includes('worst') || symptomsLower.includes('sudden') || symptomsLower.includes('vision') || symptomsLower.includes('confusion')) {
            diagnosis.primary_diagnosis = 'Severe Headache - Requires Evaluation';
            diagnosis.confidence_score = 0.6;
            diagnosis.referral_needed = true;
            diagnosis.red_flags = ['Severe headache', 'Neurological symptoms possible'];
        } else {
            diagnosis.primary_diagnosis = 'Tension Headache';
            diagnosis.confidence_score = 0.65;
            diagnosis.treatment_protocol.medications = [
                { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours as needed', duration: '2-3 days' }
            ];
            diagnosis.treatment_protocol.lifestyle_advice.push(
                'Rest in a quiet, dark room',
                'Apply cold compress to forehead',
                'Avoid screen time',
                'Ensure adequate sleep'
            );
        }
    }

    // Diabetes symptoms
    if (symptomsLower.includes('excessive thirst') || symptomsLower.includes('frequent urination') ||
        (symptomsLower.includes('weight loss') && symptomsLower.includes('fatigue'))) {
        diagnosis.primary_diagnosis = 'Possible Diabetes - Screening Required';
        diagnosis.confidence_score = 0.6;
        diagnosis.referral_needed = true;
        diagnosis.referral_specialty = 'Endocrinology/General Medicine';
        diagnosis.immediate_actions = [
            'Fasting blood sugar test',
            'HbA1c test',
            'Monitor symptoms',
            'Dietary modifications'
        ];
        diagnosis.differential_diagnoses.push({
            condition: 'Type 2 Diabetes Mellitus',
            probability: 0.6,
            reasoning: 'Classic diabetes symptoms present'
        });
    }

    // Hypertension
    if (bp && bp.includes('/')) {
        try {
            const systolic = parseInt(bp.split('/')[0]);
            if (systolic > 140) {
                diagnosis.primary_diagnosis = 'Hypertension - Requires Management';
                diagnosis.confidence_score = 0.8;
                diagnosis.referral_needed = true;
                diagnosis.red_flags = ['Elevated blood pressure'];
                diagnosis.immediate_actions = [
                    'Rest and recheck BP after 15 minutes',
                    'Reduce salt intake',
                    'Avoid stress',
                    'Regular BP monitoring'
                ];
            }
        } catch (e) {
            console.warn('Could not parse blood pressure:', e);
        }
    }

    // Body ache/pain
    if ((symptomsLower.includes('body ache') || symptomsLower.includes('body pain') || symptomsLower.includes('muscle pain'))
        && diagnosis.primary_diagnosis === 'General Malaise - Requires Examination') {
        diagnosis.primary_diagnosis = 'Viral Myalgia (Body Ache)';
        diagnosis.confidence_score = 0.6;
        diagnosis.treatment_protocol.medications = [
            { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 8 hours', duration: '3-5 days' }
        ];
    }

    return formatOfflineResult(diagnosis, language);
}

// Helper functions for symptom detection
function hasFeverSymptoms(symptoms) {
    const feverKeywords = ['fever', 'बुखार', 'காய்ச்சல்', 'జ్వరం', 'জ্বর', 'high temperature'];
    return feverKeywords.some(keyword => symptoms.includes(keyword));
}

function hasRespiratorySymptoms(symptoms) {
    const respiratoryKeywords = ['cough', 'cold', 'खांसी', 'सर्दी', 'இருமல்', 'దగ్గు', 'কাশি', 'runny nose', 'sore throat'];
    return respiratoryKeywords.some(keyword => symptoms.includes(keyword));
}

function hasGISymptoms(symptoms) {
    const giKeywords = ['diarrhea', 'diarrhoea', 'loose stool', 'vomiting', 'दस्त', 'उल्टी', 'வயிற்றுப்போக்கு', 'విరేచనాలు', 'ডায়রিয়া', 'nausea'];
    return giKeywords.some(keyword => symptoms.includes(keyword));
}

function hasHeadacheSymptoms(symptoms) {
    const headacheKeywords = ['headache', 'head pain', 'सिरदर्द', 'தலைவலி', 'తలనొప్పి', 'মাথাব্যথা'];
    return headacheKeywords.some(keyword => symptoms.includes(keyword));
}

// Format offline result with language-specific patient explanation
function formatOfflineResult(diagnosis, language) {
    // Add language-specific patient explanation
    const explanations = {
        'hi': `${diagnosis.primary_diagnosis} का निदान किया गया है। कृपया आराम करें और दवाएं समय पर लें। यदि लक्षण बिगड़ते हैं तो तुरंत डॉक्टर से संपर्क करें।`,
        'ta': `${diagnosis.primary_diagnosis} கண்டறியப்பட்டுள்ளது. தயவுசெய்து ஓய்வெடுத்து மருந்துகளை சரியாக எடுத்துக்கொள்ளுங்கள். அறிகுறிகள் மோசமானால் உடனடியாக மருத்துவரை அணுகவும்.`,
        'te': `${diagnosis.primary_diagnosis} నిర్ధారించబడింది. దయచేసి విశ్రాంతి తీసుకోండి మరియు మందులను సమయానికి తీసుకోండి. లక్షణాలు తీవ్రమైతే వెంటనే వైద్యుడిని సంప్రదించండి.`,
        'bn': `${diagnosis.primary_diagnosis} নির্ণয় করা হয়েছে। অনুগ্রহ করে বিশ্রাম নিন এবং সময়মতো ওষুধ খান। লক্ষণ খারাপ হলে অবিলম্বে ডাক্তারের সাথে যোগাযোগ করুন।`,
        'en': `Based on your symptoms, you have been diagnosed with ${diagnosis.primary_diagnosis}. Please rest, take medications as prescribed, and monitor your symptoms. Seek immediate medical attention if symptoms worsen.`
    };

    diagnosis.patient_explanation = explanations[language] || explanations['en'];

    return {
        status: 'success',
        diagnosis: diagnosis,
        drug_interactions: [],
        dosage_recommendations: [],
        translations: translations[language] || translations['en'],
        note: 'Offline mode - Rule-based diagnosis (AI unavailable)'
    };
}

// Display offline notice
function displayOfflineNotice() {
    const notice = document.createElement('div');
    notice.className = 'alert-box alert-warning';
    notice.style.marginBottom = '1rem';
    notice.innerHTML = `
        <span style="font-size: 1.2rem;">📡</span>
        <div>
            <strong>Offline Mode Active</strong>
            <p>The server is currently unavailable. This diagnosis was generated using rule-based logic. For more accurate AI-powered diagnosis, please ensure the backend server is running.</p>
        </div>
    `;
    resultsContent.insertBefore(notice, resultsContent.firstChild);
}

