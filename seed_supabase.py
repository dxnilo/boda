import json
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

SUPABASE_URL = "https://qimqrpczkkukncfxmthu.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXFycGN6a2t1a25jZnhtdGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjA3MjUsImV4cCI6MjEwNTY5NjcyNX0.5k7bjR65hyLgmgO_MySDGkv0j6L9M-Wm_3Uii1LADk8"

def seed_supabase():
    with open('guest_list.json', 'r', encoding='utf-8') as f:
        guests = json.load(f)
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    url = f"{SUPABASE_URL}/rest/v1/guests"
    
    # Bulk insert (Supabase supports array inserts)
    print(f"Uploading {len(guests)} guests...")
    resp = requests.post(url, headers=headers, json=guests)
    
    if resp.status_code in [200, 201]:
        print("✅ Inserted successfully!")
    else:
        print(f"Error: {resp.status_code}")
        print(resp.text)

if __name__ == '__main__':
    seed_supabase()
