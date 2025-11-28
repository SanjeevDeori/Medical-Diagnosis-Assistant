
// Perform offline diagnosis using rule-based logic
function performOfflineDiagnosis(diagnosisData) {
    const symptoms = (diagnosisData.symptoms || '').toLowerCase();
    const vitalSigns = diagnosisData.vital_signs || {};
    const language = diagnosisData.language || 'en';

    // Initialize diagnosis object
    const diagnosis = {
        primary_diagnosis: 'General Malaise - Requires Examination',
        confidence_score: 0.5,
        differential_diagnoses: [],
        treatment_protocol: {
            medications: [],
            lifestyle_advice: [
                'Rest adequately',
                'Stay hydrated',
                'Eat nutritious food',
                'Monitor symptoms'
            ]
        },
        immediate_actions: ['Monitor symptoms', 'Seek medical attention if symptoms worsen'],
        red_flags: [],
        referral_needed: false,
        referral_specialty: null
    };

    // Get vital signs
    const temp = parseFloat(vitalSigns.temperature) || 0;
    const bp = vitalSigns.blood_pressure || '';
    const hr = parseInt(vitalSigns.heart_rate) || 0;
    const o2 = parseInt(vitalSigns.oxygen_level) || 0;

    // Emergency conditions
    if (temp > 104 || (o2 && o2 < 90) || hr > 120) {
        diagnosis.primary_diagnosis = 'Medical Emergency';
        diagnosis.confidence_score = 0.9;
        diagnosis.referral_needed = true;
        diagnosis.referral_specialty = 'Emergency Medicine';
        diagnosis.red_flags = ['Critical vital signs'];
        diagnosis.immediate_actions = ['URGENT: Seek immediate medical attention'];
        return formatOfflineResult(diagnosis, language);
    }

    // Fever-related conditions
    if (symptoms.includes('fever') || symptoms.includes('बुखार') || temp > 99) {
        if (symptoms.includes('joint pain') || symptoms.includes('rash') || symptoms.includes('bleeding')) {
            diagnosis.primary_diagnosis = 'Dengue Fever (Suspected)';
            diagnosis.confidence_score = 0.65;
            diagnosis.referral_needed = true;
            diagnosis.treatment_protocol.medications = [
                { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours', duration: '3-5 days' },
                { name: 'ORS', dosage: '200ml', frequency: 'Every 2 hours', duration: 'Until fever subsides' }
            ];
            diagnosis.immediate_actions = ['Blood test for dengue', 'Monitor platelet count', 'Stay hydrated'];
        } else if (symptoms.includes('chills') || symptoms.includes('sweating')) {
            diagnosis.primary_diagnosis = 'Malaria (Suspected)';
            diagnosis.confidence_score = 0.6;
            diagnosis.referral_needed = true;
            diagnosis.treatment_protocol.medications = [
                { name: 'Antimalarial (as prescribed)', dosage: 'As per doctor', frequency: 'As prescribed', duration: '3-7 days' }
            ];
            diagnosis.immediate_actions = ['Blood smear test for malaria', 'Start antimalarial treatment'];
        } else if (temp > 103) {
            diagnosis.primary_diagnosis = 'High Fever - Possible Infection';
            diagnosis.confidence_score = 0.7;
            diagnosis.treatment_protocol.medications = [
                { name: 'Paracetamol', dosage: '500-1000mg', frequency: 'Every 6 hours', duration: '3-5 days' }
            ];
        } else {
            diagnosis.primary_diagnosis = 'Viral Fever';
            diagnosis.confidence_score = 0.7;
            diagnosis.treatment_protocol.medications = [
                { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6-8 hours', duration: '3-5 days' }
            ];
        }
    }

    // Respiratory symptoms
    if (symptoms.includes('cough') || symptoms.includes('breathing') || symptoms.includes('chest pain')) {
        if (symptoms.includes('difficulty breathing') || symptoms.includes('shortness of breath')) {
            diagnosis.primary_diagnosis = 'Pneumonia (Suspected)';
            diagnosis.confidence_score = 0.65;
            diagnosis.referral_needed = true;
            diagnosis.treatment_protocol.medications = [
                { name: 'Amoxicillin', dosage: '500mg', frequency: '3 times daily', duration: '5-7 days' }
            ];
            diagnosis.immediate_actions = ['Chest X-ray', 'Start antibiotics', 'Monitor oxygen levels'];
        } else if (symptoms.includes('persistent cough') || symptoms.includes('blood') || symptoms.includes('weight loss')) {
            diagnosis.primary_diagnosis = 'Tuberculosis (Suspected)';
            diagnosis.confidence_score = 0.6;
            diagnosis.referral_needed = true;
            diagnosis.immediate_actions = ['Sputum test for TB', 'Chest X-ray', 'Start DOTS therapy if confirmed'];
        } else {
            diagnosis.primary_diagnosis = 'Upper Respiratory Tract Infection';
            diagnosis.confidence_score = 0.75;
            diagnosis.treatment_protocol.medications = [
                { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '3-5 days' },
                { name: 'Steam inhalation', dosage: '2-3 times', frequency: 'Daily', duration: '5 days' }
            ];
        }
    }

    // Gastrointestinal symptoms
    if (symptoms.includes('diarrhea') || symptoms.includes('vomiting') || symptoms.includes('stomach')) {
        diagnosis.primary_diagnosis = 'Acute Gastroenteritis';
        diagnosis.confidence_score = 0.75;
        diagnosis.treatment_protocol.medications = [
            { name: 'ORS', dosage: '200-400ml', frequency: 'After each loose stool', duration: 'Until diarrhea stops' },
            { name: 'Zinc supplements', dosage: '20mg', frequency: 'Once daily', duration: '10-14 days' }
        ];
        diagnosis.immediate_actions = ['Start ORS immediately', 'Monitor for dehydration'];

        if (symptoms.includes('blood') || symptoms.includes('severe')) {
            diagnosis.referral_needed = true;
            diagnosis.red_flags = ['Blood in stool', 'Severe dehydration risk'];
        }
    }

    // Diabetes symptoms
    if (symptoms.includes('excessive thirst') || symptoms.includes('frequent urination') ||
        (symptoms.includes('weight loss') && symptoms.includes('fatigue'))) {
        diagnosis.primary_diagnosis = 'Diabetes (Suspected)';
        diagnosis.confidence_score = 0.6;
        diagnosis.referral_needed = true;
        diagnosis.immediate_actions = ['Fasting blood sugar test', 'HbA1c test'];
    }

    // Hypertension
    if (bp && bp.includes('/')) {
        try {
            const systolic = parseInt(bp.split('/')[0]);
            if (systolic > 140) {
                diagnosis.primary_diagnosis = 'Hypertension';
                diagnosis.confidence_score = 0.75;
                diagnosis.referral_needed = true;
                diagnosis.immediate_actions = ['Regular BP monitoring', 'Reduce salt intake'];
            }
        } catch (e) {
            console.warn('Could not parse blood pressure');
        }
    }

    // Headache
    if (symptoms.includes('headache') || symptoms.includes('head pain')) {
        if (symptoms.includes('severe') || symptoms.includes('sudden') || symptoms.includes('vision')) {
            diagnosis.primary_diagnosis = 'Severe Headache - Requires Evaluation';
            diagnosis.confidence_score = 0.6;
            diagnosis.referral_needed = true;
        } else {
            diagnosis.primary_diagnosis = 'Tension Headache';
            diagnosis.confidence_score = 0.65;
            diagnosis.treatment_protocol.medications = [
                { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours as needed', duration: '2-3 days' }
            ];
        }
    }

    // Typhoid
    if (symptoms.includes('typhoid') || (symptoms.includes('fever') && symptoms.includes('abdominal pain'))) {
        diagnosis.primary_diagnosis = 'Typhoid Fever (Suspected)';
        diagnosis.confidence_score = 0.6;
        diagnosis.referral_needed = true;
        diagnosis.immediate_actions = ['Widal test', 'Blood culture', 'Start antibiotics'];
    }

    // Jaundice
    if (symptoms.includes('jaundice') || symptoms.includes('yellow') || symptoms.includes('dark urine')) {
        diagnosis.primary_diagnosis = 'Jaundice - Liver Function Issue';
        diagnosis.confidence_score = 0.65;
        diagnosis.referral_needed = true;
        diagnosis.immediate_actions = ['Liver function test', 'Bilirubin test', 'Avoid fatty foods'];
    }

    // Anemia
    if (symptoms.includes('weakness') || symptoms.includes('pale') || symptoms.includes('fatigue')) {
        diagnosis.primary_diagnosis = 'Anemia (Suspected)';
        diagnosis.confidence_score = 0.55;
        diagnosis.treatment_protocol.medications = [
            { name: 'Iron supplements', dosage: '100mg', frequency: 'Once daily', duration: '3 months' }
        ];
        diagnosis.immediate_actions = ['Complete blood count test', 'Increase iron-rich foods'];
    }

    return formatOfflineResult(diagnosis, language);
}

// Format offline result with language-specific patient explanation
function formatOfflineResult(diagnosis, language) {
    const explanations = {
        'hi': `${diagnosis.primary_diagnosis} का निदान किया गया है। कृपया आराम करें और दवाएं समय पर लें।`,
        'ta': `${diagnosis.primary_diagnosis} கண்டறியப்பட்டுள்ளது. தயவுசெய்து ஓய்வெடுத்து மருந்துகளை சரியாக எடுத்துக்கொள்ளுங்கள்.`,
        'te': `${diagnosis.primary_diagnosis} నిర్ధారించబడింది. దయచేసి విశ్రాంతి తీసుకోండి మరియు మందులను సమయానికి తీసుకోండి.`,
        'bn': `${diagnosis.primary_diagnosis} নির্ণয় করা হয়েছে। অনুগ্রহ করে বিশ্রাম নিন এবং সময়মতো ওষুধ খান।`,
        'en': `Based on your symptoms, you have been diagnosed with ${diagnosis.primary_diagnosis}. Please rest and monitor your symptoms.`
    };

    diagnosis.patient_explanation = explanations[language] || explanations['en'];

    return {
        status: 'success',
        diagnosis: diagnosis,
        drug_interactions: [],
        dosage_recommendations: []
    };
}

// Display offline mode notice
function displayOfflineNotice() {
    const notice = document.createElement('div');
    notice.className = 'alert-box alert-warning';
    notice.style.marginTop = '1rem';
    notice.innerHTML = `
        <span style="font-size: 1.2rem;">📡</span>
        <div>
            <strong>Offline Mode Active</strong>
            <p style="margin-top: 0.25rem; font-size: 0.9rem;">Backend server is offline. Using rule-based diagnosis (60-75% accuracy). For BioBERT AI diagnosis (87% accuracy), please ensure the backend is running.</p>
        </div>
    `;

    const resultsContent = document.getElementById('resultsContent');
    if (resultsContent && resultsContent.firstChild) {
        resultsContent.insertBefore(notice, resultsContent.firstChild);
    }
}
