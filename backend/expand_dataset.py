
import pandas as pd
import random

# Simple augmentation by shuffling words and adding noise
def augment_text(text):
    words = text.split()
    if len(words) > 3:
        random.shuffle(words)
    return ' '.join(words)

def expand_dataset():
    input_file = 'data/training_data.csv'
    output_file = 'data/expanded_training_data.csv'
    
    try:
        df = pd.read_csv(input_file)
        print(f"Original dataset size: {len(df)}")
        
        new_rows = []
        for _, row in df.iterrows():
            # Create 3 variations for each existing row
            for _ in range(3):
                new_rows.append({
                    'symptoms': augment_text(row['symptoms']),
                    'disease': row['disease']
                })
        
        augmented_df = pd.DataFrame(new_rows)
        final_df = pd.concat([df, augmented_df], ignore_index=True)
        
        print(f"Expanded dataset size: {len(final_df)}")
        final_df.to_csv(output_file, index=False)
        print(f"Saved to {output_file}")
        
    except Exception as e:
        print(f"Error expanding dataset: {e}")

if __name__ == "__main__":
    expand_dataset()
