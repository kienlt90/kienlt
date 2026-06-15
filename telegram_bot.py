import os
import re
import sys
import json
import subprocess
import telebot
from telebot import types

sys.stdout.reconfigure(encoding='utf-8')

# ----------------------------------------------------------------------
# CONFIGURATION
# ----------------------------------------------------------------------
# Replace this with your bot token obtained from @BotFather, 
# or set the TELEGRAM_BOT_TOKEN environment variable.
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8226594395:AAFd-FhOxxtmhyP4j9D5qz937A1TsK1sfmo")
HTML_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "contracts.html")
HISL2_CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hisl2_config.json")
ATTT_CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "thi_attt_f12.json")

# Load HIS L2 config data into memory
_hisl2_data = []
try:
    with open(HISL2_CONFIG_PATH, "r", encoding="utf-8") as _f:
        _raw = json.load(_f)
        for _sheet in _raw.values():
            _hisl2_data.extend(_sheet)
    print(f"✅ Loaded {len(_hisl2_data)} HIS L2 config entries")
except Exception as _e:
    print(f"⚠️ Could not load hisl2_config.json: {_e}")

# Load ATTT data into memory
_attt_data = []
try:
    with open(ATTT_CONFIG_PATH, "r", encoding="utf-8") as _f:
        _attt_data = json.load(_f)
    print(f"✅ Loaded {len(_attt_data)} ATTT exam entries")
except Exception as _e:
    print(f"⚠️ Could not load thi_attt_f12.json: {_e}")

if BOT_TOKEN == "YOUR_TELEGRAM_BOT_TOKEN_HERE":
    print("WARNING: Please set your TELEGRAM_BOT_TOKEN in the script or environment variable.")

bot = telebot.TeleBot(BOT_TOKEN)

# Set bot commands in the menu automatically
try:
    bot.set_my_commands([
        types.BotCommand("list_units", "📋 Xem danh sách đơn vị y tế"),
        types.BotCommand("add_contract", "➕ Bắt đầu thêm hợp đồng mới"),
        types.BotCommand("tracuu", "🔍 Tra cứu cấu hình HIS L2"),
        types.BotCommand("attt", "🛡️ Tra cứu đáp án thi An toàn thông tin"),
        types.BotCommand("help", "❓ Hướng dẫn sử dụng")
    ])
except Exception as e:
    print(f"Warning: Failed to set bot commands: {e}")

# In-memory dictionary to store user conversation state
user_sessions = {}

