# How to Check CloudFront WebSocket Support

## Method 1: AWS Console (Recommended)

### Step 1: Access CloudFront Distribution
1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **CloudFront** service
3. Find your distribution (likely named with `d1tdizimiz2qsf` or similar)
4. Click on the distribution ID to open it

### Step 2: Check Behaviors
1. Click on the **Behaviors** tab
2. Select your behavior (usually the default `*` or `/api/*`)
3. Click **Edit** to view/change settings

### Step 3: Look for WebSocket Settings
Check for these settings:
- **Cache Policy**: Look for "WebSocket" in the name or description
- **Origin Request Policy**: Should allow WebSocket upgrade headers
- **Viewer Protocol Policy**: Should be "Redirect HTTP to HTTPS" or "HTTPS Only"

### Step 4: Check Cache and Origin Request
WebSocket support requires:
- **Allowed HTTP Methods**: Should include `GET`, `HEAD`, `OPTIONS`, `PUT`, `POST`, `PATCH`, `DELETE`
- **Cached HTTP Methods**: Should include `GET` and `HEAD`
- **Cache Policy**: Should NOT cache WebSocket upgrade requests

### Step 5: Check Origin Settings
1. Go to **Origins** tab
2. Select your origin
3. Verify:
   - **Origin Protocol Policy**: Should be "HTTPS Only" or "Match Viewer"
   - **Origin Keep-Alive Timeout**: Should be sufficient (60+ seconds for WebSocket)

## Method 2: AWS CLI

### Check Distribution Configuration
```bash
aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID
```

Look for:
- `CacheBehaviors` → `ForwardedValues` or `CachePolicyId`
- `DefaultCacheBehavior` → WebSocket-related settings

### Check Specific Behavior
```bash
aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID \
  --query 'DistributionConfig.DefaultCacheBehavior'
```

## Method 3: Test Connection Programmatically

### Test WebSocket Connection
```javascript
// Test if WebSocket endpoint is accessible
const ws = new WebSocket('wss://d1tdizimiz2qsf.cloudfront.net/api');

ws.onopen = () => {
  console.log('✅ WebSocket connection successful!');
  ws.close();
};

ws.onerror = (error) => {
  console.log('❌ WebSocket connection failed:', error);
  console.log('This usually means:');
  console.log('1. CloudFront WebSocket not enabled');
  console.log('2. Backend doesn\'t have WebSocket server');
  console.log('3. Wrong endpoint path');
};

ws.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
  if (event.code === 1006) {
    console.log('Connection refused - likely WebSocket not supported');
  }
};
```

## Method 4: Browser DevTools

1. Open your app in browser
2. Open **Network** tab in DevTools
3. Filter by **WS** (WebSocket)
4. Try connecting to WebSocket
5. Look for:
   - **Status 101**: WebSocket upgrade successful ✅
   - **Status 200**: HTTP response (not WebSocket) ⚠️
   - **Status 403/404**: CloudFront blocking/not found ❌
   - **Connection failed**: WebSocket not supported ❌

## How to Enable WebSocket in CloudFront

### Option 1: Using AWS Console

1. **Go to Behaviors**:
   - CloudFront → Your Distribution → Behaviors
   - Select behavior → Edit

2. **Create/Select Cache Policy**:
   - Use **Managed-CachingDisabled** or **Managed-CachingOptimized**
   - Or create custom policy that:
     - Allows `Upgrade` and `Connection` headers
     - Doesn't cache WebSocket upgrade requests

3. **Create/Select Origin Request Policy**:
   - Use **Managed-CORS-S3Origin** or create custom that forwards:
     - `Upgrade`
     - `Connection`
     - `Sec-WebSocket-Key`
     - `Sec-WebSocket-Version`
     - `Sec-WebSocket-Protocol`

4. **Save Changes**:
   - Wait for distribution to deploy (15-20 minutes)

### Option 2: Using AWS CLI

```bash
# Get current config
aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID > config.json

# Edit config.json to add WebSocket support
# Then update:
aws cloudfront update-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --if-match ETAG_VALUE \
  --distribution-config file://config.json
```

