
import torch
from torch.utils.data import DataLoader, Dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from torch.optim import AdamW
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np
import os

# Configuration
MODEL_NAME = "dmis-lab/biobert-v1.1"
MAX_LEN = 128
BATCH_SIZE = 16
EPOCHS = 3
LEARNING_RATE = 2e-5
DATA_PATH = "data/expanded_training_data.csv"
OUTPUT_DIR = "model/biobert_finetuned"

class DiagnosisDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len, label_map):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len
        self.label_map = label_map

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, item):
        text = str(self.texts[item])
        label_name = self.labels[item]
        label = self.label_map[label_name]

        encoding = self.tokenizer.encode_plus(
            text,
            add_special_tokens=True,
            max_length=self.max_len,
            return_token_type_ids=False,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt',
        )

        return {
            'text': text,
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

def train_model():
    print(f"Starting training with {MODEL_NAME}...")
    
    # Create output directory
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Load Data
    if not os.path.exists(DATA_PATH):
        print(f"Error: {DATA_PATH} not found. Please create dummy data first.")
        return

    df = pd.read_csv(DATA_PATH)
    
    # Create label mapping
    unique_labels = df['disease'].unique()
    label_map = {label: i for i, label in enumerate(unique_labels)}
    
    # Save label map
    import json
    with open(os.path.join(OUTPUT_DIR, 'label_map.json'), 'w') as f:
        json.dump(label_map, f)

    # Split data
    df_train, df_val = train_test_split(df, test_size=0.2, random_state=42)

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME, 
        num_labels=len(unique_labels)
    )

    train_dataset = DiagnosisDataset(
        df_train['symptoms'].to_numpy(),
        df_train['disease'].to_numpy(),
        tokenizer,
        MAX_LEN,
        label_map
    )

    val_dataset = DiagnosisDataset(
        df_val['symptoms'].to_numpy(),
        df_val['disease'].to_numpy(),
        tokenizer,
        MAX_LEN,
        label_map
    )

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("Device:", device)
    model = model.to(device)
    optimizer = AdamW(model.parameters(), lr=LEARNING_RATE)

    print("Starting training loop...")
    # Training Loop
    for epoch in range(EPOCHS):
        print(f"Epoch {epoch+1}/{EPOCHS} starting...")
        model.train()
        total_loss = 0
        batch_idx = 0
        for batch in train_loader:
            if batch_idx % 5 == 0:
                print(f"Processing batch {batch_idx}...")
            batch_idx += 1
            
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )

            loss = outputs.loss
            total_loss += loss.item()

            loss.backward()
            optimizer.step()
            optimizer.zero_grad()

        avg_train_loss = total_loss / len(train_loader)
        print(f"Epoch {epoch+1}/{EPOCHS} - Average Training Loss: {avg_train_loss:.4f}")

    # Save Model
    print(f"Saving model to {OUTPUT_DIR}...")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print("Training complete!")

if __name__ == "__main__":
    train_model()
