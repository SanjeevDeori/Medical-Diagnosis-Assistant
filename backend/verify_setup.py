
import sys
import pkg_resources

def check_requirements():
    required = {
        'flask', 
        'torch', 
        'transformers', 
        'numpy', 
        'pandas', 
        'scikit-learn'
    }
    
    installed = {pkg.key for pkg in pkg_resources.working_set}
    missing = required - installed
    
    if missing:
        print(f"❌ Missing requirements: {', '.join(missing)}")
        print("Run: pip install -r requirements.txt")
        return False
    else:
        print("✅ All core requirements installed.")
        return True

def check_gpu():
    try:
        import torch
        if torch.cuda.is_available():
            print(f"✅ GPU available: {torch.cuda.get_device_name(0)}")
        else:
            print("⚠️ GPU not available. Training will be slow on CPU.")
    except ImportError:
        print("❌ Torch not installed.")

if __name__ == "__main__":
    print("Verifying Setup...")
    check_requirements()
    check_gpu()
