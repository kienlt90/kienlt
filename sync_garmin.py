import os
import sys
import json
import datetime
from garminconnect import Garmin

# Reconfigure stdout to use UTF-8 on Windows
sys.stdout.reconfigure(encoding='utf-8')

# File Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "garmin_config.json")
DATA_PATH = os.path.join(BASE_DIR, "swimming_data.json")
SESSION_TOKEN_PATH = os.path.join(BASE_DIR, "garmin_session.json")

def format_pace(duration_seconds, distance_meters):
    if not distance_meters or distance_meters <= 0:
        return "0:00"
    # Pace in seconds per 100m
    pace_sec = duration_seconds / (distance_meters / 100.0)
    minutes = int(pace_sec // 60)
    seconds = int(pace_sec % 60)
    return f"{minutes}:{seconds:02d}"

def sync():
    # 1. Load Credentials
    if not os.path.exists(CONFIG_PATH):
        print(f"⚠️ Không tìm thấy file cấu hình: {CONFIG_PATH}")
        print("Vui lòng tạo file garmin_config.json với nội dung:")
        print('{\n  "email": "email_cua_ban@gmail.com",\n  "password": "mat_khau_cua_ban"\n}')
        return False
        
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            config = json.load(f)
        email = config.get("email")
        password = config.get("password")
    except Exception as e:
        print(f"❌ Lỗi đọc file cấu hình: {e}")
        return False
        
    if not email or not password or "YOUR_" in email:
        print("⚠️ Vui lòng điền email và password thực tế vào file garmin_config.json!")
        return False
        
    print(f"🔌 Đang kết nối tới Garmin Connect cho tài khoản: {email}...")
    
    # 2. Authenticate
    api = None
    try:
        # Try loading token from session file to avoid logging in every time
        token_data = None
        if os.path.exists(SESSION_TOKEN_PATH):
            try:
                with open(SESSION_TOKEN_PATH, "r") as token_file:
                    token_data = json.load(token_file)
            except Exception:
                pass
                
        if token_data:
            # Login using token
            api = Garmin()
            api.login(token_data)
            print("🔑 Đăng nhập thành công bằng Session Token cũ.")
        else:
            # Normal login
            api = Garmin(email, password)
            api.login()
            # Save token
            token_store = api.garth.dump()
            with open(SESSION_TOKEN_PATH, "w") as token_file:
                json.dump(token_store, token_file)
            print("🔑 Đăng nhập thành công và lưu Session Token mới.")
    except Exception as e:
        print(f"❌ Lỗi đăng nhập Garmin Connect: {e}")
        # If token was bad, delete it and try again
        if os.path.exists(SESSION_TOKEN_PATH):
            os.remove(SESSION_TOKEN_PATH)
        return False

    # 3. Fetch activities (Last 90 days)
    try:
        today = datetime.date.today()
        start_date = today - datetime.timedelta(days=90)
        print(f"📅 Đang quét hoạt động bơi lội từ {start_date.isoformat()} đến hôm nay...")
        
        raw_activities = api.get_activities_by_date(
            start_date.isoformat(), 
            today.isoformat()
        )
    except Exception as e:
        print(f"❌ Lỗi tải dữ liệu hoạt động: {e}")
        return False

    # 4. Filter and process swim activities
    swim_list = []
    for act in raw_activities:
        # Check activity type
        act_type = act.get("activityType", {}).get("typeKey", "").lower()
        if "swimming" not in act_type:
            continue
            
        dist = act.get("distance", 0.0) # in meters
        dur = act.get("duration", 0.0) # in seconds
        
        # Calculate Pace
        pace_str = format_pace(dur, dist)
        
        # SWOLF (usually averageSwolf in Garmin data)
        avg_swolf = act.get("averageSwolf")
        if avg_swolf is None:
            # Try from attributes if nested
            avg_swolf = act.get("avgSwolf")
            
        # Heart Rate
        avg_hr = act.get("averageHR")
        max_hr = act.get("maxHR")
        
        # Strokes
        avg_strokes = act.get("averageStrokes")
        
        swim_session = {
            "id": act.get("activityId"),
            "name": act.get("activityName", "Bơi lội"),
            "startTime": act.get("startTimeLocal"), # e.g. "2026-06-15 07:30:00"
            "distance": round(dist, 1),
            "duration": round(dur, 1),
            "calories": round(act.get("calories", 0.0), 1),
            "avgPace": pace_str,
            "avgSwolf": avg_swolf,
            "avgHr": avg_hr,
            "maxHr": max_hr,
            "strokes": avg_strokes
        }
        swim_list.append(swim_session)

    # Sort by start time descending
    swim_list.sort(key=lambda x: x["startTime"], reverse=True)
    
    # 5. Write to File
    try:
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(swim_list, f, indent=4, ensure_ascii=False)
        print(f"📊 Đã cập nhật thành công {len(swim_list)} buổi bơi lội vào {DATA_PATH}!")
        return True
    except Exception as e:
        print(f"❌ Lỗi lưu dữ liệu bơi lội: {e}")
        return False

if __name__ == "__main__":
    success = sync()
    sys.exit(0 if success else 1)
