import requests
import json

url = "http://localhost:8080/api/products"

product_data = {
    "name": "Test Product",
    "description": "Test Description",
    "categoryId": 1,
    "isActive": True,
    "variants": [
        {
            "variantName": "Default",
            "sku": "TP-001",
            "mrp": 100,
            "price": 80,
            "stockQuantity": 10,
            "availabilityStatus": "IN_STOCK"
        }
    ]
}

files = {
    'product': (None, json.dumps(product_data), 'application/json'),
    'image': ('test_image.png', b'fake image content', 'image/png')
}

try:
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
    if response.status_code == 201:
        print("Verification SUCCESS")
    else:
        print("Verification FAILED")
except Exception as e:
    print(f"Error: {e}")
