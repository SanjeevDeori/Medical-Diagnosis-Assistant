# Quick Start Guide - Medical Diagnosis Assistant

## 🚀 5-Minute Quick Start

### Step 1: Setup (One-time)
```powershell
# Navigate to project directory
cd medical-diagnosis-assistant

# Run automated setup
.\setup.ps1
```

### Step 2: Get Gemini API Key (Optional but Recommended)
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key
5. Open `backend/.env` in a text editor
6. Replace `your_gemini_api_key_here` with your actual key
7. Save the file

**Note**: Without API key, system works in offline mode with rule-based diagnosis.

### Step 3: Start Backend
```powershell
cd backend
venv\Scripts\activate
python app.py
```

You should see:
```
🏥 Medical Diagnosis Assistant Backend Starting...
📊 Database: ../data/medical_assistant.db
🤖 AI Model: Gemini Pro (Online)
🌐 Server running on http://localhost:5000
```

### Step 4: Open Frontend
1. Open a new terminal/command prompt
2. Navigate to `medical-diagnosis-assistant/frontend`
3. Double-click `index.html` OR run:
   ```powershell
   start index.html
   ```

### Step 5: Test the System

**Sample Patient Data:**
- **Patient ID**: P001
- **Name**: Ramesh Kumar
- **Age**: 45
- **Weight**: 70
- **Gender**: Male

**Sample Symptoms:**
```
Patient has fever (102°F) for 3 days, severe headache, body ache, and fatigue. 
No cough or cold symptoms.
```

**Vital Signs:**
- Temperature: 102
- Blood Pressure: 130/85
- Heart Rate: 88
- Oxygen Level: 97

**Medical History:**
```
No known allergies. Diabetic (controlled with Metformin 500mg).
```

Click "Analyze & Diagnose" and wait for results!

## 📱 Using the Interface

### Language Selection
- Click the language dropdown in the header
- Select your preferred language
- Interface labels will update automatically

### Patient Registration
1. Enter unique Patient ID
2. Fill in patient details
3. System auto-saves on first diagnosis

### Recording Symptoms
- Type symptoms in any language
- Be specific and detailed
- Include duration and severity

### Vital Signs
- Enter available measurements
- Leave blank if not measured
- System works with partial data

### Understanding Results

**Confidence Score**: 
- 80-100%: High confidence
- 60-79%: Moderate confidence
- Below 60%: Low confidence, consider referral

**Differential Diagnoses**:
- Alternative possible conditions
- Ranked by probability
- Use for comprehensive evaluation

**Treatment Protocol**:
- Immediate medications
- Dosage adjusted for age/weight
- Lifestyle recommendations
- Follow-up timeline

**Drug Interactions**:
- ⚠️ Warning if interactions detected
- ✅ Safe if no interactions
- Review before prescribing

**Referral Needed**:
- Red alert if specialist required
- Specialty recommendation provided
- Immediate action required

## 🔧 Troubleshooting

### "Server Offline" message
**Solution**: Start the backend server
```powershell
cd backend
venv\Scripts\activate
python app.py
```

### "AI Model Offline" message
**Solution**: Add Gemini API key to `.env` file
- System still works in offline mode
- For AI-powered diagnosis, add API key

### Database errors
**Solution**: Ensure data directory exists
```powershell
mkdir data
```

### Port 5000 already in use
**Solution**: Change port in `backend/app.py`
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```
Also update `frontend/app.js`:
```javascript
const API_BASE_URL = 'http://localhost:5001/api';
```

## 💡 Tips for Best Results

### Symptom Description
✅ Good: "High fever (103°F) for 2 days, severe headache, vomiting 3 times, no appetite"
❌ Poor: "Not feeling well"

### Medical History
Include:
- Current medications
- Known allergies
- Chronic conditions
- Recent illnesses
- Surgeries

### Vital Signs
- Measure accurately
- Record time of measurement
- Note any abnormalities

### Language Support
- Type symptoms in patient's language
- System understands multilingual input
- Results shown in selected language

## 📊 Sample Test Cases

### Case 1: Fever with Headache
```
Symptoms: High fever 103°F, severe headache, body pain, fatigue
Temperature: 103
Expected: Viral fever or Dengue (if endemic area)
```

### Case 2: Respiratory Infection
```
Symptoms: Cough, cold, mild fever, sore throat
Temperature: 99.5
Expected: Upper Respiratory Tract Infection
```

### Case 3: Gastroenteritis
```
Symptoms: Diarrhea 5 times, vomiting, stomach pain, dehydration
Expected: Acute Gastroenteritis, ORS recommendation
```

### Case 4: Diabetes Symptoms
```
Symptoms: Excessive thirst, frequent urination, fatigue, weight loss
Expected: Diabetes screening recommendation
```

## 🌐 Offline Mode

When internet is unavailable:
1. System automatically detects
2. Switches to rule-based diagnosis
3. Provides basic treatment protocols
4. Saves data for later sync
5. Status shows "Offline Mode"

**Offline Capabilities**:
- ✅ Symptom analysis
- ✅ Basic diagnosis
- ✅ Treatment suggestions
- ✅ Drug interaction checks
- ✅ Patient history
- ❌ Advanced AI analysis
- ❌ Complex differential diagnosis

## 📞 Getting Help

1. **Check README.md** for detailed documentation
2. **Review API logs** in terminal for errors
3. **Browser Console** (F12) for frontend errors
4. **Test with sample data** to verify setup

## 🎯 Next Steps

After successful setup:
1. **Customize drug database** with local medications
2. **Add regional diseases** to knowledge base
3. **Train staff** on system usage
4. **Set up backup** procedures
5. **Monitor performance** and accuracy

---

**Ready to start? Run `.\setup.ps1` and follow the steps above!** 🚀
