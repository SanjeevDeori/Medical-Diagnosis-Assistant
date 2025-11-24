from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime
import google.generativeai as genai
from typing import Dict, List, Any
import re
from flask import send_from_directory

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Serve frontend UI
@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
model = None

if GEMINI_API_KEY and GEMINI_API_KEY != 'your_gemini_api_key_here':
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Use gemini-2.0-flash as it is available
        model = genai.GenerativeModel('gemini-2.0-flash')
        print("✓ Gemini AI Model (gemini-2.0-flash) configured successfully")
    except Exception as e:
        print(f"⚠️  Gemini API configuration failed: {str(e)}")
        print("   System will operate in OFFLINE MODE")
        model = None
else:
    print("⚠️  No valid Gemini API key found")
    print("   System will operate in OFFLINE MODE (rule-based diagnosis)")

# Database setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'medical_assistant.db')

def init_db():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DB_PATH, timeout=10)
    try:
        cursor = conn.cursor()
        
        # Patient records table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                age INTEGER,
                gender TEXT,
                contact TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Diagnosis history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS diagnosis_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                symptoms TEXT NOT NULL,
                vital_signs TEXT,
                medical_history TEXT,
                diagnosis_result TEXT NOT NULL,
                confidence_score REAL,
                treatment_plan TEXT,
                referral_needed BOOLEAN,
                language TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
            )
        ''')
        
        # Knowledge base for common rural diseases
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS disease_knowledge (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                disease_name TEXT NOT NULL,
                common_symptoms TEXT,
                prevalence_score REAL,
                treatment_protocol TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Drug interactions database
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS drug_interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                drug1 TEXT NOT NULL,
                drug2 TEXT NOT NULL,
                interaction_severity TEXT,
                description TEXT
            )
        ''')
        
        conn.commit()
    finally:
        conn.close()

# Initialize database on startup 
init_db()

# Multilingual translations
TRANSLATIONS = {
    'en': {
        'diagnosis': 'Diagnosis',
        'treatment': 'Treatment Plan',
        'referral': 'Specialist Referral Needed',
        'confidence': 'Confidence Score'
    },
    'hi': {
        'diagnosis': 'निदान',
        'treatment': 'उपचार योजना',
        'referral': 'विशेषज्ञ रेफरल आवश्यक',
        'confidence': 'विश्वास स्कोर'
    },
    'ta': {
        'diagnosis': 'நோய் கண்டறிதல்',
        'treatment': 'சிகிச்சை திட்டம்',
        'referral': 'நிபுணர் பரிந்துரை தேவை',
        'confidence': 'நம்பிக்கை மதிப்பெண்'
    },
    'te': {
        'diagnosis': 'రోగ నిర్ధారణ',
        'treatment': 'చికిత్స ప్రణాళిక',
        'referral': 'నిపుణుల సిఫార్సు అవసరం',
        'confidence': 'విశ్వాస స్కోరు'
    },
    'bn': {
        'diagnosis': 'রোগ নির্ণয়',
        'treatment': 'চিকিৎসা পরিকল্পনা',
        'referral': 'বিশেষজ্ঞ রেফারেল প্রয়োজন',
        'confidence': 'আত্মবিশ্বাস স্কোর'
    }
}

# Common drug interactions (simplified database)
DRUG_INTERACTIONS = {
    ('aspirin', 'warfarin'): {'severity': 'high', 'description': 'Increased bleeding risk'},
    ('metformin', 'alcohol'): {'severity': 'medium', 'description': 'Risk of lactic acidosis'},
    ('paracetamol', 'alcohol'): {'severity': 'medium', 'description': 'Liver damage risk'},
    ('ibuprofen', 'aspirin'): {'severity': 'medium', 'description': 'Reduced effectiveness'},
}

