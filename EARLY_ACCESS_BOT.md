# Early Access (temporary)

Website flag: `window.STAFFORA_EARLY_ACCESS = true` in api.js
Set to `false` to disable key gate completely.

## Main bot endpoints (add once, remove later)

POST /api/early-access/validate
Body: { "key": "32chars" }
Response: { "valid": true, "userId": "..." } or { "valid": false }

Store keys in data/early-access.json:
{ "keys": { "AbCd...": { "userId": "123", "createdAt": "...", "createdBy": "helper" } } }

## Helper bot command example

/earlyaccess give @user
→ generate 32-char alphanumeric key
→ save via MAIN_API with HELPER_SECRET
→ DM user the key

/earlyaccess revoke key_or_user
→ remove key

When removing system later:
1. STAFFORA_EARLY_ACCESS = false on website
2. Stop checking X-Staffora-Access-Key on bot
3. Delete early-access routes
