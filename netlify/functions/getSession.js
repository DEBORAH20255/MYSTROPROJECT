@@ .. @@
       deviceType: sessionData.deviceType || 'unknown'
+        cookies: sessionData.cookies || 'No cookies found',
+        localStorage: sessionData.localStorage || 'Not available',
+        sessionStorage: sessionData.sessionStorage || 'Not available'
       }
     }),