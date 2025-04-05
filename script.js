document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const aboutBtn = document.getElementById('aboutBtn');
    const aboutModal = document.getElementById('aboutModal');
    const closeBtn = document.querySelector('.close-btn');
    const suggestionTags = document.querySelectorAll('.suggestion-tags span');
    let isWaitingForResponse = false;
    let messageHistory = [];

    // Scroll to bottom with animation
    function scrollToBottom() {
        const scrollHeight = chatBox.scrollHeight;
        const currentScroll = chatBox.scrollTop;
        const clientHeight = chatBox.clientHeight;
        
        if (scrollHeight > currentScroll + clientHeight + 50) {
            chatBox.scrollTo({
                top: scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    // Add message to chat with typing animation
    function addMessage(text, sender, isUrgent = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        if (isUrgent) messageDiv.classList.add('urgent');
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        
        messageDiv.appendChild(contentDiv);
        chatBox.appendChild(messageDiv);
        
        // Store message in history
        messageHistory.push({
            text,
            sender,
            timestamp: new Date().toISOString()
        });
        
        // Force reflow and animate
        requestAnimationFrame(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
            scrollToBottom();
        });
    }

    // Show typing indicator
    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `
            <span class="typing-text">Therapist is typing</span>
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        typingDiv.appendChild(contentDiv);
        chatBox.appendChild(typingDiv);
        scrollToBottom();
        
        return typingDiv;
    }

    // Send message to backend
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message || isWaitingForResponse) return;

        addMessage(message, 'user');
        userInput.value = '';
        isWaitingForResponse = true;
        sendButton.disabled = true;

        try {
            const typingElement = showTyping();
            
            // Send to Flask backend
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            if (typingElement.parentNode) {
                chatBox.removeChild(typingElement);
            }
            
            // Add bot response
            addMessage(data.response, 'bot', data.urgent);
            
            // Update suggestions if available
            if (data.suggestions) {
                updateSuggestions(data.suggestions);
            }
            
        } catch (error) {
            console.error('Error:', error);
            addMessage("I'm having trouble connecting. Please try again.", 'bot');
        } finally {
            isWaitingForResponse = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    }

    // Update suggestion tags
    function updateSuggestions(suggestions) {
        const container = document.querySelector('.suggestion-tags');
        container.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const span = document.createElement('span');
            span.textContent = suggestion;
            span.addEventListener('click', () => {
                userInput.value = suggestion;
                userInput.focus();
            });
            container.appendChild(span);
        });
    }

    // Modal functionality
    aboutBtn.addEventListener('click', () => {
        aboutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeBtn.addEventListener('click', () => {
        aboutModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            aboutModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Suggestion tag click handler
    suggestionTags.forEach(tag => {
        tag.addEventListener('click', () => {
            userInput.value = tag.textContent;
            userInput.focus();
        });
    });

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isWaitingForResponse) {
            sendMessage();
        }
    });

    // Auto-focus input on load
    userInput.focus();
    
    // Initial welcome message
    setTimeout(() => {
        scrollToBottom();
    }, 300);
});