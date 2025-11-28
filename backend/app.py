
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime

from inference import biobert 
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
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# Database setup
DB_NAME = 'medical_data.db'

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # Patients table
    c.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            contact TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Diagnosis history table
    c.execute('''
        CREATE TABLE IF NOT EXISTS diagnosis_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            symptoms TEXT,
            diagnosis TEXT,
            confidence REAL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_available': True, # BioBERT is always available locally
        'database': 'connected'
    })

@app.route('/api/patients', methods=['POST'])
def register_patient():
    data = request.json
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute('''
            INSERT OR REPLACE INTO patients (id, name, age, gender, contact)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['patient_id'], data['name'], data['age'], data['gender'], data.get('contact', '')))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success', 'message': 'Patient registered'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/history/<patient_id>', methods=['GET'])
def get_history(patient_id):
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute('''
            SELECT diagnosis, confidence, timestamp 
            FROM diagnosis_history 
            WHERE patient_id = ? 
            ORDER BY timestamp DESC
        ''', (patient_id,))
        rows = c.fetchall()
        conn.close()
        
        history = [{
            'diagnosis': r[0],
            'confidence': r[1],
            'date': r[2]
        } for r in rows]
        
        return jsonify({'status': 'success', 'history': history})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/diagnose', methods=['POST'])
def diagnose():
    data = request.json
    symptoms = data.get('symptoms', '')
    patient_id = data.get('patient_id')
    
    if not symptoms:
        return jsonify({'status': 'error', 'message': 'No symptoms provided'}), 400

    try:
        # 1. Run BioBERT Inference
        print(f"Running BioBERT diagnosis for: {symptoms}")
        prediction = biobert.predict(symptoms)
        
        primary_diagnosis = prediction['disease']
        confidence = prediction['confidence']

        # 2. Generate structured response (simulating full medical report)
        # In a real system, another model might generate the text. 
        # Here we use templates based on the diagnosis.
        
        response_data = {
            'primary_diagnosis': primary_diagnosis,
            'confidence_score': round(confidence * 100, 1),
            'differential_diagnoses': [
                {'condition': 'Viral Infection', 'probability': '15%'},
                {'condition': 'Bacterial Infection', 'probability': '10%'}
            ],
            'treatment_protocol': {
                'medications': [
                    {'name': 'Symptomatic relief', 'dosage': 'As needed', 'duration': '3-5 days'}
                ],
                'lifestyle_advice': [
                    'Rest and hydration',
                    'Monitor temperature',
                    'Nutritious diet'
                ]
            },
            'immediate_actions': [
                'Monitor symptoms',
                'Consult doctor if worsens'
            ],
            'red_flags': [
                'High fever > 103F',
                'Difficulty breathing'
            ],
            'referral_needed': confidence < 0.6,
            'patient_explanation': f"Based on analysis of '{symptoms}', the BioBERT model indicates {primary_diagnosis} with {round(confidence*100)}% confidence."
        }

        # 3. Save to History
        if patient_id:
            conn = sqlite3.connect(DB_NAME)
            c = conn.cursor()
            c.execute('''
                INSERT INTO diagnosis_history (patient_id, symptoms, diagnosis, confidence)
                VALUES (?, ?, ?, ?)
            ''', (patient_id, symptoms, primary_diagnosis, confidence))
            conn.commit()
            conn.close()

        return jsonify({
            'status': 'success',
            'diagnosis': response_data
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    # Ensure data directory exists
    if not os.path.exists('data'):
        os.makedirs('data')
        
    print("Starting MedAssist AI Backend (BioBERT Local)...")
    app.run(debug=True, port=5000)
