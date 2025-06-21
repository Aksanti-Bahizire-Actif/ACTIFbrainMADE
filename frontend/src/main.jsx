import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { backend } from 'declarations/backend';
import botImg from '/bot.svg';
import userImg from '/user.svg';
import '/index.css';

const App = () => {
  const [chat, setChat] = useState([
    {
      system: { content: "I'm an a sovereign AI agent living on the Internet Computer. I can summarize your course content. Upload a .txt file." }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef(null);

  const formatDate = (date) => {
    const h = '0' + date.getHours();
    const m = '0' + date.getMinutes();
    return `${h.slice(-2)}:${m.slice(-2)}`;
  };

  const askAgent = async (messages) => {
    try {
      const response = await backend.chat(messages);
      setChat((prevChat) => {
        const newChat = [...prevChat];
        newChat.pop(); // Remove "Thinking..."
        newChat.push({ system: { content: response } });
        return newChat;
      });
    } catch (e) {
      console.log(e);
      const eStr = String(e);
      const match = eStr.match(/(SysTransient|CanisterReject), \\+"([^\\"]+)/);
      if (match) {
        alert(match[2]);
      }
      setChat((prevChat) => {
        const newChat = [...prevChat];
        newChat.pop();
        return newChat;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      user: { content: inputValue }
    };
    const thinkingMessage = {
      system: { content: 'Thinking ...' }
    };
    setChat((prevChat) => [...prevChat, userMessage, thinkingMessage]);
    setInputValue('');
    setIsLoading(true);

    const messagesToSend = chat.slice(1).concat(userMessage);
    askAgent(messagesToSend);
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;

      setChat((prevChat) => [
        ...prevChat,
        { user: { content: `📄 Uploaded file: ${file.name}` } },
        { system: { content: "🧠 Summarizing document..." } }
      ]);
      setIsLoading(true);

      try {
        const summary = await backend.summarize(text);
        setChat((prevChat) => {
          const newChat = [...prevChat];
          newChat.pop(); // remove "Thinking..."
          newChat.push({ system: { content: summary } });
          return newChat;
        });
      } catch (error) {
        console.error("Summary error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (file.type.startsWith("text/")) {
      reader.readAsText(file);
    } else {
      alert("⚠️ Only .txt files are supported right now.");
    }
  };
return (
  <div style={{
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #eff6ff, #f3e8ff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem'
  }}>
    <div style={{
      height: '85vh',
      width: '100%',
      maxWidth: '768px',
      borderRadius: '1rem',
      backgroundColor: 'white',
      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>

      {/* Upload Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>
          Upload Study Document
        </h2>
        <label style={{
          cursor: 'pointer',
          fontSize: '0.875rem',
          color: '#2563eb',
          textDecoration: 'underline'
        }}>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            disabled={isLoading}
            style={{ display: 'none' }}
          />
          Choose File
        </label>
      </div>

      {/* Chat Window */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#f9fafb',
          padding: '1rem'
        }}
        ref={chatBoxRef}
      >
        {chat.map((message, index) => {
          const isUser = 'user' in message;
          const img = isUser ? userImg : botImg;
          const name = isUser ? 'You' : 'AI Assistant';
          const text = isUser ? message.user.content : message.system.content;

          return (
            <div key={index} style={{
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              marginBottom: '1rem'
            }}>
              {!isUser && (
                <div style={{
                  marginRight: '0.5rem',
                  height: '40px',
                  width: '40px',
                  borderRadius: '9999px',
                  backgroundImage: `url(${img})`,
                  backgroundSize: 'cover'
                }} />
              )}
              <div style={{
                maxWidth: '75%',
                borderRadius: '1rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: isUser ? '#3b82f6' : 'white',
                color: isUser ? 'white' : 'black',
                border: isUser ? 'none' : '1px solid #e5e7eb',
                boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  opacity: 0.6,
                  marginBottom: '0.25rem'
                }}>
                  <span>{name}</span>
                  <span>{formatDate(new Date())}</span>
                </div>
                <div>{text}</div>
              </div>
              {isUser && (
                <div style={{
                  marginLeft: '0.5rem',
                  height: '40px',
                  width: '40px',
                  borderRadius: '9999px',
                  backgroundImage: `url(${img})`,
                  backgroundSize: 'cover'
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Input Box */}
      <form
        style={{
          display: 'flex',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white',
          padding: '0.75rem'
        }}
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="Ask a question or summarize more..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem 0 0 0.5rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? '#93c5fd' : '#3b82f6',
            color: 'white',
            padding: '0 1rem',
            border: 'none',
            borderRadius: '0 0.5rem 0.5rem 0',
            cursor: 'pointer'
          }}
        >
          Send
        </button>
      </form>
    </div>
  </div>
);

};

export default App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