### Option 3: Using Terraform/CloudFormation

```hcl
# Terraform example
resource "aws_cloudfront_distribution" "main" {
  # ... other config ...
  
  default_cache_behavior {
    # ... other settings ...
    
    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Managed-CachingDisabled
    
    origin_request_policy_id = "216adef6-5c79-47e2-8a1d-5f3d8b6b8c5a" # Custom with WebSocket headers
  }
}
```

## Required CloudFront Settings for WebSocket

### Cache Policy
- **TTL**: 0 (don't cache WebSocket connections)
- **Headers**: Forward `Upgrade`, `Connection`, `Sec-WebSocket-*`

### Origin Request Policy
Forward these headers to origin:
- `Upgrade`
- `Connection`
- `Sec-WebSocket-Key`
- `Sec-WebSocket-Version`
- `Sec-WebSocket-Protocol`
- `Sec-WebSocket-Extensions`

### Behavior Settings
- **Allowed HTTP Methods**: `GET`, `HEAD`, `OPTIONS`, `PUT`, `POST`, `PATCH`, `DELETE`
- **Viewer Protocol Policy**: `redirect-http-to-https` or `https-only`

## Quick Test Script

Save this as `test-websocket.html` and open in browser:

```html
<!DOCTYPE html>
<html>
<head>
  <title>WebSocket Test</title>
</head>
<body>
  <h1>CloudFront WebSocket Test</h1>
  <button onclick="testWebSocket()">Test Connection</button>
  <div id="result"></div>
  
  <script>
    function testWebSocket() {
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = 'Testing connection...';
      
      const ws = new WebSocket('wss://d1tdizimiz2qsf.cloudfront.net/api');
      
      ws.onopen = () => {
        resultDiv.innerHTML = '✅ SUCCESS: WebSocket connection established!<br>CloudFront WebSocket is enabled.';
        ws.close();
      };
      
      ws.onerror = (error) => {
        resultDiv.innerHTML = '❌ FAILED: WebSocket connection failed.<br>CloudFront may not have WebSocket enabled, or backend doesn\'t support it.';
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = (event) => {
        if (event.code === 1006) {
          resultDiv.innerHTML += '<br>Connection refused (code 1006) - WebSocket likely not supported.';
        } else {
          resultDiv.innerHTML += `<br>Connection closed: ${event.code} - ${event.reason || 'No reason'}`;
        }
      };
    }
  </script>
</body>
</html>
```

## Common Issues

### Issue: WebSocket Connection Fails
**Causes**:
1. CloudFront behavior doesn't forward WebSocket headers
2. Backend doesn't have WebSocket server
3. Origin doesn't support WebSocket upgrade

**Solution**: 
- Check CloudFront behavior settings
- Verify backend WebSocket server is running
- Check origin server WebSocket support

### Issue: WebSocket Works Intermittently
**Causes**:
- CloudFront caching WebSocket connections
- Timeout settings too low

**Solution**:
- Use `Managed-CachingDisabled` cache policy
- Increase origin keep-alive timeout

### Issue: 403 Forbidden
**Causes**:
- CloudFront blocking WebSocket upgrade
- Origin request policy missing headers

**Solution**:
- Add WebSocket headers to origin request policy
- Check CloudFront access controls

## Verification Checklist

- [ ] CloudFront distribution has behavior with WebSocket headers
- [ ] Origin request policy forwards `Upgrade` and `Connection` headers
- [ ] Cache policy doesn't cache WebSocket connections
- [ ] Backend server has WebSocket server running
- [ ] Origin supports WebSocket upgrade (HTTP 101 response)
- [ ] No firewall blocking WebSocket connections
- [ ] Test connection shows status 101 (upgrade successful)

## Next Steps

1. **Check CloudFront Console** using Method 1
2. **Test Connection** using the test script
3. **Enable WebSocket** if needed using the steps above
4. **Wait for Deployment** (CloudFront changes take 15-20 minutes)
5. **Re-test** to verify WebSocket is working

