import os
import json
import uuid
import datetime
from bson import ObjectId

class Database:
    def __init__(self, data_file="civicconnect_data.json"):
        self.data_file = data_file
        self.users = []
        self.departments = []
        self.complaints = []
        self.votes = []
        self.complaint_histories = []
        self.notifications = []
        self.load()

    def load(self):
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.users = data.get("users", [])
                    self.departments = data.get("departments", [])
                    self.complaints = data.get("complaints", [])
                    self.votes = data.get("votes", [])
                    self.complaint_histories = data.get("complaint_histories", [])
                    self.notifications = data.get("notifications", [])
            except Exception as e:
                print(f"[DB] Error loading {self.data_file}: {e}")
                self.save()
        else:
            self.save()

    def save(self):
        try:
            with open(self.data_file, "w", encoding="utf-8") as f:
                json.dump({
                    "users": self.users,
                    "departments": self.departments,
                    "complaints": self.complaints,
                    "votes": self.votes,
                    "complaint_histories": self.complaint_histories,
                    "notifications": self.notifications
                }, f, default=str, indent=2)
        except Exception as e:
            print(f"[DB] Error saving data: {e}")

db = Database()

def new_id():
    return str(ObjectId())

def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()
