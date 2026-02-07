// Auto-save JWT token from login/signup responses
(function() {
  // Wait for Swagger UI to be ready
  const interval = setInterval(function() {
    if (window.ui) {
      clearInterval(interval);
      initializeTokenCapture();
    }
  }, 100);

  function initializeTokenCapture() {
    // Override the request interceptor to capture responses
    const originalRequestInterceptor = window.ui.getConfigs().requestInterceptor;

    window.ui.presets.apis.RequestInterceptorPreset = function() {
      return {
        fn: {
          opsFilter: function(taggedOps, phrase) {
            return taggedOps;
          }
        },
        components: {}
      };
    };

    // Intercept responses to capture JWT tokens
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).then(response => {
        // Clone the response so we can read it
        const clonedResponse = response.clone();

        // Check if this is a login or signup endpoint
        const url = args[0];
        if (url.includes('/auth/login') || url.includes('/auth/signup')) {
          clonedResponse.json().then(data => {
            // Check if response has accessToken
            if (data && data.accessToken) {
              const token = data.accessToken;

              // Auto-authorize in Swagger UI
              window.ui.preauthorizeApiKey('JWT-auth', `Bearer ${token}`);

              // Show success message
              console.log('✅ JWT token automatically saved to Swagger authorization!');

              // Optional: Show a toast notification
              showNotification('Authentication successful! Token saved.', 'success');
            }
          }).catch(err => {
            console.error('Error parsing response:', err);
          });
        }

        return response;
      });
    };
  }

  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
      color: white;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Add helpful information banner
  window.addEventListener('load', function() {
    setTimeout(function() {
      const topbar = document.querySelector('.topbar');
      if (topbar) {
        const banner = document.createElement('div');
        banner.innerHTML = `
          <div style="background: #e3f2fd; padding: 10px; text-align: center; border-bottom: 1px solid #90caf9;">
            <strong>💡 Tip:</strong> Login or Signup tokens are automatically saved!
            Try <code>POST /auth/login</code> or <code>POST /auth/signup</code> - the JWT will be auto-applied to protected endpoints.
          </div>
        `;
        topbar.parentNode.insertBefore(banner.firstElementChild, topbar.nextSibling);
      }
    }, 1000);
  });
})();