def get_diagnosis_prompt(symptoms: str, vital_signs: Dict, medical_history: str, language: str) -> str:
    """Generate prompt for Gemini API"""
    prompt = f"""You are an expert medical diagnosis assistant for rural healthcare in India. 
Analyze the following patient information and provide a differential diagnosis.

Patient Symptoms: {symptoms}
Vital Signs: {json.dumps(vital_signs)}
Medical History: {medical_history}

Provide your response in the following JSON format:
{{
    "primary_diagnosis": "Most likely condition",
    "confidence_score": 0.0-1.0,
    "differential_diagnoses": [
        {{"condition": "name", "probability": 0.0-1.0, "reasoning": "brief explanation"}},
        ...
    ],
    "immediate_actions": ["action1", "action2"],
    "treatment_protocol": {{
        "medications": [{{"name": "drug", "dosage": "amount", "frequency": "times per day", "duration": "days"}}],
        "lifestyle_advice": ["advice1", "advice2"],
        "follow_up": "timeframe"
    }},
    "referral_needed": true/false,
    "referral_specialty": "specialty if referral needed",
    "red_flags": ["warning sign1", "warning sign2"],
    "patient_explanation": "Simple explanation in {language} language suitable for patients"
}}

Focus on common rural health issues in India such as:
- Infectious diseases (malaria, dengue, typhoid, tuberculosis)
- Respiratory infections
- Gastrointestinal issues
- Diabetes and hypertension
- Nutritional deficiencies
- Skin conditions

Consider Indian healthcare protocols and available medications in rural areas."""
    
    return prompt

def check_drug_interactions(medications: List[str]) -> List[Dict]:
    """Check for drug interactions"""
    interactions = []
    medications_lower = [med.lower() for med in medications]
    
    for i, drug1 in enumerate(medications_lower):
        for drug2 in medications_lower[i+1:]:
            key1 = (drug1, drug2)
            key2 = (drug2, drug1)
            
            if key1 in DRUG_INTERACTIONS:
                interactions.append({
                    'drugs': [drug1, drug2],
                    'severity': DRUG_INTERACTIONS[key1]['severity'],
                    'description': DRUG_INTERACTIONS[key1]['description']
                })
            elif key2 in DRUG_INTERACTIONS:
                interactions.append({
                    'drugs': [drug1, drug2],
                    'severity': DRUG_INTERACTIONS[key2]['severity'],
                    'description': DRUG_INTERACTIONS[key2]['description']
                })
    
    return interactions

def safe_float(value, default=0.0):
    try:
        if value is None or value == '':
            return default
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_int(value, default=0):
    try:
        if value is None or value == '':
            return default
        return int(float(value))
    except (ValueError, TypeError):
        return default

def calculate_dosage(medication: str, age: int, weight: float, gender: str) -> Dict:
    """Calculate appropriate dosage based on patient demographics"""
    # Ensure inputs are valid numbers
    age = safe_int(age, 30)
    weight = safe_float(weight, 60.0)
    
    # Simplified dosage calculation - in production, use comprehensive drug database
    dosage_adjustments = {
        'paracetamol': {
            'adult': '500-1000mg every 4-6 hours',
            'child': f'{15 * weight}mg every 4-6 hours (max 60mg/kg/day)',
            'elderly': '500mg every 6 hours'
        },
        'amoxicillin': {
            'adult': '500mg three times daily',
            'child': f'{20 * weight}mg three times daily',
            'elderly': '250-500mg three times daily'
        }
    }
    
    medication_lower = medication.lower()
    age_category = 'child' if age < 12 else 'elderly' if age > 65 else 'adult'
    
    if medication_lower in dosage_adjustments:
        return {
            'medication': medication,
            'recommended_dosage': dosage_adjustments[medication_lower].get(age_category, 'Consult physician'),
            'age_category': age_category
        }
    
    return {
        'medication': medication,
        'recommended_dosage': 'Standard adult dosage - consult drug reference',
        'age_category': age_category
    }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_available': model is not None,
        'database': 'connected'
    })

