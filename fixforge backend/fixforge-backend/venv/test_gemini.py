import requests, os

KEY = "AIzaSyACKbgPRKFTwD2tgFe6IRe3wyxsQ77Cfhs"
URL = f"https://generativelanguage.googleapis.com/v1beta/models?key={KEY}"

res = requests.get(URL, timeout=30)
print(res.status_code)
print(res.text)
