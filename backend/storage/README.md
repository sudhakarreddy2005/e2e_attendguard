# Storage Structure

## Overview
The storage folder is organized into two separate directories to ensure data integrity and model accuracy:

```
backend/storage/
├── training/     ← Student registration images (used to train LBPH model)
├── uploads/      ← Captured violation images (used only for matching and reporting)
├── 
└── labels.json   ← Label-to-student_id mapping
```

## Folder Purposes

### `training/` (Registration Images)
- **Purpose**: Store registered student face images used for training the LBPH face recognizer
- **Content**: Clean, curated student photos taken at registration time
- **Naming**: `<student_id>_<filename>` (e.g., `23BQ1A05A9_photo.jpg`)
- **Usage**: 
  - Training: `train_lbph.py` reads from this folder and trains the model
  - Never used for testing or matching (prevents overfitting)
- **Access**: Controlled via admin interface (student registration)

### `uploads/` (Captured Images)
- **Purpose**: Store images captured by security personnel during bunk checking
- **Content**: Real-world photos taken at gates, corridors, classrooms
- **Naming**: `capture_<timestamp>_<filename>` (e.g., `capture_1704931200.5_gate.jpg`)
- **Usage**:
  - Matching: `/match` endpoint loads a trained model and matches against this folder's images
  - Audit trail: Maintains a record of all matching attempts
  - Reporting: Evidence for violation records
- **Access**: Security personnel upload images via the app's Detect page

## Why Separate?

**Problem**: Mixing training and testing data leads to:
- Overfitting: Model memorizes training samples instead of learning generalizable patterns
- Inflated accuracy: Test accuracy appears higher than real-world accuracy
- Poor real-world performance: System fails on unseen images

**Solution**: 
- Train LBPH on `storage/training/` (registered student images only)
- Evaluate LBPH on `storage/uploads/` (captured images from live bunk checking)
- This separation ensures honest assessment and reliable matching accuracy

### Reference
See: https://en.wikipedia.org/wiki/Training,_validation,_and_test_sets

## Workflow

```
1. REGISTRATION (Admin)
   └─> Upload student face image
       └─> Saved to storage/training/
           └─> Used to train LBPH model

2. TRAINING
   └─> python train_lbph.py
       └─> Reads all images from storage/training/
           └─> Trains LBPH recognizer
               └─> Saves model.yml, labels.json

3. BUNK DETECTION (Security)
   └─> Upload captured image via Detect page
       └─> Saved to storage/uploads/
           └─> /match endpoint loads trained model
               └─> Predicts student identity
                   └─> Records violation if matched

4. AUDIT
   └─> storage/uploads/ maintains a complete history
       └─> Useful for compliance and appeal reviews
```

## Migration (One-time)

If you have existing images in a flat `storage/` folder, run:

```bash
python migrate_storage.py
```

This will:
1. Create `training/` and `uploads/` subfolders
2. Move all existing images to `training/` (assumes they are student registration images)
3. Preserve folder structure for backward compatibility

## Access Patterns

| Operation | Reads From | Writes To |
|-----------|-----------|-----------|
| Register student | - | `training/` |
| Train LBPH model | `training/` | `model.yml`, `labels.json` |
| Upload capture | - | `uploads/` |
| Match image | `model.yml`, `labels.json` | `uploads/` (audit copy) |
| View violations | `uploads/` | - |

## Maintenance

- **Training images**: Grow over time as new students are registered
- **Upload images**: Grow continuously during operation; consider cleanup policies
- **Model**: Retrain periodically (e.g., weekly) to include newly registered students