@app.route('/api/patient/register', methods=['POST'])
def register_patient():
    """Register a new patient"""
    data = request.json
    
    try:
        conn = sqlite3.connect(DB_PATH, timeout=10)
        try:
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO patients (patient_id, name, age, gender, contact)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                data['patient_id'],
                data['name'],
                data.get('age'),
                data.get('gender'),
                data.get('contact')
            ))
            
            conn.commit()
        finally:
            conn.close()
        
        return jsonify({'status': 'success', 'message': 'Patient registered successfully'})
    except sqlite3.IntegrityError:
        return jsonify({'status': 'error', 'message': 'Patient ID already exists'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/diagnose', methods=['POST'])
def diagnose():
    """Main diagnosis endpoint"""
    data = request.json
    
    patient_id = data.get('patient_id')
    symptoms = data.get('symptoms', '')
    vital_signs = data.get('vital_signs', {})
    medical_history = data.get('medical_history', '')
    language = data.get('language', 'en')
    
    # Safely convert demographics
    age = safe_int(data.get('age'), 30)
    weight = safe_float(data.get('weight'), 60.0)
    gender = data.get('gender', 'unknown')
    
    try:
        # Generate diagnosis using Gemini
        if model:
            prompt = get_diagnosis_prompt(symptoms, vital_signs, medical_history, language)
            response = model.generate_content(prompt)
            
            # Parse JSON response
            response_text = response.text
            # Extract JSON from markdown code blocks if present
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            
            diagnosis_result = json.loads(response_text)
        else:
            # Fallback offline diagnosis (rule-based)
            diagnosis_result = offline_diagnosis(symptoms, vital_signs, medical_history, language)
        
        # Check drug interactions
        medications = []
        if 'treatment_protocol' in diagnosis_result and 'medications' in diagnosis_result['treatment_protocol']:
            medications = [med['name'] for med in diagnosis_result['treatment_protocol']['medications']]
        
        drug_interactions = check_drug_interactions(medications)
        
        # Calculate dosages
        dosage_recommendations = []
        for med in medications:
            dosage_recommendations.append(calculate_dosage(med, age, weight, gender))
        
        # Save to database
        conn = sqlite3.connect(DB_PATH, timeout=10)
        try:
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO diagnosis_history 
                (patient_id, symptoms, vital_signs, medical_history, diagnosis_result, 
                 confidence_score, treatment_plan, referral_needed, language)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                patient_id,
                symptoms,
                json.dumps(vital_signs),
                medical_history,
                json.dumps(diagnosis_result),
                diagnosis_result.get('confidence_score', 0),
                json.dumps(diagnosis_result.get('treatment_protocol', {})),
                diagnosis_result.get('referral_needed', False),
                language
            ))
            
            conn.commit()
        finally:
            conn.close()
        
        # Prepare response
        response_data = {
            'status': 'success',
            'diagnosis': diagnosis_result,
            'drug_interactions': drug_interactions,
            'dosage_recommendations': dosage_recommendations,
            'translations': TRANSLATIONS.get(language, TRANSLATIONS['en'])
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"⚠️ AI Model failed: {str(e)}")
        print("🔄 Switching to offline diagnosis")
        
        # Fallback to offline diagnosis
        diagnosis_result = offline_diagnosis(symptoms, vital_signs, medical_history, language)
        
        # Check drug interactions for offline result
        medications = []
        if 'treatment_protocol' in diagnosis_result and 'medications' in diagnosis_result['treatment_protocol']:
            medications = [med['name'] for med in diagnosis_result['treatment_protocol']['medications']]
        
        drug_interactions = check_drug_interactions(medications)
        
        # Calculate dosages for offline result
        dosage_recommendations = []
        for med in medications:
            dosage_recommendations.append(calculate_dosage(med, age, weight, gender))
            
        return jsonify({
            'status': 'success',
            'diagnosis': diagnosis_result,
            'drug_interactions': drug_interactions,
            'dosage_recommendations': dosage_recommendations,
            'translations': TRANSLATIONS.get(language, TRANSLATIONS['en']),
            'note': 'Offline mode (AI unavailable)'
        })

