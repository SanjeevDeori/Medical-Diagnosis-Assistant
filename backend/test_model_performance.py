
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sklearn.metrics import classification_report, confusion_matrix
import pandas as pd
import numpy as np

MODEL_PATH = "model/biobert_finetuned"
DATA_PATH = "data/training_data.csv"

def evaluate_model():
    try:
        print("Loading model for evaluation...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
        
        # Load labels
        import json
        with open(f"{MODEL_PATH}/label_map.json", 'r') as f:
            label_map = json.load(f)
        inv_label_map = {v: k for k, v in label_map.items()}
        
        # Load test data (using training data for demo purposes if no separate test set)
        df = pd.read_csv(DATA_PATH)
        
        print("Running predictions...")
        y_true = []
        y_pred = []
        
        for _, row in df.iterrows():
            text = row['symptoms']
            true_label = row['disease']
            
            inputs = tokenizer(
                text, 
                return_tensors="pt", 
                truncation=True, 
                padding=True, 
                max_length=128
            )
            
            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits
                pred_idx = torch.argmax(logits, dim=1).item()
                pred_label = inv_label_map[pred_idx]
                
            y_true.append(true_label)
            y_pred.append(pred_label)
            
        print("\nClassification Report:")
        print(classification_report(y_true, y_pred))
        
    except Exception as e:
        print(f"Evaluation failed: {e}")
        print("Ensure you have trained the model first using train_biobert.py")

if __name__ == "__main__":
    evaluate_model()
