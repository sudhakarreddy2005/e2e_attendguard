import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import get_db

def migrate_student_stats():
    db = get_db()
    
    print(f"Connected to DB: {db.name}")
    print("Starting migration to flat counters...")
    
    students = db.students.find({})
    count_updated = 0
    count_skipped = 0
    
    for student in students:
        _id = student["_id"]
        
        # Check if already migrated
        if all(key in student for key in ["violations_count", "late_count", "bunk_count", "dress_code_count"]):
            # Also optionally remove 'stats' if it stuck around
            if "stats" in student:
                db.students.update_one({"_id": _id}, {"$unset": {"stats": ""}})
                print(f"Student {_id} already has counts, removed old nested stats.")
            else:
                count_skipped += 1
            continue
            
        # Migrate data
        # If they had nested stats previously:
        old_stats = student.get("stats", {})
        old_types = old_stats.get("types", {})
        
        updates = {
            "$set": {
                "violations_count": old_stats.get("total", 0),
                "late_count": old_types.get("late_arrival", 0),
                "bunk_count": old_types.get("bunk", 0),
                "dress_code_count": old_types.get("dress_code", 0)
            },
            "$unset": {
                "stats": ""
            }
        }
        
        db.students.update_one({"_id": _id}, updates)
        count_updated += 1
        print(f"Updated student: {student.get('roll_no', 'unknown')} ({_id})")
        
    print(f"Migration complete. Updated: {count_updated}, Skipped (already valid): {count_skipped}")

if __name__ == "__main__":
    migrate_student_stats()
