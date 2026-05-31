import requests
import json
BEARER_TOKEN = "YOUR_BEARER_TOKEN"

url = "https://api.x.com//2/tweets/search/recent"

headers = {
    "Authorization": f"Bearer {BEARER_TOKEN}"
}

params = {
    "query": "Dubai or Sharjah -is:retweet", 
    "max_results": 5,
    "tweet.fields": "created_at, geo, lang"
}

response = requests.get(url, headers = headers, params = params)

print("Status Code:", response.status_code)

try:
    data = response.json()
    print(json.dumps(data, indent = 4, ensure_ascii = False))
except:
    print("Error reading response")

# This is just a sample code for the X API to extract news items.
# This is in no way a real code or input, since we do not have a bearer token and it is not a responsibility now as a junior !