# ----------------------------------------------------------------------
# DATABASE UTILITIES (Read & Write contracts.html)
# ----------------------------------------------------------------------
def read_database():
    """Reads contracts.html, parses the 'let units = [...];' array, and returns it."""
    if not os.path.exists(HTML_PATH):
        raise FileNotFoundError(f"contracts.html not found at {HTML_PATH}")
        
    with open(HTML_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Match the 'let units = [ ... ];' array declaration
    match = re.search(r'let\s+units\s*=\s*(\[[\s\S]*?\]);', content)
    if not match:
        raise ValueError("Could not find the 'let units = [...];' declaration in contracts.html")
        
    # We use a custom parser or eval to extract the JS array safely in Python.
    # To keep it simple, we write a temp JS script and run node to dump it to JSON.
    temp_js_path = os.path.join(os.path.dirname(HTML_PATH), "temp_dump_units.js")
    temp_json_path = os.path.join(os.path.dirname(HTML_PATH), "temp_dump_units.json")
    
    js_code = f"""
    const fs = require('fs');
    const content = fs.readFileSync('{HTML_PATH.replace('\\', '/')}', 'utf8');
    const match = content.match(/let\\s+units\\s*=\\s*(\\[[\\s\\S]*?\\]);/);
    if (match) {{
        try {{
            const units = eval(match[1]);
            fs.writeFileSync('{temp_json_path.replace('\\', '/')}', JSON.stringify(units, null, 2), 'utf8');
            process.exit(0);
        }} catch(e) {{
            console.error(e);
            process.exit(1);
        }}
    }} else {{
        process.exit(2);
    }}
    """
    
    with open(temp_js_path, "w", encoding="utf-8") as f:
        f.write(js_code)
        
    try:
        # Run node script
        res = subprocess.run(["node", temp_js_path], capture_output=True, text=True, check=True)
        with open(temp_json_path, "r", encoding="utf-8") as f_json:
            units = json.load(f_json)
        return units
    finally:
        # Cleanup
        if os.path.exists(temp_js_path): os.remove(temp_js_path)
        if os.path.exists(temp_json_path): os.remove(temp_json_path)

def write_database(units):
    """Serializes the units array and updates the 'let units = [...];' block in contracts.html."""
    if not os.path.exists(HTML_PATH):
        raise FileNotFoundError(f"contracts.html not found at {HTML_PATH}")
        
    with open(HTML_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Serialize to pretty JS format
    js_array_str = json.dumps(units, indent=6, ensure_ascii=False)
    
    # We need to replace the old block with the new one
    new_content, count = re.subn(
        r'let\s+units\s*=\s*\[[\s\S]*?\];', 
        f"let units = {js_array_str};", 
        content
    )
    
    if count == 0:
        raise ValueError("Failed to replace the 'let units = [...];' block in contracts.html")
        
    # Write to temp file first to test syntax
    temp_html_path = HTML_PATH + ".tmp"
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    # Verify syntax using Node.js
    verify_js_path = os.path.join(os.path.dirname(HTML_PATH), "temp_verify_syntax.js")
    verify_js = f"""
    const fs = require('fs');
    const content = fs.readFileSync('{temp_html_path.replace('\\', '/')}', 'utf8');
    const match = content.match(/let\\s+units\\s*=\\s*(\\[[\\s\\S]*?\\]);/);
    if (match) {{
        try {{
            eval(match[1]);
            process.exit(0);
        }} catch(e) {{
            process.exit(1);
        }}
    }} else {{
        process.exit(2);
    }}
    """
    with open(verify_js_path, "w", encoding="utf-8") as f:
        f.write(verify_js)
        
    try:
        subprocess.run(["node", verify_js_path], check=True)
        # Syntax is OK, rename temp file to replace original
        os.replace(temp_html_path, HTML_PATH)
    except Exception as e:
        if os.path.exists(temp_html_path): os.remove(temp_html_path)
        raise ValueError(f"Syntax validation failed. Reverting changes. Error: {e}")
    finally:
        if os.path.exists(verify_js_path): os.remove(verify_js_path)

def sync_to_git(commit_message):
    """Runs git add, commit, and push in the local repository directory."""
    cwd = os.path.dirname(HTML_PATH)
    try:
        subprocess.run(["git", "add", "contracts.html"], cwd=cwd, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", commit_message], cwd=cwd, check=True, capture_output=True)
        subprocess.run(["git", "push"], cwd=cwd, check=True, capture_output=True)
        return True, "Successfully pushed to GitHub!"
    except subprocess.CalledProcessError as e:
        return False, f"Git Sync Error: {e.stderr.strip() if e.stderr else e}"
    except Exception as e:
        return False, f"Error: {e}"

# ----------------------------------------------------------------------
# BOT HANDLERS
# ----------------------------------------------------------------------
@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    welcome_text = (
        "👋 **Chào mừng bạn đến với VNPT Contract Bot!**\n\n"
        "Tôi sẽ giúp bạn quản lý hợp đồng y tế và tra cứu thông tin nhanh chóng.\n\n"
        "**Các lệnh chính:**\n"
        "➕ /add_contract : Thêm hợp đồng mới vào portal.\n"
        "📋 /list_units : Xem danh sách các đơn vị và tổng giá trị hợp đồng.\n"
        "🔍 /tracuu <từ khóa> : Tra cứu cấu hình HIS L2.\n"
        "🛡️ /attt <từ khóa> : Tra cứu đáp án thi An toàn thông tin.\n"
        "❓ /help : Xem hướng dẫn sử dụng."
    )
    bot.reply_to(message, welcome_text, parse_mode='Markdown')

def parse_value_to_number(value_str):
    if not value_str:
        return 0
    # Remove dots, commas, spaces and non-digit characters
    digits = re.sub(r'[^\d]', '', value_str)
    try:
        return int(digits) if digits else 0
    except ValueError:
        return 0

def format_vietnamese_currency(amount):
    return f"{amount:,.0f}".replace(",", ".") + " đồng"

@bot.message_handler(commands=['list_units', 'listunits', 'list'])
def list_units(message):
    try:
        units = read_database()
        lines = ["📋 **Danh sách đơn vị y tế hiện có:**\n"]
        for idx, u in enumerate(units):
            # Calculate sum of active (non-pending) contracts
            total_val = 0
            for c in u.get("contracts", []):
                if c.get("status") != "pending":
                    total_val += parse_value_to_number(c.get("value", ""))
            
            val_str = format_vietnamese_currency(total_val)
            lines.append(f"{idx+1}. **{u['name']}** -- {val_str}")
        bot.reply_to(message, "\n".join(lines), parse_mode='Markdown')
    except Exception as e:
        bot.reply_to(message, f"❌ Lỗi đọc cơ sở dữ liệu: {e}")

@bot.message_handler(commands=['add_contract', 'addcontract', 'add'])
def start_add_contract(message):
    chat_id = message.chat.id
    try:
        units = read_database()
        # Create a markup menu with existing unit names
        markup = types.ReplyKeyboardMarkup(one_time_keyboard=True, resize_keyboard=True)
        for u in units:
            markup.add(types.KeyboardButton(f"{u['name']} ({u['id']})"))
        markup.add(types.KeyboardButton("➕ Thêm đơn vị mới..."))
        
        user_sessions[chat_id] = {"step": "SELECT_UNIT", "data": {}}
        bot.send_message(chat_id, "Bước 1: Chọn Đơn vị thụ hưởng từ danh sách dưới đây, hoặc chọn thêm đơn vị mới:", reply_markup=markup)
    except Exception as e:
        bot.reply_to(message, f"❌ Lỗi khởi tạo: {e}")

@bot.message_handler(func=lambda msg: msg.chat.id in user_sessions)
def handle_wizard_steps(message):
    chat_id = message.chat.id
    session = user_sessions[chat_id]
    step = session["step"]
    text = message.text.strip()
    
    if text.lower() == "/cancel":
        user_sessions.pop(chat_id, None)
        bot.send_message(chat_id, "❌ Đã hủy quy trình thêm hợp đồng.", reply_markup=types.ReplyKeyboardRemove())
        return

    if step == "SELECT_UNIT":
        if text == "➕ Thêm đơn vị mới...":
            session["step"] = "INPUT_NEW_UNIT_NAME"
            bot.send_message(chat_id, "Nhập Tên đơn vị mới (ví dụ: *Bệnh viện Đa khoa Columbia Asian*):", parse_mode='Markdown', reply_markup=types.ReplyKeyboardRemove())
        else:
            # Parse unit_id from string like "TYT Phường Bến Cát (tyt_phuong_ben_cat)"
            match = re.search(r'\(([^)]+)\)$', text)
            if match:
                unit_id = match.group(1)
                session["data"]["unit_id"] = unit_id
                session["step"] = "INPUT_CODE"
                bot.send_message(chat_id, "Bước 2: Nhập Mã số Hợp đồng (ví dụ: *HĐ-52/2026/CA*):", parse_mode='Markdown', reply_markup=types.ReplyKeyboardRemove())
            else:
                bot.send_message(chat_id, "Vui lòng chọn đơn vị y tế hợp lệ từ menu.")

    elif step == "INPUT_NEW_UNIT_NAME":
        session["data"]["new_unit_name"] = text
        session["step"] = "INPUT_NEW_UNIT_ID"
        # Generate default slug/id from name
        default_id = re.sub(r'[^a-z0-9_]', '', text.lower().replace(" ", "_"))
        bot.send_message(chat_id, f"Nhập ID đơn vị mới viết liền không dấu (Gợi ý: `{default_id}`):", parse_mode='Markdown')

    elif step == "INPUT_NEW_UNIT_ID":
        session["data"]["unit_id"] = text
        session["step"] = "INPUT_CODE"
        bot.send_message(chat_id, "Bước 2: Nhập Mã số Hợp đồng (ví dụ: *HĐ-52/2026/CA*):", parse_mode='Markdown')

    elif step == "INPUT_CODE":
        session["data"]["code"] = text
        session["step"] = "INPUT_NAME"
        bot.send_message(chat_id, "Bước 3: Nhập Tên Hợp đồng đầy đủ (ví dụ: *Hợp đồng thuê dịch vụ công nghệ thông tin y tế (HIS & LIS) - BV Columbia*):", parse_mode='Markdown')

    elif step == "INPUT_NAME":
        session["data"]["name"] = text
        session["step"] = "INPUT_PACKAGE"
        
        markup = types.ReplyKeyboardMarkup(one_time_keyboard=True, resize_keyboard=True)
        markup.add("Hệ thống thông tin bệnh viện HIS L2", "Hệ thống Quản lý Y tế Cơ sở HMIS", "Hệ thống Bệnh án điện tử EMR")
        bot.send_message(chat_id, "Bước 4: Chọn gói cước dịch vụ phần mềm hoặc nhập tên gói cước khác:", reply_markup=markup)

    elif step == "INPUT_PACKAGE":
        session["data"]["package"] = text
        session["step"] = "INPUT_VALUE"
        bot.send_message(chat_id, "Bước 5: Nhập Giá trị hợp đồng (ví dụ: *90,000,000 VND*):", parse_mode='Markdown', reply_markup=types.ReplyKeyboardRemove())

    elif step == "INPUT_VALUE":
        # Format input value nicely (add VND if missing)
        val = text
        if "vnd" not in val.lower() and "đồng" not in val.lower() and "đ" not in val.lower():
            val += " VND"
        session["data"]["value"] = val
        session["step"] = "INPUT_DATE"
        bot.send_message(chat_id, "Bước 6: Nhập Ngày ký hiệu lực (Định dạng DD/MM/YYYY, ví dụ: *01/04/2026*):", parse_mode='Markdown')

    elif step == "INPUT_DATE":
        session["data"]["date"] = text
        session["step"] = "INPUT_END_DATE"
        bot.send_message(chat_id, "Bước 7: Nhập Ngày hết hạn (Định dạng DD/MM/YYYY, ví dụ: *31/03/2027* hoặc nhập *Chưa có*):", parse_mode='Markdown')

    elif step == "INPUT_END_DATE":
        end_date = text
        if end_date.lower() == "chưa có" or end_date.lower() == "chua co" or end_date == "-":
            end_date = ""
        session["data"]["endDate"] = end_date
        session["step"] = "INPUT_FILENAME"
        bot.send_message(chat_id, "Bước 8: Nhập Tên tệp tin PDF hợp đồng (ví dụ: *HD_2026_bv_columbia_asian.pdf*):", parse_mode='Markdown')

    elif step == "INPUT_FILENAME":
        session["data"]["fileName"] = text
        session["step"] = "INPUT_FILESIZE"
        bot.send_message(chat_id, "Bước 9: Nhập Dung lượng tệp tin (ví dụ: *1.5 MB*):", parse_mode='Markdown')

    elif step == "INPUT_FILESIZE":
        session["data"]["fileSize"] = text
        session["step"] = "CONFIRMATION"
        
        # Build preview
        data = session["data"]
        preview = (
            "📝 **XÁC NHẬN THÔNG TIN HỢP ĐỒNG MỚI:**\n"
            f"• Đơn vị: `{data.get('new_unit_name', data['unit_id'])}`\n"
            f"• Mã HĐ: `{data['code']}`\n"
            f"• Tên HĐ: *{data['name']}*\n"
            f"• Gói cước: `{data['package']}`\n"
            f"• Giá trị: `{data['value']}`\n"
            f"• Ngày ký: `{data['date']}`\n"
            f"• Hết hạn: `{data['endDate'] or 'Chưa có'}`\n"
            f"• Tệp PDF: `{data['fileName']} ({data['fileSize']})`\n\n"
            "Hãy chọn hành động dưới đây:"
        )
        markup = types.ReplyKeyboardMarkup(one_time_keyboard=True, resize_keyboard=True)
        markup.add("✅ Xác nhận & Lưu HĐ", "❌ Hủy bỏ")
        bot.send_message(chat_id, preview, reply_markup=markup, parse_mode='Markdown')

    elif step == "CONFIRMATION":
        if text == "✅ Xác nhận & Lưu HĐ":
            bot.send_message(chat_id, "⏳ Đang ghi nhận dữ liệu vào cơ sở dữ liệu...", reply_markup=types.ReplyKeyboardRemove())
            data = session["data"]
            
            try:
                # 1. Read database
                units = read_database()
                
                # Check if we need to insert a new unit
                target_unit = None
                for u in units:
                    if u["id"] == data["unit_id"]:
                        target_unit = u
                        break
                        
                if not target_unit and "new_unit_name" in data:
                    # Create new unit
                    # Generate 2 letter avatar
                    words = data["new_unit_name"].split()
                    avatar = "".join([w[0].upper() for w in words if w[0].isalnum()])[:2]
                    if not avatar: avatar = "NEW"
                    
                    target_unit = {
                        "id": data["unit_id"],
                        "name": data["new_unit_name"],
                        "avatar": avatar,
                        "contracts": []
                    }
                    units.append(target_unit)
                    
                if not target_unit:
                    bot.send_message(chat_id, f"❌ Lỗi: Không tìm thấy đơn vị ID `{data['unit_id']}` để thêm HĐ.")
                    user_sessions.pop(chat_id, None)
                    return
                
                # Generate unique ID for the contract
                idx = len(target_unit["contracts"]) + 1
                c_id = f"{data['unit_id']}-{idx}"
                
                # Build contract object
                new_contract = {
                    "id": c_id,
                    "code": data["code"],
                    "name": data["name"],
                    "fileName": data["fileName"],
                    "fileSize": data["fileSize"],
                    "package": data["package"],
                    "value": data["value"],
                    "date": data["date"],
                    "endDate": data["endDate"],
                    "status": "almost_signed", # default to "Sắp ký hợp đồng" as requested
                    "ms1Done": True,
                    "ms2Done": False,
                    "ms3Done": False,
                    "signedBy": "",
                    "signedTime": ""
                }
                
                target_unit["contracts"].append(new_contract)
                
                # 2. Write back to file
                write_database(units)
                
                bot.send_message(chat_id, "✅ Đã lưu hợp đồng thành công vào `contracts.html`! Đang đồng bộ hóa lên Git...")
                
                # 3. Git sync
                git_msg = f"feat: add contract {data['code']} for {target_unit['name']} via Telegram Bot"
                success, git_info = sync_to_git(git_msg)
                if success:
                    bot.send_message(chat_id, f"🚀 {git_info}")
                else:
                    bot.send_message(chat_id, f"⚠️ Đã lưu cục bộ nhưng lỗi đẩy lên Git: {git_info}")
                    
            except Exception as e:
                bot.send_message(chat_id, f"❌ Lỗi khi ghi file: {e}")
                
            user_sessions.pop(chat_id, None)
        else:
            user_sessions.pop(chat_id, None)
            bot.send_message(chat_id, "❌ Đã hủy bỏ thêm hợp đồng.", reply_markup=types.ReplyKeyboardRemove())

# ----------------------------------------------------------------------
# HIS L2 CONFIG SEARCH HANDLER
# ----------------------------------------------------------------------
@bot.message_handler(commands=['tracuu', 'search', 'config'])
def search_hisl2_config(message):
    """Search HIS L2 configuration by keyword."""
    chat_id = message.chat.id
    # Extract keyword from command
    parts = message.text.strip().split(None, 1)
    if len(parts) < 2 or not parts[1].strip():
        bot.reply_to(
            message,
            "🔍 *Tra cứu cấu hình HIS L2*\n\n"
            "Cú pháp: `/tracuu <từ khóa>`\n"
            "Ví dụ:\n"
            "  `/tracuu CCCD`\n"
            "  `/tracuu bắt buộc nhập`\n"
            "  `/tracuu NGT_TN`\n\n"
            f"📊 Tổng số cấu hình trong hệ thống: *{len(_hisl2_data)}*",
            parse_mode='Markdown'
        )
        return

    keyword = parts[1].strip().lower()
    bot.send_message(chat_id, f"⏳ Đang tìm kiếm: `{parts[1].strip()}`...", parse_mode='Markdown')

    results = []
    for row in _hisl2_data:
        ma = row.get('Mã cấu hình', '')
        ten = row.get('Tên cấu hình', '')
        mo_ta = row.get('Mô tả', '')
        mac_dinh = row.get('Giá trị mặc định', '')
        # Search in all fields
        searchable = f"{ma} {ten} {mo_ta} {mac_dinh}".lower()
        if keyword in searchable:
            results.append((ma, ten, mac_dinh, mo_ta))
        if len(results) >= 10:
            break

    if not results:
        bot.send_message(
            chat_id,
            f"❌ Không tìm thấy kết quả nào cho từ khóa: *{parts[1].strip()}*\n"
            "Thử lại với từ khóa khác hoặc dùng mã cấu hình (ví dụ: `NGT_`, `ADMIN_`).",
            parse_mode='Markdown'
        )
        return

    lines = [f"🔍 *Kết quả tra cứu:* `{parts[1].strip()}`\n"]
    for ma, ten, mac_dinh, mo_ta in results:
        lines.append(f"📌 `{ma}`")
        lines.append(f"   *{ten}*")
        if mac_dinh:
            lines.append(f"   Giá trị mặc định: `{mac_dinh}`")
        if mo_ta:
            lines.append(f"   _{mo_ta}_")
        lines.append("")

    total_found = sum(
        1 for row in _hisl2_data
        if keyword in f"{row.get('Mã cấu hình', '')} {row.get('Tên cấu hình', '')} {row.get('Mô tả', '')} {row.get('Giá trị mặc định', '')}".lower()
    )
    if total_found > 10:
        lines.append(f"_...và {total_found - 10} kết quả khác. Hãy dùng từ khóa cụ thể hơn._")

    # Telegram message limit is 4096 chars - split if too long
    full_msg = "\n".join(lines)
    if len(full_msg) > 4000:
        full_msg = full_msg[:4000] + "\n_(Cắt bớt do quá dài)_"

    bot.send_message(chat_id, full_msg, parse_mode='Markdown')


# Helper to clean HTML for Telegram Markdown
def clean_html(text):
    if not text:
        return ""
    # Replace <p> with newline
    text = re.sub(r'</?p\s*.*?>', '\n', text)
    text = re.sub(r'<br\s*/?>', '\n', text)
    # Replace <img> with placeholder
    text = re.sub(r'<img\s*.*?>', ' [Ảnh đính kèm] ', text)
    # Remove all other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Replace HTML entities
    text = text.replace("&nbsp;", " ").replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&").replace("&quot;", '"')
    # Collapse multiple newlines
    text = re.sub(r'\n+', '\n', text).strip()
    return text

@bot.message_handler(commands=['attt', 'traattt'])
def search_attt(message):
    """Search ATTT questions and answers by keyword."""
    chat_id = message.chat.id
    parts = message.text.strip().split(None, 1)
    if len(parts) < 2 or not parts[1].strip():
        bot.reply_to(
            message,
            "🛡️ *Tra cứu đáp án thi An toàn thông tin*\n\n"
            "Cú pháp: `/attt <từ khóa>`\n"
            "Ví dụ:\n"
            "  `/attt ransomware`\n"
            "  `/attt email giả mạo`\n"
            "  `/attt OTP`\n\n"
            f"📊 Tổng số câu hỏi trong bộ đề: *{len(_attt_data)}*",
            parse_mode='Markdown'
        )
        return

    keyword = parts[1].strip().lower()
    bot.send_message(chat_id, f"⏳ Đang tra cứu bộ đề: `{parts[1].strip()}`...", parse_mode='Markdown')

    results = []
    for row in _attt_data:
        que = row.get('que', '')
        searchable_parts = [que]
        for k, v in row.items():
            if k != 'que' and v:
                searchable_parts.append(str(v))
        
        searchable = " ".join(searchable_parts).lower()
        if keyword in searchable:
            results.append(row)
        if len(results) >= 8:
            break

    if not results:
        bot.send_message(
            chat_id,
            f"❌ Không tìm thấy câu hỏi nào có từ khóa: *{parts[1].strip()}*\n"
            "Thử tìm bằng các từ khóa khác ngắn hơn.",
            parse_mode='Markdown'
        )
        return

    lines = [f"🛡️ *Kết quả tra cứu bộ đề:* `{parts[1].strip()}`\n"]
    for idx, row in enumerate(results):
        que_cleaned = clean_html(row.get('que', ''))
        lines.append(f"*{idx+1}. {que_cleaned}*")
        
        if 'ans' in row and row['ans']:
            ans_cleaned = clean_html(row['ans'])
            lines.append(f"👉 _Đáp án:_ `{ans_cleaned}`")
        else:
            ans_list = []
            for i in range(1, 10):
                key = f"ans{i}"
                if key in row and row[key]:
                    ans_list.append(clean_html(row[key]))
            if ans_list:
                lines.append("👉 _Đáp án:_")
                for ans in ans_list:
                    lines.append(f"  • `{ans}`")
        lines.append("")

    total_found = 0
    for row in _attt_data:
        searchable_parts = [row.get('que', '')]
        for k, v in row.items():
            if k != 'que' and v:
                searchable_parts.append(str(v))
        if keyword in " ".join(searchable_parts).lower():
            total_found += 1

    if total_found > 8:
        lines.append(f"_...và {total_found - 8} câu hỏi khác. Hãy dùng từ khóa cụ thể hơn._")

    full_msg = "\n".join(lines)
    if len(full_msg) > 4000:
        full_msg = full_msg[:4000] + "\n_(Cắt bớt do vượt quá độ dài tin nhắn)_"

    bot.send_message(chat_id, full_msg, parse_mode='Markdown')


# Start polling
if __name__ == "__main__":
    print("Telegram Contract Bot is running...")
    bot.infinity_polling()