def offline_diagnosis(symptoms: str, vital_signs: Dict, medical_history: str, language: str) -> Dict:
    """Offline rule-based diagnosis for low connectivity scenarios"""
    symptoms_lower = symptoms.lower()
    
    # Initialize diagnosis structure
    diagnosis = {
        'primary_diagnosis': 'General Malaise - Requires Examination',
        'confidence_score': 0.3,
        'differential_diagnoses': [],
        'immediate_actions': ['Monitor vital signs', 'Ensure patient comfort', 'Maintain hydration'],
        'treatment_protocol': {
            'medications': [],
            'lifestyle_advice': ['Adequate rest', 'Drink plenty of fluids', 'Maintain hygiene'],
            'follow_up': '24-48 hours or if symptoms worsen'
        },
        'referral_needed': False,
        'referral_specialty': '',
        'red_flags': [],
        'patient_explanation': 'Based on the symptoms, please rest and monitor your condition. Consult a doctor if symptoms persist or worsen.'
    }
    
    # Get vital signs with safe conversion
    temp = safe_float(vital_signs.get('temperature'), 0)
    bp = vital_signs.get('blood_pressure', '')
    hr = safe_int(vital_signs.get('heart_rate'), 0)
    o2 = safe_int(vital_signs.get('oxygen_level'), 0)
    
    # Check for emergency conditions first
    if temp > 104 or (o2 and o2 < 90) or hr > 120:
        diagnosis['primary_diagnosis'] = 'Medical Emergency'
        diagnosis['confidence_score'] = 0.9
        diagnosis['referral_needed'] = True
        diagnosis['referral_specialty'] = 'Emergency Medicine'
        diagnosis['red_flags'] = ['Critical vital signs', 'Immediate medical attention required']
        diagnosis['immediate_actions'] = ['URGENT: Transfer to hospital immediately', 'Monitor continuously', 'Keep patient stable']
        diagnosis['patient_explanation'] = 'This is a medical emergency. Please seek immediate hospital care.'
        return diagnosis
    
    # Fever-related conditions
    if any(word in symptoms_lower for word in ['fever', 'बुखार', 'காய்ச்சல்', 'జ్వరం', 'জ্বর']):
        if temp > 103:
            # High fever - possible serious infection
            diagnosis['primary_diagnosis'] = 'High Fever - Possible Severe Infection'
            diagnosis['confidence_score'] = 0.75
            diagnosis['referral_needed'] = True
            diagnosis['referral_specialty'] = 'General Medicine'
            diagnosis['red_flags'] = ['High temperature (>103°F)', 'Risk of complications']
            diagnosis['immediate_actions'] = [
                'Tepid sponging to reduce fever',
                'Administer antipyretics',
                'Monitor temperature every 2 hours',
                'Ensure adequate hydration'
            ]
            diagnosis['treatment_protocol']['medications'] = [
                {'name': 'Paracetamol', 'dosage': '500-1000mg', 'frequency': 'Every 6 hours', 'duration': '3-5 days'},
                {'name': 'ORS', 'dosage': '200-400ml', 'frequency': 'After each episode of sweating', 'duration': 'Until fever subsides'}
            ]
            
            # Check for dengue/malaria symptoms
            if any(word in symptoms_lower for word in ['joint pain', 'rash', 'bleeding', 'headache behind eyes']):
                diagnosis['differential_diagnoses'].append({
                    'condition': 'Dengue Fever',
                    'probability': 0.6,
                    'reasoning': 'High fever with joint pain/rash suggests dengue'
                })
                diagnosis['immediate_actions'].append('Blood test for dengue/malaria recommended')
            
            if any(word in symptoms_lower for word in ['chills', 'shivering', 'sweating']):
                diagnosis['differential_diagnoses'].append({
                    'condition': 'Malaria',
                    'probability': 0.5,
                    'reasoning': 'Fever with chills and sweating pattern'
                })
                diagnosis['immediate_actions'].append('Blood smear for malaria parasites')
                
        elif temp >= 100:
            # Moderate fever
            diagnosis['primary_diagnosis'] = 'Fever - Likely Viral Infection'
            diagnosis['confidence_score'] = 0.7
            diagnosis['treatment_protocol']['medications'] = [
                {'name': 'Paracetamol', 'dosage': '500mg', 'frequency': 'Every 6-8 hours', 'duration': '3-5 days'}
            ]
            diagnosis['differential_diagnoses'].append({
                'condition': 'Viral Fever',
                'probability': 0.7,
                'reasoning': 'Moderate fever without severe symptoms'
            })
    
    # Respiratory symptoms
    if any(word in symptoms_lower for word in ['cough', 'cold', 'खांसी', 'सर्दी', 'இருமல்', 'దగ్గు', 'কাশি']):
        if any(word in symptoms_lower for word in ['difficulty breathing', 'chest pain', 'shortness of breath']):
            diagnosis['primary_diagnosis'] = 'Lower Respiratory Tract Infection - Possible Pneumonia'
            diagnosis['confidence_score'] = 0.7
            diagnosis['referral_needed'] = True
            diagnosis['referral_specialty'] = 'Pulmonology/General Medicine'
            diagnosis['red_flags'] = ['Breathing difficulty', 'Possible pneumonia']
            diagnosis['treatment_protocol']['medications'] = [
                {'name': 'Amoxicillin', 'dosage': '500mg', 'frequency': '3 times daily', 'duration': '5-7 days'},
                {'name': 'Paracetamol', 'dosage': '500mg', 'frequency': 'Every 6 hours for fever', 'duration': '3-5 days'}
            ]
        else:
            diagnosis['primary_diagnosis'] = 'Upper Respiratory Tract Infection (Common Cold)'
            diagnosis['confidence_score'] = 0.75
            diagnosis['treatment_protocol']['medications'] = [
                {'name': 'Cetirizine', 'dosage': '10mg', 'frequency': 'Once daily', 'duration': '3-5 days'},
                {'name': 'Steam inhalation', 'dosage': '2-3 times', 'frequency': 'Daily', 'duration': '5 days'}
            ]
            diagnosis['differential_diagnoses'].append({
                'condition': 'Common Cold',
                'probability': 0.8,
                'reasoning': 'Typical cold symptoms without severe features'
            })
    
    # Gastrointestinal symptoms
    if any(word in symptoms_lower for word in ['diarrhea', 'diarrhoea', 'loose stool', 'vomiting', 'दस्त', 'उल्टी', 'வயிற்றுப்போக்கு', 'విరేచనాలు', 'ডায়রিয়া']):
        diagnosis['primary_diagnosis'] = 'Acute Gastroenteritis'
        diagnosis['confidence_score'] = 0.75
        diagnosis['immediate_actions'] = [
            'Start ORS immediately',
            'Monitor for dehydration signs',
            'Avoid solid food initially',
            'Maintain hand hygiene'
        ]
        diagnosis['treatment_protocol']['medications'] = [
            {'name': 'ORS (Oral Rehydration Solution)', 'dosage': '200-400ml', 'frequency': 'After each loose stool', 'duration': 'Until diarrhea stops'},
            {'name': 'Zinc supplements', 'dosage': '20mg', 'frequency': 'Once daily', 'duration': '10-14 days'}
        ]
        diagnosis['treatment_protocol']['lifestyle_advice'] = [
            'Drink plenty of fluids (ORS, coconut water, rice water)',
            'Eat bland foods (rice, banana, toast)',
            'Avoid dairy, spicy, and oily foods',
            'Maintain strict hand hygiene'
        ]
        
        if 'blood' in symptoms_lower or 'severe' in symptoms_lower:
            diagnosis['referral_needed'] = True
            diagnosis['red_flags'] = ['Blood in stool', 'Severe dehydration risk']
            diagnosis['treatment_protocol']['medications'].append(
                {'name': 'Antibiotic (Ciprofloxacin)', 'dosage': '500mg', 'frequency': 'Twice daily', 'duration': '3-5 days'}
            )
    
    # Headache
    if any(word in symptoms_lower for word in ['headache', 'head pain', 'सिरदर्द', 'தலைவலி', 'తలనొప్పి', 'মাথাব্যথা']):
        if any(word in symptoms_lower for word in ['severe', 'worst', 'sudden', 'vision', 'confusion']):
            diagnosis['primary_diagnosis'] = 'Severe Headache - Requires Evaluation'
            diagnosis['confidence_score'] = 0.6
            diagnosis['referral_needed'] = True
            diagnosis['red_flags'] = ['Severe headache', 'Neurological symptoms possible']
        else:
            diagnosis['primary_diagnosis'] = 'Tension Headache'
            diagnosis['confidence_score'] = 0.65
            diagnosis['treatment_protocol']['medications'] = [
                {'name': 'Paracetamol', 'dosage': '500mg', 'frequency': 'Every 6 hours as needed', 'duration': '2-3 days'}
            ]
            diagnosis['treatment_protocol']['lifestyle_advice'].extend([
                'Rest in a quiet, dark room',
                'Apply cold compress to forehead',
                'Avoid screen time',
                'Ensure adequate sleep'
            ])
    
    # Diabetes symptoms
    if any(word in symptoms_lower for word in ['excessive thirst', 'frequent urination', 'weight loss', 'fatigue', 'blurred vision']):
        diagnosis['primary_diagnosis'] = 'Possible Diabetes - Screening Required'
        diagnosis['confidence_score'] = 0.6
        diagnosis['referral_needed'] = True
        diagnosis['referral_specialty'] = 'Endocrinology/General Medicine'
        diagnosis['immediate_actions'] = [
            'Fasting blood sugar test',
            'HbA1c test',
            'Monitor symptoms',
            'Dietary modifications'
        ]
        diagnosis['differential_diagnoses'].append({
            'condition': 'Type 2 Diabetes Mellitus',
            'probability': 0.6,
            'reasoning': 'Classic diabetes symptoms present'
        })
    
    # Hypertension symptoms
    if bp and '/' in bp:
        try:
            systolic = int(bp.split('/')[0])
            if systolic > 140:
                diagnosis['primary_diagnosis'] = 'Hypertension - Requires Management'
                diagnosis['confidence_score'] = 0.8
                diagnosis['referral_needed'] = True
                diagnosis['red_flags'] = ['Elevated blood pressure']
                diagnosis['immediate_actions'] = [
                    'Rest and recheck BP after 15 minutes',
                    'Reduce salt intake',
                    'Avoid stress',
                    'Regular BP monitoring'
                ]
        except:
            pass
    
    # Body ache/pain
    if any(word in symptoms_lower for word in ['body ache', 'body pain', 'muscle pain', 'शरीर दर्द', 'உடல் வலி']):
        if diagnosis['primary_diagnosis'] == 'General Malaise - Requires Examination':
            diagnosis['primary_diagnosis'] = 'Viral Myalgia (Body Ache)'
            diagnosis['confidence_score'] = 0.6
            diagnosis['treatment_protocol']['medications'] = [
                {'name': 'Paracetamol', 'dosage': '500mg', 'frequency': 'Every 8 hours', 'duration': '3-5 days'}
            ]
    
    # Add general patient explanation based on language
    if language == 'hi':
        diagnosis['patient_explanation'] = f'{diagnosis["primary_diagnosis"]} का निदान किया गया है। कृपया आराम करें और दवाएं समय पर लें। यदि लक्षण बिगड़ते हैं तो तुरंत डॉक्टर से संपर्क करें।'
    elif language == 'ta':
        diagnosis['patient_explanation'] = f'{diagnosis["primary_diagnosis"]} கண்டறியப்பட்டுள்ளது. தயவுசெய்து ஓய்வெடுத்து மருந்துகளை சரியாக எடுத்துக்கொள்ளுங்கள். அறிகுறிகள் மோசமானால் உடனடியாக மருத்துவரை அணுகவும்.'
    elif language == 'te':
        diagnosis['patient_explanation'] = f'{diagnosis["primary_diagnosis"]} నిర్ధారించబడింది. దయచేసి విశ్రాంతి తీసుకోండి మరియు మందులను సమయానికి తీసుకోండి. లక్షణాలు తీవ్రమైతే వెంటనే వైద్యుడిని సంప్రదించండి.'
    elif language == 'bn':
        diagnosis['patient_explanation'] = f'{diagnosis["primary_diagnosis"]} নির্ণয় করা হয়েছে। অনুগ্রহ করে বিশ্রাম নিন এবং সময়মতো ওষুধ খান। লক্ষণ খারাপ হলে অবিলম্বে ডাক্তারের সাথে যোগাযোগ করুন।'
    else:
        diagnosis['patient_explanation'] = f'Based on your symptoms, you have been diagnosed with {diagnosis["primary_diagnosis"]}. Please rest, take medications as prescribed, and monitor your symptoms. Seek immediate medical attention if symptoms worsen.'
    
    return diagnosis

