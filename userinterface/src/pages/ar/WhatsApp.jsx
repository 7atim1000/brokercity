import { useState } from "react";

const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

const WHATSAPP_GREEN = "#25D366";
const WHATSAPP_DARK_GREEN = "#128C7E";
const WHATSAPP_TEAL_BG = "#DCF8C6";

const playSuccessSound = () => {
    //const audio = new Audio("/sounds/success.mp3");
    const audio = new Audio("https://cdn.jsdelivr.net/gh/naptha/tesseract.js@master/examples/audio/beep.mp3");
    audio.play().catch(() => {});
};

export default function SendWhatsAppForm() {
    const [toNumber, setToNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const response = await fetch(`${BASE}/api/whatsapp/send/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ to_number: toNumber }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to send message.");
            } else {
                setResult(data);
                setToNumber("");
                playSuccessSound();
            }
        } catch (err) {
            setError("Network error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                maxWidth: 420,
                margin: "0 auto",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
                border: `1px solid ${WHATSAPP_TEAL_BG}`,
            }}
        >
            <div
                style={{
                    background: WHATSAPP_DARK_GREEN,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                }}
            >
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.71.45 3.38 1.3 4.85L2.05 22l5.36-1.4a9.87 9.87 0 0 0 4.63 1.18h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.13-2.9-7C17.19 3.03 14.7 2 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.26-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.21-8.25 8.21Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29Z"/>
                    </svg>
                </div>
                <div>
                    <p style={{ color: "#fff", margin: 0, fontWeight: 600, fontSize: 15 }}>
                        WhatsApp sender
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: 12 }}>
                        Send via Twilio sandbox
                    </p>
                </div>
            </div>

            <div style={{ background: "#ECE5DD", padding: "20px" }}>
                <form onSubmit={handleSubmit}>
                    <label
                        style={{
                            display: "block",
                            fontSize: 13,
                            color: "#3b4a54",
                            marginBottom: 6,
                            fontWeight: 500,
                        }}
                    >
                        Recipient's WhatsApp number
                    </label>
                    <input
                        type="text"
                        value={toNumber}
                        onChange={(e) => setToNumber(e.target.value)}
                        placeholder="+9715XXXXXXXX"
                        required
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1px solid #cfd8dc",
                            fontSize: 14,
                            outline: "none",
                            boxSizing: "border-box",
                            background: "#fff",
                        }}
                    />
                    <p style={{ fontSize: 12, color: "#667781", marginTop: 6 }}>
                        Number must have already joined the Twilio sandbox.
                    </p>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            marginTop: 14,
                            padding: "12px",
                            background: loading ? "#8fd4a8" : WHATSAPP_GREEN,
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: loading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                        }}
                    >
                        {loading ? "Sending..." : (
                            <>
                                Send message
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
                                    <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                {result && (
                    <div
                        style={{
                            marginTop: 16,
                            background: WHATSAPP_TEAL_BG,
                            color: "#075E54",
                            padding: "10px 14px",
                            borderRadius: 8,
                            fontSize: 13,
                        }}
                    >
                        Message sent to {result.to_number} — status: {result.status}
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            marginTop: 16,
                            background: "#fbe4e4",
                            color: "#a72e2e",
                            padding: "10px 14px",
                            borderRadius: 8,
                            fontSize: 13,
                        }}
                    >
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}


// import { useState } from "react";

// const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// const WHATSAPP_GREEN = "#25D366";
// const WHATSAPP_DARK_GREEN = "#128C7E";
// const WHATSAPP_TEAL_BG = "#DCF8C6";

// const playSuccessSound = () => {
// const audio = new Audio("https://cdn.jsdelivr.net/gh/naptha/tesseract.js@master/examples/audio/beep.mp3");
// audio.play().catch(() => {});
// };


// export default function SendWhatsAppForm() {

//     const [toNumber, setToNumber] = useState("");
//     const [loading, setLoading] = useState(false);
//     const [result, setResult] = useState(null);
//     const [error, setError] = useState(null);

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setResult(null);
//         setError(null);

//         try {
//             const response = await fetch(`${BASE}/api/whatsapp/send/`, {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({ to_number: toNumber }),
//             });

//             const data = await response.json();

//             if (!response.ok) {
//                 setError(data.error || "Failed to send message.");
//             } else {
//                 setResult(data);
//                 setToNumber("");
//                 playSuccessSound(); // 🔊 play sound on success
//             }
//         } catch (err) {
//             setError("Network error: " + err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div
//             style={{
//                 maxWidth: 420,
//                 margin: "0 auto",
//                 borderRadius: 16,
//                 overflow: "hidden",
//                 boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
//                 fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
//                 border: `1px solid ${WHATSAPP_TEAL_BG}`,
//             }}
            
           
//         >
//             {/* Header */}
//             <div
//                 style={{
//                     background: WHATSAPP_DARK_GREEN,
//                     padding: "16px 20px",
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 10,
//                 }}
//             >
//                 <div
//                     style={{
//                         width: 36,
//                         height: 36,
//                         borderRadius: "50%",
//                         background: "rgba(255,255,255,0.2)",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                     }}
//                 >
//                     <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
//                         <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.71.45 3.38 1.3 4.85L2.05 22l5.36-1.4a9.87 9.87 0 0 0 4.63 1.18h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.13-2.9-7C17.19 3.03 14.7 2 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.26-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.21-8.25 8.21Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29Z"/>
//                     </svg>
//                 </div>
//                 <div>
//                     <p style={{ color: "#fff", margin: 0, fontWeight: 600, fontSize: 15 }}>
//                         WhatsApp sender
//                     </p>
//                     <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: 12 }}>
//                         Send via Twilio sandbox
//                     </p>
//                 </div>
//             </div>

//             {/* Body */}
//             <div style={{ background: "#ECE5DD", padding: "20px" }}
//              className ='h-[850px]'
//             >
//                 <form onSubmit={handleSubmit}>
//                     <label
//                         style={{
//                             display: "block",
//                             fontSize: 13,
//                             color: "#3b4a54",
//                             marginBottom: 6,
//                             fontWeight: 500,
//                         }}
//                     >
//                         Recipient's WhatsApp number
//                     </label>
//                     <input
//                         type="text"
//                         value={toNumber}
//                         onChange={(e) => setToNumber(e.target.value)}
//                         placeholder="+9715XXXXXXXX"
//                         required
//                         style={{
//                             width: "100%",
//                             padding: "10px 12px",
//                             borderRadius: 8,
//                             border: "1px solid #cfd8dc",
//                             fontSize: 14,
//                             outline: "none",
//                             boxSizing: "border-box",
//                             background: "#fff",
//                         }}
//                     />
//                     <p style={{ fontSize: 12, color: "#667781", marginTop: 6 }}>
//                         Number must have already joined the Twilio sandbox.
//                     </p>

//                     <button
//                         type="submit"
//                         disabled={loading}
//                         style={{
//                             width: "100%",
//                             marginTop: 14,
//                             padding: "12px",
//                             background: loading ? "#8fd4a8" : WHATSAPP_GREEN,
//                             color: "#fff",
//                             border: "none",
//                             borderRadius: 8,
//                             fontSize: 15,
//                             fontWeight: 600,
//                             cursor: loading ? "not-allowed" : "pointer",
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             gap: 8,
//                         }}
//                     >
//                         {loading ? "Sending..." : (
//                             <>
//                                 Send message
//                                 <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
//                                     <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
//                                 </svg>
//                             </>
//                         )}
//                     </button>
//                 </form>

//                 {result && (
//                     <div
//                         style={{
//                             marginTop: 16,
//                             background: WHATSAPP_TEAL_BG,
//                             color: "#075E54",
//                             padding: "10px 14px",
//                             borderRadius: 8,
//                             fontSize: 13,
//                         }}
//                     >
//                         Message sent to {result.to_number} — status: {result.status}
//                     </div>
//                 )}

//                 {error && (
//                     <div
//                         style={{
//                             marginTop: 16,
//                             background: "#fbe4e4",
//                             color: "#a72e2e",
//                             padding: "10px 14px",
//                             borderRadius: 8,
//                             fontSize: 13,
//                         }}
//                     >
//                         {error}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }




// import { useState } from "react";

// const BASE = import.meta.env.VITE_DJANGO_BASE_URL;

// export default function SendWhatsAppForm() {
//     const [form, setForm] = useState({ to_number: "", message_body: "" });
//     const [loading, setLoading] = useState(false);
//     const [result, setResult] = useState(null);
//     const [error, setError] = useState(null);

//     const handleChange = (e) => {
//         setForm({ ...form, [e.target.name]: e.target.value });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setResult(null);
//         setError(null);

//         try {
//             const response = await fetch(`${BASE}/api/whatsapp/send/`, {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify(form),
//             });

//             const data = await response.json();

//             if (!response.ok) {
//                 setError(data.error || "Failed to send message.");
//             } else {
//                 setResult(data);
//                 setForm({ to_number: "", message_body: "" });
//             }
//         } catch (err) {
//             setError("Network error: " + err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="max-w-md mx-auto p-4 border rounded-lg shadow-sm">
//             <h2 className="text-lg font-semibold mb-3">Send WhatsApp Message</h2>

//             <form onSubmit={handleSubmit} className="space-y-3">
//                 <div>
//                     <label className="block text-sm font-medium mb-1">
//                         Phone Number
//                     </label>
//                     <input
//                         type="text"
//                         name="to_number"
//                         value={form.to_number}
//                         onChange={handleChange}
//                         placeholder="+9715XXXXXXXX"
//                         required
//                         className="w-full border rounded px-3 py-2"
//                     />
//                 </div>

//                 <div>
//                     <label className="block text-sm font-medium mb-1">
//                         Message
//                     </label>
//                     <textarea
//                         name="message_body"
//                         value={form.message_body}
//                         onChange={handleChange}
//                         placeholder="Type your message..."
//                         required
//                         rows={4}
//                         className="w-full border rounded px-3 py-2"
//                     />
//                 </div>

//                 <button
//                     type="submit"
//                     disabled={loading}
//                     className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
//                 >
//                     {loading ? "Sending..." : "Send Message"}
//                 </button>
//             </form>

//             {result && (
//                 <div className="mt-3 p-2 bg-green-50 text-green-700 rounded text-sm">
//                     Message sent! Status: {result.status}
//                 </div>
//             )}

//             {error && (
//                 <div className="mt-3 p-2 bg-red-50 text-red-700 rounded text-sm">
//                     {error}
//                 </div>
//             )}
//         </div>
//     );
// }