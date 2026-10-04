import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup () {
    const BASE = import.meta.env.VITE_DJANGO_BASE_URL;
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        password2: "",
        role: "user",
        image: null,
    });

    const [preview, setPreview] = useState(null);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === "image") {
            const file = files[0];
            setForm((prev) => ({ ...prev, image: file }));

            if (file) {
                setPreview(URL.createObjectURL(file));
            }
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setMsg("");

        const formData = new FormData();

        formData.append("username", form.username);
        formData.append("email", form.email);
        formData.append("password", form.password);
        formData.append("password2", form.password2);
        formData.append("role", form.role);

        if (form.image) {
            formData.append("image", form.image);
        }

        try {
            const res = await fetch(`${BASE}/api/register/`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setMsg("✅ Account created successfully.");

                setTimeout(() => {
                    navigate("/login");
                }, 1200);
            } else {
                setMsg(data.detail || JSON.stringify(data));
            }
        } catch (err) {
            console.error(err);
            setMsg("Registration failed.");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-6">

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

                <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">
                    Create Account
                </h1>

                <p className="text-center text-gray-600 mb-6">
                    Join our online shopping platform
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">

                    <div className="flex justify-center">

                        <label className="cursor-pointer">

                            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-gray-300">

                                {preview ? (
                                    <img
                                        src={preview}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-md">
                                        Photo
                                    </div>
                                )}

                            </div>

                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                hidden
                                onChange={handleChange}
                            />

                        </label>

                    </div>

                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={form.username}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3"
                    />

                    <input
                        type="password"
                        name="password2"
                        placeholder="Confirm Password"
                        value={form.password2}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3"
                    />

                    <div>

                        <p className="text-sm font-medium text-gray-600 mb-2">
                            Account Type
                        </p>

                        

                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-blue-500 cursor-pointer text-white rounded-lg py-3 transition"
                    >
                        {loading ? "Creating..." : "Create Account"}
                    </button>

                    <a
                        href="/login"
                        className="ml-1 font-normal text-xs text-blue-600 underline mt-1"
                    >
                        Back To Login
                    </a>

                </form>

                {msg && (
                    <p className="text-sm text-green-700 text-center mt-1">
                        {msg}
                    </p>
                )}

            </div>

        </div>
    );
};

export default Signup;

