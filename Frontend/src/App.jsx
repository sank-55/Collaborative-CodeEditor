import { useEffect, useState } from "react";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
import { 
  Copy, 
  Users, 
  Code, 
  LogOut, 
  Type, 
  CheckCircle,
  Sparkles 
} from "lucide-react";
//connecting backend with frontend
const socket = io("http://localhost:5001");

const App = () => {
  const [joined, setJoined] = useState(false); //join new user 
  const [roomId, setRoomId] = useState(""); //Bydefault empty string
  const [userName, setUserName] = useState(""); // used to user joing or leaving data
  const [language, setLanguage] = useState("javascript"); //use in handling language changes
  const [code, setCode] = useState("// start coding collaboratively..."); //handling codes
  const [copySuccess, setCopySuccess] = useState(false); // for copythe id
  const [users, setUsers] = useState([]); //
  const [typing, setTyping] = useState(""); //  to handle user typing event
  const [isLoading, setIsLoading] = useState(false); //

  // this loop will run until any thing renders then it go again

  useEffect(() => {
    //join in same socket then 
    socket.on("userJoined", (users) => {
      setUsers(users);
    });
    //upon updating code newCode is recieved the value 
    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });
    //fetch the username and put user's name while typing
    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is typing`);
      setTimeout(() => setTyping(""), 2000);
    });
    //simultanously change the updated language
    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage);
    });

    ////clean up function for the socket ( active when it is changed again and web renders)
    return () => {
      socket.off("userJoined"); //after joining the user dont show the same 
      socket.off("codeUpdate");//if code is not update for long then socket will
      socket.off("userTyping");// if any one not typing not show anymore
      socket.off("languageUpdate");// if language updation is done socket removed it
    };
  }, []);//empty array to call it only once

  useEffect(() => {
    //upon leaving room 
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };
    // before relode function is called to handle the situation
    window.addEventListener("beforeunload", handleBeforeUnload);
    // clean up function
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);//empty array to call it only once

  const joinRoom = () => {
    if (roomId && userName) {
      setIsLoading(true);
      socket.emit("join", { roomId, userName });
      setTimeout(() => {
        setJoined(true);
        setIsLoading(false);
      }, 800);
    }
  };
  //upon leaving all varriables are set as initial
  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// start coding collaboratively...");
    setLanguage("javascript");
  };
  // copying the room ID for user
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);//copy to clipboard
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);//after 2s it will as default
  };
// Here newCode Language is marked as code language 
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    // socket make this change for all user
    socket.emit("codeChange", { roomId, code: newCode });
    //take roomID and UserName by fetching it from backend
    socket.emit("typing", { roomId, userName });
  };

  // take user's new event and 
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage); // put the position in the prev. varriable
    socket.emit("languageChange", { roomId, language: newLanguage });
  };
// if not joined nor created a room show the landing page or Home page
  if (!joined) {
    return (
      // ---------------------------   HOME PAGE -----------------------------
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <Code className="h-12 w-12 text-white mr-3" />
              <Sparkles className="h-8 w-8 text-yellow-300" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">CollabCode</h1>
            <p className="text-indigo-200">Real-time collaborative code editing</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-indigo-100 mb-1">Room ID</label>
              <input
                type="text"
                placeholder="Enter room ID"
                //using eventListner 
                value={roomId}
                //fetching the room ID 
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-indigo-100 mb-1">Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                //using evernt listner add user name form 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              />
            </div>
            
            <button 
              onClick={joinRoom}
              disabled={!roomId || !userName || isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Join Room'
              )}
            </button>
          </div>
          
          <p className="text-center text-indigo-200 mt-6 text-sm">
            Create a new room by entering a unique ID
          </p>
        </div>
      </div>
    );
  }

  return (
//- -------------- CODE EDITOR INTERFACE -------------------------------------------
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 flex flex-col border-r border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <Code className="h-5 w-5 mr-2 text-indigo-400" />
              CollabCode
            </h2>
            <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full">
              Live
            </span>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Room ID:</span>
            <div className="flex items-center">
              <code className="text-sm bg-gray-700 px-2 py-1 rounded mr-2">{roomId.slice(0, 8)}...</code>
              <button 
                onClick={copyRoomId}// upon clicking the room ID copySuc become true
                className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md transition"
                title="Copy Room ID"
              >
                {copySuccess ? ( //Prev false after copying true next styling changes
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 mr-2 text-indigo-400" />
            <h3 className="font-medium">Users in Room ({users.length})</h3>
          </div>
          
          <div className="space-y-2">
            {/* after fecthing the user data and room id assign or mapped here */}
            {users.map((user, index) => (
              <div key={index} className="flex items-center bg-gray-700/50 px-3 py-2 rounded-md">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                {/* show only 12 char of the name */}
                <span className="text-sm">{user.slice(0, 12)}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 border-b border-gray-700">
          <label className="block- text-sm font-medium mb-2 flex items-center">
            <Type className="h-4 w-4 mr-2 text-indigo-400" />
            Language
          </label>
          <select
          //rendering using the event lisner 
            value={language}
            onChange={handleLanguageChange}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>
        </div>
        
        {typing && (
          <div className="p-4 bg-indigo-900/30 m-4 rounded-md flex items-center">
            <div className="flex space-x-1 mr-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-sm text-indigo-300">{typing}</span>
          </div>
        )}
        
        <div className="p-6 mt-auto">
          <button 
            onClick={leaveRoom}
            className="w-full flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-4 rounded-md font-medium transition"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave Room
          </button>
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
          <h1 className="text-lg font-mono font-medium">
            Editing in <span className="text-indigo-400 capitalize">{language}</span>
          </h1>
        </div>
        <div className="flex-1">
          {/* This is used for VS Code like editor */}
          <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            value={code}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontLigatures: true,
              wordWrap: 'on',
              smoothScrolling: true,
              cursorBlinking: 'phase',
            }}
            loading={
              <div className="h-full w-full flex items-center justify-center bg-gray-900">
                <div className="animate-pulse text-gray-500">Loading editor...</div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default App;