@app.route('/api/patient/history/<patient_id>', methods=['GET'])
def get_patient_history(patient_id):
    """Get patient diagnosis history"""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=10)
        try:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM diagnosis_history 
                WHERE patient_id = ? 
                ORDER BY created_at DESC
            ''', (patient_id,))
            
            rows = cursor.fetchall()
        finally:
            conn.close()
        
        history = []
        for row in rows:
            history.append({
                'id': row[0],
                'symptoms': row[2],
                'diagnosis': json.loads(row[5]),
                'confidence_score': row[6],
                'referral_needed': row[8],
                'date': row[10]
            })
        
        return jsonify({'status': 'success', 'history': history})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/drug-interactions/check', methods=['POST'])
def check_interactions():
    """Check drug interactions endpoint"""
    data = request.json
    medications = data.get('medications', [])
    
    interactions = check_drug_interactions(medications)
    
    return jsonify({
        'status': 'success',
        'interactions': interactions,
        'safe': len(interactions) == 0
    })

@app.route('/api/dosage/calculate', methods=['POST'])
def calculate_dosage_endpoint():
    """Calculate dosage based on patient demographics"""
    data = request.json
    
    medication = data.get('medication')
    age = data.get('age', 30)
    weight = data.get('weight', 60)
    gender = data.get('gender', 'unknown')
    
    dosage = calculate_dosage(medication, age, weight, gender)
    
    return jsonify({
        'status': 'success',
        'dosage': dosage
    })

if __name__ == '__main__':
    print("🏥 Medical Diagnosis Assistant Backend Starting...")
    print(f"📊 Database: {DB_PATH}")
    print(f"🤖 AI Model: {'Gemini Pro (Online)' if model else 'Offline Mode'}")
    print("🌐 Server running on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
