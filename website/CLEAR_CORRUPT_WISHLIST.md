# How to Fix Corrupt Wishlist Data Permanently

## Problem
Items keep reappearing in your wishlist after deletion, or items you deleted are showing up again after refresh. This is due to **corrupt test data from an old version** of the app.

## Solution: One-Click Clear

### Via Frontend UI (Easiest)
1. Navigate to your **Wishlist** page
2. Look for the red **"🗑️ Clear All Wishlist Data"** button (appears after the "My Wishlist" heading)
3. Click the button
4. Confirm the warning dialog
5. ✅ All corrupt data is wiped clean!

### Via API (Manual)
If you want to call it directly:

```bash
curl -X DELETE "http://3.111.157.226/api/v1/wishlist/clear" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json"
```

Replace `<YOUR_TOKEN>` with your actual bearer token.

## What This Does
- **Completely clears** all wishlist data for the logged-in user
- **Ignores broken/missing variant IDs** - it's a "master command" that obliterates everything
- After clearing, the wishlist is a clean slate with zero items
- Any new items you add will work perfectly forever

## After Clearing
✅ No more duplicate items  
✅ Delete button will work correctly  
✅ Items won't reappear after refresh  
✅ Wishlist operations will be clean and predictable  

## Note
This is a one-time data cleanup. Only use it if you're experiencing the duplication/reappearing items issue. After clearing, your wishlist will function normally.
